-- Apply German phonebook collation for Wortiger and Wortgeflecht word ordering
-- on an existing local database.
-- This intentionally removes the old read views because the app now reads directly
-- from the base tables using database collation for ordering.

CREATE COLLATION IF NOT EXISTS public.de_phonebook (
    provider = icu,
    locale = 'de-u-co-phonebk'
);

DROP VIEW IF EXISTS wortiger.wortliste_read_4;
DROP VIEW IF EXISTS wortiger.wortliste_read_5;
DROP VIEW IF EXISTS wortiger.wortliste_read_6;
DROP VIEW IF EXISTS wortiger.wortliste_read_7;
DROP VIEW IF EXISTS wortgeflecht.dictionary_read;

ALTER TABLE wortiger.wortliste_4
    ALTER COLUMN word TYPE character(4) COLLATE "public"."de_phonebook" USING word;
ALTER TABLE wortiger.wortliste_5
    ALTER COLUMN word TYPE character(5) COLLATE "public"."de_phonebook" USING word;
ALTER TABLE wortiger.wortliste_6
    ALTER COLUMN word TYPE character(6) COLLATE "public"."de_phonebook" USING word;
ALTER TABLE wortiger.wortliste_7
    ALTER COLUMN word TYPE character(7) COLLATE "public"."de_phonebook" USING word;

ALTER TABLE wortgeflecht.dictionary
    ALTER COLUMN word TYPE varchar(255) COLLATE "public"."de_phonebook" USING word;
