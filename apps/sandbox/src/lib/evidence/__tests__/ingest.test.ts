import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_STAMP, networkCostEvidence, type GasQuote } from '@diboas/defi';
import { __resetEvidencePersistence } from '../factory';
import { ingestNetworkCost, networkCostKey } from '../ingest';

/**
 * ⛑ RETENTION (Legal 2026-09-22). Activation and reads now take the
 * current-facing moment so the store can apply the 90-day window. These
 * fixtures carry `FIXTURE_STAMP` (retrieved 2026-07-18), so the moment below
 * sits inside the window and every assertion keeps testing what it tested
 * before. Expiry has its own tests, with their own expired clock.
 */
const WITHIN_RETENTION = '2026-07-20T00:00:00.000Z';

const ORIGINAL = { ...process.env };

const fixtureQuote = (chain: 'Arbitrum' | 'Solana' = 'Arbitrum', fee = 0.03): GasQuote => ({
  chain,
  typicalFeeUsd: fee,
  stamp: FIXTURE_STAMP,
});

/**
 * The F-A runtime producer, end to end against the in-memory store the contract
 * suite already proves — wired through the real factory by stubbing the module
 * that selects the adapter, so the producer's own logic is what is exercised.
 */
const store = vi.hoisted(() => {
  const { InMemoryEvidenceStore } = require('@diboas/defi') as {
    InMemoryEvidenceStore: new () => import('@diboas/defi').EvidenceStore;
  };
  return { current: new InMemoryEvidenceStore(), enabled: true };
});

vi.mock('../factory', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../factory')>();
  return {
    ...actual,
    getEvidencePersistence: () =>
      store.enabled
        ? { enabled: true as const, store: store.current }
        : { enabled: false as const, reason: 'NOT_CONFIGURED' as const },
  };
});

describe('F-A runtime producer', () => {
  beforeEach(async () => {
    const { InMemoryEvidenceStore } = await import('@diboas/defi');
    store.current = new InMemoryEvidenceStore();
    store.enabled = true;
    __resetEvidencePersistence();
  });
  afterEach(() => {
    process.env = { ...ORIGINAL };
    __resetEvidencePersistence();
  });

  it('should persist fixture network cost under kind:subject:unit and activate it', async () => {
    const outcome = await ingestNetworkCost(fixtureQuote(), WITHIN_RETENTION);
    expect(outcome).toMatchObject({
      status: 'INGESTED',
      evidenceKey: 'network-cost:Arbitrum:USD',
      activated: true,
    });
    const active = await store.current.readActive('network-cost:Arbitrum:USD', WITHIN_RETENTION);
    expect(active?.payload).toMatchObject({ value: '0.03', unit: 'USD' });
  });

  it('should keep MODELLED through the whole path — never OBSERVED', async () => {
    await ingestNetworkCost(fixtureQuote(), WITHIN_RETENTION);
    const active = await store.current.readActive('network-cost:Arbitrum:USD', WITHIN_RETENTION);
    expect(active?.payload).toMatchObject({ stamp: { origin: 'MODELLED', source: 'fixture' } });
    expect(JSON.stringify(active?.payload)).not.toContain('OBSERVED');
  });

  it('should collapse a retry of the same fixture observation into one record', async () => {
    const first = await ingestNetworkCost(fixtureQuote(), WITHIN_RETENTION);
    const second = await ingestNetworkCost(fixtureQuote(), WITHIN_RETENTION);
    expect(first.status).toBe('INGESTED');
    expect(second.status).toBe('DUPLICATE');
  });

  it('should keep the two chains in SEPARATE evidence identities', async () => {
    await ingestNetworkCost(fixtureQuote('Arbitrum', 0.03), WITHIN_RETENTION);
    await ingestNetworkCost(fixtureQuote('Solana', 0.001), WITHIN_RETENTION);
    expect(
      (await store.current.readActive('network-cost:Arbitrum:USD', WITHIN_RETENTION))?.payload
    ).toMatchObject({
      value: '0.03',
    });
    expect(
      (await store.current.readActive('network-cost:Solana:USD', WITHIN_RETENTION))?.payload
    ).toMatchObject({
      value: '0.001',
    });
  });

  it('should WRITE NOTHING when durable persistence is disabled, and say so', async () => {
    store.enabled = false;
    const outcome = await ingestNetworkCost(fixtureQuote(), WITHIN_RETENTION);
    expect(outcome).toEqual({ status: 'PERSISTENCE_DISABLED', reason: 'NOT_CONFIGURED' });
    /* And nothing reached any store: the one we hold is untouched. */
    expect(
      await store.current.readActive('network-cost:Arbitrum:USD', WITHIN_RETENTION)
    ).toBeNull();
  });

  it('should REFUSE ineligible evidence without persisting or activating it', async () => {
    const live: GasQuote = {
      chain: 'Arbitrum',
      typicalFeeUsd: 0.03,
      stamp: { ...FIXTURE_STAMP, source: 'defillama', origin: 'OBSERVED' },
    };
    const outcome = await ingestNetworkCost(live, WITHIN_RETENTION);
    expect(outcome).toEqual({ status: 'INELIGIBLE', reason: 'EXTERNAL_SOURCE' });
    expect(
      await store.current.readActive('network-cost:Arbitrum:USD', WITHIN_RETENTION)
    ).toBeNull();
  });

  it('should build an UNCONVERTED envelope through the ADAPTER layer (Stage G)', () => {
    const envelope = networkCostEvidence(fixtureQuote());
    if (envelope.availability !== 'AVAILABLE') throw new Error('unreachable');
    expect(envelope.normalization).toEqual({ converted: false });
    expect(envelope.actionability).toBe('REFERENCE');
    expect(networkCostKey('Arbitrum')).toBe('network-cost:Arbitrum:USD');
  });
});

/**
 * ⛑ THE RETENTION ANCHOR AT THE INGEST SEAM (verified 2026-09-22).
 *
 * The store anchors retention on the record's own `retrievedAt`, but the CALLER
 * chooses what that is — and passing `stamp.asOf` would silently restore the
 * exact defect the verification found. A sabotage proved this seam unguarded:
 * back-dating custody to the fixture's documentation date failed nothing.
 *
 * A fixture's `stamp.asOf` is `FIXTURE_AS_OF` (2026-07-18), a compile-time
 * constant. Custody begins when we ingest, not when the file was written.
 */
describe('ingestion anchors retention on CUSTODY, never on the fixture date', () => {
  const INGESTED_AT = '2026-09-22T00:00:00.000Z';
  /* 40 days after ingestion — but 106 days after FIXTURE_AS_OF. Under the old
     stamp anchor this record would already be purged; under custody it is not
     even half-way through its window. */
  const LATER = '2026-11-01T00:00:00.000Z';

  it('should keep a fixture record readable well past FIXTURE_AS_OF + 90 days', async () => {
    const outcome = await ingestNetworkCost(fixtureQuote(), INGESTED_AT);
    expect(outcome.status).toBe('INGESTED');
    const active = await store.current.readActive(networkCostKey('Arbitrum'), LATER);
    expect(
      active,
      'anchoring on stamp.asOf would have expired this record on 2026-10-16'
    ).not.toBeNull();
  });

  it('should expire it 90 days after INGESTION, not 90 days after the fixture date', async () => {
    await ingestNetworkCost(fixtureQuote(), INGESTED_AT);
    /* 89 days after custody began: retained. */
    expect(
      await store.current.readActive(networkCostKey('Arbitrum'), '2026-12-20T00:00:00.000Z')
    ).not.toBeNull();
    /* 90 days after custody began: gone. */
    expect(
      await store.current.readActive(networkCostKey('Arbitrum'), '2026-12-21T00:00:00.000Z')
    ).toBeNull();
  });

  it('should never let the fixture stamp reach the retention clock', async () => {
    /* Asserted on the stored record, not on behaviour alone: the anchor must
       differ from the stamp whenever the two genuinely differ. */
    await ingestNetworkCost(fixtureQuote(), INGESTED_AT);
    const active = await store.current.readActive(networkCostKey('Arbitrum'), INGESTED_AT);
    expect(active?.payload).toMatchObject({ stamp: { asOf: FIXTURE_STAMP.asOf } });
    expect(FIXTURE_STAMP.asOf).not.toBe(INGESTED_AT);
  });
});
