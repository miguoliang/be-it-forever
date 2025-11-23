# English Learning System - Rust Implementation

A minimal, high-performance Rust implementation of the English Learning System with spaced repetition (SM-2 algorithm).

## Technology Stack

- **Language**: Rust (stable)
- **Web Framework**: Axum (async, minimal)
- **Database**: PostgreSQL with sqlx (compile-time checked queries, no ORM)
- **Migrations**: sqlx-cli
- **Authentication**: JWT with jsonwebtoken
- **Template Engine**: Tera (similar to Jinja2)
- **Async Runtime**: Tokio

## Features

- ✅ JWT-based authentication with role-based access control (client/operator)
- ✅ SM-2 spaced repetition algorithm for optimal learning
- ✅ Knowledge management with JSONB metadata
- ✅ Card types and template system
- ✅ Account cards with review tracking
- ✅ Statistics and progress tracking
- ✅ Raw SQL queries (no ORM) for minimal overhead
- ✅ Type-safe database queries with sqlx

## Prerequisites

- Rust (1.70+)
- PostgreSQL (14+)
- sqlx-cli (`cargo install sqlx-cli --no-default-features --features postgres`)

## Setup

1. **Clone the repository**

```bash
cd english-learning
```

2. **Create .env file**

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection.

3. **Create database**

```bash
createdb english_learning
```

4. **Run migrations**

```bash
sqlx migrate run
```

5. **Build the project**

```bash
cargo build --release
```

6. **Run the server**

```bash
cargo run --release
```

The server will start on `http://localhost:8080`.

## Development

### Running in development mode

```bash
cargo run
```

### Running tests

```bash
cargo test
```

### Database migrations

Create a new migration:

```bash
sqlx migrate add <migration_name>
```

Run migrations:

```bash
sqlx migrate run
```

Revert last migration:

```bash
sqlx migrate revert
```

## API Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication

All endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

JWT tokens must contain:
- `sub`: Account ID
- `role`: "client" or "operator"
- `exp`: Expiration timestamp

### Key Endpoints

#### Knowledge
- `GET /api/v1/knowledge` - List knowledge items
- `GET /api/v1/knowledge/:code` - Get specific knowledge item

#### Card Types
- `GET /api/v1/card-types` - List card types
- `GET /api/v1/card-types/:code` - Get specific card type

#### Account Cards (Client Role)
- `GET /api/v1/accounts/me/cards` - List my cards
- `GET /api/v1/accounts/me/cards:due` - Get cards due for review
- `GET /api/v1/accounts/me/cards/:card_id` - Get specific card
- `POST /api/v1/accounts/me/cards/:card_id:review` - Submit review
- `POST /api/v1/accounts/me/cards:initialize` - Initialize cards

#### Statistics (Client Role)
- `GET /api/v1/accounts/me/stats` - Get learning statistics

## Project Structure

```
src/
├── main.rs           # Entry point
├── config.rs         # Configuration
├── db.rs             # Database connection and code generation
├── models.rs         # Data models and DTOs
├── services.rs       # Business logic layer
├── api.rs            # REST API handlers
├── auth.rs           # JWT authentication
├── error.rs          # Error handling
└── sm2.rs            # SM-2 algorithm implementation

migrations/
└── 001_initial_schema.sql  # Database schema
```

## Performance Characteristics

- **Zero-cost abstractions**: Rust's ownership system provides memory safety without garbage collection
- **Compile-time query validation**: sqlx checks SQL queries at compile time
- **Minimal memory overhead**: No ORM means direct SQL execution
- **Async I/O**: Tokio runtime provides high-concurrency handling
- **Small binary size**: ~10-20MB release binary (vs 100MB+ JVM-based solutions)

## Comparison with Kotlin/Quarkus

| Aspect | Rust | Kotlin/Quarkus |
|--------|------|----------------|
| Binary Size | ~15MB | ~100MB+ |
| Memory Usage | ~10-50MB | ~200-500MB |
| Startup Time | <100ms | ~1-2s |
| Database Layer | Raw SQL (sqlx) | Hibernate Reactive |
| Type Safety | Compile-time | Runtime |
| Performance | Excellent | Good |
| Learning Curve | Steep | Moderate |

## License

See main README.md
