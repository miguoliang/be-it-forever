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
}
