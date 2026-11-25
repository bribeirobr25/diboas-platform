/**
 * The waitlist signup-source labels: ONE list, read by the client (which labels it may store)
 * and by the signup route (which `cta_source:` tags it keeps). Server-safe: no browser APIs.
 *
 * A label says which button sent a person to the waitlist form. It is stored on the
 * signup as the tag `cta_source:<label>` (readable by SQL only). The server keeps only labels
 * on this list and drops any other `cta_source:` tag without refusing the signup (market
 * clean-up W-C, plan §10.2: a refused label kept until success would lock a tab out of
 * signing up on every retry).
 */
import { LESSONS } from '@/lib/learn/registry';
import type { LessonId } from '@/lib/learn/types';

/** The tools whose result card sends people to the waitlist. */
export const TOOL_CTA_SLUGS = [
  'asset-history',
  'currency-depreciation',
  'idle-cash',
  'card-fees',
] as const;
export type ToolCtaSlug = (typeof TOOL_CTA_SLUGS)[number];

export type CtaSource = 'market' | `tool-${ToolCtaSlug}` | `learn-${LessonId}`;

export const CTA_SOURCES: ReadonlySet<CtaSource> = new Set<CtaSource>([
  'market',
  ...TOOL_CTA_SLUGS.map((slug) => `tool-${slug}` as const),
  ...(Object.keys(LESSONS) as LessonId[]).map((id) => `learn-${id}` as const),
]);

/** The tag prefix lives with the waitlist's other note prefixes (one home, W-D1). */
export { CTA_SOURCE_TAG_PREFIX } from '@/lib/waitingList/constants';

export function isKnownCtaSource(value: string): value is CtaSource {
  return CTA_SOURCES.has(value as CtaSource);
}
