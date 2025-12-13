-- Fix search_path for public.give_cards_to_new_user
CREATE OR REPLACE FUNCTION "public"."give_cards_to_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public
    AS $$
begin
  -- 新增这 1 行：如果是 operator，直接啥也不干
  if (new.raw_user_meta_data->>'role') = 'operator' then
    return new;
  end if;

  -- 下面是原来的发卡逻辑（保持不变）
  insert into public.accounts (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into public.account_cards (
    account_id, knowledge_code, card_type_code,
    ease_factor, interval_days, repetitions, next_review_date
  )
  select 
    new.id,
    k.code,
    'basic-front-back',
    2.50, 0, 0,
    now()
  from public.knowledge k
  on conflict (account_id, knowledge_code, card_type_code) do nothing;

  return new;
end;
$$;
