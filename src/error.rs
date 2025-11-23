use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    Unauthorized,
    Forbidden,
    BadRequest(String),
    InternalServerError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized".to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "FORBIDDEN", "Forbidden".to_string()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", msg),
            AppError::InternalServerError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", msg),
        };

        let body = Json(json!({
            "error": {
                "code": code,
                "message": message,
            }
        }));

        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Resource not found".to_string()),
            _ => AppError::InternalServerError(err.to_string()),
        }
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalServerError(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
