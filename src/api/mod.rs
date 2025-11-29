use axum::Router;
use axum::routing::{get, post};
use std::sync::Arc;
use serde::Deserialize;

use crate::config::Config;
use crate::db::DbPool;

pub mod knowledge;
pub mod card_types;
pub mod cards;
pub mod stats;
pub mod auth;

pub struct AppState {
    pub db: DbPool,
    pub config: Config,
}

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default)]
    pub page: i64,
    #[serde(default = "default_page_size")]
    pub size: i64,
}

pub fn default_page_size() -> i64 {
    20
}

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        // Auth endpoints
        .route("/auth/login", post(auth::login))
        .route("/auth/signup", post(auth::login)) // Alias signup to login for dev
        // Knowledge endpoints
        .route("/knowledge", get(knowledge::list_knowledge).post(knowledge::create_knowledge))
        .route("/knowledge/:code", get(knowledge::get_knowledge).put(knowledge::update_knowledge).delete(knowledge::delete_knowledge))
        // Card types endpoints
        .route("/card-types", get(card_types::list_card_types))
        .route("/card-types/:code", get(card_types::get_card_type))
        // Account card endpoints
        .route("/accounts/me/cards", get(cards::list_my_cards))
        .route("/accounts/me/cards:due", get(cards::get_due_cards))
        .route("/accounts/me/cards:initialize", post(cards::initialize_cards))
        .route("/accounts/me/cards/:card_id", get(cards::get_my_card))
        .route("/accounts/me/cards/:card_id:review", post(cards::review_card))
        // Stats endpoints
        .route("/accounts/me/stats", get(stats::get_my_stats))
        .with_state(state)
}
