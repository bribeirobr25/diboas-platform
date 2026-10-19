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
 */
import type { RegimeCoverage, SignalGroup } from '@/lib/analytics-sdk/types';

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

export type ConditionWordSuffix = 'active' | 'inactive' | 'unavailable';

export function conditionWordSuffix(state: string | undefined): ConditionWordSuffix {
  if (state === 'ACTIVE') return 'active';
  if (state === 'UNAVAILABLE' || state == null) return 'unavailable';
  return 'inactive';
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
  const entry = coverage?.suspended?.[0];
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
