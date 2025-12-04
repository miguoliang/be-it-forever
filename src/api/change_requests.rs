use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use std::sync::Arc;
use serde::Deserialize;

use crate::{
    auth::{require_manager_role, Claims},
    error::Result,
    models::{ChangeRequest, Page},
    services::change_requests::ChangeRequestService, // Updated import path
    api::AppState,
};

#[derive(Debug, Deserialize)]
pub struct ListRequestsParams {
    #[serde(default)]
    pub page: i64,
    #[serde(default = "super::default_page_size")]
    pub size: i64,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ApprovalRequest {
    pub approved: bool,
    #[allow(dead_code)]
    pub reason: Option<String>,
}

pub async fn list_change_requests(
    State(state): State<Arc<AppState>>,
    claims: Claims,
    Query(params): Query<ListRequestsParams>,
) -> Result<Json<Page<ChangeRequest>>> {
    // Both operators and managers can list requests?
    // ARCHITECTURE.md says managers review.
    // PRODUCT.md says Operators can "View status of submitted requests".
    // So we should allow both.
    // If we want to be strict per architecture doc "3.5 Operator Manager Workflows" it says "Auth: Protected by require_manager_role".
    // But logically operators need to see their requests.
    // Let's stick to manager role for the "Review" endpoint as per 3.5, but maybe relaxed for listing own?
    // For now, I will implement as per 3.5 for Manager Review.
    require_manager_role(&claims)?;

    let size = params.size.min(100);
    let page = ChangeRequestService::list_requests(&state.db, params.status, params.page, size).await?;
    Ok(Json(page))
}

pub async fn approve_reject_request(
    State(state): State<Arc<AppState>>,
    claims: Claims,
    Path(id): Path<i64>,
    Json(req): Json<ApprovalRequest>,
) -> Result<StatusCode> {
    require_manager_role(&claims)?;

    let reviewer_id = claims.sub.parse::<i64>()
        .map_err(|_| crate::error::AppError::BadRequest("Invalid account ID".to_string()))?;

    // We need the username for "created_by" / "updated_by" fields when approving.
    // In a real system we'd fetch it or have it in claims.
    // For now, let's fetch it or just use the ID as string if lazy.
    // Better to fetch.
    let reviewer_username = sqlx::query_scalar::<_, String>("SELECT username FROM accounts WHERE id = $1")
        .bind(reviewer_id)
        .fetch_one(&state.db)
        .await?;

    if req.approved {
        ChangeRequestService::approve_request(&state.db, id, reviewer_id, &reviewer_username).await?;
    } else {
        ChangeRequestService::reject_request(&state.db, id, reviewer_id).await?;
    }

    Ok(StatusCode::NO_CONTENT)
}
