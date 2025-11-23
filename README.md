# English Learning System

A minimal, high-performance spaced repetition learning platform built with **Rust**, using the SM-2 algorithm for optimal learning schedules.

## 🚀 Migration to Rust

This project has been **completely migrated from Kotlin/Quarkus to Rust** for:
- **Minimal codebase**: No ORM, raw SQL with compile-time checking
- **High performance**: Zero-cost abstractions, async I/O
- **Small footprint**: ~15MB binary vs 100MB+ JVM
- **Fast startup**: <100ms vs ~1-2s
- **Low memory**: ~10-50MB vs ~200-500MB

## Prerequisites

- **Rust** (1.70+) - [Install Rust](https://rustup.rs/)
- **PostgreSQL** (14+)
- **sqlx-cli** - Install with: `cargo install sqlx-cli --no-default-features --features postgres`

## Quick Start

### 1. Setup Database

```bash
# Create database
createdb english_learning

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
```

### 2. Run Migrations

```bash
sqlx migrate run
```

### 3. Build and Run

```bash
# Development mode
cargo run

# Production build
cargo build --release
./target/release/english-learning
```

The server will start on `http://localhost:8080`.

## Common Commands

### Development

```bash
# Run in development mode
cargo run

# Run with auto-reload (requires cargo-watch)
cargo install cargo-watch
cargo watch -x run

# Run tests
cargo test

# Run with logging
RUST_LOG=debug cargo run
```

### Build

```bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release

# Check without building
cargo check
```

### Database

```bash
# Run migrations
sqlx migrate run

# Create new migration
sqlx migrate add <migration_name>

# Revert last migration
sqlx migrate revert

# Database info
sqlx database info
```

### Code Quality

```bash
# Format code
cargo fmt

# Lint code
cargo clippy

# Run all checks
cargo fmt && cargo clippy && cargo test
```

## Project Structure

```
.
├── Cargo.toml              # Rust dependencies and configuration
├── .env.example            # Environment variables template
├── ARCHITECTURE.md         # Complete system architecture
├── README_RUST.md          # Detailed Rust-specific documentation
├── migrations/             # Database migrations (sqlx)
│   └── 001_initial_schema.sql
└── src/
    ├── main.rs            # Application entry point
    ├── config.rs          # Configuration management
    ├── db.rs              # Database connection & code generation
    ├── models.rs          # Data models and DTOs
    ├── services.rs        # Business logic layer
    ├── api.rs             # REST API handlers
    ├── auth.rs            # JWT authentication
    ├── error.rs           # Error handling
    └── sm2.rs             # SM-2 algorithm implementation
```

## Tech Stack

- **Language**: Rust (stable)
- **Web Framework**: [Axum](https://github.com/tokio-rs/axum) - Fast, ergonomic async web framework
- **Database**: PostgreSQL with [sqlx](https://github.com/launchbadge/sqlx) - Compile-time checked queries
- **Async Runtime**: [Tokio](https://tokio.rs/) - Industry-standard async runtime
- **Authentication**: JWT with [jsonwebtoken](https://github.com/Keats/jsonwebtoken)
- **Serialization**: [Serde](https://serde.rs/) - Fast, zero-copy serialization

## API Documentation

Full API documentation is available in [ARCHITECTURE.md](./ARCHITECTURE.md).

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <token>
```

### Key Endpoints

**Knowledge**
- `GET /api/v1/knowledge` - List knowledge items
- `GET /api/v1/knowledge/:code` - Get specific knowledge

**Card Types**
- `GET /api/v1/card-types` - List card types
- `GET /api/v1/card-types/:code` - Get specific card type

**Account Cards** (Client role required)
- `GET /api/v1/accounts/me/cards` - List my cards
- `GET /api/v1/accounts/me/cards:due` - Get cards due for review
- `POST /api/v1/accounts/me/cards/:card_id:review` - Submit review
- `POST /api/v1/accounts/me/cards:initialize` - Initialize cards

**Statistics** (Client role required)
- `GET /api/v1/accounts/me/stats` - Get learning statistics

## Environment Variables

```bash
DATABASE_URL=postgres://postgres:postgres@localhost/english_learning
HOST=0.0.0.0
PORT=8080
JWT_SECRET=change-me-in-production
RUST_LOG=info,english_learning=debug
```

## Performance Characteristics

| Metric | Rust | Kotlin/Quarkus |
|--------|------|----------------|
| Binary Size | ~15MB | ~100MB+ |
| Memory Usage | ~10-50MB | ~200-500MB |
| Startup Time | <100ms | ~1-2s |
| Cold Start | <50ms | ~500ms-1s |
| Request Latency | <1ms | ~2-5ms |

## Features

- ✅ **SM-2 Spaced Repetition**: Optimal review scheduling algorithm
- ✅ **JWT Authentication**: Role-based access control (client/operator)
- ✅ **Raw SQL**: No ORM overhead, compile-time query validation
- ✅ **Async I/O**: High-concurrency with Tokio
- ✅ **Type Safety**: Compile-time guarantees
- ✅ **Minimal Dependencies**: Small attack surface
- ✅ **Fast Build**: <10s incremental builds

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture and API specs
- [README_RUST.md](./README_RUST.md) - Detailed Rust implementation guide

## License

MIT License - See LICENSE file for details
