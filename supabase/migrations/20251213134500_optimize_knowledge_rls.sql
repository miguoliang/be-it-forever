-- Optimize RLS policies for knowledge table to avoid re-evaluating auth.jwt() for each row

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for operators" ON public.knowledge;
DROP POLICY IF EXISTS "Enable update for operators" ON public.knowledge;
DROP POLICY IF EXISTS "Enable delete for operators" ON public.knowledge;

-- Re-create policies using (select auth.jwt()) for scalar evaluation optimization

CREATE POLICY "Enable insert for operators" ON public.knowledge
FOR INSERT WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

CREATE POLICY "Enable update for operators" ON public.knowledge
FOR UPDATE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
) WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

CREATE POLICY "Enable delete for operators" ON public.knowledge
FOR DELETE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);
