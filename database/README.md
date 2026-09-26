# Database

## Which migrations to apply (Supabase)

1. `migrations/000_production_schema.sql` — base schema.
2. `migrations/003_authorization_privacy_ledger.sql` — authorization, privacy, ledger RPCs, realtime. Idempotent; safe to re-run.

Do **not** apply:

* `001_initial_schema.sql` — an older, non-Supabase schema (own `users` table). Kept for history only.
* `002_profiles_and_auth_trigger.sql` — fails after `000` (`firebase_uid` column missing); its trigger is replaced by 003.

Before applying 003 to a database that already has data, take a backup. 003 recomputes `accounts.opening_balance` so that `balance = opening_balance + ledger`; review accounts whose opening balance becomes negative.

In the Supabase dashboard, enable **Realtime → Private channels only** (or keep public channels for other apps but note that FamilyFinanceSync only uses private `user:{uid}` topics).

## Tests (local PostgreSQL 16)

```bash
PGHOST=… PGPORT=… PGUSER=postgres npm run test:db
```

`tests/00_supabase_shim.sql` creates stand-ins for `auth.uid()`, the `anon`/`authenticated` roles, default grants and `realtime.send()` so the policies can be tested without Supabase. Never run the shim against a real project.

* `tests/01_baseline_exploits.sql` — demonstrates the holes in 000 alone (run on 000 only).
* `tests/02_authorization_tests.sql` — 77 checks: privilege escalation, privacy, ledger, idempotency, requests, roles, removal, realtime targeting.
* `tests/03_concurrency.sh` — 200 parallel writes to one account and 15 concurrent retries with one idempotency key.
