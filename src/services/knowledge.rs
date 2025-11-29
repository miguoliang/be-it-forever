use crate::db::DbPool;
use crate::error::{AppError, Result};
use crate::models::{Knowledge, Page};

pub struct KnowledgeService;

impl KnowledgeService {
    pub async fn get_knowledge_list(
        pool: &DbPool,
        page: i64,
        size: i64,
    ) -> Result<Page<Knowledge>> {
        let offset = page * size;

        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM knowledge")
            .fetch_one(pool)
            .await?;

        let items = sqlx::query_as::<_, Knowledge>(
            "SELECT * FROM knowledge ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        )
        .bind(size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(Page::new(items, page, size, total))
    }

    pub async fn get_knowledge_by_code(pool: &DbPool, code: &str) -> Result<Knowledge> {
        sqlx::query_as::<_, Knowledge>("SELECT * FROM knowledge WHERE code = $1")
            .bind(code)
            .fetch_one(pool)
            .await
            .map_err(|_| AppError::NotFound(format!("Knowledge with code {} not found", code)))
    }

    #[allow(dead_code)]
    pub async fn get_related_knowledge(
        pool: &DbPool,
        knowledge_code: &str,
    ) -> Result<Vec<Knowledge>> {
        let items = sqlx::query_as::<_, Knowledge>(
            r#"
            SELECT k.* FROM knowledge k
            INNER JOIN knowledge_rel kr ON k.code = kr.target_knowledge_code
            WHERE kr.source_knowledge_code = $1
            "#,
        )
        .bind(knowledge_code)
        .fetch_all(pool)
        .await?;

        Ok(items)
    }

    pub async fn create_knowledge(
        pool: &DbPool,
        req: crate::models::CreateKnowledgeRequest,
        operator_id: &str,
    ) -> Result<Knowledge> {
        // Generate code
        // If code is "CS", generate CS-XXXXXXX
        // Otherwise default to ST-XXXXXXX
        let prefix = match req.code.as_deref() {
            Some("CS") => "CS",
            _ => "ST",
        };
        
        let code = crate::db::generate_code(pool, prefix).await.map_err(|e| {
            AppError::InternalServerError(format!("Failed to generate code: {}", e))
        })?;

        let now = chrono::Utc::now();
        let knowledge = sqlx::query_as::<_, Knowledge>(
            r#"
            INSERT INTO knowledge (code, name, description, metadata, created_at, updated_at, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(code)
        .bind(req.name)
        .bind(req.description)
        .bind(req.metadata)
        .bind(now)
        .bind(now)
        .bind(operator_id)
        .bind(operator_id)
        .fetch_one(pool)
        .await?;

        Ok(knowledge)
    }

    pub async fn update_knowledge(
        pool: &DbPool,
        code: &str,
        req: crate::models::UpdateKnowledgeRequest,
        operator_id: &str,
    ) -> Result<Knowledge> {
        // Check if exists
        let current = Self::get_knowledge_by_code(pool, code).await?;

        let now = chrono::Utc::now();
        let knowledge = sqlx::query_as::<_, Knowledge>(
            r#"
            UPDATE knowledge
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                metadata = COALESCE($3, metadata),
                updated_at = $4,
                updated_by = $5
            WHERE code = $6
            RETURNING *
            "#,
        )
        .bind(req.name.unwrap_or(current.name))
        .bind(req.description.unwrap_or(current.description))
        .bind(req.metadata.or(current.metadata))
        .bind(now)
        .bind(operator_id)
        .bind(code)
        .fetch_one(pool)
        .await?;

        Ok(knowledge)
    }

    pub async fn delete_knowledge(pool: &DbPool, code: &str) -> Result<()> {
        // Check if exists
        Self::get_knowledge_by_code(pool, code).await?;

        // Check if any cards reference this knowledge
        let used_in_cards: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM account_cards WHERE knowledge_code = $1)",
        )
        .bind(code)
        .fetch_one(pool)
        .await?;

        if used_in_cards {
            return Err(AppError::BadRequest(
                "Cannot delete knowledge that is used in account cards".to_string(),
            ));
        }

        sqlx::query("DELETE FROM knowledge WHERE code = $1")
            .bind(code)
            .execute(pool)
            .await?;

        Ok(())
    }
}
