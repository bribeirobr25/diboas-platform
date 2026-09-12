-- 004_ledger_events_scope_idx.sql — scope-aware replay index (I-1).
-- Supersedes idx_ledger_events_owner (002) for every read path: reads are now
-- always scoped, so the leading (owner_key, ledger_scope) prefix is what the
-- planner needs, ordered by seq for deterministic replay. 002's index is left
-- in place deliberately — dropping an index is a separate, reversible decision
-- and this one still serves any owner-wide count.
-- One statement per file (Neon HTTP one-shot).
CREATE INDEX IF NOT EXISTS idx_ledger_events_owner_scope
  ON ledger_events (owner_key, ledger_scope, seq)
