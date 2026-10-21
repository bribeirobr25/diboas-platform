/**
 * Small pure helpers shared by the /market views (2026-10-18, the ETF-01
 * suspension package). Kept out of the components so the rules are unit-tested
 * and written once:
 *
 *   - `conditionWordSuffix`: which word a macro condition gets. UNAVAILABLE has
 *     its own word and never borrows the restrictive one ("firm",
 *     "contracting"), which is how missing data used to read as an adverse
 *     market condition on both the Backdrop and the umbrella card.
 *   - `coverageNotes`: the reduced-coverage sentences beside the score and the
 *     chart, filled from `regime.coverage`, which the generator writes. Nothing
 *     here infers a suspension; no coverage entry means no note.
 *   - `isSignalGroupUnavailable` (2026-10-19): whether a signal group shows as
 *     unavailable rather than as a scored band.
 *   - `regimeLabelMap`: the five translated band labels.
 *   - `lowConfidenceReason` (2026-10-21): why a LOW badge is LOW, in words,
 *     from the causes the read-time check recorded at the same instant.
 */
import type {
  DataStatus,
  RegimeCode,
  RegimeCoverage,
  SignalGroup,
} from '@/lib/analytics-sdk/types';
import { ETF_FLOW_SOURCE_ID } from './constants';

/** The views' message lookup: a key under `market.` plus its English fallback. */
export type MarketTranslate = (key: string, fallback: string) => string;

/**
 * The five band labels, translated. One definition for the umbrella, the
 * scored view and the chart's table (2026-10-18 compliance pass: the two views
 * each carried a copy, and the chart table showed the raw code instead).
 */
export function regimeLabelMap(t: MarketTranslate): Record<RegimeCode, string> {
  return {
    VERY_FAVORABLE: t('dashboard.regimeLabels.VERY_FAVORABLE', 'Very Favorable'),
    CONSTRUCTIVE: t('dashboard.regimeLabels.CONSTRUCTIVE', 'Constructive'),
    NEUTRAL_MIXED: t('dashboard.regimeLabels.NEUTRAL_MIXED', 'Neutral / Mixed'),
    DEFENSIVE: t('dashboard.regimeLabels.DEFENSIVE', 'Defensive'),
    HOSTILE: t('dashboard.regimeLabels.HOSTILE', 'Hostile'),
  };
}

/**
 * The chart table's dates, formatted ONCE on the server and handed to the
 * client chart as text, keyed by ISO day (`YYYY-MM-DD`). Formatting inside the
 * client component ran `Intl` twice, on the server and again in the browser,
 * and the two can disagree for a locale when their ICU/CLDR data differ: this
 * removes that one cause of a server/browser text mismatch. Covers every
 * snapshot, so whichever range the chart shows has its labels. UTC, so a run
 * day never shifts to the day before.
 */
export function historicalDateLabels(
  snapshots: ReadonlyArray<{ date: string }>,
  locale: string
): Record<string, string> {
  const format = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  return Object.fromEntries(
    snapshots.map((s) => {
      const day = s.date.slice(0, 10);
      return [day, format.format(new Date(`${day}T00:00:00Z`))];
    })
  );
}

/**
 * A group shows as unavailable when nothing in it was evaluated. The generator
 * writes `status: 'UNAVAILABLE'` for that case; the signal check also covers a
 * payload generated before that status existed (the 2026-10-19 refresh was
 * computed with `WEAK`), so such data can never render as a weak read.
 */
export function isSignalGroupUnavailable(group: Pick<SignalGroup, 'status' | 'signals'>): boolean {
  if (group.status === 'UNAVAILABLE') return true;
  const signals = group.signals ?? [];
  return signals.length > 0 && signals.every((s) => s.state === 'UNAVAILABLE');
}

/**
 * The Backdrop's three conditions in display order: the signal id and the
 * message-key stem. One definition for the Backdrop view, the umbrella card and
 * the umbrella model (5.631: each carried its own copy).
 */
export const BACKDROP_CONDITIONS = [
  { id: 'MAC-01', key: 'dollar' },
  { id: 'MAC-02', key: 'rates' },
  { id: 'MAC-03', key: 'liquidity' },
] as const;

export type ConditionWordSuffix = 'active' | 'inactive' | 'unavailable';

/**
 * Only an ASSESSED condition gets a market word: ACTIVE the supportive one,
 * INACTIVE the restrictive one. Anything else (UNAVAILABLE, and the contract's
 * STALE and ERROR, which the engine does not emit today but the SDK type
 * allows) could not be assessed and reads unavailable. The 2026-10-18 compliance
 * pass closed the STALE/ERROR route, which fell through to the restrictive word.
 */
export function conditionWordSuffix(state: string | undefined): ConditionWordSuffix {
  if (state === 'ACTIVE') return 'active';
  if (state === 'INACTIVE') return 'inactive';
  return 'unavailable';
}

export interface CoverageNoteTemplates {
  score: string;
  chart: string;
}

/**
 * @param coverage  regime.coverage (absent on cycles that predate the field)
 * @param maxScore  regime.max_score
 * @param locale    BCP-47 locale for the date
 * @param templates the two translated sentences, with {points} {max} {date}
 * @returns both sentences filled, or nulls when nothing is suspended
 */
export function coverageNotes(
  coverage: RegimeCoverage | undefined,
  maxScore: number,
  locale: string,
  templates: CoverageNoteTemplates
): { score: string | null; chart: string | null } {
  // The two sentences name the ETF flow indicator, so they are only ever
  // filled from ETF-01's entry; another signal's suspension must not borrow
  // them (2026-10-18 compliance pass: this read `suspended[0]`).
  const entry = coverage?.suspended?.find((e) => e.signal_id === 'ETF-01');
  if (!entry) return { score: null, chart: null };
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${entry.since}T00:00:00Z`)
  );
  return {
    score: templates.score
      .replace('{points}', String(entry.points))
      .replace('{max}', String(maxScore)),
    chart: templates.chart.replace('{date}', date),
  };
}

/** The approved LOW-reason sentences (owner-approved 2026-10-21), already translated. */
export interface LowConfidenceTemplates {
  /** "Why confidence is low:" */
  lead: string;
  /** The suspended ETF data past its limit; `{date}` = its latest complete weekly record. */
  etf: string;
  /** One other source past its limit; `{sources}` = its name. */
  staleOne: string;
  /** Several other sources past their limit; `{sources}` = their names as a list. */
  staleOther: string;
  /** Two or more sources unavailable; `{count}` = how many. */
  unavailable: string;
}

/**
 * Why confidence is LOW, as the lead and one sentence per cause (ETF, other
 * stale sources, unavailable sources, in that order), or null when confidence
 * is not LOW. Built only from `low_confidence_causes`, which the read-time
 * check writes at the same instant and by the same rule as the badge, so the
 * badge and its reason cannot disagree. A date comes from the source's own
 * `last_updated_at` (the latest complete record), never from a collection
 * attempt.
 */
export function lowConfidenceReason(
  status: DataStatus | null | undefined,
  sourceLabel: (sourceId: string) => string,
  locale: string,
  templates: LowConfidenceTemplates
): { lead: string; sentences: string[] } | null {
  const causes = status?.overall_confidence === 'LOW' ? status.low_confidence_causes : undefined;
  if (!causes) return null;
  const sentences: string[] = [];
  if (causes.past_stale.includes(ETF_FLOW_SOURCE_ID)) {
    const updated = status?.sources.find((s) => s.source === ETF_FLOW_SOURCE_ID)?.last_updated_at;
    if (updated) {
      const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
        new Date(updated)
      );
      sentences.push(templates.etf.replace('{date}', date));
    }
  }
  const others = causes.past_stale.filter((id) => id !== ETF_FLOW_SOURCE_ID).map(sourceLabel);
  if (others.length) {
    const list = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(others);
    sentences.push(
      (others.length === 1 ? templates.staleOne : templates.staleOther).replace('{sources}', list)
    );
  }
  if (causes.unavailable.length >= 2) {
    sentences.push(templates.unavailable.replace('{count}', String(causes.unavailable.length)));
  }
  return sentences.length ? { lead: templates.lead, sentences } : null;
}
