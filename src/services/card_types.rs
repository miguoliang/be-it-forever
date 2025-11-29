use crate::db::DbPool;
use crate::error::{AppError, Result};
use crate::models::{CardType, Page, Template};
use chrono::Utc;

pub struct CardTypeService;

impl CardTypeService {
    pub async fn get_card_types(pool: &DbPool, page: i64, size: i64) -> Result<Page<CardType>> {
        let offset = page * size;

        let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM card_types")
            .fetch_one(pool)
            .await?;

        let items = sqlx::query_as::<_, CardType>(
            "SELECT * FROM card_types ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        )
        .bind(size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(Page::new(items, page, size, total))
    }

    pub async fn get_card_type_by_code(pool: &DbPool, code: &str) -> Result<CardType> {
        sqlx::query_as::<_, CardType>("SELECT * FROM card_types WHERE code = $1")
            .bind(code)
            .fetch_one(pool)
            .await
            .map_err(|_| AppError::NotFound(format!("Card type with code {} not found", code)))
    }

    #[allow(dead_code)]
    pub async fn get_templates_for_card_type(
        pool: &DbPool,
        card_type_code: &str,
    ) -> Result<Vec<(Template, String)>> {
        let rows = sqlx::query_as::<_, (String, String, String, String, Vec<u8>, String)>(
            r#"
            SELECT t.code, t.name, t.description, t.format, t.content, rel.role
            FROM templates t
            INNER JOIN card_type_template_rel rel ON t.code = rel.template_code
            WHERE rel.card_type_code = $1
            "#,
        )
        .bind(card_type_code)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|(code, name, desc, format, content, role)| {
                (
                    Template {
                        code,
                        name,
                        description: desc,
                        format,
                        content,
                        created_at: Utc::now(),
                        updated_at: Utc::now(),
                        created_by: None,
                        updated_by: None,
                    },
                    role,
                )
            })
            .collect())
    }
}
