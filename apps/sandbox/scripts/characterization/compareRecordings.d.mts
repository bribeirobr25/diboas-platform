/** Types for `compareRecordings.mjs` (plan P12a J5). */
export interface ComparisonResult {
  ok: boolean;
  problems: string[];
  compared: number;
  families: number;
}
export function compareRecordings(
  base: Record<string, Record<string, unknown>>,
  head: Record<string, Record<string, unknown>>,
  frozenIds: Record<string, Record<string, unknown>>
): ComparisonResult;
