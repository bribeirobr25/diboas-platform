-- 006_evidence_active.sql — the active-evidence pointer (F-A).
-- Must run after 005: the composite FK parent lives there.
-- One statement per file (Neon HTTP one-shot). Independently idempotent.
--
-- ONE pointer field. An earlier draft carried record_id AND record_seq, with
-- only record_id bound to the record — so record_seq could disagree with the
-- row it pointed at while still driving the compare-and-swap. That shape is
-- rejected: record_seq is now the single pointer and the FK binds it together
-- with evidence_key, which proves structurally that
--   the activation seq IS the seq of the exact referenced record, and
--   that record has the SAME evidence identity as the pointer.
-- record_id is reached by join when needed.
--
-- evidence_key as PRIMARY KEY = exactly one active record per identity.
-- Activation is a separate, guarded, single statement (see PostgresEvidenceStore):
-- it orders by INGESTION sequence, never by semantic freshness, which is H-owned.
CREATE TABLE IF NOT EXISTS evidence_active (
  evidence_key TEXT        PRIMARY KEY,
  record_seq   BIGINT      NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (evidence_key, record_seq)
    REFERENCES evidence_records (evidence_key, seq)
)
