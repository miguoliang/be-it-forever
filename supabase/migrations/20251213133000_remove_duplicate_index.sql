-- Drop redundant index that duplicates the unique constraint
-- The constraint "account_cards_account_id_knowledge_code_card_type_code_key" already provides 
-- a unique index on (account_id, knowledge_code, card_type_code).

DROP INDEX IF EXISTS "public"."idx_account_cards_unique_composite";
