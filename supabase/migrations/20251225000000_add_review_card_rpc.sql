-- Function to review a card transactionally
CREATE OR REPLACE FUNCTION "public"."review_card"(
  p_card_id bigint,
  p_user_id uuid,
  p_quality integer,
  p_ease_factor numeric,
  p_interval_days integer,
  p_repetitions integer,
  p_next_review_date timestamp with time zone
) RETURNS void
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_rows_affected int;
begin
  -- Update account_cards
  update public.account_cards
  set
    ease_factor = p_ease_factor,
    interval_days = p_interval_days,
    repetitions = p_repetitions,
    next_review_date = p_next_review_date,
    last_reviewed_at = now(),
    updated_at = now()
  where id = p_card_id and account_id = p_user_id;

  get diagnostics v_rows_affected = row_count;

  if v_rows_affected = 0 then
    raise exception 'Card not found or access denied';
  end if;

  -- Insert review_history
  insert into public.review_history (account_card_id, quality, reviewed_at)
  values (p_card_id, p_quality, now());
end;
$$;

ALTER FUNCTION "public"."review_card"(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."review_card"(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."review_card"(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) TO "service_role";
