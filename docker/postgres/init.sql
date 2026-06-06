-- CareSync PostgreSQL initialization.
-- Extension setup and seed bootstrap are populated in Prompt 2.
-- This file runs automatically on first container start via
-- docker-entrypoint-initdb.d.

-- Placeholder: extensions (uuid-ossp, citext, pgcrypto) added in Prompt 2.
SELECT 'CareSync database initialized' AS status;
