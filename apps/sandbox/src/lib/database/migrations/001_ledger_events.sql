-- 001_ledger_events.sql — the event-sourced play ledger (P1.2 slice 1a).
-- App-owned. No PII (play-money amounts + goal metadata only) -> no *_encrypted
-- columns. C-P0 holds by construction: no column can represent real value.
-- One statement per file (Neon HTTP is one-shot; no multi-statement splitter).
-- owner_key: the account id (Auth.js users.id) once Phase 2 wires it. TEXT + NO
-- FK now (the users table lands in Phase 2). Under Option 2 (W6 16.A1) Postgres
-- never holds anonymous rows, so every owner_key resolves to a real users.id --
-- the Phase-2 FK is cleanly addable with no orphan keys.
CREATE TABLE IF NOT EXISTS ledger_events (
  seq        BIGSERIAL PRIMARY KEY,
  event_id   UUID NOT NULL UNIQUE,
  owner_key  TEXT NOT NULL,
  type       TEXT NOT NULL,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
