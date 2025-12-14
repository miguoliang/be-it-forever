-- Policies for templates table

-- Policy 1: Allow everyone to read templates
CREATE POLICY "Enable read access for all users" ON public.templates
FOR SELECT USING (true);

-- Policy 2: Allow operators to Insert
CREATE POLICY "Enable insert for operators" ON public.templates
FOR INSERT WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Policy 3: Allow operators to Update
CREATE POLICY "Enable update for operators" ON public.templates
FOR UPDATE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
) WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Policy 4: Allow operators to Delete
CREATE POLICY "Enable delete for operators" ON public.templates
FOR DELETE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);


-- Policies for card_type_templates table

-- Policy 1: Allow everyone to read card_type_templates
CREATE POLICY "Enable read access for all users" ON public.card_type_templates
FOR SELECT USING (true);

-- Policy 2: Allow operators to Insert
CREATE POLICY "Enable insert for operators" ON public.card_type_templates
FOR INSERT WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Policy 3: Allow operators to Update
CREATE POLICY "Enable update for operators" ON public.card_type_templates
FOR UPDATE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
) WITH CHECK (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Policy 4: Allow operators to Delete
CREATE POLICY "Enable delete for operators" ON public.card_type_templates
FOR DELETE USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);
