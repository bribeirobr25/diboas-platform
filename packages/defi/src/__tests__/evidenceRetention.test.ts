import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_BACKUP_MAX_ADDITIONAL_DAYS,
  EVIDENCE_RETENTION_DAYS,
  evidenceExpiresAt,
  isEvidenceExpired,
  isRecordExpired,
  mayPersistReducedStatistic,
} from '../evidenceRetention';
import { buildEvidenceCandidate } from '../evidenceStore';
import { referenceEvidence, unavailableEvidence, type CostCoverage } from '../evidence';
import { InMemoryEvidenceStore } from '../testing';
import { toPayloadV1 } from '../evidencePayload';
import { evidenceKey } from '../evidenceIdentity';
import { evidenceStamp } from '../types';
import { createHash } from 'node:crypto';

/**
 * The Legal/Data retention ruling of 2026-09-22, made executable.
 *
 * 90 elapsed days from the ORIGINAL retrievedAt, with a clock that nothing can
 * restart. The tests that matter most here are the ones proving what CANNOT
 * happen — a copy, a reactivation or a restore extending someone's data life.
 */

const RETRIEVED = '2026-01-01T00:00:00.000Z';
const DAY = 24 * 60 * 60 * 1000;
const at = (ms: number) => new Date(Date.parse(RETRIEVED) + ms).toISOString();
const sha256 = (i: string) => createHash('sha256').update(i, 'utf8').digest('hex');
const NETWORK: CostCoverage = { kind: 'single', category: 'network' };

function candidate(retrievedAt = RETRIEVED, value = 0.03, recordId = '1', stampAsOf?: string) {
  const envelope = referenceEvidence({
    value,
    /* The stamp's asOf is DELIBERATELY independent of the retention anchor —
       that separation is the whole point of the 2026-09-22 verification. */
    stamp: evidenceStamp({
      source: 'fixture',
      origin: 'MODELLED',
      asOf: stampAsOf ?? retrievedAt,
    }),
    normalization: { converted: false },
    coverage: NETWORK,
  });
  if (envelope.availability !== 'AVAILABLE') throw new Error('unreachable');
  return buildEvidenceCandidate({
    evidenceKey: evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit: 'USD' }),
    envelope,
    unit: 'USD',
    recordId: `00000000-0000-4000-8000-00000000000${recordId}`,
    hash: sha256,
    retrievedAt,
  });
}

describe('the 90-day window, at its exact boundary', () => {
  it('should state the ruled constants', () => {
    expect(EVIDENCE_RETENTION_DAYS).toBe(90);
    expect(EVIDENCE_BACKUP_MAX_ADDITIONAL_DAYS).toBe(30);
  });

  it('should RETAIN at 89d 23h 59m', () => {
    expect(isEvidenceExpired(RETRIEVED, at(89 * DAY + 23 * 3_600_000 + 59 * 60_000))).toBe(false);
  });

  it('should EXPIRE exactly AT the 90-day boundary', () => {
    /* Inclusive at expiry. A boundary stated one way in code and the other in a
       test is how 90 days quietly becomes 91. */
    expect(isEvidenceExpired(RETRIEVED, at(90 * DAY))).toBe(true);
  });

  it('should derive the same expiry instant every time it is asked', () => {
    expect(evidenceExpiresAt(RETRIEVED)).toBe(at(90 * DAY));
    expect(evidenceExpiresAt(RETRIEVED)).toBe(evidenceExpiresAt(RETRIEVED));
  });

  it('should treat an unparseable clock or stamp as EXPIRED, never as retained', () => {
    /* Fail-closed: retention protects people, so a broken timestamp must not
       extend how long their data is held. */
    expect(isEvidenceExpired('not-a-date', at(0))).toBe(true);
    expect(isEvidenceExpired(RETRIEVED, 'not-a-date')).toBe(true);
  });

  it('should anchor on the RECORD retrievedAt, never on the payload stamp', () => {
    /**
     * ⛑ THE 2026-09-22 VERIFICATION, pinned.
     *
     * A fixture's `stamp.asOf` is `FIXTURE_AS_OF` — a hardcoded documentation
     * date identical to `observedAt`, not a moment anything was fetched. The
     * fixture class is also the ONLY class eligible for persistence today, so
     * anchoring retention on the stamp was wrong for 100% of persistable
     * evidence: a record ingested 66 days after the fixture date received 24
     * days of life instead of 90, and would soon have been BORN EXPIRED.
     *
     * Here the stamp is deliberately 200 days older than the record. The record
     * must still be retained, because custody began at `retrievedAt`.
     */
    const ancient = new Date(Date.parse(RETRIEVED) - 200 * DAY).toISOString();
    const record = { retrievedAt: RETRIEVED };
    expect(isRecordExpired(record, at(89 * DAY))).toBe(false);
    expect(isRecordExpired(record, at(90 * DAY))).toBe(true);
    /* And the stamp it carries has no effect on that answer at all. */
    expect(isEvidenceExpired(ancient, at(0))).toBe(true);
    expect(isEvidenceExpired(RETRIEVED, at(0))).toBe(false);
  });

  it('should retain a FIXTURE-class record whose stamp predates the window', async () => {
    /* End-to-end through the store, with the real shape: an old documentation
       stamp and a fresh custody moment. */
    const store = new InMemoryEvidenceStore();
    const stale = new Date(Date.parse(RETRIEVED) - 200 * DAY).toISOString();
    const put = await store.put(candidate(RETRIEVED, 0.03, '1', stale));
    if (put.status !== 'INSERTED') throw new Error('setup');
    expect((await store.activate('network-cost:Arbitrum:USD', put.seq, at(1 * DAY))).status).toBe(
      'ACTIVATED'
    );
    expect(await store.readActive('network-cost:Arbitrum:USD', at(89 * DAY))).not.toBeNull();
    expect(await store.readActive('network-cost:Arbitrum:USD', at(90 * DAY))).toBeNull();
  });
});

describe('the clock cannot be restarted', () => {
  it('should not restart when the same record is re-activated', async () => {
    const store = new InMemoryEvidenceStore();
    const put = await store.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('expected INSERTED');
    expect((await store.activate('network-cost:Arbitrum:USD', put.seq, at(0))).status).toBe(
      'ACTIVATED'
    );
    /* Re-activating the SAME record at a later moment must not buy it more life. */
    const late = await store.activate('network-cost:Arbitrum:USD', put.seq, at(90 * DAY));
    expect(late.status).toBe('EXPIRED');
    expect(await store.readActive('network-cost:Arbitrum:USD', at(90 * DAY))).toBeNull();
  });

  it('should collapse a re-retrieval of the SAME observation, so no new clock starts', async () => {
    /**
     * The strongest guarantee, and it is structural rather than enforced: the
     * ingestion key hashes the OBSERVATION identity, so re-retrieving an
     * identical observation is a DUPLICATE, not a new record. There is no
     * second row with a later retrievedAt to extend the observation's life.
     */
    const store = new InMemoryEvidenceStore();
    const first = await store.put(candidate());
    const again = await store.put(candidate());
    expect(first.status).toBe('INSERTED');
    expect(again.status).toBe('DUPLICATE');
    if (again.status !== 'DUPLICATE') throw new Error('unreachable');
    expect(again.seq).toBe(first.status === 'INSERTED' ? first.seq : -1);
  });

  it('should keep each record on its OWN clock when a newer observation supersedes it', async () => {
    const store = new InMemoryEvidenceStore();
    const old = await store.put(candidate(RETRIEVED, 0.03, '1'));
    const fresh = await store.put(candidate(at(60 * DAY), 0.05, '2'));
    if (old.status !== 'INSERTED' || fresh.status !== 'INSERTED') throw new Error('setup');
    /* Supersession does NOT extend the older record: at day 90 it is expired
       even though a newer record for the same identity exists. */
    expect((await store.activate('network-cost:Arbitrum:USD', old.seq, at(90 * DAY))).status).toBe(
      'EXPIRED'
    );
    /* And the newer one lives on its own retrieval, not the older one's. */
    expect(
      (await store.activate('network-cost:Arbitrum:USD', fresh.seq, at(100 * DAY))).status
    ).toBe('ACTIVATED');
  });
});

describe('operational exclusion, purge and pointer safety', () => {
  async function seeded() {
    const store = new InMemoryEvidenceStore();
    const put = await store.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('setup');
    await store.activate('network-cost:Arbitrum:USD', put.seq, at(0));
    return { store, seq: put.seq };
  }

  it('should exclude expired evidence from reads BEFORE any purge has run', async () => {
    /* Expiry and purge are up to 24h apart; nothing may be served in that gap. */
    const { store } = await seeded();
    expect(await store.readActive('network-cost:Arbitrum:USD', at(89 * DAY))).not.toBeNull();
    expect(await store.readActive('network-cost:Arbitrum:USD', at(90 * DAY))).toBeNull();
  });

  it('should never activate expired evidence', async () => {
    const { store, seq } = await seeded();
    expect((await store.activate('network-cost:Arbitrum:USD', seq, at(91 * DAY))).status).toBe(
      'EXPIRED'
    );
  });

  it('should purge the record AND its pointer, leaving no dangling reference', async () => {
    const { store } = await seeded();
    const result = await store.purgeExpired({ now: at(90 * DAY) });
    expect(result).toEqual({ purgedRecords: 1, purgedPointers: 1, heldRecords: 0 });
    expect(await store.readActive('network-cost:Arbitrum:USD', at(90 * DAY))).toBeNull();
  });

  it('should NOT silently activate an older record when the active one is purged', async () => {
    /**
     * The failure this exists to prevent: purging the active record and having
     * an older one take its place. An older record was retrieved EARLIER, so it
     * is necessarily also expired — promoting it would resurrect exactly what
     * Legal ordered deleted.
     */
    const store = new InMemoryEvidenceStore();
    const older = await store.put(candidate(RETRIEVED, 0.03, '1'));
    const newer = await store.put(candidate(at(1 * DAY), 0.05, '2'));
    if (older.status !== 'INSERTED' || newer.status !== 'INSERTED') throw new Error('setup');
    await store.activate('network-cost:Arbitrum:USD', newer.seq, at(2 * DAY));
    await store.purgeExpired({ now: at(91 * DAY) });
    /**
     * ⚑ Asserted on POINTER STATE, not through readActive. A first version of
     * this test checked the read and passed even when purge DID activate an
     * older record — because the expiry gate masked the dangling pointer. It
     * proved the read gate, not the purge. Postgres refuses a dangling pointer
     * via the composite FK; here the count is the instrument.
     */
    expect(store.activePointerCount()).toBe(0);
    expect(await store.readActive('network-cost:Arbitrum:USD', at(91 * DAY))).toBeNull();
  });

  it('should leave NO pointer behind for any purged identity', async () => {
    const { store } = await seeded();
    await store.purgeExpired({ now: at(90 * DAY) });
    expect(store.activePointerCount()).toBe(0);
  });

  it('should leave unexpired evidence completely alone', async () => {
    const { store } = await seeded();
    const result = await store.purgeExpired({ now: at(10 * DAY) });
    expect(result.purgedRecords).toBe(0);
    expect(await store.readActive('network-cost:Arbitrum:USD', at(10 * DAY))).not.toBeNull();
  });
});

describe('restore protection', () => {
  it('should refuse a restored backup copy the moment it is read or activated', async () => {
    /**
     * Legal §8: restoration must not revive expired evidence. This is free
     * because the clock travels INSIDE the payload — a restored row carries its
     * original retrievedAt, so it evaluates as expired on arrival. There is no
     * separate expiry state that could come back stale or missing.
     *
     * Modelled as a restore: the record is put into a FRESH store (as a
     * restore would), then read at a post-expiry moment.
     */
    const restored = new InMemoryEvidenceStore();
    const put = await restored.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('setup');
    expect(
      (await restored.activate('network-cost:Arbitrum:USD', put.seq, at(120 * DAY))).status
    ).toBe('EXPIRED');
    expect(await restored.readActive('network-cost:Arbitrum:USD', at(120 * DAY))).toBeNull();
  });
});

describe('legal hold — the minimum seam, not a case-management system', () => {
  it('should skip expired evidence a documented hold names, and report it', async () => {
    const store = new InMemoryEvidenceStore();
    const put = await store.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('setup');
    await store.activate('network-cost:Arbitrum:USD', put.seq, at(0));
    const held = await store.purgeExpired({
      now: at(90 * DAY),
      hold: new Set(['network-cost:Arbitrum:USD']),
    });
    expect(held).toEqual({ purgedRecords: 0, purgedPointers: 0, heldRecords: 1 });
  });

  it('should keep held evidence OUT of Product use even while retained', async () => {
    /* A hold preserves the record for a matter; it does not return it to
       service. Segregation is what the read gate already provides. */
    const store = new InMemoryEvidenceStore();
    const put = await store.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('setup');
    await store.activate('network-cost:Arbitrum:USD', put.seq, at(0));
    await store.purgeExpired({ now: at(90 * DAY), hold: new Set(['network-cost:Arbitrum:USD']) });
    expect(await store.readActive('network-cost:Arbitrum:USD', at(90 * DAY))).toBeNull();
  });

  it('should purge on the next run once the hold is released', async () => {
    const store = new InMemoryEvidenceStore();
    const put = await store.put(candidate());
    if (put.status !== 'INSERTED') throw new Error('setup');
    await store.purgeExpired({ now: at(90 * DAY), hold: new Set(['network-cost:Arbitrum:USD']) });
    const released = await store.purgeExpired({ now: at(95 * DAY) });
    expect(released.purgedRecords).toBe(1);
  });
});

describe('reduced source statistic — capability, never a mandate', () => {
  it('should permit persistence ONLY when audit need AND source rights both hold', () => {
    expect(
      mayPersistReducedStatistic({
        neededForAuditOfThisClass: true,
        sourceRightsPermitRetention: true,
      })
    ).toBe(true);
    for (const policy of [
      { neededForAuditOfThisClass: true, sourceRightsPermitRetention: false },
      { neededForAuditOfThisClass: false, sourceRightsPermitRetention: true },
      { neededForAuditOfThisClass: false, sourceRightsPermitRetention: false },
    ]) {
      expect(mayPersistReducedStatistic(policy)).toBe(false);
    }
  });

  it('should persist NO reduced statistic today, because no class qualifies', () => {
    /* Asserted on the payload shape, not on a comment: there is no field for
       one, so nothing can quietly start retaining it. */
    const payload = toPayloadV1(
      referenceEvidence({
        value: 0.03,
        stamp: evidenceStamp({ source: 'fixture', origin: 'MODELLED', asOf: RETRIEVED }),
        normalization: { converted: false },
        coverage: NETWORK,
      }),
      'USD'
    );
    const serialized = JSON.stringify(payload);
    for (const forbidden of ['sample', 'median', 'p25', 'p75', 'statistic']) {
      expect(serialized.toLowerCase()).not.toContain(forbidden);
    }
  });
});

describe('provider-agnostic lifecycle', () => {
  it('should name no provider, chain or payload vendor shape', () => {
    const src = require('node:fs')
      .readFileSync(new URL('../evidenceRetention.ts', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const forbidden of ['chainstack', 'arbitrum', 'solana', 'defillama', 'coingecko', 'rpc']) {
      expect(
        src.toLowerCase(),
        `${forbidden} would couple the lifecycle to a source`
      ).not.toContain(forbidden);
    }
  });

  it('should behave identically regardless of which source stamped the evidence', async () => {
    for (const source of ['fixture', 'defillama', 'coingecko'] as const) {
      const store = new InMemoryEvidenceStore();
      const envelope = referenceEvidence({
        value: 0.03,
        stamp: evidenceStamp({ source, origin: 'MODELLED', asOf: RETRIEVED }),
        normalization: { converted: false },
        coverage: NETWORK,
      });
      if (envelope.availability !== 'AVAILABLE') throw new Error('unreachable');
      const put = await store.put(
        buildEvidenceCandidate({
          evidenceKey: evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit: 'USD' }),
          envelope,
          unit: 'USD',
          recordId: '00000000-0000-4000-8000-000000000009',
          hash: sha256,
          retrievedAt: RETRIEVED,
        })
      );
      if (put.status !== 'INSERTED') throw new Error('setup');
      expect(
        (await store.activate('network-cost:Arbitrum:USD', put.seq, at(90 * DAY))).status
      ).toBe('EXPIRED');
    }
  });
});
