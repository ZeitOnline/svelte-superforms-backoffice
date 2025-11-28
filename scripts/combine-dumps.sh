#!/bin/bash
# Simple and clean script to combine dump files

OUTPUT_FILE="./docker/init-db.sql"

echo "Creating init-db.sql with clean schema transformations..."

# Create the header
cat > $OUTPUT_FILE << 'EOF'
-- Initialize PostgreSQL with eckchen and wortiger schemas from staging databases
-- Generated from existing dump files
-- This file contains both schema definitions and data

-- Create schemas
CREATE SCHEMA IF NOT EXISTS eckchen;
CREATE SCHEMA IF NOT EXISTS wortiger;

-- Create PostgREST role
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA eckchen TO web_anon;
GRANT USAGE ON SCHEMA wortiger TO web_anon;

-- ================================
-- ECKCHEN SCHEMA DEFINITIONS
-- ================================
EOF

echo "1/4 Processing eckchen schema..."
# Simple replacement: public. -> eckchen.
sed 's/public\./eckchen\./g' eckchen_schema.sql | \
  grep -v "^SET " | \
  grep -v "^--" | \
  grep -v "^$" >> $OUTPUT_FILE

cat >> $OUTPUT_FILE << 'EOF'

-- ================================
-- ECKCHEN DATA
-- ================================
EOF

echo "2/4 Processing eckchen data..."
# Simple replacement: public. -> eckchen.
sed 's/public\./eckchen\./g' eckchen_data.sql | \
  grep -v "^SET " | \
  grep -v "^--" | \
  grep -v "^$" >> $OUTPUT_FILE

cat >> $OUTPUT_FILE << 'EOF'

-- ================================
-- WORTIGER SCHEMA DEFINITIONS
-- ================================
EOF

echo "3/4 Processing wortiger schema..."
# Simple replacement: public. -> wortiger.
sed 's/public\./wortiger\./g' wortiger_schema.sql | \
  grep -v "^SET " | \
  grep -v "^--" | \
  grep -v "^$" >> $OUTPUT_FILE

cat >> $OUTPUT_FILE << 'EOF'

-- ================================
-- WORTIGER DATA
-- ================================
EOF

echo "4/4 Processing wortiger data..."
# Simple replacement: public. -> wortiger.
sed 's/public\./wortiger\./g' wortiger_data.sql | \
  grep -v "^SET " | \
  grep -v "^--" | \
  grep -v "^$" >> $OUTPUT_FILE

# Add PostgREST permissions
cat >> $OUTPUT_FILE << 'EOF'

-- ================================
-- POSTGREST PERMISSIONS
-- ================================

-- Grant permissions for PostgREST on eckchen schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA eckchen TO web_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA eckchen TO web_anon;

-- Grant permissions for PostgREST on wortiger schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA wortiger TO web_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA wortiger TO web_anon;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA eckchen GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA eckchen GRANT USAGE, SELECT ON SEQUENCES TO web_anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA wortiger GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA wortiger GRANT USAGE, SELECT ON SEQUENCES TO web_anon;
EOF

echo "✅ init-db.sql created successfully with clean transformations!"
echo "🚀 Now run: docker-compose down -v && docker-compose up"
