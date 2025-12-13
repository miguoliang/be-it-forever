-- Optimize RLS policies for account_cards to avoid re-evaluating auth.uid() for each row

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own cards" ON public.account_cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON public.account_cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.account_cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.account_cards;

-- Re-create policies using (select auth.uid())
-- This forces Postgres to treat the function call as a scalar subquery, 
-- evaluating it once per query plan instead of once per row.

CREATE POLICY "Users can view their own cards" ON public.account_cards
FOR SELECT USING (
  account_id = (select auth.uid())
);

CREATE POLICY "Users can insert their own cards" ON public.account_cards
FOR INSERT WITH CHECK (
  account_id = (select auth.uid())
);

CREATE POLICY "Users can update their own cards" ON public.account_cards
FOR UPDATE USING (
  account_id = (select auth.uid())
) WITH CHECK (
  account_id = (select auth.uid())
);

CREATE POLICY "Users can delete their own cards" ON public.account_cards
FOR DELETE USING (
  account_id = (select auth.uid())
);
