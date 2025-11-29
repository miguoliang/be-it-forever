use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, Result};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,  // Subject (account ID)
    pub role: String, // Role: "client" or "operator"
    pub exp: usize,   // Expiry timestamp
}

impl Claims {
    #[allow(dead_code)]
    pub fn new(account_id: &str, role: &str) -> Self {
        let expiration = chrono::Utc::now()
            .checked_add_signed(chrono::Duration::hours(24))
            .unwrap()
            .timestamp() as usize;

        Self {
            sub: account_id.to_string(),
            role: role.to_string(),
            exp: expiration,
        }
    }

    #[allow(dead_code)]
    pub fn encode(&self, secret: &str) -> Result<String> {
        encode(
            &Header::default(),
            self,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .map_err(|e| AppError::InternalServerError(e.to_string()))
    }

    pub fn decode(token: &str, secret: &str) -> Result<Self> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| AppError::Unauthorized)?;

        Ok(token_data.claims)
    }

    pub fn is_client(&self) -> bool {
        self.role == "client"
    }

    #[allow(dead_code)]
    pub fn is_operator(&self) -> bool {
        self.role == "operator"
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self> {
        // Extract the token from the Authorization header
        let auth_header = parts
            .headers
            .get("authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        // Check if it starts with "Bearer "
        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized);
        }

        let token = &auth_header[7..];

        // For now, we'll use a default secret (should be from config in production)
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "change-me-in-production".to_string());

        Claims::decode(token, &secret)
    }
}

/// Middleware for checking if user has client role
pub fn require_client_role(claims: &Claims) -> Result<()> {
    if claims.is_client() {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

/// Middleware for checking if user has operator role
#[allow(dead_code)]
pub fn require_operator_role(claims: &Claims) -> Result<()> {
    if claims.is_operator() {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}
