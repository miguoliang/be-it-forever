-- Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own account, Operators can read all
CREATE POLICY "Users can read own account" ON public.accounts
FOR SELECT USING (
  id = (select auth.uid()) 
  OR 
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Policy 2: Users can update their own account
CREATE POLICY "Users can update own account" ON public.accounts
FOR UPDATE USING (
  id = (select auth.uid())
) WITH CHECK (
  id = (select auth.uid())
);

-- Note: INSERT is handled by database triggers (give_cards_to_new_user -> inserts account),
-- which run with SECURITY DEFINER privileges, bypassing RLS.
-- So we don't necessarily need an INSERT policy for users unless we allow them to create profiles manually.
-- However, for completeness and to prevent errors if the trigger logic changes:
CREATE POLICY "Users can insert own account" ON public.accounts
FOR INSERT WITH CHECK (
  id = (select auth.uid())
);
