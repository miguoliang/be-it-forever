-- Enable RLS on review_history table
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own review history
-- Requires joining with account_cards to verify ownership via account_id
CREATE POLICY "Users can view own review history" ON public.review_history
FOR SELECT USING (
  account_card_id IN (
    SELECT id FROM public.account_cards 
    WHERE account_id = (select auth.uid())
  )
);

-- Policy 2: Users can insert their own review history
CREATE POLICY "Users can insert own review history" ON public.review_history
FOR INSERT WITH CHECK (
  account_card_id IN (
    SELECT id FROM public.account_cards 
    WHERE account_id = (select auth.uid())
  )
);

-- Policy 3: Users can update their own review history (if needed)
CREATE POLICY "Users can update own review history" ON public.review_history
FOR UPDATE USING (
  account_card_id IN (
    SELECT id FROM public.account_cards 
    WHERE account_id = (select auth.uid())
  )
) WITH CHECK (
  account_card_id IN (
    SELECT id FROM public.account_cards 
    WHERE account_id = (select auth.uid())
  )
);

-- Policy 4: Users can delete their own review history
CREATE POLICY "Users can delete own review history" ON public.review_history
FOR DELETE USING (
  account_card_id IN (
    SELECT id FROM public.account_cards 
    WHERE account_id = (select auth.uid())
  )
);
