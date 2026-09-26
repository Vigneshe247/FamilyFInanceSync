#!/usr/bin/env bash
# Usage: PGHOST=/tmp/pg PGPORT=5433 PGUSER=postgres database/tests/run.sh
# Creates a scratch database, applies the Supabase shim + migrations, runs tests.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=ffs_test_$$
psql -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DB" >/dev/null
trap 'psql -q -c "DROP DATABASE IF EXISTS $DB" >/dev/null' EXIT
for f in database/tests/00_supabase_shim.sql database/migrations/000_production_schema.sql \
         database/migrations/003_authorization_privacy_ledger.sql database/migrations/003_authorization_privacy_ledger.sql \
         database/tests/02_authorization_tests.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" 2>&1 | grep -E "NOTICE:  ok|FAIL|ERROR|PASSED" | sed "s/^.*NOTICE:  //" || true
  test "${PIPESTATUS[0]}" -eq 0 || { echo "FAILED in $f"; exit 1; }
done
