import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_STAMP, networkCostEvidence, type GasQuote } from '@diboas/defi';
import { __resetEvidencePersistence } from '../factory';
import { ingestNetworkCost, ingestNetworkCosts, networkCostKey } from '../ingest';
import { expectedLogs } from '@/test/expectedLogs';

// Failure paths below LOG by design (R-14); asserted, not silenced (2026-10-19 cleanup).
const logs = expectedLogs({
  strict: true,
  error: ['evidence contradiction', 'evidence ingestion failed'],
  requiredIn:
    /when the same observation arrives with a different payload|when the store throws|when the clock is an invalid Date/,
});

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

/**
 * Every test starts clean, whatever ran before it (A-11, 2026-11-10). The blocks share
 * the hoisted `store`, and a test may swap in a store whose `put` throws or turn
 * persistence off — so the reset lives at the top level, not in one block: under
 * `--sequence.shuffle` a block without its own reset inherited the last test's store.
 */
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

describe('F-A runtime producer', () => {
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

/**
 * The producer's non-ingested outcomes (register 5.70). The module contract: "every
 * non-ingested outcome is a RESULT, not an exception … only an unexpected failure is logged
 * as an error". So a contradiction is REPORTED and never resolved — history is not
 * overwritten — and a failure returns `FAILED` with nothing activated.
 */
describe('F-A runtime producer · contradiction and failure are results', () => {
  let memory: InstanceType<typeof import('@diboas/defi').InMemoryEvidenceStore>;

  beforeEach(async () => {
    const { InMemoryEvidenceStore } = await import('@diboas/defi');
    memory = new InMemoryEvidenceStore();
    store.current = memory;
  });

  it('should report a CONTRADICTION and keep the stored value when the same observation arrives with a different payload', async () => {
    const first = await ingestNetworkCost(fixtureQuote('Arbitrum', 0.03), WITHIN_RETENTION);
    if (first.status !== 'INGESTED') throw new Error(`unexpected ${first.status}`);
    // Same chain, same fixture stamp → same observation identity; a different value.
    const second = await ingestNetworkCost(fixtureQuote('Arbitrum', 0.05), WITHIN_RETENTION);
    expect(second).toEqual({
      status: 'CONTRADICTION',
      evidenceKey: 'network-cost:Arbitrum:USD',
      seq: first.seq,
    });
    const active = await memory.readActive(networkCostKey('Arbitrum'), WITHIN_RETENTION);
    expect(active?.payload).toMatchObject({ value: '0.03' });
    expect(logs.calls('error')).toHaveLength(1);
  });

  it('should return FAILED and activate nothing when the store throws', async () => {
    const down = new Error('connection refused');
    store.current = {
      put: async () => {
        throw down;
      },
      activate: memory.activate.bind(memory),
      readActive: memory.readActive.bind(memory),
      purgeExpired: memory.purgeExpired.bind(memory),
    };
    expect(await ingestNetworkCost(fixtureQuote(), WITHIN_RETENTION)).toEqual({
      status: 'FAILED',
      error: down,
    });
    expect(memory.activePointerCount()).toBe(0);
  });

  it('should return FAILED and write nothing when the clock is an invalid Date', async () => {
    const outcome = await ingestNetworkCost(fixtureQuote(), new Date('not a date'));
    expect(outcome.status).toBe('FAILED');
    expect(memory.activePointerCount()).toBe(0);
    // Nothing was put: the same observation is still NEW afterwards, not a DUPLICATE.
    expect((await ingestNetworkCost(fixtureQuote(), WITHIN_RETENTION)).status).toBe('INGESTED');
  });

  it('should anchor custody on a Date clock exactly as on its ISO string', async () => {
    const outcome = await ingestNetworkCost(fixtureQuote(), new Date('2026-09-22T00:00:00.000Z'));
    expect(outcome).toMatchObject({ status: 'INGESTED', activated: true });
    // 89 days after custody began: retained. 90 days: gone.
    expect(
      await memory.readActive(networkCostKey('Arbitrum'), '2026-12-20T00:00:00.000Z')
    ).not.toBeNull();
    expect(
      await memory.readActive(networkCostKey('Arbitrum'), '2026-12-21T00:00:00.000Z')
    ).toBeNull();
  });

  it('should activate nothing when the custody clock cannot be read (retention fails closed)', async () => {
    const outcome = await ingestNetworkCost(fixtureQuote(), 'not a timestamp');
    /* Only what holds in BOTH stores is asserted: nothing becomes active. The outcome
       STATUS is store-dependent — the in-memory store keeps the record un-activated
       (INGESTED, activated:false) while Postgres refuses the unparseable timestamp at the
       insert (FAILED) — so pinning either one would pin a value the other contradicts. */
    expect(outcome.status === 'INGESTED' && outcome.activated).toBe(false);
    expect(memory.activePointerCount()).toBe(0);
    expect(await memory.readActive(networkCostKey('Arbitrum'), WITHIN_RETENTION)).toBeNull();
  });
});

describe('ingestNetworkCosts · one outcome per quote, in order', () => {
  it('should ingest every chain and return the outcomes in the order of the quotes', async () => {
    const outcomes = await ingestNetworkCosts(
      [fixtureQuote('Solana', 0.001), fixtureQuote('Arbitrum', 0.03)],
      WITHIN_RETENTION
    );
    expect(outcomes).toMatchObject([
      { status: 'INGESTED', evidenceKey: 'network-cost:Solana:USD', activated: true },
      { status: 'INGESTED', evidenceKey: 'network-cost:Arbitrum:USD', activated: true },
    ]);
  });

  it('should return a disabled outcome per quote when persistence is off', async () => {
    store.enabled = false;
    const disabled = { status: 'PERSISTENCE_DISABLED', reason: 'NOT_CONFIGURED' };
    expect(
      await ingestNetworkCosts([fixtureQuote('Solana'), fixtureQuote('Arbitrum')], WITHIN_RETENTION)
    ).toEqual([disabled, disabled]);
    expect(await ingestNetworkCosts([], WITHIN_RETENTION)).toEqual([]);
  });
});
