/**
 * Freshness of hand-refreshed reference data (2026-10-21): one rule, blocking
 * only where the data is the subject, plus a scheduled run that alerts the
 * owner. No assertion here depends on today's date.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SUBJECTS,
  ageInDays,
  enforcedSubjects,
  freshnessVerdict,
} from '../../../scripts/data-freshness/check.mjs';

const REPO = path.resolve(__dirname, '../../../../..');
const readWorkflow = (name: string) =>
  fs.readFileSync(path.join(REPO, '.github/workflows', name), 'utf8');

describe('freshnessVerdict', () => {
  it('should pass below the limit and be stale AT the limit', () => {
    expect(freshnessVerdict(91.99, 92, true)).toBe('ok');
    expect(freshnessVerdict(92, 92, true)).toBe('fail');
    expect(freshnessVerdict(92, 92, false)).toBe('warn');
  });

  it('should treat an unparseable stamp as stale, never as fresh', () => {
    expect(freshnessVerdict(ageInDays('not a date'), 92, true)).toBe('fail');
    expect(freshnessVerdict(ageInDays(''), 365, false)).toBe('warn');
  });

  it('should measure age from the stamp', () => {
    expect(ageInDays('2026-10-21T00:00:00Z', new Date('2026-11-11T00:00:00Z'))).toBe(21);
  });
});

describe('enforcedSubjects — block only where the data is the subject', () => {
  it('should enforce TVL for a change to the TVL data, copy, script or page', () => {
    for (const file of [
      'apps/web/src/lib/market-data/data/protocolsTvl.json',
      'packages/i18n/translations/de/protocols.json',
      'apps/web/scripts/protocols-tvl/sources.mjs',
      'apps/web/src/components/Pages/Protocols/protocolsData.ts',
    ]) {
      expect([...enforcedSubjects('changed', [file])]).toEqual(['protocols-tvl']);
    }
  });

  it('should enforce the historical anchors only for a change to historical.ts', () => {
    expect([
      ...enforcedSubjects('changed', ['apps/web/src/lib/market-data/historical.ts']),
    ]).toEqual(['historical-anchors']);
  });

  it('should only warn for an unrelated change (another lane, /market, a sibling file)', () => {
    for (const file of [
      'apps/sandbox/src/app/page.tsx',
      'apps/web/data/market/shared/regime.json',
      'packages/i18n/translations/de/protocols-extra.json',
      'apps/web/src/lib/market-data/historical.test.ts',
    ]) {
      expect(enforcedSubjects('changed', [file]).size).toBe(0);
    }
  });

  it('should enforce everything when the changed files cannot be listed, or on the scheduled run', () => {
    const all = SUBJECTS.map((s) => s.id).sort();
    expect([...enforcedSubjects('changed', null)].sort()).toEqual(all);
    expect([...enforcedSubjects('all', [])].sort()).toEqual(all);
    expect(enforcedSubjects('none', null).size).toBe(0);
  });

  it('should read a parseable stamp for every subject from the committed files', () => {
    for (const s of SUBJECTS) expect(Number.isFinite(ageInDays(s.readStamp()))).toBe(true);
  });
});

describe('where the rule runs', () => {
  it('should run in CI scoped to the commit’s changed files', () => {
    expect(readWorkflow('ci.yml')).toMatch(
      /node apps\/web\/scripts\/data-freshness\/check\.mjs --changed-from-git/
    );
  });

  it('should run on a schedule that enforces every subject, so a stale figure alerts the owner', () => {
    const wf = readWorkflow('data-freshness.yml');
    expect(wf).toMatch(/schedule:\s*\n\s*- cron:/);
    expect(wf).toMatch(/node apps\/web\/scripts\/data-freshness\/check\.mjs --enforce-all/);
    expect(wf).not.toMatch(/continue-on-error/);
  });
});
