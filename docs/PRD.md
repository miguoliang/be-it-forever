# Product Design

## 1\. Introduction

### Vision

An intelligent knowledge learning platform that helps users master any subject matter through scientifically-optimized spaced repetition. The system adapts to each learner's performance, presenting content at optimal intervals to maximize retention and minimize study time.

### Core Goals

* **Effective Learning**: Utilize SM-2 algorithm for optimal memory retention.
* **Personalized Experience**: Adapt review schedules to individual performance.
* **Efficient Management**: Enable batch import/export and quality control for content managers.
* **Scalability**: Handle large volumes of knowledge items and users.

---

## 2\. Core Concepts

### 2.1 Learning Model (Spaced Repetition)

The system is built on the **SM-2 algorithm**, which determines the optimal time to review a card based on:

* **Quality Rating**: User's self-assessed performance (0-5).
* **Repetitions**: Number of successful consecutive reviews.
* **Ease Factor**: A multiplier indicating how easy the item is for the user.

**Learning States**:

* **New**: Never reviewed.
* **Learning**: In progress (reviewed 1-2 times successfully).
* **Review**: Established (reviewed 3+ times successfully).

### 2.2 Content Structure

* **Knowledge Items**: The fundamental units of learning (vocabulary, facts, concepts).
  * Unique immutable code (`ST-XXXXXXX` or `CS-XXXXXXX`).
  * Name, Description, and Metadata (JSONB).
  * Relationships to other items.
* **Card Types**: Different ways to present knowledge (e.g., Term → Definition, Fill-in-the-blank).
* **Templates**: Visual layout definitions for card types (Front/Back content).
* **Account Cards**: A user-specific instance of a (Knowledge Item + Card Type) pair, tracking their personal progress.

---

## 3\. User Roles & Workflows

### 3.0 Authentication (Common)

All users must authenticate to access the system.

**Key Workflows**:

1. **Sign Up**:
   * User provides username and password.
   * System creates a new account.
   * **Learner Initialization**: For new learner accounts, the system automatically triggers an asynchronous background job to create `Account Cards` for all existing `Knowledge Items`. This ensures the user has content to review immediately.
2. **Sign In**:
   * User enters credentials.
   * System validates credentials and issues a secure session token (JWT).
   * **Role Detection**:
     * **Operator Managers** are redirected to the Manager Dashboard (`/manager`).
     * **Operators** are redirected to the Operator Dashboard (`/operator`).
     * **Learners** are redirected to the Learning Dashboard (`/learn`).
3. **Sign Out**:
   * User clicks "Sign Out".
   * System invalidates the session locally (clears token).
   * User is redirected to the Landing Page (`/`).

### 3.1 Learners (Clients)

End-users focused on mastering content.

**Key Workflows**:

1. **Onboarding**:
   * (Covered in Sign Up) - Immediate access to learning content upon first login.
2. **Daily Review**:
   * View cards due for review (`next_review_date <= today`).
   * Reveal answer and rate quality (0-5).
   * System reschedules the card.
3. **Progress Tracking**:
   * View dashboard with statistics (Total, New, Learning, Due Today).

### 3.2 Content Managers (Operators)

Internal users who manage the learning content. They cannot directly modify the live knowledge base.

**Key Workflows**:

1. **Request Submission**:
   * Create/Edit/Delete knowledge items via the Operator Dashboard.
   * These actions create a **Change Request** instead of modifying data directly.
2. **Request Tracking**:
   * View status of submitted requests (Pending, Approved, Rejected).

### 3.3 Operator Managers

Senior internal users with authority to approve changes.

**Key Workflows**:

1. **Review Workflow**:
   * View list of pending Change Requests.
   * Review diffs (Old vs New).
   * Approve -> Changes applied to live DB.
   * Reject -> Request closed with reason.

---

## 4\. Business Rules

### 4.1 SM-2 Algorithm Rules

* **Passed (Quality ≥ 3)**: Interval increases based on Ease Factor.
* **Failed (Quality < 3)**: Interval resets to 1 day; Ease Factor decreases.
* **First Review**: Interval = 1 day.
* **Second Review**: Interval = 6 days.

### 4.2 Content Management Rules

* **Immutable Codes**: Once generated, a knowledge code (`ST-0000001`) never changes.
* **Code Generation**:
  * `ST-`: Standard items (default).
  * `CS-`: Case Study/Custom items.
* **Validation**: Imports must pass schema validation before approval.

### 4.3 User Account Rules

* **Initialization**: Users get access to ALL current knowledge items upon signup.
* **Isolation**: One user's progress does not affect another's.

---

## 5\. Non-Functional Requirements

* **Performance**: Review sessions must load quickly (<200ms).
* **Reliability**: Import workflows must be atomic and robust (using temporal patterns).
* **Security**: Role-based access control (Learner vs. Operator).