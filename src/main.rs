mod config;
mod db;
mod models;
mod services;
mod api;
mod auth;
mod error;
mod sm2;

use axum::{Router, routing::get};
use tower_http::trace::TraceLayer;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "english_learning=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let config = config::Config::from_env()?;

    // Setup database connection pool
    let db_pool = db::create_pool(&config.database_url).await?;

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await?;

    // Setup shared state
    let app_state = Arc::new(api::AppState {
        db: db_pool,
        config: config.clone(),
    });

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1", api::routes(app_state))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}
