use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Knowledge {
    pub code: String,
    pub name: String,
    pub description: String,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct KnowledgeRel {
    pub id: i64,
    pub source_knowledge_code: String,
    pub target_knowledge_code: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Template {
    pub code: String,
    pub name: String,
    pub description: String,
    pub format: String,
    pub content: Vec<u8>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CardType {
    pub code: String,
    pub name: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CardTypeTemplateRel {
    pub id: i64,
    pub card_type_code: String,
    pub template_code: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Account {
    pub id: i64,
    pub username: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AccountCard {
    pub id: i64,
    pub account_id: i64,
    pub knowledge_code: String,
    pub card_type_code: String,
    pub ease_factor: rust_decimal::Decimal,
    pub interval_days: i32,
    pub repetitions: i32,
    pub next_review_date: DateTime<Utc>,
    pub last_reviewed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub updated_by: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ReviewHistory {
    pub id: i64,
    pub account_card_id: i64,
    pub quality: i32,
    pub reviewed_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateKnowledgeRequest {
    pub code: String,
    pub name: String,
    pub description: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateKnowledgeRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

// DTOs for API responses
#[derive(Debug, Serialize, Deserialize)]
pub struct Page<T> {
    pub content: Vec<T>,
    pub page: PageInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageInfo {
    pub number: i64,
    pub size: i64,
    pub total_elements: i64,
    pub total_pages: i64,
}

impl<T> Page<T> {
    pub fn new(content: Vec<T>, page_number: i64, page_size: i64, total_elements: i64) -> Self {
        let total_pages = (total_elements + page_size - 1) / page_size;
        Self {
            content,
            page: PageInfo {
                number: page_number,
                size: page_size,
                total_elements,
                total_pages,
            },
        }
    }
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct AccountCardWithContent {
    #[serde(flatten)]
    pub card: AccountCard,
    pub knowledge: Knowledge,
    #[serde(rename = "cardType")]
    pub card_type: CardType,
    pub front: Option<String>,
    pub back: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Stats {
    #[serde(rename = "totalCards")]
    pub total_cards: i64,
    #[serde(rename = "newCards")]
    pub new_cards: i64,
    #[serde(rename = "learningCards")]
    pub learning_cards: i64,
    #[serde(rename = "dueToday")]
    pub due_today: i64,
    #[serde(rename = "byCardType")]
    pub by_card_type: std::collections::HashMap<String, i64>,
}
