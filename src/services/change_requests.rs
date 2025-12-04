use crate::db::DbPool;
use crate::error::{AppError, Result};
use crate::models::{ChangeRequest, Page};
use chrono::Utc;

pub struct ChangeRequestService;

impl ChangeRequestService {
    pub async fn list_requests(
        pool: &DbPool,
        status: Option<String>,
        page: i64,
        size: i64,
    ) -> Result<Page<ChangeRequest>> {
        let offset = page * size;

        let (count_query, items_query) = if let Some(ref _s) = status {
            (
                "SELECT COUNT(*) FROM change_requests WHERE status = $1",
                "SELECT * FROM change_requests WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            )
        } else {
            (
                "SELECT COUNT(*) FROM change_requests",
                "SELECT * FROM change_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            )
        };

        let total: i64 = if let Some(ref s) = status {
            sqlx::query_scalar(count_query)
                .bind(s)
                .fetch_one(pool)
                .await?
        } else {
            sqlx::query_scalar(count_query)
                .fetch_one(pool)
                .await?
        };

        let items = if let Some(s) = status {
            sqlx::query_as::<_, ChangeRequest>(items_query)
                .bind(s)
                .bind(size)
                .bind(offset)
                .fetch_all(pool)
                .await?
        } else {
            sqlx::query_as::<_, ChangeRequest>(items_query)
                .bind(size)
                .bind(offset)
                .fetch_all(pool)
                .await?
        };

        Ok(Page::new(items, page, size, total))
    }

    pub async fn create_request(
        pool: &DbPool,
        request_type: &str,
        target_code: Option<String>,
        payload: serde_json::Value,
        submitter_id: i64,
    ) -> Result<ChangeRequest> {
        let request = sqlx::query_as::<_, ChangeRequest>(
            r#"
            INSERT INTO change_requests (request_type, target_code, payload, status, submitter_id, created_at, updated_at)
            VALUES ($1, $2, $3, 'PENDING', $4, $5, $6)
            RETURNING *
            "#,
        )
        .bind(request_type)
        .bind(target_code)
        .bind(payload)
        .bind(submitter_id)
        .bind(Utc::now())
        .bind(Utc::now())
        .fetch_one(pool)
        .await?;

        Ok(request)
    }

    pub async fn approve_request(
        pool: &DbPool,
        request_id: i64,
        reviewer_id: i64,
        reviewer_username: &str, // Need username for created_by/updated_by
    ) -> Result<()> {
        let mut tx = pool.begin().await?;

        // 1. Get request
        let request = sqlx::query_as::<_, ChangeRequest>(
            "SELECT * FROM change_requests WHERE id = $1 FOR UPDATE",
        )
        .bind(request_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|_| AppError::NotFound("Change request not found".to_string()))?;

        if request.status != "PENDING" {
            return Err(AppError::BadRequest("Request is not pending".to_string()));
        }

        // 2. Apply changes
        match request.request_type.as_str() {
            "CREATE" => {
                // For CREATE, the payload contains the CreateKnowledgeRequest data.
                // We need to generate the code here.
                let req: crate::models::CreateKnowledgeRequest = serde_json::from_value(request.payload.clone())
                    .map_err(|e| AppError::InternalServerError(format!("Invalid payload: {}", e)))?;
                
                // Determine prefix from hint in payload (which was mapped to 'code' field)
                let prefix = match req.code.as_deref() {
                    Some("CS") => "CS",
                    _ => "ST",
                };

                // We need to call generate_code but it's in db module. 
                // Since we are inside a transaction, we can't easily reuse the simple helper that takes a pool.
                // We'll reimplement the sequence logic here for simplicity within TX.
                let sequence_name = format!("code_seq_{}", prefix.to_lowercase());
                let next_val: i64 = sqlx::query_scalar(&format!("SELECT nextval('{}')", sequence_name))
                    .fetch_one(&mut *tx)
                    .await?;
                let code = format!("{}-{:07}", prefix, next_val);

                sqlx::query(
                    r#"
                    INSERT INTO knowledge (code, name, description, metadata, created_at, updated_at, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    "#,
                )
                .bind(code)
                .bind(req.name)
                .bind(req.description)
                .bind(req.metadata)
                .bind(Utc::now())
                .bind(Utc::now())
                .bind(reviewer_username)
                .bind(reviewer_username)
                .execute(&mut *tx)
                .await?;
            }
            "UPDATE" => {
                let code = request.target_code.ok_or_else(|| AppError::InternalServerError("Missing target code for UPDATE".to_string()))?;
                let req: crate::models::UpdateKnowledgeRequest = serde_json::from_value(request.payload.clone())
                    .map_err(|e| AppError::InternalServerError(format!("Invalid payload: {}", e)))?;

                // Get current to merge? SQL COALESCE handles it if we bind properly.
                // But we need to fetch current values if we want to support partial updates cleanly via SQL 
                // or just rely on COALESCE(?, current_col).
                // Let's use COALESCE approach similar to previous direct update.
                
                // Need to verify existence first?
                let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM knowledge WHERE code = $1)")
                    .bind(&code)
                    .fetch_one(&mut *tx)
                    .await?;
                
                if !exists {
                    return Err(AppError::NotFound(format!("Knowledge {} not found", code)));
                }

                sqlx::query(
                    r#"
                    UPDATE knowledge
                    SET name = COALESCE($1, name),
                        description = COALESCE($2, description),
                        metadata = COALESCE($3, metadata),
                        updated_at = $4,
                        updated_by = $5
                    WHERE code = $6
                    "#,
                )
                .bind(req.name)
                .bind(req.description)
                .bind(req.metadata)
                .bind(Utc::now())
                .bind(reviewer_username)
                .bind(code)
                .execute(&mut *tx)
                .await?;
            }
            "DELETE" => {
                let code = request.target_code.ok_or_else(|| AppError::InternalServerError("Missing target code for DELETE".to_string()))?;
                
                // Check usage
                let used: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM account_cards WHERE knowledge_code = $1)")
                    .bind(&code)
                    .fetch_one(&mut *tx)
                    .await?;
                
                if used {
                    return Err(AppError::BadRequest("Cannot delete knowledge in use".to_string()));
                }

                sqlx::query("DELETE FROM knowledge WHERE code = $1")
                    .bind(code)
                    .execute(&mut *tx)
                    .await?;
            }
            _ => return Err(AppError::InternalServerError(format!("Unknown request type: {}", request.request_type))),
        }

        // 3. Update request status
        sqlx::query(
            "UPDATE change_requests SET status = 'APPROVED', reviewer_id = $1, updated_at = $2 WHERE id = $3",
        )
        .bind(reviewer_id)
        .bind(Utc::now())
        .bind(request_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }

    pub async fn reject_request(
        pool: &DbPool,
        request_id: i64,
        reviewer_id: i64,
    ) -> Result<()> {
        let result = sqlx::query(
            "UPDATE change_requests SET status = 'REJECTED', reviewer_id = $1, updated_at = $2 WHERE id = $3 AND status = 'PENDING'",
        )
        .bind(reviewer_id)
        .bind(Utc::now())
        .bind(request_id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Pending request not found".to_string()));
        }

        Ok(())
    }
}
