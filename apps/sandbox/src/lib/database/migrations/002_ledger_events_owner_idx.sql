-- 002_ledger_events_owner_idx.sql — replay/read index for the play ledger.
-- Scopes reads by owner_key, ordered by seq (deterministic replay). One
-- statement per file (Neon HTTP one-shot).
CREATE INDEX IF NOT EXISTS idx_ledger_events_owner ON ledger_events (owner_key, seq)
