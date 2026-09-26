-- =========================================================================
-- Authorization / privacy / ledger tests for 003.
-- Run on a scratch database:  00_supabase_shim.sql → 000 → 003 → this file.
-- Every check raises an exception on failure (psql ON_ERROR_STOP=1).
-- =========================================================================
\set ON_ERROR_STOP 1
SET client_min_messages = notice;

CREATE SCHEMA IF NOT EXISTS test;
GRANT USAGE ON SCHEMA test TO authenticated, anon;

CREATE OR REPLACE FUNCTION test.ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

-- Runs sql and requires it to fail (optionally with a given SQLSTATE)
CREATE OR REPLACE FUNCTION test.fails(sql TEXT, label TEXT, want_state TEXT DEFAULT NULL) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE sql;
  EXCEPTION WHEN OTHERS THEN
    IF want_state IS NOT NULL AND SQLSTATE <> want_state THEN
      RAISE EXCEPTION 'FAIL: % (expected %, got % %)', label, want_state, SQLSTATE, SQLERRM;
    END IF;
    RAISE NOTICE 'ok  % (blocked: %)', label, SQLERRM;
    RETURN;
  END;
  RAISE EXCEPTION 'FAIL: % (statement succeeded but should have been blocked)', label;
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test TO authenticated, anon;

CREATE TABLE IF NOT EXISTS test.ids (k TEXT PRIMARY KEY, v UUID);
GRANT ALL ON test.ids TO authenticated;
CREATE OR REPLACE FUNCTION test.id(p TEXT) RETURNS UUID LANGUAGE sql AS $$ SELECT v FROM test.ids WHERE k = p $$;
CREATE OR REPLACE FUNCTION test.cat(p_family UUID, p_name TEXT, p_type TEXT) RETURNS UUID LANGUAGE sql SECURITY DEFINER AS
$$ SELECT id FROM public.categories WHERE family_id = p_family AND name = p_name AND type = p_type $$;
GRANT EXECUTE ON FUNCTION test.id(TEXT), test.cat(UUID,TEXT,TEXT) TO authenticated;

-- ---------- users ----------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'head@fam.test',    '{"full_name":"Arun Head"}'),
  ('a0000000-0000-0000-0000-000000000002', 'spouse@fam.test',  '{"full_name":"Priya Spouse"}'),
  ('a0000000-0000-0000-0000-000000000003', 'son@fam.test',     '{"full_name":"Rahul Son"}'),
  ('a0000000-0000-0000-0000-000000000004', 'viewer@fam.test',  '{"full_name":"Vini Viewer"}'),
  ('a0000000-0000-0000-0000-000000000005', 'outsider@x.test',  '{"full_name":"Oscar Outsider"}');
INSERT INTO test.ids VALUES ('head','a0000000-0000-0000-0000-000000000001'),('spouse','a0000000-0000-0000-0000-000000000002'),
  ('son','a0000000-0000-0000-0000-000000000003'),('viewer','a0000000-0000-0000-0000-000000000004'),('out','a0000000-0000-0000-0000-000000000005');

SELECT test.ok((SELECT count(*) FROM public.profiles) = 5, 'signup trigger created 5 profiles');

-- ---------- anon ----------
SET ROLE anon;
SELECT test.fails('SELECT * FROM public.transactions', 'anon cannot read transactions');
SELECT test.fails($$SELECT public.bootstrap_family('x')$$, 'anon cannot call RPCs');
RESET ROLE;

-- ---------- head bootstraps family & invites ----------
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
INSERT INTO test.ids SELECT 'fam', public.bootstrap_family('Arun Family');
SELECT test.ok(public.bootstrap_family() = test.id('fam'), 'bootstrap_family is idempotent');
INSERT INTO test.ids SELECT 'acct', id FROM public.accounts WHERE family_id = test.id('fam') AND name = 'Cash';
SELECT test.ok(array_length(public.my_permissions(test.id('fam')),1) = (SELECT count(*) FROM public.permissions), 'head has every permission');

CREATE TEMP TABLE inv AS
SELECT 'spouse' AS who, (public.create_invitation(test.id('fam'), 'SPOUSE', 'Wife', 'spouse@fam.test')).code
UNION ALL SELECT 'son', (public.create_invitation(test.id('fam'), 'SON', 'Son', NULL)).code
UNION ALL SELECT 'viewer', (public.create_invitation(test.id('fam'), 'VIEWER', 'Uncle', NULL)).code;
GRANT SELECT ON inv TO authenticated;

SELECT set_config('request.jwt.claim.sub', test.id('out')::text, false);
SELECT test.fails(format($$SELECT public.accept_invitation(%L)$$, (SELECT code FROM inv WHERE who='spouse')),
  'invitation bound to another email cannot be used');
INSERT INTO test.ids SELECT 'outfam', public.bootstrap_family('Other Family');

SELECT set_config('request.jwt.claim.sub', test.id('spouse')::text, false);
SELECT public.accept_invitation((SELECT code FROM inv WHERE who='spouse'));
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT public.accept_invitation((SELECT code FROM inv WHERE who='son'));
SELECT test.fails(format($$SELECT public.accept_invitation(%L)$$, (SELECT code FROM inv WHERE who='son')), 'invitation cannot be reused');
SELECT set_config('request.jwt.claim.sub', test.id('viewer')::text, false);
SELECT public.accept_invitation((SELECT code FROM inv WHERE who='viewer'));

-- ---------- privilege-escalation attempts by the son ----------
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.fails($$INSERT INTO public.role_permissions VALUES ('SON','members.remove')$$, 'son cannot edit role_permissions', '42501');
SELECT test.fails($$INSERT INTO public.member_permissions (family_member_id, permission_id, allowed)
  SELECT id, 'transactions.view_family', true FROM public.family_members WHERE user_id = auth.uid()$$, 'son cannot grant himself overrides', '42501');
SELECT test.fails($$UPDATE public.family_members SET role_id = 'FAMILY_HEAD' WHERE user_id = auth.uid()$$, 'son cannot promote himself', '42501');
SELECT test.fails(format($$DELETE FROM public.families WHERE id = %L$$, test.id('fam')), 'son cannot delete the family', '42501');
SELECT test.fails($$UPDATE public.profiles SET email = 'x@y' WHERE id = auth.uid()$$, 'profile email not client-editable', '42501');
SELECT test.fails(format($$UPDATE public.accounts SET balance = 99999999 WHERE id = %L$$, test.id('acct')), 'balance not client-writable', '42501');
SELECT test.fails(format($$INSERT INTO public.transactions (family_id,user_id,category_id,type,amount,description,payment_method)
  VALUES (%L,%L,%L,'income',1,'forged','cash')$$, test.id('fam'), test.id('head'), test.cat(test.id('fam'),'Salary','income')),
  'direct transaction insert blocked (must use RPC)', '42501');
SELECT test.fails(format($$SELECT public.set_member_permission((SELECT id FROM public.family_members WHERE user_id=auth.uid()), 'transactions.view_family', true)$$),
  'son cannot call set_member_permission', '42501');
SELECT test.fails(format($$SELECT public.create_role(%L,'Boss','x',ARRAY['members.remove'])$$, test.id('fam')), 'son cannot create roles', '42501');
UPDATE public.profiles SET bio = 'I like cricket', location = 'Madurai' WHERE id = auth.uid();
SELECT test.ok((SELECT bio FROM public.profiles WHERE id = auth.uid()) = 'I like cricket', 'son can edit own profile fields');

-- ---------- ledger: create, validation, idempotency ----------
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',0,%L,'zero')$$, test.id('fam'), test.cat(test.id('fam'),'Food','expense')), 'zero amount rejected', '22023');
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',-500,%L,'neg')$$, test.id('fam'), test.cat(test.id('fam'),'Food','expense')), 'negative amount rejected', '22023');
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',500,%L,'pet')$$, test.id('fam'), test.cat(test.id('fam'),'Other','expense')), 'Other needs custom category', '22023');
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',500,%L,'wrong type')$$, test.id('fam'), test.cat(test.id('fam'),'Salary','income')), 'category type must match', '22023');
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',500,%L,'x')$$, test.id('outfam'), test.cat(test.id('outfam'),'Food','expense')), 'cannot write into another family', '42501');

INSERT INTO test.ids SELECT 'son_lunch', (public.create_transaction(test.id('fam'),'expense',25000,test.cat(test.id('fam'),'Food','expense'),'Lunch',
  NOW(),'cash',NULL,NULL,'family',NULL,'key-lunch-1')).id;
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',100,%L,'x',NOW(),'cash',NULL,NULL,'family',%L)$$,
  test.id('fam'), test.cat(test.id('fam'),'Food','expense'), test.id('acct')), 'son cannot book against a shared account without accounts.view', '42501');
SELECT test.ok((public.create_transaction(test.id('fam'),'expense',25000,test.cat(test.id('fam'),'Food','expense'),'Lunch',
  NOW(),'cash',NULL,NULL,'family',NULL,'key-lunch-1')).id = test.id('son_lunch'), 'retry with same idempotency key returns the same row');
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE description='Lunch') = 1, 'no duplicate after retry');
INSERT INTO test.ids SELECT 'son_pet', (public.create_transaction(test.id('fam'),'expense',50000,test.cat(test.id('fam'),'Other','expense'),'Vet',
  NOW(),'upi','Pet Care')).id;
INSERT INTO test.ids SELECT 'son_private', (public.create_transaction(test.id('fam'),'expense',10000,test.cat(test.id('fam'),'Personal','expense'),'Private gift',
  NOW(),'cash',NULL,NULL,'private')).id;
INSERT INTO test.ids SELECT 'son_allow', (public.create_transaction(test.id('fam'),'income',500000,test.cat(test.id('fam'),'Allowance','income'),'Monthly allowance')).id;
SELECT test.ok((SELECT custom_category FROM public.transactions WHERE id = test.id('son_pet')) = 'Pet Care', 'custom category stored');
SELECT test.ok((SELECT count(*) FROM public.transactions) = 4, 'son sees his own 4 transactions');

-- ---------- privacy: head sees nothing of son until son shares ----------
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE user_id = test.id('son')) = 0, 'head cannot see son transactions while sharing is off');

SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT public.set_member_sharing((SELECT id FROM public.family_members WHERE user_id = auth.uid()), false, true);
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE user_id = test.id('son')) = 2, 'head sees son shared expenses only (not private, not income)');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.transactions WHERE id = test.id('son_private')), 'private transaction never visible to head');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM public.transactions WHERE id = test.id('son_allow')), 'income hidden while income sharing is off');
SELECT test.ok((SELECT expense_paise FROM public.v_member_monthly_summary WHERE user_id = test.id('son')) = 75000, 'monthly summary only aggregates visible rows');

-- head locks sharing (e.g. minor): son can no longer turn it off
SELECT public.set_member_sharing((SELECT id FROM public.family_members WHERE user_id = test.id('son')), true, true, true);
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.fails($$SELECT public.set_member_sharing((SELECT id FROM public.family_members WHERE user_id = auth.uid()), false, false)$$,
  'son cannot change locked sharing', '42501');

-- ---------- other members ----------
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT public.create_transaction(test.id('fam'),'income',4000000,test.cat(test.id('fam'),'Salary','income'),'Salary Sep');
INSERT INTO test.ids SELECT 'head_bonus', (public.create_transaction(test.id('fam'),'income',1000000,test.cat(test.id('fam'),'Salary','income'),'Bonus',
  NOW(),'bank',NULL,NULL,'private',test.id('acct'))).id;
SELECT test.ok((SELECT balance FROM public.accounts WHERE id = test.id('acct')) = 1000000, 'account balance updated atomically by ledger trigger');
SELECT test.ok((public.update_transaction(test.id('head_bonus'), 1, 1200000)).version = 2, 'update bumps version');
SELECT test.ok((SELECT balance FROM public.accounts WHERE id = test.id('acct')) = 1200000, 'balance follows amount edit');
SELECT public.void_transaction(test.id('head_bonus'), 'entered twice');
SELECT test.ok((SELECT balance FROM public.accounts WHERE id = test.id('acct')) = 0, 'voiding restores balance');
SELECT test.ok(public.reconcile_account_balance(test.id('acct')) = 0, 'reconcile agrees with trigger-maintained balance');
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE user_id = test.id('head')) = 0, 'son cannot see head transactions');
SELECT set_config('request.jwt.claim.sub', test.id('spouse')::text, false);
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE user_id <> auth.uid()) = 0, 'spouse has no family view by default');
SELECT set_config('request.jwt.claim.sub', test.id('viewer')::text, false);
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',100,%L,'x')$$, test.id('fam'), test.cat(test.id('fam'),'Food','expense')), 'viewer cannot add transactions', '42501');
SELECT set_config('request.jwt.claim.sub', test.id('out')::text, false);
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE family_id = test.id('fam')) = 0, 'outsider sees no transactions of another family');
SELECT test.ok((SELECT count(*) FROM public.family_members WHERE family_id = test.id('fam')) = 0, 'outsider sees no members of another family');
SELECT test.ok((SELECT count(*) FROM public.profiles WHERE id = test.id('head')) = 0, 'outsider cannot read other family profiles');

-- ---------- update / void ----------
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.fails(format($$SELECT public.update_transaction(%L, 99, 30000)$$, test.id('son_lunch')), 'stale version rejected', '40001');
SELECT test.ok((public.update_transaction(test.id('son_lunch'), 1, 30000)).amount = 30000, 'son edits own transaction');
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.fails(format($$SELECT public.void_transaction(%L)$$, test.id('son_lunch')), 'son lacks delete_own by default', '42501');
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT test.ok((public.void_transaction(test.id('son_lunch'), 'duplicate')).status = 'voided', 'head (delete_any) voids a visible son transaction');

-- ---------- requests ----------
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
INSERT INTO test.ids SELECT 'req', (public.create_request(test.id('fam'),'expense','New cricket bat','Need it for school team',
  250000, test.cat(test.id('fam'),'Shopping','expense'), NULL, NULL, 'req-key-1')).id;
SELECT test.ok((public.create_request(test.id('fam'),'expense','New cricket bat','dup', 250000,
  test.cat(test.id('fam'),'Shopping','expense'), NULL, NULL, 'req-key-1')).id = test.id('req'), 'request creation is idempotent');
INSERT INTO test.ids SELECT 'req_perm', (public.create_request(test.id('fam'),'permission','View family summary',NULL,NULL,NULL,NULL,'family_finance.view')).id;
SELECT test.fails(format($$SELECT public.review_request(%L,'approved')$$, test.id('req')), 'requester cannot approve own request', '42501');
SELECT set_config('request.jwt.claim.sub', test.id('spouse')::text, false);
SELECT test.fails(format($$SELECT public.review_request(%L,'approved')$$, test.id('req')), 'spouse cannot approve by default', '42501');
SELECT test.ok((SELECT count(*) FROM public.requests) = 0, 'spouse cannot see others requests');
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT test.ok((SELECT count(*) FROM public.notifications WHERE type = 'request_created') = 2, 'head notified of both requests');
SELECT public.review_request(test.id('req'), 'approved', 'Ok, study well');
SELECT test.fails(format($$SELECT public.review_request(%L,'rejected')$$, test.id('req')), 'cannot review twice', '55000');
SELECT public.review_request(test.id('req_perm'), 'rejected', 'Not yet');
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE description = 'New cricket bat' AND amount = 250000) = 1,
  'approved expense request became a ledger entry for the requester');
SELECT test.ok((SELECT count(*) FROM public.notifications WHERE type IN ('request_approved','request_rejected')) = 2, 'son notified of both decisions');
SELECT test.ok((SELECT count(*) FROM public.notifications WHERE user_id <> auth.uid()) = 0, 'son sees only his own notifications');
UPDATE public.notifications SET read_at = NOW();
SELECT test.fails($$UPDATE public.notifications SET message = 'hacked'$$, 'notification content not editable', '42501');
SELECT test.ok((SELECT count(*) FROM public.audit_logs) = 0, 'son cannot read audit log');

-- ---------- roles ----------
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
INSERT INTO test.ids SELECT 'spouse_member', id FROM public.family_members WHERE user_id = test.id('spouse');
SELECT set_config('request.jwt.claim.sub', test.id('spouse')::text, false);
SELECT test.fails(format($$SELECT public.assign_member_role(%L,'FAMILY_HEAD')$$, test.id('spouse_member')), 'spouse cannot make herself head', '42501');
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
CREATE TEMP TABLE custom_role AS SELECT * FROM public.create_role(test.id('fam'), 'Co-Manager', 'Helps manage money',
  ARRAY['family.view','members.view','transactions.create_income','transactions.create_expense','transactions.view_own',
        'transactions.view_family','family_finance.view','requests.approve','requests.reject','notifications.view']);
GRANT SELECT ON custom_role TO authenticated;
SELECT public.assign_member_role(test.id('spouse_member'), (SELECT id FROM custom_role));
SELECT set_config('request.jwt.claim.sub', test.id('spouse')::text, false);
SELECT test.ok(public.has_family_permission(test.id('fam'), 'transactions.view_family'), 'custom role grants view_family');
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE user_id = test.id('head')) = 1, 'with view_family the spouse now sees the head''s shared salary');
SELECT test.fails(format($$SELECT public.set_role_permissions(%L,%L,ARRAY['members.remove'])$$, test.id('fam'), (SELECT id FROM custom_role)),
  'spouse cannot edit own role permissions', '42501');
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT test.fails(format($$SELECT public.remove_member((SELECT id FROM public.family_members WHERE user_id = %L))$$, test.id('head')), 'owner cannot be removed', '42501');

-- ---------- family settings & invitations ----------
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.fails(format($$SELECT public.update_family(%L,'Hacked')$$, test.id('fam')), 'son cannot rename the family', '42501');
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT test.ok((public.update_family(test.id('fam'), 'Kumar Family')).name = 'Kumar Family', 'head renames the family');
CREATE TEMP TABLE inv2 AS SELECT * FROM public.create_invitation(test.id('fam'), 'DAUGHTER');
GRANT SELECT ON inv2 TO authenticated;
SELECT public.revoke_invitation((SELECT id FROM inv2));
SELECT set_config('request.jwt.claim.sub', test.id('out')::text, false);
SELECT test.fails(format($$SELECT public.accept_invitation(%L)$$, (SELECT code FROM inv2)), 'revoked invitation cannot be used', '22023');
SELECT test.fails(format($$SELECT public.revoke_invitation(%L)$$, (SELECT id FROM inv2)), 'outsider cannot revoke invitations', '42501');

-- ---------- member removal keeps history, ends access ----------
SELECT set_config('request.jwt.claim.sub', test.id('head')::text, false);
SELECT public.remove_member((SELECT id FROM public.family_members WHERE user_id = test.id('son')), 'moved out');
SELECT set_config('request.jwt.claim.sub', test.id('son')::text, false);
SELECT test.ok((SELECT count(*) FROM public.transactions) = 0, 'removed member loses access immediately');
SELECT test.fails(format($$SELECT public.create_transaction(%L,'expense',100,%L,'x')$$, test.id('fam'), test.cat(test.id('fam'),'Food','expense')), 'removed member cannot write', '42501');
RESET ROLE;
SELECT test.ok((SELECT count(*) FROM public.transactions WHERE user_id = test.id('son')) = 5, 'removed member financial history retained');

-- ---------- realtime: targeted broadcast only ----------
SELECT test.ok(NOT EXISTS (SELECT 1 FROM realtime.messages WHERE event = 'transaction.created'
    AND payload->'payload'->>'id' = test.id('son_private')::text AND topic <> 'user:' || test.id('son')), 'private transaction event sent only to its owner');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM realtime.messages WHERE topic IN ('user:' || test.id('viewer'), 'user:' || test.id('out'))
    AND event LIKE 'transaction.%'), 'viewer and outsider received no transaction events');
SELECT test.ok(NOT EXISTS (SELECT 1 FROM realtime.messages WHERE topic NOT LIKE 'user:%'), 'no family-wide topics used');
SELECT test.ok((SELECT bool_and(payload ? 'id' AND payload ? 'type' AND payload ? 'occurred_at' AND NOT (payload->'payload') ? 'idempotency_key')
    FROM realtime.messages), 'events carry id/type/occurred_at and no idempotency keys');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', test.id('viewer')::text, false);
SELECT set_config('realtime.topic', 'user:' || test.id('head'), false);
SELECT test.ok((SELECT count(*) FROM realtime.messages) = 0, 'viewer cannot join the head''s private topic');
SELECT set_config('realtime.topic', 'user:' || test.id('viewer'), false);
SELECT test.ok((SELECT count(*) FROM realtime.messages) > 0, 'viewer can read own private topic');
RESET ROLE;

\echo 'ALL AUTHORIZATION TESTS PASSED'
