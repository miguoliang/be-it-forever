-- Enable RLS on card_types table
ALTER TABLE public.card_types ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow everyone to read card types
CREATE POLICY "Enable read access for all users" ON public.card_types
FOR SELECT USING (true);

-- Policy 2: Allow operators to Insert
CREATE POLICY "Enable insert for operators" ON public.card_types
FOR INSERT WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Policy 3: Allow operators to Update
CREATE POLICY "Enable update for operators" ON public.card_types
FOR UPDATE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
) WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Policy 4: Allow operators to Delete
CREATE POLICY "Enable delete for operators" ON public.card_types
FOR DELETE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);
