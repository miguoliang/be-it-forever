-- Create templates table
CREATE TABLE IF NOT EXISTS "public"."templates" (
    "code" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "format" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "templates_pkey" PRIMARY KEY ("code"),
    CONSTRAINT "templates_name_key" UNIQUE ("name")
);

-- Owner
ALTER TABLE "public"."templates" OWNER TO "postgres";

-- Create sequence for card_type_templates id
CREATE SEQUENCE IF NOT EXISTS "public"."card_type_templates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."card_type_templates_id_seq" OWNER TO "postgres";

-- Create card_type_templates table
CREATE TABLE IF NOT EXISTS "public"."card_type_templates" (
    "id" bigint DEFAULT nextval('public.card_type_templates_id_seq') NOT NULL,
    "card_type_code" character varying(20) NOT NULL,
    "template_code" character varying(20) NOT NULL,
    "role" character varying(255) NOT NULL,
    CONSTRAINT "card_type_templates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."card_type_templates" OWNER TO "postgres";

ALTER SEQUENCE "public"."card_type_templates_id_seq" OWNED BY "public"."card_type_templates"."id";

-- Foreign Keys
ALTER TABLE ONLY "public"."card_type_templates"
    ADD CONSTRAINT "card_type_templates_card_type_code_fkey" FOREIGN KEY ("card_type_code") REFERENCES "public"."card_types"("code") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."card_type_templates"
    ADD CONSTRAINT "card_type_templates_template_code_fkey" FOREIGN KEY ("template_code") REFERENCES "public"."templates"("code") ON DELETE CASCADE;

-- Indexes
CREATE INDEX "idx_card_type_templates_card_type" ON "public"."card_type_templates" USING "btree" ("card_type_code");
CREATE INDEX "idx_card_type_templates_template" ON "public"."card_type_templates" USING "btree" ("template_code");

-- Enable RLS
ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."card_type_templates" ENABLE ROW LEVEL SECURITY;

-- Grants (Matching existing pattern for public tables)
GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";

GRANT ALL ON TABLE "public"."card_type_templates" TO "anon";
GRANT ALL ON TABLE "public"."card_type_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."card_type_templates" TO "service_role";

GRANT ALL ON SEQUENCE "public"."card_type_templates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."card_type_templates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."card_type_templates_id_seq" TO "service_role";
