-- Code generation sequences
CREATE SEQUENCE code_seq_st START WITH 1;
CREATE SEQUENCE code_seq_cs START WITH 1;

-- Knowledge table
CREATE TABLE knowledge (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_knowledge_metadata_gin ON knowledge USING GIN (metadata);

-- Knowledge relationships (self-referential many-to-many)
CREATE TABLE knowledge_rel (
    id BIGSERIAL PRIMARY KEY,
    source_knowledge_code VARCHAR(20) NOT NULL REFERENCES knowledge(code),
    target_knowledge_code VARCHAR(20) NOT NULL REFERENCES knowledge(code),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT no_self_ref CHECK (source_knowledge_code != target_knowledge_code)
);

CREATE INDEX idx_knowledge_rel_source ON knowledge_rel(source_knowledge_code);
CREATE INDEX idx_knowledge_rel_target ON knowledge_rel(target_knowledge_code);

-- Templates table
CREATE TABLE templates (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    format VARCHAR(255) NOT NULL,
    content BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Card types table
CREATE TABLE card_types (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Card type to template relationship
CREATE TABLE card_type_template_rel (
    id BIGSERIAL PRIMARY KEY,
    card_type_code VARCHAR(20) NOT NULL REFERENCES card_types(code),
    template_code VARCHAR(20) NOT NULL REFERENCES templates(code),
    role VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_card_type_template_rel_card_type ON card_type_template_rel(card_type_code);
CREATE INDEX idx_card_type_template_rel_template ON card_type_template_rel(template_code);

-- Translation keys table
CREATE TABLE translation_keys (
    code VARCHAR(20) PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Translation messages table
CREATE TABLE translation_messages (
    code VARCHAR(20) PRIMARY KEY,
    translation_key_code VARCHAR(20) NOT NULL REFERENCES translation_keys(code),
    locale_code VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT unique_key_locale UNIQUE (translation_key_code, locale_code)
);

CREATE INDEX idx_translation_messages_key ON translation_messages(translation_key_code);
CREATE INDEX idx_translation_messages_locale ON translation_messages(locale_code);

-- Accounts table
CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Account cards table (user's learning progress)
CREATE TABLE account_cards (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    knowledge_code VARCHAR(20) NOT NULL REFERENCES knowledge(code),
    card_type_code VARCHAR(20) NOT NULL REFERENCES card_types(code),
    ease_factor DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 1,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMPTZ NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT unique_account_knowledge_card_type UNIQUE (account_id, knowledge_code, card_type_code)
);

CREATE INDEX idx_account_cards_account ON account_cards(account_id);
CREATE INDEX idx_account_cards_next_review ON account_cards(next_review_date);
CREATE INDEX idx_account_cards_knowledge ON account_cards(knowledge_code);
CREATE INDEX idx_account_cards_card_type ON account_cards(card_type_code);

-- Review history table
CREATE TABLE review_history (
    id BIGSERIAL PRIMARY KEY,
    account_card_id BIGINT NOT NULL REFERENCES account_cards(id),
    quality INTEGER NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    CONSTRAINT valid_quality CHECK (quality >= 0 AND quality <= 5)
);

CREATE INDEX idx_review_history_account_card ON review_history(account_card_id);
CREATE INDEX idx_review_history_reviewed_at ON review_history(reviewed_at);