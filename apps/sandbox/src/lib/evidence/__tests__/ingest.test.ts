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
