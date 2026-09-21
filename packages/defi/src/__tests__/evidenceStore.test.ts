import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { referenceEvidence } from '../evidence';
import { evidenceKey } from '../evidenceIdentity';
import { buildEvidenceCandidate } from '../evidenceStore';
import { FIXTURE_STAMP } from '../fixtures';
import { InMemoryEvidenceStore } from '../testing';
import { evidenceStamp } from '../types';
import type { EvidenceEnvelope } from '../evidence';

const sha256 = (input: string) => createHash('sha256').update(input, 'utf8').digest('hex');
const NETWORK: { kind: 'single'; category: 'network' } = { kind: 'single', category: 'network' };

const AVAILABLE = (envelope: EvidenceEnvelope<number>) => {
  if (envelope.availability !== 'AVAILABLE') throw new Error('expected an AVAILABLE envelope');
  return envelope;
};

function candidate(options: {
  unit?: string;
  value?: number;
  recordId?: string;
  stampAsOf?: string;
  rateAsOf?: string;
}) {
  const unit = options.unit ?? 'USD';
  const converted = options.rateAsOf !== undefined;
  const envelope = referenceEvidence({
    value: options.value ?? 0.03,
    stamp: options.stampAsOf
      ? evidenceStamp({ source: 'defillama', origin: 'OBSERVED', asOf: options.stampAsOf })
      : FIXTURE_STAMP,
    normalization: converted
      ? {
          converted: true as const,
          fromCurrency: 'USD',
          toCurrency: unit,
          /* Synthetic, controlled stamp: this proves the identity RULE. No
             provider persistence permission is implied by a test fixture. */
          rateStamp: evidenceStamp({
            source: 'coingecko',
            origin: 'OBSERVED',
            asOf: options.rateAsOf as string,
          }),
        }
      : { converted: false as const },
    coverage: NETWORK,
  });
  return buildEvidenceCandidate({
    evidenceKey: evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit }),
    envelope: AVAILABLE(envelope),
    unit,
    recordId:
      options.recordId ?? `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`,
    hash: sha256,
  });
}

/**
 * The store CONTRACT, proven against the in-memory adapter whose semantics
 * mirror the Postgres one. Every case here is a requirement from the accepted
 * F-A design, not an observation of what the code happens to do.
 */
describe('evidence store — idempotency by observation identity', () => {
  it('should collapse a retry of the SAME observation into one record', async () => {
    const store = new InMemoryEvidenceStore();
    const first = await store.put(candidate({}));
    const retry = await store.put(candidate({}));
    expect(first.status).toBe('INSERTED');
    expect(retry.status).toBe('DUPLICATE');
    if (retry.status !== 'DUPLICATE') throw new Error('unreachable');
    expect(retry.seq).toBe(first.status === 'INSERTED' ? first.seq : -1);
  });

  it('should create NEW history for a genuinely new base observation', async () => {
    const store = new InMemoryEvidenceStore();
    const monday = await store.put(candidate({ stampAsOf: '2026-09-21T00:00:00.000Z' }));
    const tuesday = await store.put(candidate({ stampAsOf: '2026-09-22T00:00:00.000Z' }));
    expect(monday.status).toBe('INSERTED');
    expect(tuesday.status).toBe('INSERTED');
    expect(tuesday.seq).toBeGreaterThan(monday.seq);
  });

  it('should create a NEW record when the same base is converted on a new rate observation', async () => {
    const store = new InMemoryEvidenceStore();
    const first = await store.put(candidate({ unit: 'EUR', rateAsOf: '2026-09-21T00:00:00.000Z' }));
    const second = await store.put(
      candidate({ unit: 'EUR', rateAsOf: '2026-09-22T00:00:00.000Z' })
    );
    expect(first.status).toBe('INSERTED');
    expect(second.status).toBe('INSERTED');
  });

  it('should treat the same measure in a different unit as a DIFFERENT evidence identity', async () => {
    const usd = candidate({ unit: 'USD' });
    const eur = candidate({ unit: 'EUR', rateAsOf: '2026-09-21T00:00:00.000Z' });
    expect(usd.evidenceKey).not.toBe(eur.evidenceKey);
    expect(usd.ingestionKey).not.toBe(eur.ingestionKey);
  });
});

describe('evidence store — contradiction is reported, never resolved', () => {
  it('should return the STORED digest so a retry can be told from a contradiction', async () => {
    const store = new InMemoryEvidenceStore();
    const original = candidate({ value: 0.03 });
    await store.put(original);
    /* Same observation identity (same stamp, same key, unconverted), different
       value — so the digest differs while the ingestion key does not. */
    const contradicting = candidate({ value: 0.05 });
    expect(contradicting.ingestionKey).toBe(original.ingestionKey);
    const result = await store.put(contradicting);
    expect(result.status).toBe('DUPLICATE');
    if (result.status !== 'DUPLICATE') throw new Error('unreachable');
    expect(result.storedDigest).toBe(original.payloadDigest);
    expect(result.storedDigest).not.toBe(contradicting.payloadDigest);
  });

  it('should leave the ORIGINAL payload in place — history is not overwritten', async () => {
    const store = new InMemoryEvidenceStore();
    const original = candidate({ value: 0.03 });
    const put = await store.put(original);
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    await store.activate(original.evidenceKey, put.seq);
    await store.put(candidate({ value: 0.05 }));
    const active = await store.readActive(original.evidenceKey);
    expect(active?.payload).toMatchObject({ value: '0.03' });
  });
});

describe('evidence store — activation', () => {
  it('should activate the first record and read it back', async () => {
    const store = new InMemoryEvidenceStore();
    const c = candidate({});
    const put = await store.put(c);
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    expect(await store.activate(c.evidenceKey, put.seq)).toEqual({
      status: 'ACTIVATED',
      seq: put.seq,
    });
    const active = await store.readActive(c.evidenceKey);
    expect(active?.seq).toBe(put.seq);
    expect(active?.evidenceKey).toBe(c.evidenceKey);
  });

  it('should refuse a pointer that targets a record of a DIFFERENT evidence identity', async () => {
    const store = new InMemoryEvidenceStore();
    const usd = candidate({ unit: 'USD' });
    const put = await store.put(usd);
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    const otherKey = evidenceKey({ kind: 'network-cost', subject: 'Solana', unit: 'USD' });
    await expect(store.activate(otherKey, put.seq)).rejects.toThrow(/identity mismatch/);
  });

  it('should NOT let a lower ingestion seq overwrite a higher one', async () => {
    const store = new InMemoryEvidenceStore();
    const first = await store.put(candidate({ stampAsOf: '2026-09-21T00:00:00.000Z' }));
    const second = await store.put(candidate({ stampAsOf: '2026-09-22T00:00:00.000Z' }));
    const key = candidate({}).evidenceKey;
    await store.activate(key, second.seq);
    const stale = await store.activate(key, first.seq);
    expect(stale).toEqual({ status: 'NOT_NEWER', activeSeq: second.seq });
    expect((await store.readActive(key))?.seq).toBe(second.seq);
  });

  it('should be idempotent when the SAME record is activated twice', async () => {
    const store = new InMemoryEvidenceStore();
    const c = candidate({});
    const put = await store.put(c);
    if (put.status !== 'INSERTED') throw new Error('unreachable');
    await store.activate(c.evidenceKey, put.seq);
    expect(await store.activate(c.evidenceKey, put.seq)).toEqual({
      status: 'NOT_NEWER',
      activeSeq: put.seq,
    });
  });

  it('should keep the previous record after a newer one is activated', async () => {
    const store = new InMemoryEvidenceStore();
    const first = await store.put(candidate({ stampAsOf: '2026-09-21T00:00:00.000Z' }));
    const key = candidate({}).evidenceKey;
    await store.activate(key, first.seq);
    const second = await store.put(candidate({ stampAsOf: '2026-09-22T00:00:00.000Z' }));
    await store.activate(key, second.seq);
    /* The superseded record is still addressable: activation moves a pointer,
       it never deletes history. */
    expect(await store.readActive(key)).toMatchObject({ seq: second.seq });
    expect(first.seq).toBeLessThan(second.seq);
  });

  it('should report no active record before activation', async () => {
    const store = new InMemoryEvidenceStore();
    const c = candidate({});
    await store.put(c);
    expect(await store.readActive(c.evidenceKey)).toBeNull();
  });
});
