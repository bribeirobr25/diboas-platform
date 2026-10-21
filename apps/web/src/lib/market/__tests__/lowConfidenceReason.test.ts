/**
 * A LOW confidence badge says why (2026-10-21, owner-approved copy).
 *
 * The read-time check records the causes at the same instant and by the same
 * rule as the badge (`low_confidence_causes`); `lowConfidenceReason` turns
 * them into the approved sentences. Synthetic panels only: the committed data
 * is never read here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyReadTimeFreshness } from '@/lib/analytics-sdk/freshness';
import type { DataStatus } from '@/lib/analytics-sdk/types';
import { ETF_FLOW_SOURCE_ID } from '../constants';
import { lowConfidenceReason, type LowConfidenceTemplates } from '../presentationState';

const EN: LowConfidenceTemplates = {
  lead: 'Why confidence is low:',
  etf: 'the Bitcoin ETF flow data has had no complete weekly record since {date}. This indicator is suspended and counts for zero points, so it does not change the score itself.',
  staleOne:
    '{sources} has not been updated within its expected time, so this reading relies on older data than usual.',
  staleOther:
    '{sources} have not been updated within their expected time, so this reading relies on older data than usual.',
  unavailable:
    '{count} data sources are unavailable right now, so this reading covers fewer indicators than usual.',
};
const LABELS: Record<string, string> = {
  'FRED:DGS10': '10-year Treasury yield',
  'FRED:NASDAQCOM': 'Nasdaq Composite',
  'Yahoo:GC=F': 'Gold price',
};
const label = (id: string) => LABELS[id] ?? id;

type Source = DataStatus['sources'][number];
const src = (source: string, over: Partial<Source> = {}): Source => ({
  source,
  status: 'FRESH',
  last_updated_at: '2026-10-16T00:00:00Z',
  expected_next_update_at: null,
  stale_after: '2026-12-01T00:00:00Z',
  delayed_after: null,
  message: null,
  ...over,
});
/** A panel shaped like the 19/10 cycle: the suspended ETF row expires at 30/10 00:00. */
const panel = (extra: Source[] = []): DataStatus =>
  ({
    overall_confidence: 'MODERATE',
    last_successful_update_at: null,
    delayed_sources: [],
    unavailable_sources: [],
    sources: [
      src('FRED:DGS10', { status: 'DELAYED' }),
      src(ETF_FLOW_SOURCE_ID, {
        status: 'UNAVAILABLE',
        last_updated_at: '2026-10-09T00:00:00Z',
        stale_after: '2026-10-30T00:00:00Z',
      }),
      ...extra,
    ],
  }) as unknown as DataStatus;

const ETF_LIMIT = Date.parse('2026-10-30T00:00:00Z');
const at = (ms: number) => applyReadTimeFreshness(panel(), new Date(ms));

describe('the read-time check records why confidence is LOW, at the same instant', () => {
  it('should record nothing before or AT the ETF limit, and the causes 1 ms after it', () => {
    expect(at(ETF_LIMIT - 1)).toMatchObject({ overall_confidence: 'MODERATE' });
    expect(at(ETF_LIMIT - 1).low_confidence_causes).toBeUndefined();
    expect(at(ETF_LIMIT).low_confidence_causes).toBeUndefined(); // strict: not past at the instant
    expect(at(ETF_LIMIT + 1)).toMatchObject({
      overall_confidence: 'LOW',
      low_confidence_causes: {
        past_stale: [ETF_FLOW_SOURCE_ID],
        unavailable: [ETF_FLOW_SOURCE_ID],
      },
    });
  });
});

describe('lowConfidenceReason — the approved sentences', () => {
  const low = (past_stale: string[], unavailable: string[] = [], extra: Source[] = []) =>
    ({
      ...panel(extra),
      overall_confidence: 'LOW',
      low_confidence_causes: { past_stale, unavailable },
    }) as DataStatus;

  it('should explain the 30/10 case: the suspended ETF data, dated by its latest complete record', () => {
    expect(lowConfidenceReason(low([ETF_FLOW_SOURCE_ID]), label, 'en', EN)).toEqual({
      lead: 'Why confidence is low:',
      sentences: [
        'the Bitcoin ETF flow data has had no complete weekly record since October 9, 2026. This indicator is suspended and counts for zero points, so it does not change the score itself.',
      ],
    });
  });

  it('should name one other stale source in the singular and several as a list', () => {
    expect(lowConfidenceReason(low(['FRED:DGS10']), label, 'en', EN)?.sentences).toEqual([
      '10-year Treasury yield has not been updated within its expected time, so this reading relies on older data than usual.',
    ]);
    expect(
      lowConfidenceReason(low(['FRED:DGS10', 'FRED:NASDAQCOM', 'Yahoo:GC=F']), label, 'en', EN)
        ?.sentences
    ).toEqual([
      '10-year Treasury yield, Nasdaq Composite, and Gold price have not been updated within their expected time, so this reading relies on older data than usual.',
    ]);
  });

  it('should state the unavailable count only when two or more sources are unavailable', () => {
    expect(lowConfidenceReason(low([], ['A', 'B']), label, 'en', EN)?.sentences).toEqual([
      '2 data sources are unavailable right now, so this reading covers fewer indicators than usual.',
    ]);
    expect(lowConfidenceReason(low([], ['A']), label, 'en', EN)).toBeNull();
  });

  it('should keep the order ETF, other sources, unavailable when several causes apply', () => {
    const r = lowConfidenceReason(
      low([ETF_FLOW_SOURCE_ID, 'FRED:DGS10'], ['A', ETF_FLOW_SOURCE_ID]),
      label,
      'en',
      EN
    );
    expect(r?.sentences.map((s) => s.slice(0, 22))).toEqual([
      'the Bitcoin ETF flow d',
      '10-year Treasury yield',
      '2 data sources are una',
    ]);
  });

  it('should say nothing when confidence is not LOW, or LOW without recorded causes', () => {
    expect(lowConfidenceReason(panel(), label, 'en', EN)).toBeNull();
    expect(
      lowConfidenceReason({ ...panel(), overall_confidence: 'LOW' } as DataStatus, label, 'en', EN)
    ).toBeNull();
    expect(lowConfidenceReason(null, label, 'en', EN)).toBeNull();
  });

  it('should format the date in the reader’s language, in UTC', () => {
    const de: LowConfidenceTemplates = {
      ...EN,
      lead: 'Warum die Konfidenz niedrig ist:',
      etf: 'Für die Bitcoin-ETF-Zuflüsse gibt es seit dem {date} keinen vollständigen Wochenwert.',
    };
    expect(lowConfidenceReason(low([ETF_FLOW_SOURCE_ID]), label, 'de', de)?.sentences[0]).toBe(
      'Für die Bitcoin-ETF-Zuflüsse gibt es seit dem 9. Oktober 2026 keinen vollständigen Wochenwert.'
    );
  });
});

describe('the scored view renders the reason under the confidence badge', () => {
  it('should place the reason right after the badge pills, only when there is one', () => {
    const shell = fs.readFileSync(
      path.join(__dirname, '../../../app/[locale]/(landing)/market/MarketViewShell.tsx'),
      'utf8'
    );
    const badge = shell.indexOf('<ConfidenceBadge');
    const reason = shell.indexOf('data-market-low-reason');
    expect(badge).toBeGreaterThan(-1);
    expect(reason).toBeGreaterThan(badge);
    expect(shell).toMatch(/\{lowReason \? \(/);
  });

  it('should have the four keys in all four languages', () => {
    for (const locale of ['en', 'pt-BR', 'es', 'de']) {
      const json = JSON.parse(
        fs.readFileSync(
          path.join(
            __dirname,
            `../../../../../../packages/i18n/translations/${locale}/market.json`
          ),
          'utf8'
        )
      );
      expect(Object.keys(json.dashboard.lowReason).sort()).toEqual(
        ['etf', 'lead', 'staleOne', 'staleOther', 'unavailable'].sort()
      );
    }
  });
});
