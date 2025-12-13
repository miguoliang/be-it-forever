-- Performance Index for Daily Review Query
-- Accelerates: WHERE account_id = ? AND next_review_date <= NOW()
CREATE INDEX IF NOT EXISTS idx_account_cards_review_schedule 
ON public.account_cards (account_id, next_review_date);

-- Data Integrity Constraint (Prevent duplicate cards for same user/knowledge)
-- Ensures a user can't have the same card type for the same word twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_cards_unique_composite 
ON public.account_cards (account_id, knowledge_code, card_type_code);

-- Foreign Key Index for Review History
-- Accelerates joins between account_cards and review_history
CREATE INDEX IF NOT EXISTS idx_review_history_card_id 
ON public.review_history (account_card_id);
