-- Try to create extension, but don't fail if not available (PGlite doesn't support pg_trgm)
DO $$
BEGIN
  EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_trgm';
  EXECUTE 'CREATE INDEX IF NOT EXISTS boards_name_trgm_idx ON board USING gin (name gin_trgm_ops)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS cards_title_trgm_idx ON card USING gin (title gin_trgm_ops)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm extension not available, skipping trigram indexes';
END $$;
