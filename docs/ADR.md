# System Architecture

## 1\. System Overview

### High-Level Design

The system is designed as a modular backend service exposing a REST API, consumed by a Single Page Application (SPA) frontend. It prioritizes separation of concerns, reactive/async patterns, and a clean data model.

### Key Components

* **API Layer**: Handles HTTP requests, authentication, and routing.
* **Service Layer**: Contains business logic (SM-2, Knowledge Management, Stats).
* **Data Layer**: Manages persistence to PostgreSQL using reactive patterns.
* **Frontend**: React-based SPA for Learners and Operators.

---

## 2\. Domain & Data Design

### 2.1 Database Schema

The database uses PostgreSQL and strictly enforces data integrity via foreign keys and constraints.

#### Core Tables

* `knowledge`: The central content entity.
  * `code` (PK): Immutable identifier (e.g., `ST-0000001`).
  * `metadata` (JSONB): Flexible attributes.
* `card_types`: Definitions of learning patterns.
* `templates`: Rendering layouts linked to card types.
* `accounts`: User identities.
* `account_cards`: Intersection of Account + Knowledge + CardType. Tracks SM-2 state.
* `review_history`: Immutable log of all reviews for analytics.
* `change_requests`: Staging area for content modifications proposed by Operators.
  * `id` (PK): `BIGSERIAL`.
  * `request_type`: `CREATE`, `UPDATE`, `DELETE`.
  * `target_code`: Code of item being modified (nullable for CREATE).
  * `payload`: JSONB snapshot of proposed state.
  * `status`: `PENDING`, `APPROVED`, `REJECTED`.
  * `submitter_id`: Account ID of Operator.
  * `reviewer_id`: Account ID of Manager (nullable).

#### ER Diagram (Conceptual)

```mermaid
erDiagram
    Account ||--o{ AccountCard : "tracks progress for"
    Knowledge ||--o{ AccountCard : "is subject of"
    CardType ||--o{ AccountCard : "defines format of"
    AccountCard ||--o{ ReviewHistory : "logs history"
    Account ||--o{ ChangeRequest : "submits (Operator)"
    Account ||--o{ ChangeRequest : "reviews (Manager)"
```

### 2.2 Data Types & Standards

* **Codes**: All primary business entities use the `{PREFIX}-{NUMBER}` format.
  * `ST`: Standard (default).
  * `CS`: Case Study.
* **Timestamps**: All stored in UTC (`TIMESTAMPTZ`).
* **IDs**: Internal surrogates use `BIGSERIAL` (i64), but public API uses Codes where applicable.

---

## 3\. Application Architecture

### 3.1 Backend Layers

1. **API (**`src/api/`):
   * **Controllers**: Thin wrappers mapping HTTP to Services.
   * **DTOs**: Strongly typed Request/Response objects.
   * **Middleware**: Authentication (JWT) and Role checks (`client`, `operator`).
2. **Services (**`src/services/`):
   * **KnowledgeService**: CRUD + Import/Export logic.
   * **CardService**: SM-2 calculation and review processing.
   * **StatsService**: Aggregation queries.
3. **Data Access (**`src/db.rs` / `src/models.rs`):
   * Uses `sqlx` for type-safe SQL queries.
   * **Pagination**: Standardized `Page<T>` return type.

### 3.2 Frontend Architecture

* **Framework**: React + Vite + TypeScript.
* **State Management**: TanStack Query (React Query) for server state.
* **Routing**: TanStack Router (File-based routing).
* **UI Components**: Radix UI + Tailwind CSS (Shadcn-like structure).
* **Key Features**:
  * **Auth Context**: Persists JWT and Role.
  * **Operator Dashboard**: Uses Drawer/Sheet patterns for creation flows.
  * **Learner View**: Optimized for focus (Review Mode).

### 3.3 Learner Workflows

Implementation details for key learner activities:

1. **Daily Review**:
   * **Endpoint**: `GET /api/v1/accounts/me/cards/due`
   * **Logic**: Queries `account_cards` where `next_review_date <= NOW()`.
   * **Pagination**: Returns batch of cards to frontend.
   * **Submission**: `POST /api/v1/accounts/me/cards/{id}/review` accepts `quality` (0-5).
   * **Algorithm**: Backend `CardService` applies SM-2 to update `ease_factor`, `interval_days`, `repetitions`, and `next_review_date`.
2. **Progress Tracking**:
   * **Endpoint**: `GET /api/v1/accounts/me/stats`
   * **Logic**: Aggregates counts (Total, New, Learning, Due) via SQL `COUNT` queries.
   * **Optimization**: Efficient single-pass or parallel queries.
3. **Card Management**:
   * **Endpoint**: `GET /api/v1/accounts/me/cards`
   * **Filtering**: Supports filters by `card_type_code` and pagination.

### 3.4 Operator Workflows

Implementation details for content management:

1. **Knowledge Management (CRUD)**:
   * **Endpoints**: `POST`, `PUT`, `DELETE` on `/api/v1/knowledge`.
   * **Auth**: Protected by `require_operator_role` middleware.
   * **Code Generation**:
     * Backend generates immutable codes (`ST-` or `CS-`) via `db::generate_code`.
     * Uses Postgres `SEQUENCE` for atomicity.
   * **Creation Flow**:
     * Frontend: Opens Drawer/Sheet with "Type" selection.
     * Backend: Generates code based on type, inserts into DB.
2. **Batch Import/Export (Planned)**:
   * **Export**: Streamed CSV response from `knowledge` table.
   * **Import**: Temporal Workflow to handle validation, diffing, and application.

### 3.5 Operator Manager Workflows

Implementation details for content review and approval:

1. **Change Request Review**:
   * **Endpoint**: `GET /api/v1/change-requests`
   * **Filtering**: By status (`PENDING`, `APPROVED`, `REJECTED`).
   * **Auth**: Protected by `require_manager_role` middleware.
2. **Request Approval/Rejection**:
   * **Endpoint**: `POST /api/v1/change-requests/{id}/approval`
     * **Body**: `{ "approved": boolean, "reason": string }`
   * **Logic**:
     * **Approve**: Applies the JSONB payload to the live `knowledge` table (Insert/Update/Delete). Updates request status to `APPROVED`.
     * **Reject**: Updates request status to `REJECTED`.

---

## 4\. Key Design Patterns

### 4.1 Immutable Code Generation

* **Requirement**: Content needs stable IDs across exports/imports.
* **Implementation**:
  * Backend uses Postgres `SEQUENCE` (`code_seq_st`, `code_seq_cs`).
  * Service selects prefix based on input type.
  * Format: `ST-0000123`.

### 4.2 Spaced Repetition (SM-2)

* **Logic**: Pure function implementation.
  * Input: `(current_interval, ease_factor, repetitions, quality)`
  * Output: `(new_interval, new_ease, new_repetitions)`
* **State**: Persisted in `account_cards`.

### 4.3 Batch Operations

* **Import**:
  * **Validation**: Strict schema checking before DB touch.
  * **Atomicity**: Changes applied transactionally.
* **Initialization**:
  * Asynchronous creation of cards for new users to prevent blocking signup.

---

## 5\. Security & Access Control

### 5.1 Authentication

* **Mechanism**: JWT (JSON Web Tokens) signed with HS256.
* **Identity**: `sub` claim contains the Account ID (i64).
* **Roles**: `role` claim contains either `client` or `operator`.
* **Flows**:
  * **POST /api/v1/auth/login**:
    * Accepts: `username` (password ignored in dev mode).
    * Action: Finds or Creates `Account` record.
    * Logic: If username is "operator" or "admin", assigns `operator` role. Else `client`.
    * Returns: JWT Token + User Info.
  * **POST /api/v1/auth/signup**:
    * Aliased to login for development simplicity (auto-creation).
    * Triggers: Asynchronous card initialization for new users.

### 5.2 Authorization

* **Role-Based Access Control (RBAC)**:
  * `client`: Access to `/accounts/me/*` and read-only `/knowledge`.
  * `operator`: Can SUBMIT change requests via `/knowledge` (Write). Cannot modify live DB directly.
  * `operator_manager`: Full access to `/change-requests` to approve requests. Can also act as Operator.
  * *Note*: Operators implicitly have Client permissions for dogfooding/testing.

---

## 6\. Deployment & Operations

* **Containerization**: Docker & Docker Compose.
* **Database**: PostgreSQL 15+.
* **Configuration**: Environment variables (`.env`).