-- Table: accounts
CREATE TABLE public.accounts (
  id uuid NOT NULL,
  username text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Table: knowledge
CREATE TABLE public.knowledge (
  code character varying NOT NULL,
  name character varying NOT NULL UNIQUE,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_pkey PRIMARY KEY (code)
);

-- Table: card_types
CREATE TABLE public.card_types (
  code character varying NOT NULL,
  name character varying NOT NULL UNIQUE,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT card_types_pkey PRIMARY KEY (code)
);

-- Table: account_cards
CREATE TABLE public.account_cards (
  id bigint NOT NULL DEFAULT nextval('account_cards_id_seq'::regclass),
  account_id uuid NOT NULL,
  knowledge_code character varying NOT NULL,
  card_type_code character varying NOT NULL,
  ease_factor numeric NOT NULL DEFAULT 2.50,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  next_review_date timestamp with time zone NOT NULL DEFAULT now(),
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT account_cards_pkey PRIMARY KEY (id),
  CONSTRAINT account_cards_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT account_cards_knowledge_code_fkey FOREIGN KEY (knowledge_code) REFERENCES public.knowledge(code),
  CONSTRAINT account_cards_card_type_code_fkey FOREIGN KEY (card_type_code) REFERENCES public.card_types(code)
);

-- Table: review_history
CREATE TABLE public.review_history (
  id bigint NOT NULL DEFAULT nextval('review_history_id_seq'::regclass),
  account_card_id bigint NOT NULL,
  quality integer NOT NULL CHECK (quality >= 0 AND quality <= 5),
  reviewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_history_pkey PRIMARY KEY (id),
  CONSTRAINT review_history_account_card_id_fkey FOREIGN KEY (account_card_id) REFERENCES public.account_cards(id)
);
