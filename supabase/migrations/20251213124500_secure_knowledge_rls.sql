-- Function to sync role from user_metadata to app_metadata
-- This ensures that even if we use user_metadata for frontend convenience,
-- the authoritative source for RLS is app_metadata (which users can't edit via API directly if we lock it down, 
-- though essentially if they can edit user_metadata and we copy it, they can still escalate privileges 
-- UNLESS we restrict user_metadata updates too. 
-- BUT standard Supabase behavior allows users to update their own user_metadata.
-- SO, copying it blindly is STILL insecure if the source is insecure.

-- REAL SECURITY FIX:
-- We should NOT allow users to set their own 'role' in user_metadata.
-- We should use a Database Trigger that sets app_metadata role based on some other criteria, 
-- OR strictly manage role assignment via Admin API (Service Role) only.

-- HOWEVER, given the current app architecture relies on `user_metadata` for "Operator" status,
-- effectively "anyone who claims to be an operator is an operator" IF the signup flow allows setting metadata.
-- If the signup flow (backend) controls the metadata, then we are safe-ish.
-- The API route `src/app/api/auth/send-otp/route.ts` usually handles this.
-- If the frontend calls `supabase.auth.signUp({ options: { data: { role: 'operator' } } })`, then it's insecure.

-- ASSUMPTION:
-- We want to secure RLS. 
-- We will switch RLS to use `app_metadata`.
-- We will ONLY allow `app_metadata` to be set by Triggers or Admin/Service Role.
-- We will NOT automatically copy user_metadata to app_metadata blindly, because that defeats the purpose.

-- BUT, to keep the current "Operator" functionality working (where I assume developers/admins set this up),
-- I will Create a migration that:
-- 1. Updates existing operators to have role in app_metadata.
-- 2. Updates RLS to use app_metadata.
-- 3. DOES NOT automatically sync future user_metadata changes to app_metadata (preventing privilege escalation).
--    This means to make someone an operator in the future, you MUST set app_metadata (via dashboard or admin script).

-- 1. Backfill existing operators
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, raw_user_meta_data FROM auth.users WHERE raw_user_meta_data->>'role' = 'operator' LOOP
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"operator"')
    WHERE id = r.id;
  END LOOP;
END $$;

-- 2. Drop insecure policies
DROP POLICY IF EXISTS "Enable insert for operators" ON public.knowledge;
DROP POLICY IF EXISTS "Enable update for operators" ON public.knowledge;
DROP POLICY IF EXISTS "Enable delete for operators" ON public.knowledge;

-- 3. Re-create policies using app_metadata (secure)
CREATE POLICY "Enable insert for operators" ON public.knowledge
FOR INSERT WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'operator'
);

CREATE POLICY "Enable update for operators" ON public.knowledge
FOR UPDATE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'operator'
) WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'operator'
);

CREATE POLICY "Enable delete for operators" ON public.knowledge
FOR DELETE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'operator'
);
