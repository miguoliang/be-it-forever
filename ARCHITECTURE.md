# English Learning System All in One

## Part 1: Business Overview

### System Overview
An English learning system that helps users learn vocabulary and knowledge through spaced repetition. The system uses the SM-2 algorithm to optimize learning schedules, presenting cards for review at optimal intervals. Knowledge content is managed by operators through CSV batch imports with validation and approval workflows.

### Key Features
- **Spaced Repetition Learning**: SM-2 algorithm for optimal review scheduling
- **Knowledge Management**: Predefined knowledge items organized by levels
- **Card Types**: Multiple learning patterns (e.g., word-to-definition, definition-to-word)
- **Progress Tracking**: Statistics and learning history
- **Batch Import**: CSV-based knowledge management with validation and approval

---

## Part 1.1: Client Side Operations

### Card Review Operation
1. User requests cards due for review
2. System retrieves cards where `next_review_date <= today`
3. System renders card content using templates (front and back)
4. User reviews card and submits quality rating (0-5)
5. System applies SM-2 algorithm to calculate next review date
6. System updates card state and records review history
7. User sees updated card with new review schedule

**User Actions**:
- View due cards
- Review cards
- Submit quality rating

**System Behaviors**:
- Filter cards by due date
- Render card content from templates
- Calculate optimal next review date using SM-2
- Track learning progress

### Statistics Viewing Operation
1. User requests learning statistics
2. System calculates statistics from user's cards:
   - Total cards
   - New cards (not yet reviewed)
   - Learning cards (in progress)
   - Due today
   - Breakdown by card type
3. User views progress dashboard

**User Actions**:
- View learning statistics

**System Behaviors**:
- Aggregate card statistics
- Calculate learning progress metrics
- Group by card types

## Part 1.1.1: Client Side Workflows (Temporal)

### Card Initialization Workflow
A heavy job that creates cards for all knowledge-card type combinations after user signup. This workflow is executed asynchronously using Temporal.

**Workflow Steps**:
1. User signs up for an account
2. System triggers Temporal workflow for card initialization
3. Workflow loads available knowledge items (potentially thousands)
4. Workflow loads all card types
5. Workflow creates cards in batches for each knowledge-card type combination:
   - Batch processing to avoid timeouts
   - Progress tracking for monitoring
   - Error handling and retry logic
6. Workflow creates cards with default SM-2 values
7. Workflow completes and notifies system
8. User account is ready for learning

**User Actions**:
- Sign up for account (triggers workflow)

**System Behaviors**:
- Triggers Temporal workflow asynchronously
- Workflow processes cards in batches
- Workflow provides progress updates
- Workflow handles errors and retries
- System ensures account is ready for learning

---

## Part 1.2: Operator Side Workflows (Temporal)

### Knowledge Management Workflow

A heavy job with multiple sub-tasks: CSV upload, validation, comparison, and approval. This workflow is executed using Temporal to handle long-running operations, retries, and state management.

**Workflow Steps**:

1. **Export CSV** (Optional, Simple Operation)
   - Operator exports all knowledge to CSV file
   - Exported CSV includes code column with all existing codes filled in
   - Operator can modify the CSV file (add new rows, update existing rows, remove rows)

2. **Upload CSV & Start Workflow**
   - Operator uploads modified CSV file
   - CSV format:
     - **Existing items**: Code column is filled (e.g., `ST-0000001`)
     - **New items**: Code column is empty (codes will be generated after approval)
     - **Metadata fields**: Flat columns with `metadata:` prefix (e.g., `metadata:level`, `metadata:type`)
   - System triggers Temporal workflow for knowledge import
   - Workflow stores CSV data temporarily

3. **Validation Activity** (Temporal Activity)
   - Workflow executes validation activity:
     - Validates data legality (format, required fields)
     - Parses metadata columns and converts to JSONB
     - Validates code format if provided
   - Workflow stores validation results

4. **Comparison Activity** (Temporal Activity)
   - Workflow executes comparison activity:
     - Compares CSV with existing database:
       - Uses code column to identify existing items (if code is filled)
       - Uses content matching for items without codes (to detect duplicates)
     - Identifies differences:
       - New items (code column empty, not in database)
       - Updated items (code column filled, exists in database with different data)
       - Unchanged items (code column filled, exists with same data)
       - Deleted items (in database but not in CSV)
   - Workflow stores comparison results

5. **Review & Approval** (Human-in-the-loop)
   - Operator reviews validation results and differences
   - Operator approves or rejects changes via API
   - Workflow waits for operator decision (signal)

6. **Apply Changes Activity** (Temporal Activity, if approved)
   - If approved, workflow executes apply activity:
     - Generates codes (ST-0000001, ST-0000002, etc.) for new items using CodeGenerationService
     - Applies all changes to database in batches:
       - Inserts new items with generated codes
       - Updates existing items
       - Handles deletions (if supported)
     - Progress tracking for large batches
     - Error handling and retry logic
   - If rejected, workflow completes without changes

**Key Points**:
- Export is a simple operation (not a workflow)
- Import is a Temporal workflow with multiple activities
- Workflow handles long-running operations, retries, and state management
- Validation and comparison are separate activities for better error handling
- Approval is a human-in-the-loop step (workflow waits for signal)
- Code generation happens during apply activity, after approval
- Batch processing ensures scalability for large imports

---

## Part 2: Technology Architecture

## Part 2.2: Code Specification

### Code Pattern Format

Predefined entities (`knowledge`, `templates`, `card_types`) use immutable short codes following a pattern format:

**Pattern**: `{PREFIX}-{NUMBER}`

Where:
- `PREFIX`: 2-letter uppercase meaningless prefix
- `NUMBER`: 7-digit zero-padded number (0000001-9999999)
- Total length: 10 characters (2 prefix + 1 hyphen + 7 digits)

### Code Prefixes

- **ST-**: Standard (e.g., `ST-0000001`, `ST-0000002`)
- **CS-**: Custom (e.g., `CS-0000001`)

All predefined entities (knowledge, templates, card_types) use these prefixes. ST- is used for standard/predefined items, CS- is reserved for custom items or future extensions.

### Code Rules

1. **Global Uniqueness**: Codes must be unique across all entity types globally
2. **Immutable**: Once assigned, codes cannot be changed
3. **Prefix Meaning**: ST- indicates standard/predefined items, CS- indicates custom items
4. **Sequential**: Numbers are assigned sequentially within each prefix
5. **Case Sensitive**: Codes are stored in uppercase

### Examples

- Standard Template: `ST-0000001`, `ST-0000002`
- Standard Card Type: `ST-0000003`, `ST-0000004`
- Standard Knowledge: `ST-0000005`, `ST-0000006`
- Custom items: `CS-0000001`, `CS-0000002` (for future use)

### Code Generation Design

**Generation Strategy**: Database sequences per prefix to ensure global uniqueness and sequential numbering.

#### Database Sequences

Each prefix requires a separate database sequence to maintain sequential numbering:

```sql
-- Sequences for code generation
CREATE SEQUENCE code_seq_st START WITH 1;  -- ST- prefix
CREATE SEQUENCE code_seq_cs START WITH 1;  -- CS- prefix
```

**Sequence Naming Convention**: `code_seq_{prefix_lowercase}`

#### Code Generation Service

A centralized `CodeGenerationService` handles code generation:

**Responsibilities**:
1. Select appropriate sequence based on prefix
2. Generate next sequential number
3. Format code according to pattern: `{PREFIX}-{NUMBER}` (10 characters total)
4. Ensure atomicity and thread-safety
5. Validate generated code format

**Implementation Pattern (Pseudo-code)**:
```
class CodeGenerationService {
    async function generateCode(prefix): String {
        require(prefix in ["ST", "CS"], "Invalid prefix")
        
        sequenceName = "code_seq_" + prefix.lowercase()
        nextValue = db.query("SELECT nextval('$sequenceName')")
        
        number = padStart(nextValue.toString(), 7, '0')
        require(number.length <= 7, "Sequence overflow")

        return "$prefix-$number"
    }
}
```

#### Code Generation Rules

1. **Atomicity**: Use database sequences (not application-level counters) to ensure atomic increments
2. **Thread-Safety**: Database sequences are inherently thread-safe
3. **Uniqueness**: Sequences guarantee unique numbers per prefix
4. **Sequential**: Numbers are assigned sequentially within each prefix
5. **Format Validation**: Generated code must match pattern `{PREFIX}-{NUMBER}` (10 chars)
6. **Prefix Validation**: Only `ST` and `CS` prefixes are allowed
7. **Number Padding**: Numbers are zero-padded to 7 digits (0000001-9999999)

#### Code Generation Flow

```
1. Service receives prefix (ST or CS)
2. Validate prefix format and allowed values
3. Query database sequence: SELECT nextval('code_seq_{prefix}')
4. Format number: pad to 7 digits with leading zeros
5. Combine: {PREFIX}-{NUMBER}
6. Validate final code format (10 characters)
7. Return generated code
```

#### Error Handling

**Invalid Prefix**:
- Error: `IllegalArgumentException`
- Message: "Invalid prefix: {prefix}. Must be ST or CS"

**Sequence Overflow**:
- Error: `IllegalStateException`
- Message: "Sequence value exceeds maximum (9999999)"
- Prevention: Monitor sequence values, plan for prefix migration if needed

**Database Error**:
- Error: `DataAccessException`
- Handling: Retry logic or fail-fast depending on use case

#### Code Validation

Before using generated codes, validate format:

```
function validateCode(code: String): Boolean {
    pattern = "^(ST|CS)-\d{7}$"
    return match(code, pattern)
}
```

#### Usage in Entity Creation

**Example**: Creating a knowledge item
```
code = codeGenerationService.generateCode("ST")
knowledge = Knowledge(
    code = code,
    name = "Example",
    description = "Description",
    metadata = null
)
repository.save(knowledge)
```

#### Migration Considerations

**Initial Sequence Values**:
- Start sequences at 1 for new systems
- For existing data migration, set sequence start value to max existing number + 1:
  ```sql
  SELECT setval('code_seq_st', (SELECT MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)) FROM knowledge WHERE code LIKE 'ST-%'));
  ```

**Sequence Reset** (if needed):
- Use `setval()` to reset sequence to specific value
- Only during migration or maintenance, never in production

---

## Part 2.3: Data Type Definitions

### Standardized Data Types

All database fields use the following standardized semantic data type definitions based on usage patterns:

| Semantic Type | Database Type | Usage |
|--------------|---------------|-------|
| `code` | `VARCHAR(20)` | Immutable code identifiers (e.g., `ST-0000001`) |
| `short_string` | `VARCHAR(255)` | Short text fields (name, username, role) |
| `long_string` | `TEXT` | Long text fields (description, message) |
| `blob` | `BYTEA` | Binary large object fields (content) |
| `i18n_key` | `VARCHAR(100)` | i18n translation key identifiers |
| `i18n_locale` | `VARCHAR(10)` | i18n locale codes (e.g., `zh-CN`, `es-ES`) |
| `id` | `BIGSERIAL` | Auto-increment primary keys |
| `decimal` | `DECIMAL(5,2)` | Decimal numeric values (e.g., ease_factor) |
| `integer` | `INTEGER` | Integer numeric values (interval_days, repetitions, quality) |
| `local_time` | `TIMESTAMP` | Date-time fields with time parts (next_review_date, last_reviewed_at, reviewed_at) |
| `utc_time` | `TIMESTAMP` | UTC timestamp fields (created_at, updated_at) |
| `jsonb` | `JSONB` | JSON metadata |

---

## Part 2.4: Audit Fields

### Standard Audit Fields

The following audit fields are used across tables but are not shown in the Core ER Diagram to keep it clean:

| Field Name | Semantic Type | Database Type | Description |
|------------|---------------|---------------|-------------|
| `created_at` | `utc_time` | `TIMESTAMP` | Creation timestamp |
| `updated_at` | `utc_time` | `TIMESTAMP` | Last update timestamp |
| `created_by` | `short_string` | `VARCHAR(255)` | Username or identifier of internal user who created the record |
| `updated_by` | `short_string` | `VARCHAR(255)` | Username or identifier of internal user who last updated the record |

### Audit Fields by Table

| Table | `created_at` | `updated_at` | `created_by` | `updated_by` |
|-------|--------------|--------------|---------------|---------------|
| `knowledge` | ✓ | ✓ | ✓ | ✓ |
| `templates` | ✓ | ✓ | ✓ | ✓ |
| `card_types` | ✓ | ✓ | ✓ | ✓ |
| `translation_keys` | ✓ | ✓ | ✓ | ✓ |
| `translation_messages` | ✓ | ✓ | ✓ | ✓ |
| `knowledge_rel` | ✓ | ✓ | ✓ | ✓ |
| `card_type_template_rel` | ✓ | ✓ | ✓ | ✓ |
| `accounts` | ✓ | ✓ | ✓ | ✓ |
| `account_cards` | ✓ | ✓ | ✓ | ✓ |
| `review_history` | ✓ | | ✓ | |

**Notes**:
- All timestamp audit fields use `utc_time` semantic type and are stored in UTC.
- User audit fields use `short_string` semantic type to store internal user identifiers.
- `review_history` table does not have `updated_at` and `updated_by` fields as it represents immutable historical records that should not be modified after creation.
- Review-related fields (`reviewed_at`, `last_reviewed_at`) are core business fields and remain in the Core ER Diagram as they track account review actions.

---

## Part 2.5: Database Schema

### Tables

#### 1. `knowledge`
Learning unit with common fields: code (immutable primary key), name, description, and metadata (JSONB for flexible key-value data). Uses immutable code (format: `ST-0000001` for standard items) as primary key since knowledge items are predefined.

#### 2. `knowledge_rel`
Junction table for many-to-many self-referential relationship between knowledge items. Links knowledge items to other knowledge items for various reasons. Uses `source_knowledge_code` and `target_knowledge_code` to reference knowledge items. Constraint: source_knowledge_code cannot equal target_knowledge_code (no self-references).

#### 3. `templates`
Reusable templates for rendering card content using FreeMarker template engine. Includes format field (short_string type) to specify template format - currently supports `ftl` (FreeMarker Template Language). Content field (blob type) stores the template content in FreeMarker syntax. Templates support FreeMarker variables and expressions (e.g., `${name}`, `${description}`, `${metadata.level}`, `<#list relatedKnowledge as item>...${item.name}...</#list>`). Metadata can be accessed via dot notation (e.g., `${metadata.level}` or `${metadata.nested.key}`). A template's usage role (e.g., "front", "back", or custom roles) is determined by how it's referenced in card_type_template_rel, not by a type field. Templates can be reused across different card types in different roles for flexibility. Uses immutable code (format: `ST-0000001` for standard templates) as primary key since templates are predefined.

#### 3. `card_types`
Predefined card patterns that reference templates for rendering. Each card type defines a learning pattern (e.g., "word_to_definition", "definition_to_word") and can reference multiple templates in different roles (e.g., "front", "back", or custom roles). Uses immutable code (format: `ST-0000001` for standard card types) as primary key since card types are predefined.

#### 3. `card_type_template_rel`
Junction table for flexible many-to-many relationship between card_types and templates. Links card types to templates with a role field indicating how the template is used (e.g., "front", "back").

#### 4. `translation_keys`
Translation key entries using i18n pattern. Each translation key has a unique key. Uses immutable code (format: `ST-0000001` for standard keys) as primary key since translation keys are predefined.

#### 5. `translation_messages`
Translation message entries for each locale. Each translation key can have multiple messages (one per locale_code). References translation_keys via foreign key. The combination of `translation_key_code` and `locale_code` is unique. Uses immutable code (format: `ST-0000001` for standard messages) as primary key since translation messages are predefined.

#### 6. `accounts`
Account records (simplified for MVP). Stores basic account information including username. Distinguishes end-user accounts from internal users who operate the product.

#### 7. `account_cards`
Account's learning progress for each knowledge-card type combination. Tracks SM-2 algorithm state including ease factor, interval days, repetitions, and next review date. Each account can have one card per knowledge-card type combination (enforced by unique constraint). References knowledge via `knowledge_code` foreign key.

#### 8. `review_history`
Historical record of reviews (optional, for analytics). Stores each review with quality rating (0-5) and timestamp for tracking learning progress over time. References account_cards via foreign key.

#### 9. `knowledge_import_sessions`
Temporary storage for CSV import sessions. Stores uploaded CSV data, validation results, and approval status. Used for batch knowledge import workflow with operator review and approval. Sessions are created during CSV upload, validated, then approved or rejected. Once approved, changes are applied to knowledge table and session can be archived or deleted.

### Core ER Diagram

```mermaid
erDiagram
    knowledge ||--o{ knowledge_rel : "source references"
    knowledge ||--o{ knowledge_rel : "target referenced by"
    knowledge ||--o{ account_cards : "has"
    card_types ||--o{ card_type_template_rel : "uses"
    templates ||--o{ card_type_template_rel : "used by"
    card_types ||--o{ account_cards : "has"
    accounts ||--o{ account_cards : "has"
    account_cards ||--o{ review_history : "has"
    
    knowledge {
        code code PK "Immutable code (ST-0000001)"
        short_string name "Knowledge name"
        long_string description "Knowledge description"
        jsonb metadata "Flexible metadata as JSON (nullable)"
    }
    
    knowledge_rel {
        id id PK "Auto-increment primary key"
        code source_knowledge_code FK "Reference to source knowledge code"
        code target_knowledge_code FK "Reference to target knowledge code"
        constraint no_self_ref "source_knowledge_code != target_knowledge_code"
    }
    
    templates {
        code code PK "Immutable code (ST-0000001)"
        short_string name UK "Unique template name"
        long_string description "Template description"
        short_string format "Template format (qute for Qute templates)"
        blob content "Template content in Qute syntax"
    }
    
    card_types {
        code code PK "Immutable code (ST-0000001)"
        short_string name UK "Unique card type name"
        long_string description "Card type description"
    }
    
    card_type_template_rel {
        id id PK "Auto-increment primary key"
        code card_type_code FK "Reference to card type code"
        code template_code FK "Reference to template code"
        short_string role "Template role (e.g., front, back)"
    }
    
    accounts {
        id id PK "Primary key"
        short_string username UK "Unique username"
    }
    
    account_cards {
        id id PK "Auto-increment primary key"
        id account_id FK "Reference to account"
        code knowledge_code FK "Reference to knowledge code"
        code card_type_code FK "Reference to card type code"
        decimal ease_factor "SM-2 ease factor"
        integer interval_days "Current interval in days"
        integer repetitions "Number of successful reviews"
        local_time next_review_date "When card is due for review"
        local_time last_reviewed_at "Last review timestamp"
    }
    
    review_history {
        id id PK "Auto-increment primary key"
        id account_card_id FK "Reference to account card"
        integer quality "SM-2 quality rating (0-5)"
        local_time reviewed_at "Review timestamp"
    }
```

### Translation ER Diagram

```mermaid
erDiagram
    translation_keys ||--o{ translation_messages : "has messages"
    
    translation_keys {
        code code PK "Immutable code (ST-0000001)"
        i18n_key key UK "Unique i18n key"
    }
    
    translation_messages {
        code code PK "Immutable code (ST-0000001)"
        code translation_key_code FK "Reference to translation key code"
        i18n_locale locale_code "Locale code (e.g., zh-CN, es-ES, en-US)"
        long_string message "Translated message for this locale"
        unique key_locale "Unique constraint on (translation_key_code, locale_code)"
    }
```

### Relationships
- One card_type ↔ multiple templates (many-to-many via card_type_template_rel junction table with role field)
- One template → can be used by multiple card_types in different roles
- One knowledge ↔ multiple knowledge (many-to-many self-referential via knowledge_rel junction table, no self-references allowed)
- One translation key → can have multiple translation messages (one per locale_code), with unique constraint on (translation_key_code, locale_code)
- One knowledge → multiple account_cards (one per account per card type)
- One account → multiple account_cards (one per knowledge per card type)
- One account_card → multiple review_history entries

**Constraints**:
- Each knowledge item has name and description fields
- Metadata field is JSONB type for flexible key-value storage
- Recommended: Create GIN index on metadata field for efficient querying: `CREATE INDEX idx_knowledge_metadata_gin ON knowledge USING GIN (metadata);`
- Knowledge_rel table: source_knowledge_code cannot equal target_knowledge_code (no self-references)
- Each account_card references a knowledge_code
- Each account_card tracks SM-2 algorithm state independently
- Translation_keys table has unique constraint on key
- Translation_messages table has unique constraint on (translation_key_code, locale_code)

> **Note**: Entity relationship patterns and JPA entity design decisions are documented in the [Design Decisions & Constraints](#step-7-design-decisions--constraints) section.

### Metadata Query Examples

Knowledge items can be queried by metadata using JSONB operators:

- **Key exists**: `WHERE metadata ? 'key'`
- **Value match**: `WHERE metadata->>'key' = 'value'`
- **Containment**: `WHERE metadata @> '{"key": "value"}'`
- **Nested access**: `WHERE metadata->'nested'->>'key' = 'value'`

For optimal performance, create a GIN index on the metadata column:
```sql
CREATE INDEX idx_knowledge_metadata_gin ON knowledge USING GIN (metadata);
```

## Part 2.6: API Design

### Design Principles

This API follows:
- **Single Responsibility Principle (SRP)**: Each endpoint has a single, well-defined responsibility
- **Google API Design Guidelines**: Resource-oriented design, consistent naming, standard patterns
- **Unified API with Role-Based Access**: Single API surface with access control via headers

### Base Path: `/api/v1`

### Workflow Endpoints (Generic)

All workflow-related operations use generic endpoints that work for any workflow type. Business-specific endpoints trigger workflows but status and signals are managed through generic workflow APIs.

#### `GET /api/v1/workflows/{workflowId}/status`
Get the status and results of any workflow execution.

**Headers**:
- `Authorization: Bearer <token>` (required, token must have appropriate role claim)

**Path Parameters**:
- `workflowId` (required): Workflow execution ID returned from workflow trigger endpoint

**Response**: `200 OK`
```json
{
  "workflowId": "uuid-string",
  "workflowExecutionId": "workflow-execution-id",
  "runId": "run-id",
  "workflowType": "KnowledgeImportWorkflow",
  "status": "RUNNING",
  "executionStatus": "RUNNING",
  "startedAt": "2024-01-01T12:00:00Z",
  "closedAt": null,
  "historyLength": 15,
  "currentActivity": "validation",
  "progress": {
    "currentStep": "Validation",
    "completedSteps": ["Upload"],
    "totalSteps": 4
  },
  "queryResults": {
    "validationResults": {
      "total": 100,
      "valid": 95,
      "errors": 5,
      "errors": [
        { "row": 10, "field": "name", "message": "Name cannot be empty" }
      ]
    },
    "comparisonResults": null
  },
  "result": null,
  "failure": null
}
```

**Status Values**:
- `RUNNING`: Workflow is currently executing
- `COMPLETED`: Workflow completed successfully
- `FAILED`: Workflow failed with an error
- `CANCELED`: Workflow was canceled
- `TERMINATED`: Workflow was terminated
- `TIMED_OUT`: Workflow timed out
- `CONTINUED_AS_NEW`: Workflow continued as new execution

**Query Results** (available via Temporal Query feature, workflow-specific):
- Workflow-specific query handlers expose internal state
- Examples: `validationResults`, `comparisonResults`, `progress`, `currentActivity`
- Query names and results vary by workflow type

**When Status is COMPLETED**:
```json
{
  "workflowId": "uuid-string",
  "workflowType": "KnowledgeImportWorkflow",
  "status": "COMPLETED",
  "executionStatus": "COMPLETED",
  "startedAt": "2024-01-01T12:00:00Z",
  "closedAt": "2024-01-01T12:05:00Z",
  "result": {
    "summary": {
      "total": 100,
      "new": 20,
      "updated": 15,
      "unchanged": 60,
      "deleted": 5
    },
    "generatedCodes": [
      "ST-0000001",
      "ST-0000002",
      ...
    ]
  }
}
```

**When Status is FAILED**:
```json
{
  "workflowId": "uuid-string",
  "workflowType": "KnowledgeImportWorkflow",
  "status": "FAILED",
  "executionStatus": "FAILED",
  "startedAt": "2024-01-01T12:00:00Z",
  "closedAt": "2024-01-01T12:02:00Z",
  "failure": {
    "message": "Validation failed: Invalid CSV format",
    "type": "ApplicationFailure",
    "cause": "CSV parsing error at line 10",
    "stackTrace": "..."
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Workflow not found
- `400 Bad Request`: Invalid workflow ID format

#### `POST /api/v1/workflows/{workflowId}/signal`
Send a signal to a running workflow.

**Headers**:
- `Authorization: Bearer <token>` (required, token must have appropriate role claim)

**Path Parameters**:
- `workflowId` (required): Workflow execution ID

**Request Body**:
```json
{
  "signalName": "approval",
  "signalData": {
    "approved": true,
    "reason": "Optional reason for approval/rejection"
  }
}
```

**Response**: `200 OK`
```json
{
  "workflowId": "uuid-string",
  "signalName": "approval",
  "signalSent": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Note**: Signal names and data structure are workflow-specific. The workflow must be waiting for this signal type.

**Errors**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Workflow not found or already completed
- `400 Bad Request`: Invalid workflow ID format or workflow not in waiting state

#### `GET /api/v1/workflows`
List workflows with optional filtering.

**Headers**:
- `Authorization: Bearer <token>` (required, token must have appropriate role claim)

**Query Parameters**:
- `workflowType` (optional): Filter by workflow type (e.g., `KnowledgeImportWorkflow`, `CardInitializationWorkflow`)
- `status` (optional): Filter by execution status (`RUNNING`, `COMPLETED`, `FAILED`, etc.)
- `page` (optional, default: 0): Page number (0-indexed)
- `size` (optional, default: 20, max: 100): Number of items per page

**Response**: `200 OK`
```json
{
  "content": [
    {
      "workflowId": "uuid-string",
      "workflowType": "KnowledgeImportWorkflow",
      "status": "RUNNING",
      "startedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token
- `400 Bad Request`: Invalid size > 100 or invalid status value

#### `POST /api/v1/workflows/{workflowId}/cancel`
Cancel a running workflow.

**Headers**:
- `Authorization: Bearer <token>` (required, token must have appropriate role claim)

**Path Parameters**:
- `workflowId` (required): Workflow execution ID

**Response**: `200 OK`
```json
{
  "workflowId": "uuid-string",
  "canceled": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Workflow not found
- `400 Bad Request`: Workflow already completed or cannot be canceled

### Resource Naming Conventions

- Use plural nouns for collection resources: `knowledge`, `card-types`, `accounts`, `cards`
- Use resource identifiers in paths: `/knowledge/{code}`, `/accounts/{accountId}/cards/{cardId}`
- Use custom actions with `:` prefix: `:initialize`, `:review`
- Use consistent field naming: camelCase in JSON, snake_case in query parameters

### API Access Control

The API uses a unified path structure with role-based access control via JWT token claims:

**Unified Path Structure**:
- All endpoints use the same paths regardless of user role
- No separate `/ops/` or `/clients/` path prefixes needed
- Role is extracted from JWT token claims (`role` or `roles` claim) to determine access permissions
- Same endpoints serve both roles, but permissions differ based on role from token

**Token-Based Role Access Control**:
- `Authorization: Bearer <token>` header contains JWT with role claim
- Role values:
  - `operator`: Internal operators managing the system (full CRUD access)
  - `client`: End-user accounts using the learning system (read/action access)
- Client endpoints use `/me` pattern for authenticated user context (account ID from token `sub` claim)
- Operators can access any account via `{accountId}` pattern

**JWT Token Structure**:
```json
{
  "sub": "account-id-or-user-id",
  "role": "client",  // or "operator"
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Benefits of Unified Path Approach**:
- Single API surface, simpler routing and maintenance
- Consistent resource structure regardless of user type
- No path-based separation needed (role determines access)
- Less code duplication
- Easier to maintain consistency
- Role-based access control at the security layer
- More secure (role cannot be spoofed, it's part of signed token)

**Security Implementation**:
- Role is validated from JWT token claims during authentication
- Access control is enforced at the security layer based on token role
- Token signature ensures role cannot be tampered with
- Same endpoint paths, different permissions based on role

## Part 2.6: API Design

### Design Principles

This API follows:
- **Single Responsibility Principle (SRP)**: Each endpoint has a single, well-defined responsibility.
- **Resource-oriented design**: Consistent naming and standard patterns.
- **Unified API with Role-Based Access**: Single API surface with access control via headers.

### Base Path: `/api/v1`

### Resource Naming Conventions

- Use plural nouns for collection resources: `knowledge`, `card-types`, `accounts`, `cards`
- Use resource identifiers in paths: `/knowledge/{code}`, `/accounts/{accountId}/cards/{cardId}`
- Use consistent field naming: camelCase in JSON, snake_case in query parameters

### API Access Control

The API uses a unified path structure with role-based access control via JWT token claims:

**Unified Path Structure**:
- All endpoints use the same paths regardless of user role.
- Role is extracted from JWT token claims to determine access permissions.

**Token-Based Role Access Control**:
- `Authorization: Bearer <token>` header contains JWT with role claim.
- Role values:
  - `operator`: Internal operators managing the system (full CRUD access).
  - `client`: End-user accounts using the learning system (read/action access).

---

## Part 2.7: Service Layer Architecture

### Components

#### 0. **PaginationHelper** (Utility Service)
Reusable utility service that encapsulates pagination pattern. Provides method that combines data query and count query into a Page result. Used by all services that need pagination to eliminate boilerplate code.

#### 1. **Sm2Algorithm** (Object)
Implements the SM-2 spaced repetition algorithm.
- `calculateNextReview(currentCard, quality)`: Updates card state based on quality rating
- `createInitialCard(accountId, knowledgeCode, cardTypeCode)`: Creates new card with default SM-2 values

**SM-2 Algorithm Logic**:
- Quality < 3 (Failed): Reset repetitions to 0, interval to 1 day, decrease ease factor by 0.2
- Quality >= 3 (Passed): Increase repetitions, calculate new interval based on ease factor
- Ease factor adjustment: Based on quality rating (0-5 scale)
- Minimum ease factor: 1.3

#### 2. **TemplateService**
Manages template operations.
- `getTemplateByCode(code)`: Get single template
- `getAllTemplates()`: List all templates (usage determined by relationships)

#### 3. **CardTemplateService**
Renders card templates with knowledge data using a template engine.
- `renderByRole(cardType, knowledge, role)`: Generates content using template for specified role
- Loads templates from database via TemplateService and card_type_template_rel
- Uses template syntax: `{name}`, `{description}`, `{metadata.level}`, `{#for item in relatedKnowledge}{item.name}{/for}` (iterates over referenced knowledge entities via knowledge_rel)
- Metadata can be accessed via dot notation (e.g., `{metadata.level}` or `{metadata.nested.key}`)
- Template format field value specifies the engine used.

#### 4. **KnowledgeService**
Manages knowledge operations.
- `getKnowledge(pageable, filter?)`: List knowledge items with pagination
- `getKnowledgeByCode(code)`: Get single knowledge item

#### 4.1. **KnowledgeImportService**
Manages CSV-based batch import/export of knowledge items. Export is a simple operation, while import uses Temporal workflows.
- `exportAllKnowledge()`: Export all knowledge items to CSV file - Simple operation
- `uploadCsv(file, operatorId)`: Upload CSV file and start Temporal workflow

#### 4.1.1. **WorkflowService** (Generic)
Generic service for managing all Temporal workflows:
- `getWorkflowStatus(workflowId)`: Get workflow status using Temporal's API
  - Returns: execution status, start/close times, history length, query results, workflow result, failure details
- `sendSignal(workflowId, signalName, signalData)`: Send signal to workflow
- `listWorkflows(workflowType, status, pageable)`: List workflows with filtering
- `cancelWorkflow(workflowId)`: Cancel running workflow

#### 4.2. **KnowledgeImportWorkflow** (Temporal Workflow)
Temporal workflow for knowledge import with multiple activities:
- `validateActivity(csvData: String)`: Validates CSV data format and content (Temporal Activity)
- `compareActivity(csvData: String)`: Compares CSV with existing database (Temporal Activity)
- `applyChangesActivity(changes: ImportChanges, approved: Boolean)`: Applies changes to database in batches (Temporal Activity)
- Workflow waits for approval signal from operator
- Handles retries, timeouts, and error recovery

**Import Session States**:
- `pending_validation`: CSV uploaded, awaiting validation
- `validated`: Validation complete, awaiting approval
- `approved`: Changes approved and applied to database
- `rejected`: Changes rejected by operator

#### 5. **CardTypeService**
Manages card type operations.
- `getAllCardTypes()`: List all card types (includes template references)
- `getCardTypeByCode(code)`: Get single card type with templates loaded

#### 6. **AccountCardService**
Manages account card operations and reviews.
- `initializeCards(accountId, request)`: Start Temporal workflow for card initialization (returns `Mono<WorkflowExecution>`) - Triggers workflow
- `getDueCards(accountId, pageable: Pageable, cardTypeCode?)`: Get cards due for review (returns `Mono<Page<AccountCard>>`) - Simple operation
- `reviewCard(accountId, cardId, request)`: Process review and update SM-2 state (returns `Mono<AccountCard>`) - Simple operation
- `getAccountCards(accountId, pageable: Pageable, cardTypeCode?, status?)`: List account cards with filters (returns `Mono<Page<AccountCard>>`) - Simple operation

#### 6.1. **CardInitializationWorkflow** (Temporal Workflow)
Temporal workflow for initializing cards after account creation:
- `loadKnowledgeActivity()`: Loads all knowledge items (Temporal Activity)
- `loadCardTypesActivity()`: Loads all card types (Temporal Activity)
- `createCardsActivity(accountId: String, knowledgeItems: List<Knowledge>, cardTypes: List<CardType>)`: Creates cards in batches (Temporal Activity)
- Processes cards in batches to avoid timeouts
- Provides progress updates
- Handles retries and error recovery

#### 7. **StatsService**
Calculates account statistics.
- `getStats(userId)`: Get comprehensive learning statistics

---

## Part 2.8: Data Flow & Component Interactions

### Card Review Flow
1. Client requests due cards: `GET /api/v1/accounts/me/cards:due`
   - Headers: `Authorization: Bearer <token>` (with `role: client` claim)
   - Query params: `card_type_code` (optional), `page`, `size`
2. Service validates JWT token and extracts account ID from `sub` claim
3. Service queries `account_cards` where `account_id = {accountId}` and `next_review_date <= today`
4. For each card, service loads:
   - Knowledge item (via account_card.knowledge_code)
   - Related knowledge items via knowledge_rel junction table
   - Card type and its associated templates via card_type_template_rel (with roles)
   - Templates for each role (e.g., "front", "back", or custom roles)
5. Service renders content using Qute templates by role (which may include `{name}`, `{description}`, and `{#for item in relatedKnowledge}...{/for}`)
6. Service returns paginated list with rendered `front` and `back` content
7. Client displays card front to user
8. User reviews and submits quality: `POST /api/v1/accounts/me/cards/{cardId}:review`
   - Headers: `Authorization: Bearer <token>` (with `role: client` claim)
   - Body: `{ "quality": 0-5 }`
9. Service validates token and extracts account ID
10. Service verifies card belongs to account (account_card.account_id matches token `sub`)
11. Service applies SM-2 algorithm to calculate new state
12. Service saves updated `account_card` and creates `review_history` entry
13. Service returns updated card with new SM-2 state and `next_review_date`

### Card Initialization Flow (Temporal Workflow)
1. User signs up for account (account creation)
2. System automatically triggers Temporal workflow for card initialization
3. Workflow starts and executes activities:
   - `loadKnowledgeActivity()`: Loads all knowledge items from database
   - `loadCardTypesActivity()`: Loads all card types from database
4. Workflow executes `createCardsActivity()`:
   - Processes knowledge-card type combinations in batches
   - For each combination:
     - Check if account_card already exists (account_id, knowledge_code, card_type_code)
     - If not, create new account_card with default SM-2 values
   - Provides progress updates during batch processing
5. Workflow completes and notifies system
6. System completes account setup with initialized cards
7. User can immediately start learning

**Note**: Card initialization happens automatically during signup via Temporal workflow. The workflow handles large batches, retries, and error recovery. The `POST /api/v1/accounts/me/cards:initialize` endpoint exists for manual re-initialization if needed, but is not part of the normal user workflow.

### Knowledge Retrieval Flow (Client)
1. Client requests knowledge items: `GET /api/v1/knowledge`
   - Headers: `Authorization: Bearer <token>` (with `role: client` or `role: operator` claim)
   - Query params: `page`, `size`, `filter` (optional)
2. Service validates JWT token
3. Service queries `knowledge` table with pagination
4. Service applies filters if provided (metadata queries)
5. Service returns paginated list of knowledge items

### Knowledge Export Flow (Operator) - Simple Operation
1. Operator requests export: `GET /api/v1/knowledge:export`
   - Headers: `Authorization: Bearer <token>` (with `role: operator` claim)
2. Service validates JWT token and checks for `operator` role
3. Service queries all knowledge items from database
4. Service generates CSV file with columns: `code`, `name`, `description`, plus flat metadata columns (`metadata:*`)
   - Converts JSONB metadata object to flat columns with `metadata:` prefix
   - Example: `{"level": "A1", "type": "vocabulary"}` becomes columns `metadata:level`, `metadata:type`
5. Service returns CSV file: `200 OK` with `Content-Type: text/csv`
6. Operator downloads and modifies CSV file (adds new rows, updates existing rows, removes rows)

### Knowledge Import Flow (Operator) - Temporal Workflow
1. Operator uploads CSV: `POST /api/v1/knowledge:upload`
   - Headers: `Authorization: Bearer <token>` (with `role: operator` claim)
   - Content-Type: `multipart/form-data`
   - Body: CSV file
2. Service validates JWT token and checks for `operator` role
3. Service starts Temporal workflow: `KnowledgeImportWorkflow`
   - Returns workflow execution ID: `202 Accepted`
4. **Workflow: Validation Activity**
   - Workflow executes `validateActivity()`:
     - Validates data types and formats
     - Validates required fields are present (`name`, `description`)
     - Validates code format if code column is filled (must match `{PREFIX}-{NUMBER}` pattern)
     - Parses metadata columns (columns starting with `metadata:`) and converts to JSONB structure
     - Reports validation errors
5. **Workflow: Comparison Activity**
   - Workflow executes `compareActivity()`:
     - Compares CSV data with existing database:
       - **For rows with code filled**: Look up by code in database
         - If code exists: Compare data to determine if updated or unchanged
         - If code doesn't exist: Error (invalid code)
       - **For rows with empty code**: Match by content (name/description)
         - If match found: Treat as update (use existing code from database)
         - If no match: Treat as new item (code will be generated)
       - **Deleted items**: Items in database but not in CSV (if deletion is supported)
   - Workflow stores comparison results
6. **Workflow: Wait for Approval Signal**
   - Workflow waits for operator approval signal
   - Operator reviews results via: `GET /api/v1/workflows/{workflowId}/status`
   - Operator approves/rejects via: `POST /api/v1/workflows/{workflowId}/signal`
     - Body: `{ "signalName": "approval", "signalData": { "approved": true, "reason": "optional" } }`
7. **Workflow: Apply Changes Activity** (if approved)
   - Workflow executes `applyChangesActivity()`:
     - Generates codes for new items using `CodeGenerationService`
     - Applies changes in batches:
       - Inserts new items with generated codes
       - Updates existing items
       - Handles deletions (if supported)
     - Provides progress updates
     - Handles retries and error recovery
8. Workflow completes and notifies system
9. Operator can query workflow status: `GET /api/v1/workflows/{workflowId}/status`

### Knowledge Import Approval Flow (Operator) - Temporal Signal
1. Operator reviews workflow results: `GET /api/v1/workflows/{workflowId}/status`
   - Headers: `Authorization: Bearer <token>` (with `role: operator` claim)
   - Response includes validation and comparison results in `queryResults`
2. Operator approves/rejects: `POST /api/v1/workflows/{workflowId}/signal`
   - Headers: `Authorization: Bearer <token>` (with `role: operator` claim)
   - Body: `{ "signalName": "approval", "signalData": { "approved": true, "reason": "optional" } }`
3. Service validates JWT token and checks for `operator` role
4. Service sends approval signal to Temporal workflow
5. Workflow receives signal and continues execution:
   - If approved: Executes `applyChangesActivity()` (see step 7 in Knowledge Import Flow)
   - If rejected: Workflow completes without changes
6. Service returns signal acknowledgment: `200 OK`
   ```json
   {
     "workflowId": "uuid",
     "signalName": "approval",
     "signalSent": true,
     "timestamp": "2024-01-01T12:00:00Z"
   }
   ```
7. Operator can query workflow status to see final results: `GET /api/v1/workflows/{workflowId}/status`
   ```json
   {
     "sessionId": "uuid",
     "status": "approved",
     "applied": {
       "new": 20,
       "updated": 15,
       "deleted": 5
     },
     "generatedCodes": [
       { "name": "New Item 1", "code": "ST-0000001" },
       { "name": "New Item 2", "code": "ST-0000002" }
     ],
     "approvedAt": "2024-01-01T12:00:00Z",
     "approvedBy": "operator-id"
   }
   ```

**Note**: Codes (ST-0000001, ST-0000002, etc.) are automatically generated by the system only after approval, not during upload or validation.

### Knowledge Import Rejection Flow (Operator)
1. Operator rejects changes: `POST /api/v1/workflows/{workflowId}/signal`
   - Headers: `Authorization: Bearer <token>` (with `role: operator` claim)
   - Body: `{ "signalName": "approval", "signalData": { "approved": false, "reason": "..." } }`
2. Service validates JWT token and checks for `operator` role
3. Service sends rejection signal to Temporal workflow
4. Workflow receives signal and completes without applying changes
5. Service returns signal acknowledgment: `200 OK`
6. Operator can query workflow status to confirm rejection: `GET /api/v1/workflows/{workflowId}/status`

### Statistics Retrieval Flow (Client)
1. Client requests statistics: `GET /api/v1/accounts/me/stats`
   - Headers: `Authorization: Bearer <token>` (with `role: client` claim)
2. Service validates JWT token and extracts account ID from `sub` claim
3. Service queries `account_cards` for account:
   - Count total cards
   - Count new cards (repetitions = 0)
   - Count learning cards (repetitions > 0 and < 3)
   - Count due today (next_review_date <= today)
   - Group by card_type_code
4. Service returns statistics object: `200 OK`

---



---

## Step 7: Design Decisions & Constraints

### MVP Constraints
- No authentication/authorization
- No caching
- Qute reactive template engine for card content rendering (format: `qute`)

### Technical Decisions

#### Entity Relationship Pattern
- **Design Decision**: Use unidirectional foreign keys WITHOUT complex ORM relationship mapping.
- **Implementation**: Foreign keys are simple ID fields.
- **Rationale**:
  1. **Explicit Control**: Developers explicitly query for related entities, preventing hidden N+1 queries.
  2. **Simpler Entities**: Plain classes without complex proxy objects or bidirectional synchronization.
  3. **Performance**: Batch loading via IDs, manual join optimization.
  4. **Serialization**: No circular references.
  5. **Microservice-Ready**: Clear entity boundaries.
- **Example**:
  ```
  class AccountCard {
      accountId: Long        // Simple field
      knowledgeCode: String  // Simple field
      ...
  }
  ```
- **Relationship Loading Pattern**:
  ```
  // Explicit loading
  cards = repository.findByAccountId(accountId)

  // Batch loading to prevent N+1
  codes = cards.map { it.knowledgeCode }.distinct()
  knowledgeMap = knowledgeRepository.findByCodeIn(codes)
  ```
- **Database Integrity**: Foreign key constraints enforced at database level via DDL.

#### Entity Design
- **Design Decision**: Use standard classes for entities.
- **Rationale**:
  1. **Stable Identity**: Equality based on business keys (primary key or natural key).
  2. **Mutable State**: Entity fields can change, but equality should remain stable.

#### Other Technical Decisions
- All operations are asynchronous/non-blocking for I/O.
- SM-2 algorithm implemented as pure function object.
- Card templates use template syntax with `{variable}` expressions.
- Database uses snake_case, Application uses camelCase.
--- End of content ---

