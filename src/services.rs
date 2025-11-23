use crate::db::DbPool;
use crate::error::{AppError, Result};
use crate::models::*;
use crate::sm2::Sm2Algorithm;
use chrono::Utc;
use rust_decimal::Decimal;
use std::str::FromStr;

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

pub struct AccountCardService;

impl AccountCardService {
    pub async fn get_cards(
        pool: &DbPool,
        account_id: i64,
        page: i64,
        size: i64,
        card_type_code: Option<String>,
    ) -> Result<Page<AccountCard>> {
        let offset = page * size;

        let (count_query, items_query) = if let Some(ref card_type) = card_type_code {
            (
                "SELECT COUNT(*) FROM account_cards WHERE account_id = $1 AND card_type_code = $2",
                "SELECT * FROM account_cards WHERE account_id = $1 AND card_type_code = $2 ORDER BY next_review_date ASC LIMIT $3 OFFSET $4",
            )
        } else {
            (
                "SELECT COUNT(*) FROM account_cards WHERE account_id = $1",
                "SELECT * FROM account_cards WHERE account_id = $1 ORDER BY next_review_date ASC LIMIT $2 OFFSET $3",
            )
        };

        let total: i64 = if let Some(ref card_type) = card_type_code {
            sqlx::query_scalar(count_query)
                .bind(account_id)
                .bind(card_type)
                .fetch_one(pool)
                .await?
        } else {
            sqlx::query_scalar(count_query)
                .bind(account_id)
                .fetch_one(pool)
                .await?
        };

        let items = if let Some(card_type) = card_type_code {
            sqlx::query_as::<_, AccountCard>(items_query)
                .bind(account_id)
                .bind(card_type)
                .bind(size)
                .bind(offset)
                .fetch_all(pool)
                .await?
        } else {
            sqlx::query_as::<_, AccountCard>(items_query)
                .bind(account_id)
                .bind(size)
                .bind(offset)
                .fetch_all(pool)
                .await?
        };

        Ok(Page::new(items, page, size, total))
    }

    pub async fn get_due_cards(
        pool: &DbPool,
        account_id: i64,
        page: i64,
        size: i64,
    ) -> Result<Page<AccountCard>> {
        let offset = page * size;

        let total: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM account_cards WHERE account_id = $1 AND next_review_date <= $2",
        )
        .bind(account_id)
        .bind(Utc::now())
        .fetch_one(pool)
        .await?;

        let items = sqlx::query_as::<_, AccountCard>(
            "SELECT * FROM account_cards WHERE account_id = $1 AND next_review_date <= $2 ORDER BY next_review_date ASC LIMIT $3 OFFSET $4",
        )
        .bind(account_id)
        .bind(Utc::now())
        .bind(size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(Page::new(items, page, size, total))
    }

    pub async fn get_card_by_id(pool: &DbPool, card_id: i64, account_id: i64) -> Result<AccountCard> {
        let card = sqlx::query_as::<_, AccountCard>(
            "SELECT * FROM account_cards WHERE id = $1 AND account_id = $2",
        )
        .bind(card_id)
        .bind(account_id)
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::NotFound("Card not found".to_string()))?;

        Ok(card)
    }

    pub async fn review_card(
        pool: &DbPool,
        card_id: i64,
        account_id: i64,
        quality: i32,
    ) -> Result<AccountCard> {
        if quality < 0 || quality > 5 {
            return Err(AppError::BadRequest("Quality must be between 0 and 5".to_string()));
        }

        // Get current card
        let card = Self::get_card_by_id(pool, card_id, account_id).await?;

        // Calculate new SM-2 values
        let (new_ease_factor, new_interval_days, new_repetitions) = Sm2Algorithm::calculate_next_review(
            card.ease_factor,
            card.interval_days,
            card.repetitions,
            quality,
        );

        let next_review_date = Utc::now()
            .checked_add_signed(chrono::Duration::days(new_interval_days as i64))
            .unwrap();

        // Update card
        let updated_card = sqlx::query_as::<_, AccountCard>(
            r#"
            UPDATE account_cards
            SET ease_factor = $1, interval_days = $2, repetitions = $3,
                next_review_date = $4, last_reviewed_at = $5, updated_at = $6
            WHERE id = $7
            RETURNING *
            "#,
        )
        .bind(new_ease_factor)
        .bind(new_interval_days)
        .bind(new_repetitions)
        .bind(next_review_date)
        .bind(Utc::now())
        .bind(Utc::now())
        .bind(card_id)
        .fetch_one(pool)
        .await?;

        // Record review history
        sqlx::query(
            "INSERT INTO review_history (account_card_id, quality, reviewed_at, created_at) VALUES ($1, $2, $3, $4)",
        )
        .bind(card_id)
        .bind(quality)
        .bind(Utc::now())
        .bind(Utc::now())
        .execute(pool)
        .await?;

        Ok(updated_card)
    }

    pub async fn initialize_cards(
        pool: &DbPool,
        account_id: i64,
    ) -> Result<(i64, i64)> {
        // Get all knowledge items
        let knowledge_items = sqlx::query_as::<_, Knowledge>("SELECT * FROM knowledge")
            .fetch_all(pool)
            .await?;

        // Get all card types
        let card_types = sqlx::query_as::<_, CardType>("SELECT * FROM card_types")
            .fetch_all(pool)
            .await?;

        let (initial_ease_factor, initial_interval_days, initial_repetitions) =
            Sm2Algorithm::initial_values();

        let mut created = 0i64;
        let mut skipped = 0i64;

        // Create cards for each knowledge-card type combination
        for knowledge in &knowledge_items {
            for card_type in &card_types {
                // Check if card already exists
                let exists: bool = sqlx::query_scalar(
                    "SELECT EXISTS(SELECT 1 FROM account_cards WHERE account_id = $1 AND knowledge_code = $2 AND card_type_code = $3)",
                )
                .bind(account_id)
                .bind(&knowledge.code)
                .bind(&card_type.code)
                .fetch_one(pool)
                .await?;

                if !exists {
                    sqlx::query(
                        r#"
                        INSERT INTO account_cards
                        (account_id, knowledge_code, card_type_code, ease_factor, interval_days, repetitions, next_review_date, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        "#,
                    )
                    .bind(account_id)
                    .bind(&knowledge.code)
                    .bind(&card_type.code)
                    .bind(initial_ease_factor)
                    .bind(initial_interval_days)
                    .bind(initial_repetitions)
                    .bind(Utc::now())
                    .bind(Utc::now())
                    .bind(Utc::now())
                    .execute(pool)
                    .await?;

                    created += 1;
                } else {
                    skipped += 1;
                }
            }
        }

        Ok((created, skipped))
    }
}

pub struct StatsService;

impl StatsService {
    pub async fn get_stats(pool: &DbPool, account_id: i64) -> Result<Stats> {
        let total_cards: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM account_cards WHERE account_id = $1",
        )
        .bind(account_id)
        .fetch_one(pool)
        .await?;

        let new_cards: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM account_cards WHERE account_id = $1 AND repetitions = 0",
        )
        .bind(account_id)
        .fetch_one(pool)
        .await?;

        let learning_cards: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM account_cards WHERE account_id = $1 AND repetitions > 0 AND repetitions < 3",
        )
        .bind(account_id)
        .fetch_one(pool)
        .await?;

        let due_today: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM account_cards WHERE account_id = $1 AND next_review_date <= $2",
        )
        .bind(account_id)
        .bind(Utc::now())
        .fetch_one(pool)
        .await?;

        // Get breakdown by card type
        let by_card_type_rows = sqlx::query_as::<_, (String, i64)>(
            "SELECT card_type_code, COUNT(*) as count FROM account_cards WHERE account_id = $1 GROUP BY card_type_code",
        )
        .bind(account_id)
        .fetch_all(pool)
        .await?;

        let by_card_type = by_card_type_rows
            .into_iter()
            .collect::<std::collections::HashMap<String, i64>>();

        Ok(Stats {
            total_cards,
            new_cards,
            learning_cards,
            due_today,
            by_card_type,
        })
    }
}
