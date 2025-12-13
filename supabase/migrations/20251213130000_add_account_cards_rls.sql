-- Enable RLS on account_cards
ALTER TABLE public.account_cards ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only see their own cards
CREATE POLICY "Users can view their own cards" ON public.account_cards
FOR SELECT USING (
  auth.uid() = account_id
);

-- Policy 2: Users can insert their own cards
-- Ensure the account_id matches the authenticated user
CREATE POLICY "Users can insert their own cards" ON public.account_cards
FOR INSERT WITH CHECK (
  auth.uid() = account_id
);

-- Policy 3: Users can update their own cards
CREATE POLICY "Users can update their own cards" ON public.account_cards
FOR UPDATE USING (
  auth.uid() = account_id
) WITH CHECK (
  auth.uid() = account_id
);

-- Policy 4: Users can delete their own cards
CREATE POLICY "Users can delete their own cards" ON public.account_cards
FOR DELETE USING (
  auth.uid() = account_id
);
