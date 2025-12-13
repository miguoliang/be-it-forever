


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_global_st_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  new.code := 'ST-' || lpad(nextval('global_code_seq')::text, 7, '0');
  return new;
end;
$$;


ALTER FUNCTION "public"."generate_global_st_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."give_cards_to_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."give_cards_to_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account_cards" (
    "id" bigint NOT NULL,
    "account_id" "uuid" NOT NULL,
    "knowledge_code" character varying(20) NOT NULL,
    "card_type_code" character varying(20) NOT NULL,
    "ease_factor" numeric(5,2) DEFAULT 2.50 NOT NULL,
    "interval_days" integer DEFAULT 0 NOT NULL,
    "repetitions" integer DEFAULT 0 NOT NULL,
    "next_review_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."account_cards" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."account_cards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."account_cards_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."account_cards_id_seq" OWNED BY "public"."account_cards"."id";



CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_types" (
    "code" character varying(20) NOT NULL,
    "name" character varying NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."card_types" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."global_code_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."global_code_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge" (
    "code" character varying(20) NOT NULL,
    "name" character varying NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."knowledge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_history" (
    "id" bigint NOT NULL,
    "account_card_id" bigint NOT NULL,
    "quality" integer NOT NULL,
    "reviewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "review_history_quality_check" CHECK ((("quality" >= 0) AND ("quality" <= 5)))
);


ALTER TABLE "public"."review_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."review_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."review_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."review_history_id_seq" OWNED BY "public"."review_history"."id";



ALTER TABLE ONLY "public"."account_cards" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."account_cards_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."review_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."review_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."account_cards"
    ADD CONSTRAINT "account_cards_account_id_knowledge_code_card_type_code_key" UNIQUE ("account_id", "knowledge_code", "card_type_code");



ALTER TABLE ONLY "public"."account_cards"
    ADD CONSTRAINT "account_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."card_types"
    ADD CONSTRAINT "card_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."card_types"
    ADD CONSTRAINT "card_types_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."knowledge"
    ADD CONSTRAINT "knowledge_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."knowledge"
    ADD CONSTRAINT "knowledge_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."review_history"
    ADD CONSTRAINT "review_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_account_cards_account" ON "public"."account_cards" USING "btree" ("account_id");



CREATE INDEX "idx_account_cards_next_review" ON "public"."account_cards" USING "btree" ("account_id", "next_review_date");



CREATE INDEX "idx_account_cards_review_schedule" ON "public"."account_cards" USING "btree" ("account_id", "next_review_date");



CREATE UNIQUE INDEX "idx_account_cards_unique_composite" ON "public"."account_cards" USING "btree" ("account_id", "knowledge_code", "card_type_code");



CREATE INDEX "idx_review_history_card_id" ON "public"."review_history" USING "btree" ("account_card_id");



CREATE OR REPLACE TRIGGER "trigger_global_st_code" BEFORE INSERT ON "public"."knowledge" FOR EACH ROW EXECUTE FUNCTION "public"."generate_global_st_code"();



ALTER TABLE ONLY "public"."account_cards"
    ADD CONSTRAINT "account_cards_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_cards"
    ADD CONSTRAINT "account_cards_card_type_code_fkey" FOREIGN KEY ("card_type_code") REFERENCES "public"."card_types"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_cards"
    ADD CONSTRAINT "account_cards_knowledge_code_fkey" FOREIGN KEY ("knowledge_code") REFERENCES "public"."knowledge"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_history"
    ADD CONSTRAINT "review_history_account_card_id_fkey" FOREIGN KEY ("account_card_id") REFERENCES "public"."account_cards"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."generate_global_st_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_global_st_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_global_st_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."give_cards_to_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."give_cards_to_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."give_cards_to_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."account_cards" TO "anon";
GRANT ALL ON TABLE "public"."account_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."account_cards" TO "service_role";



GRANT ALL ON SEQUENCE "public"."account_cards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."account_cards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."account_cards_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."card_types" TO "anon";
GRANT ALL ON TABLE "public"."card_types" TO "authenticated";
GRANT ALL ON TABLE "public"."card_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."global_code_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."global_code_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."global_code_seq" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge" TO "anon";
GRANT ALL ON TABLE "public"."knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge" TO "service_role";



GRANT ALL ON TABLE "public"."review_history" TO "anon";
GRANT ALL ON TABLE "public"."review_history" TO "authenticated";
GRANT ALL ON TABLE "public"."review_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."review_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."review_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."review_history_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop trigger if exists "trigger_global_st_code" on "public"."knowledge";

alter table "public"."account_cards" drop constraint "account_cards_account_id_fkey";

alter table "public"."account_cards" drop constraint "account_cards_card_type_code_fkey";

alter table "public"."account_cards" drop constraint "account_cards_knowledge_code_fkey";

alter table "public"."review_history" drop constraint "review_history_account_card_id_fkey";

alter table "public"."account_cards" alter column "id" set default nextval('public.account_cards_id_seq'::regclass);

alter table "public"."review_history" alter column "id" set default nextval('public.review_history_id_seq'::regclass);

alter table "public"."account_cards" add constraint "account_cards_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."account_cards" validate constraint "account_cards_account_id_fkey";

alter table "public"."account_cards" add constraint "account_cards_card_type_code_fkey" FOREIGN KEY (card_type_code) REFERENCES public.card_types(code) ON DELETE CASCADE not valid;

alter table "public"."account_cards" validate constraint "account_cards_card_type_code_fkey";

alter table "public"."account_cards" add constraint "account_cards_knowledge_code_fkey" FOREIGN KEY (knowledge_code) REFERENCES public.knowledge(code) ON DELETE CASCADE not valid;

alter table "public"."account_cards" validate constraint "account_cards_knowledge_code_fkey";

alter table "public"."review_history" add constraint "review_history_account_card_id_fkey" FOREIGN KEY (account_card_id) REFERENCES public.account_cards(id) ON DELETE CASCADE not valid;

alter table "public"."review_history" validate constraint "review_history_account_card_id_fkey";

CREATE TRIGGER trigger_global_st_code BEFORE INSERT ON public.knowledge FOR EACH ROW EXECUTE FUNCTION public.generate_global_st_code();

CREATE TRIGGER give_cards_after_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.give_cards_to_new_user();


