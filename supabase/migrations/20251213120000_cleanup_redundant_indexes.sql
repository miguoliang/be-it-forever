-- Remove redundant indexes that are covered by composite indexes
-- 1. idx_account_cards_next_review is a duplicate of idx_account_cards_review_schedule
DROP INDEX IF EXISTS "public"."idx_account_cards_next_review";

-- 2. idx_account_cards_account (account_id) is covered by idx_account_cards_review_schedule (account_id, next_review_date)
--    and idx_account_cards_unique_composite (account_id, knowledge_code, card_type_code)
DROP INDEX IF EXISTS "public"."idx_account_cards_account";
