-- Fix search_path for public.generate_global_st_code
CREATE OR REPLACE FUNCTION "public"."generate_global_st_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public
    AS $$
begin
  new.code := 'ST-' || lpad(nextval('global_code_seq')::text, 7, '0');
  return new;
end;
$$;
