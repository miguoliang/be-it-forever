-- Enable RLS on knowledge table
ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow everyone (including anonymous if needed, but let's stick to authenticated for now) to read knowledge
-- Using (true) implies public access if we grant SELECT to anon, or just authenticated if we don't.
-- Given previous context, learners need to see cards/knowledge.
CREATE POLICY "Enable read access for all users" ON public.knowledge
FOR SELECT USING (true);

-- Policy 2: Allow operators to Insert
CREATE POLICY "Enable insert for operators" ON public.knowledge
FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'operator'
);

-- Policy 3: Allow operators to Update
CREATE POLICY "Enable update for operators" ON public.knowledge
FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'operator'
) WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'operator'
);

-- Policy 4: Allow operators to Delete
CREATE POLICY "Enable delete for operators" ON public.knowledge
FOR DELETE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'operator'
);
