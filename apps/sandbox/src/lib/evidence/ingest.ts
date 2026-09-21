/**
 * The F-A RUNTIME PRODUCER — the first real evidence persistence path.
 *
 * ```text
 * FixtureGasProvider output (MODELLED, fixture-owned, USD, unconverted)
 *   -> base EvidenceEnvelope
 *   -> eligibility guard            (LC-LIC-01 scope: fixture lane only)
 *   -> validate + encode            (codec: number -> canonical decimal string)
 *   -> durable insert               (idempotent by ingestion key)
 *   -> atomic activation            (guarded CAS, one statement)
 *   -> round-trip read + decode     (proof, not assumption)
 * ```
 *
 * ⚑ NO PRODUCT CONSUMER. Nothing rendered reads `evidence_active`. The
 * `/api/market` response is composed and returned BEFORE this runs, so Product
 * behaviour and latency are unchanged by construction rather than by care.
 * F-B is the first Product consumer.
 *
 * ⚑ ORIGIN IS THE SOURCE'S ACTUAL TRUTH. The fixture provider's stamp says
 * MODELLED, and it stays MODELLED through encode, storage and decode. A value
 * is never OBSERVED merely because it passed through a provider interface, and
 * F-A does NOT satisfy canon's externally sourced primary network-cost
 * methodology — that arrives with G.
 */

import { createHash, randomUUID } from 'node:crypto';
import {
  buildEvidenceCandidate,
  evidenceKey,
  fromPayloadV1,
  referenceEvidence,
  type Chain,
  type EvidenceEnvelope,
  type GasQuote,
} from '@diboas/defi';
import { Logger } from '../monitoring/Logger';
import { evaluateIngestionEligibility } from './eligibility';
import { getEvidencePersistence } from './factory';

/** The unit the fixture network cost is natively expressed in. Unconverted. */
const NETWORK_COST_NATIVE_UNIT = 'USD';

const sha256 = (input: string): string => createHash('sha256').update(input, 'utf8').digest('hex');

export type IngestOutcome =
  | { status: 'PERSISTENCE_DISABLED'; reason: string }
  | { status: 'INELIGIBLE'; reason: string }
  | { status: 'INGESTED'; evidenceKey: string; seq: number; activated: boolean }
  | { status: 'DUPLICATE'; evidenceKey: string; seq: number }
  | { status: 'CONTRADICTION'; evidenceKey: string; seq: number }
  | { status: 'FAILED'; error: unknown };

/**
 * The base, unconverted network-cost envelope for one chain.
 *
 * Exported so the test suite builds exactly what the runtime builds. The unit
 * is the NATIVE one and no conversion is applied here: a converted value would
 * carry external rate provenance and leave the F-A lane.
 */
export function networkCostEnvelopeFrom(quote: GasQuote): EvidenceEnvelope<number> {
  return referenceEvidence({
    value: quote.typicalFeeUsd,
    stamp: quote.stamp,
    normalization: { converted: false },
    coverage: { kind: 'single', category: 'network' },
  });
}

/** `network-cost:<chain>:USD`, built through the one validated key builder. */
export function networkCostKey(chain: Chain): string {
  return evidenceKey({ kind: 'network-cost', subject: chain, unit: NETWORK_COST_NATIVE_UNIT });
}

/**
 * Persist one chain's fixture network cost, end to end.
 *
 * Every non-ingested outcome is a RESULT, not an exception: disabled, refused
 * and duplicate are ordinary states that must not disturb the caller. Only an
 * unexpected failure is logged as an error, and even then nothing rendered
 * changes.
 */
export async function ingestNetworkCost(quote: GasQuote): Promise<IngestOutcome> {
  const persistence = getEvidencePersistence();
  if (!persistence.enabled) {
    return { status: 'PERSISTENCE_DISABLED', reason: persistence.reason };
  }
  const key = networkCostKey(quote.chain);
  const eligibility = evaluateIngestionEligibility(networkCostEnvelopeFrom(quote));
  if (!eligibility.eligible) {
    /* Refused, not persisted, not activated. Explicit and internal — there is
       no user-facing copy for this, and F-A introduces none. */
    Logger.info('evidence ingestion refused', { evidenceKey: key, reason: eligibility.reason });
    return { status: 'INELIGIBLE', reason: eligibility.reason };
  }
  try {
    const candidate = buildEvidenceCandidate({
      evidenceKey: key,
      envelope: eligibility.envelope,
      unit: NETWORK_COST_NATIVE_UNIT,
      recordId: randomUUID(),
      hash: sha256,
    });
    const put = await persistence.store.put(candidate);
    if (put.status === 'DUPLICATE') {
      if (put.storedDigest !== candidate.payloadDigest) {
        /* Identical observation identity, different payload. Reported, never
           resolved here: the store does not decide which of two contradicting
           payloads is right, and history is not overwritten. */
        Logger.error('evidence contradiction', {
          evidenceKey: key,
          seq: put.seq,
          storedDigest: put.storedDigest,
          candidateDigest: candidate.payloadDigest,
        });
        return { status: 'CONTRADICTION', evidenceKey: key, seq: put.seq };
      }
      return { status: 'DUPLICATE', evidenceKey: key, seq: put.seq };
    }
    const activation = await persistence.store.activate(key, put.seq);
    /* Round-trip proof: read what was stored and decode it. A payload that
       cannot be decoded is a defect in what we just wrote, and it must surface
       here rather than at the first Product read. */
    const active = await persistence.store.readActive(key);
    if (active) fromPayloadV1(active.payload);
    return {
      status: 'INGESTED',
      evidenceKey: key,
      seq: put.seq,
      activated: activation.status === 'ACTIVATED',
    };
  } catch (error) {
    Logger.error('evidence ingestion failed', { evidenceKey: key }, error);
    return { status: 'FAILED', error };
  }
}

/**
 * Ingest every chain the market route already quotes.
 *
 * Sequential on purpose: these are one-shot HTTP statements against a
 * serverless database, and a burst adds nothing to a path whose whole point is
 * that no one is waiting for it.
 */
export async function ingestNetworkCosts(quotes: GasQuote[]): Promise<IngestOutcome[]> {
  const outcomes: IngestOutcome[] = [];
  for (const quote of quotes) outcomes.push(await ingestNetworkCost(quote));
  return outcomes;
}
