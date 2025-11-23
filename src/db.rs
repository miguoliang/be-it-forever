use sqlx::{postgres::PgPoolOptions, PgPool};

pub type DbPool = PgPool;

pub async fn create_pool(database_url: &str) -> anyhow::Result<DbPool> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    Ok(pool)
}

/// Generate code with prefix (ST or CS)
pub async fn generate_code(pool: &DbPool, prefix: &str) -> anyhow::Result<String> {
    if prefix != "ST" && prefix != "CS" {
        anyhow::bail!("Invalid prefix: {}. Must be ST or CS", prefix);
    }

    let sequence_name = format!("code_seq_{}", prefix.to_lowercase());
    let query = format!("SELECT nextval('{}')", sequence_name);

    let next_val: i64 = sqlx::query_scalar(&query)
        .fetch_one(pool)
        .await?;

    if next_val > 9999999 {
        anyhow::bail!("Sequence value exceeds maximum (9999999)");
    }

    Ok(format!("{}-{:07}", prefix, next_val))
}
