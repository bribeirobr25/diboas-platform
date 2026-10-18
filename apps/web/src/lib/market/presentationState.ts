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
 *   - `regimeLabelMap`: the five translated band labels.
 */
import type { RegimeCode, RegimeCoverage } from '@/lib/analytics-sdk/types';

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
