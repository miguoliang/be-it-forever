use axum::{
    extract::State,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    auth::Claims,
    db::DbPool,
    error::{AppError, Result},
    api::AppState,
    models::Account,
};

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    // Password is ignored in this dev version, but field is kept for API compatibility
    #[allow(dead_code)]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: AuthUser,
}

#[derive(Debug, Serialize)]
pub struct AuthUser {
    pub id: String,
    pub username: String,
    pub role: String,
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>> {
    if req.username.trim().is_empty() {
        return Err(AppError::BadRequest("Username cannot be empty".to_string()));
    }

    // Find or create account
    let account = find_or_create_account(&state.db, &req.username).await?;

    // Determine role (simple logic for dev: username 'operator' or 'admin' = operator)
    let role = if req.username == "operator" || req.username == "admin" {
        "operator"
    } else {
        "client"
    };

    // Generate JWT
    let claims = Claims::new(&account.id.to_string(), role);
    let token = claims.encode(&state.config.jwt_secret)?;

    Ok(Json(AuthResponse {
        token,
        user: AuthUser {
            id: account.id.to_string(),
            username: account.username,
            role: role.to_string(),
        },
    }))
}

async fn find_or_create_account(pool: &DbPool, username: &str) -> Result<Account> {
    // Try to find
    let account = sqlx::query_as::<_, Account>("SELECT * FROM accounts WHERE username = $1")
        .bind(username)
        .fetch_optional(pool)
        .await?;

    if let Some(acc) = account {
        return Ok(acc);
    }

    // Create if not exists
    let new_account = sqlx::query_as::<_, Account>(
        "INSERT INTO accounts (username) VALUES ($1) RETURNING *",
    )
    .bind(username)
    .fetch_one(pool)
    .await?;

    Ok(new_account)
}
