-- Add audit fields to knowledge table
ALTER TABLE "public"."knowledge"
    ADD COLUMN "created_by" character varying(255),
    ADD COLUMN "updated_by" character varying(255);

-- Add updated_at to card_types table
ALTER TABLE "public"."card_types"
    ADD COLUMN "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL;
