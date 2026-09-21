-- 005_evidence_records.sql — the shared evidence history (F-A).
-- App-owned. No PII: reference market evidence only, no owner_key, no user data.
-- APPEND-ONLY by contract: nothing in the app updates or deletes a row here.
-- One statement per file (Neon HTTP is one-shot; no multi-statement splitter).
-- Independently idempotent (CTO §14.6): CREATE TABLE IF NOT EXISTS, so a re-run
-- after a failed schema_migrations INSERT re-applies safely.
--
-- evidence_key   the semantic identity "kind:subject:unit" (the unit segment is
--                mandatory: a value in EUR is not the same persisted fact as the
--                same measure in USD). Never contains source, origin, mode or locale.
-- ingestion_key  sha256 over (evidence identity + base observation identity +
--                conversion observation identity). UNIQUE = idempotency: a retry
--                of the same observation collapses; a new FX observation does not.
--                The VALUE is deliberately not an input.
-- payload_digest sha256 over the full payload. Same ingestion_key + different
--                digest = CONTRADICTION, reported, never an overwrite.
-- UNIQUE (evidence_key, seq) is NOT redundant with the primary key: Postgres
--                requires a unique constraint on the exact referenced column
--                list, and this is the parent of 006's composite foreign key.
--                Removing it as "redundant" silently un-constrains the pointer.
CREATE TABLE IF NOT EXISTS evidence_records (
  seq            BIGSERIAL   PRIMARY KEY,
  record_id      UUID        NOT NULL UNIQUE,
  evidence_key   TEXT        NOT NULL,
  schema_version INT         NOT NULL,
  ingestion_key  TEXT        NOT NULL UNIQUE,
  payload_digest TEXT        NOT NULL,
  payload        JSONB       NOT NULL,
  ingested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evidence_key, seq)
)
