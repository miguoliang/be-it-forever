use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    auth::{require_client_role, require_operator_role, Claims},
    config::Config,
    db::DbPool,
    error::Result,
    models::*,
    services::*,
};

pub struct AppState {
    pub db: DbPool,
    pub config: Config,
}

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        // Knowledge endpoints
        .route("/knowledge", get(list_knowledge))
        .route("/knowledge/:code", get(get_knowledge))
        // Card types endpoints
        .route("/card-types", get(list_card_types))
        .route("/card-types/:code", get(get_card_type))
        // Account card endpoints
        .route("/accounts/me/cards", get(list_my_cards))
        .route("/accounts/me/cards:due", get(get_due_cards))
        .route("/accounts/me/cards:initialize", post(initialize_cards))
        .route("/accounts/me/cards/:card_id", get(get_my_card))
        .route("/accounts/me/cards/:card_id:review", post(review_card))
        // Stats endpoints
        .route("/accounts/me/stats", get(get_my_stats))
        .with_state(state)
}

#[derive(Debug, Deserialize)]
struct PaginationParams {
    #[serde(default)]
    page: i64,
    #[serde(default = "default_page_size")]
    size: i64,
}

fn default_page_size() -> i64 {
    20
}

// Knowledge handlers
async fn list_knowledge(
    State(state): State<Arc<AppState>>,
    _claims: Claims,
    Query(params): Query<PaginationParams>,
) -> Result<Json<Page<Knowledge>>> {
    let size = params.size.min(100);
    let page = KnowledgeService::get_knowledge_list(&state.db, params.page, size).await?;
    Ok(Json(page))
}

async fn get_knowledge(
    State(state): State<Arc<AppState>>,
    _claims: Claims,
    Path(code): Path<String>,
) -> Result<Json<Knowledge>> {
    let knowledge = KnowledgeService::get_knowledge_by_code(&state.db, &code).await?;
    Ok(Json(knowledge))
}

// Card type handlers
async fn list_card_types(
    State(state): State<Arc<AppState>>,
    _claims: Claims,
    Query(params): Query<PaginationParams>,
) -> Result<Json<Page<CardType>>> {
    let size = params.size.min(100);
    let page = CardTypeService::get_card_types(&state.db, params.page, size).await?;
    Ok(Json(page))
}

async fn get_card_type(
    State(state): State<Arc<AppState>>,
    _claims: Claims,
    Path(code): Path<String>,
) -> Result<Json<CardType>> {
    let card_type = CardTypeService::get_card_type_by_code(&state.db, &code).await?;
    Ok(Json(card_type))
}

// Account card handlers
#[derive(Debug, Deserialize)]
struct CardListParams {
    #[serde(default)]
    page: i64,
    #[serde(default = "default_page_size")]
    size: i64,
    card_type_code: Option<String>,
}

async fn list_my_cards(
    State(state): State<Arc<AppState>>,
    claims: Claims,
    Query(params): Query<CardListParams>,
) -> Result<Json<Page<AccountCard>>> {
    require_client_role(&claims)?;

    let account_id = claims.sub.parse::<i64>()
        .map_err(|_| crate::error::AppError::BadRequest("Invalid account ID".to_string()))?;

    let size = params.size.min(100);
    let page = AccountCardService::get_cards(
        &state.db,
        account_id,
        params.page,
        size,
        params.card_type_code,
    )
    .await?;

    Ok(Json(page))
}

async fn get_due_cards(
    State(state): State<Arc<AppState>>,
    claims: Claims,
    Query(params): Query<PaginationParams>,
) -> Result<Json<Page<AccountCard>>> {
    require_client_role(&claims)?;

    let account_id = claims.sub.parse::<i64>()
        .map_err(|_| crate::error::AppError::BadRequest("Invalid account ID".to_string()))?;

    let size = params.size.min(100);
    let page = AccountCardService::get_due_cards(&state.db, account_id, params.page, size).await?;

    Ok(Json(page))
}

async fn get_my_card(
    State(state): State<Arc<AppState>>,
    claims: Claims,
    Path(card_id): Path<i64>,
) -> Result<Json<AccountCard>> {
    require_client_role(&claims)?;

    let account_id = claims.sub.parse::<i64>()
        .map_err(|_| crate::error::AppError::BadRequest("Invalid account ID".to_string()))?;

    let card = AccountCardService::get_card_by_id(&state.db, card_id, account_id).await?;
    Ok(Json(card))
}

#[derive(Debug, Deserialize)]
struct ReviewRequest {
    quality: i32,
}

async fn review_card(
    State(state): State<Arc<AppState>>,
    claims: Claims,
    Path(card_id): Path<i64>,
    Json(req): Json<ReviewRequest>,
) -> Result<Json<AccountCard>> {
    require_client_role(&claims)?;

    let account_id = claims.sub.parse::<i64>()
        .map_err(|_| crate::error::AppError::BadRequest("Invalid account ID".to_string()))?;

    let card = AccountCardService::review_card(&state.db, card_id, account_id, req.quality).await?;
    Ok(Json(card))
}

#[derive(Debug, Serialize)]
struct InitializeCardsResponse {
    created: i64,
    skipped: i64,
}

async fn initialize_cards(
    State(state): State<Arc<AppState>>,
    claims: Claims,
) -> Result<Json<InitializeCardsResponse>> {
    require_client_role(&claims)?;

    let account_id = claims.sub.parse::<i64>()
        .map_err(|_| crate::error::AppError::BadRequest("Invalid account ID".to_string()))?;

    let (created, skipped) = AccountCardService::initialize_cards(&state.db, account_id).await?;

    Ok(Json(InitializeCardsResponse { created, skipped }))
}

async fn get_my_stats(
    State(state): State<Arc<AppState>>,
    claims: Claims,
) -> Result<Json<Stats>> {
    require_client_role(&claims)?;

    let account_id = claims.sub.parse::<i64>()
        .map_err(|_| crate::error::AppError::BadRequest("Invalid account ID".to_string()))?;

    let stats = StatsService::get_stats(&state.db, account_id).await?;
    Ok(Json(stats))
}
