#!/usr/bin/env bash
# Concurrency tests: parallel writers on one account, parallel retries with one idempotency key.
# Usage: PGHOST=/tmp/pg PGPORT=5433 PGUSER=postgres database/tests/03_concurrency.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=ffs_conc_$$
psql -q -c "CREATE DATABASE $DB" >/dev/null
trap 'psql -q -c "DROP DATABASE IF EXISTS $DB" >/dev/null' EXIT
for f in database/tests/00_supabase_shim.sql database/migrations/000_production_schema.sql database/migrations/003_authorization_privacy_ledger.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null 2>&1
done
HEAD=b0000000-0000-0000-0000-000000000001
psql -q -d "$DB" -c "INSERT INTO auth.users(id,email) VALUES ('$HEAD','h@x')"
AS="SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','$HEAD',false);"
FAM=$(psql -qtA -d "$DB" -c "$AS SELECT public.bootstrap_family('F')" | tail -1)
ACC=$(psql -qtA -d "$DB" -c "SELECT id FROM accounts WHERE family_id='$FAM'")
CAT=$(psql -qtA -d "$DB" -c "SELECT id FROM categories WHERE family_id='$FAM' AND name='Food' AND type='expense'")

# 20 sessions x 10 expenses of ₹1 (100 paise) against the same account, concurrently
for i in $(seq 1 20); do
  psql -q -d "$DB" -c "$AS SELECT public.create_transaction('$FAM','expense',100,'$CAT','c$i-'||g,NOW(),'cash',NULL,NULL,'family','$ACC') FROM generate_series(1,10) g" >/dev/null &
done
# 15 sessions retrying the SAME logical transaction concurrently
for i in $(seq 1 15); do
  psql -q -d "$DB" -c "$AS SELECT public.create_transaction('$FAM','expense',5000,'$CAT','retry',NOW(),'cash',NULL,NULL,'family','$ACC','same-key')" >/dev/null &
done
wait
BAL=$(psql -qtA -d "$DB" -c "SELECT balance FROM accounts WHERE id='$ACC'")
N=$(psql -qtA -d "$DB" -c "SELECT count(*) FROM transactions WHERE idempotency_key='same-key'")
REC=$(psql -qtA -d "$DB" -c "$AS SELECT public.reconcile_account_balance('$ACC')" | tail -1)
echo "balance=$BAL (expected -25000)  reconciled=$REC  rows_for_same_key=$N (expected 1)"
[ "$BAL" = "-25000" ] && [ "$REC" = "-25000" ] && [ "$N" = "1" ] && echo "CONCURRENCY TESTS PASSED" || { echo "CONCURRENCY TESTS FAILED"; exit 1; }
