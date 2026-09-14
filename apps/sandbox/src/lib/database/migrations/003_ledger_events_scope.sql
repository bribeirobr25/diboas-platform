-- 003_ledger_events_scope.sql — the ledger SCOPE column (I-1, plan r2 §4).
-- Splits one account's events into two independent ledgers: 'sandbox' (Practice,
-- ledger-is-truth) and 'real' (Real Money, chain-is-truth — the row is a record,
-- never the balance of record). DEFAULT 'sandbox' backfills every pre-I-1 row
-- correctly by construction: Real did not exist when they were written, so no
-- data migration and no history rewrite is needed (decision D-04).
-- NOT NULL + DEFAULT is safe here because the default supplies every existing row.
-- One statement per file (Neon HTTP is one-shot; no multi-statement splitter).
ALTER TABLE ledger_events
  ADD COLUMN IF NOT EXISTS ledger_scope TEXT NOT NULL DEFAULT 'sandbox'
