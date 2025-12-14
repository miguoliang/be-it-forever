-- Sync the global_code_seq with the manually inserted template codes
-- Since we manually inserted ST-0000001 and ST-0000002, we need to ensure the sequence starts after these.
-- Assuming global_code_seq is used for all ST- codes (Knowledge, Templates, Card Types, etc.)
SELECT setval('public.global_code_seq', GREATEST(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) FROM public.templates WHERE code LIKE 'ST-%'),
    (SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) FROM public.knowledge WHERE code LIKE 'ST-%'),
    (SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)), 0) FROM public.card_types WHERE code LIKE 'ST-%'),
    (SELECT last_value FROM public.global_code_seq)
));
