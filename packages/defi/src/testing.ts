/**
 * TEST / FIXTURE helpers. **Not for production code.**
 *
 * The role is in the FILE NAME on purpose (Founder/Strategy 2026-09-18): the
 * prohibition below must be visible at the import site, not carried as tribal
 * knowledge. Anything here exists so tests can stay short — never so production
 * can skip stating a truth explicitly.
 *
 * ⚑ THE PROHIBITION, and why it has its own file and its own guard test:
 *
 *   EXTERNAL SOURCE ≠ OBSERVED
 *
 * `observedStamp` asserts OBSERVED by its own name, which is truthful for a
 * fixture that means exactly that. In production the same convenience would be
 * a semantic default — silence meaning "observed" — which is precisely the
 * failure the explicit-origin contract exists to prevent. Production therefore
 * uses `evidenceStamp`, where `origin` is a REQUIRED argument and omitting it
 * is a compile error.
 *
 * `evidenceOriginGuard.test.ts` fails the build if any file outside `__tests__`
 * references this module, so the rule is mechanical rather than remembered.
 */

import type {
  EvidenceActivationResult,
  EvidenceActiveRecord,
  EvidencePutResult,
  EvidenceRecordCandidate,
  EvidenceStore,
} from './evidenceStore';
import { evidenceStamp, type DataStamp } from './types';

/**
 * A fixture stamp for an OBSERVED provider reading.
 *
 * Explicit by name: a caller writing `observedStamp` is stating the origin, not
 * omitting it. Kept so ~26 existing fixtures need no churn — churn in test
 * files is where a real behavioural change hides.
 */
export function observedStamp(
  source: 'defillama' | 'coingecko',
  asOf: string,
  observedAt: string | null = null
): DataStamp {
  return evidenceStamp({ source, origin: 'OBSERVED', asOf, observedAt });
}

/**
 * `InMemoryEvidenceStore` — TESTS and explicit ephemeral development ONLY.
 *
 * ⚑ THIS IS NOT DURABLE HISTORICAL PERSISTENCE, and it is never a production
 * fallback. The failure mode it exists to make impossible is the translation
 *
 * ```text
 * durable store unavailable -> InMemory -> "persistence succeeded"
 * ```
 *
 * which would report durable ingestion that no later read could find. The
 * runtime factory therefore returns `{ enabled: false, reason }` when durable
 * persistence cannot run, and NEVER an instance of this class. It lives in
 * `testing.ts` so the prohibition is visible at the import site, and
 * `evidenceOriginGuard.test.ts` already fails the build if production code
 * imports this module.
 *
 * Its semantics mirror the Postgres adapter exactly — insert-if-new by
 * ingestion key, guarded activation by ingestion seq — so the same contract
 * suite proves both.
 */
export class InMemoryEvidenceStore implements EvidenceStore {
  private seq = 0;
  private readonly byIngestionKey = new Map<string, { seq: number; digest: string }>();
  private readonly records = new Map<number, EvidenceRecordCandidate>();
  private readonly active = new Map<string, number>();

  async put(candidate: EvidenceRecordCandidate): Promise<EvidencePutResult> {
    const existing = this.byIngestionKey.get(candidate.ingestionKey);
    if (existing) {
      return { status: 'DUPLICATE', seq: existing.seq, storedDigest: existing.digest };
    }
    this.seq += 1;
    this.byIngestionKey.set(candidate.ingestionKey, {
      seq: this.seq,
      digest: candidate.payloadDigest,
    });
    this.records.set(this.seq, candidate);
    return { status: 'INSERTED', seq: this.seq };
  }

  async activate(evidenceKey: string, seq: number): Promise<EvidenceActivationResult> {
    const record = this.records.get(seq);
    /* The in-memory mirror of the composite FK: a pointer may only ever name a
       record of the SAME evidence identity. Postgres refuses this structurally;
       here it throws, so the contract suite observes one behaviour. */
    if (!record) throw new Error(`no evidence record at seq ${seq}`);
    if (record.evidenceKey !== evidenceKey) {
      throw new Error(
        `activation identity mismatch: pointer ${evidenceKey} cannot target a ${record.evidenceKey} record`
      );
    }
    const current = this.active.get(evidenceKey);
    if (current !== undefined && current >= seq) {
      return { status: 'NOT_NEWER', activeSeq: current };
    }
    this.active.set(evidenceKey, seq);
    return { status: 'ACTIVATED', seq };
  }

  async readActive(evidenceKey: string): Promise<EvidenceActiveRecord | null> {
    const seq = this.active.get(evidenceKey);
    if (seq === undefined) return null;
    const record = this.records.get(seq);
    if (!record) return null;
    return { seq, evidenceKey: record.evidenceKey, payload: record.payload };
  }
}
