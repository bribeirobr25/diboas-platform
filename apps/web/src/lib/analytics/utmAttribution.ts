/**
 * The attribution hold (market clean-up W-D1, registers 5.923, 5.924; spec §3.1).
 *
 * One memory hold for the tab: the campaign values the person arrived with (first touch, from the
 * URL, shaped) and the label of the last button that sent them to the waitlist form. **Nothing is
 * written to sessionStorage, localStorage or a cookie for attribution, under any consent**: the
 * hold lives on `globalThis` under `Symbol.for(...)` (one holder even if the bundler duplicates
 * this module), written only in effects and event handlers, never at module evaluation or during
 * render. A reload, a new tab or a full-page jump loses it (F4, by design); client navigation and
 * the language switch keep it.
 *
 * Three readers:
 * - `getNoteForSignup()`: the shaped values and the label, for a signup whose note box is ticked
 *   (the box is the consent; analytics consent does not matter);
 * - `getConsentedUtmParams()`: the shaped values, only with analytics consent (event enrichment);
 * - `getConsentedCtaLabel()`: the label, only with analytics consent (`cta_source` on the
 *   success event).
 * Analytics withdrawal stops the two analytics readers; it does not clear the hold, which
 * belongs to the box.
 */
import { hasAnalyticsConsent } from '@/components/CookieConsent/consentUtils';
import { isKnownCtaSource, type CtaSource } from './ctaSources';
import { readUtmParams, type UtmKey } from './utmShape';

const HOLD = Symbol.for('diboas.attributionHold');

/** The two keys W-D1 stopped writing; removed once on first load (a one-off migration). */
export const LEGACY_ATTRIBUTION_KEYS = ['diboas-utm-params', 'diboas-cta-source'] as const;

interface AttributionHold {
  utm: Partial<Record<UtmKey, string>>;
  ctaLabel: CtaSource | null;
}

type HoldHost = typeof globalThis & { [HOLD]?: AttributionHold };

/** The hold if one exists; readers never create it. */
const peekHold = (): AttributionHold | undefined => (globalThis as HoldHost)[HOLD];

/** The hold, created on the first write (called from effects and handlers only). */
function writableHold(): AttributionHold {
  const host = globalThis as HoldHost;
  host[HOLD] ??= { utm: {}, ctaLabel: null };
  return host[HOLD];
}

/**
 * First touch: keep the shaped campaign values of `url` unless the tab already holds some. A URL
 * with no valid campaign value changes nothing.
 */
export function captureUtmFromUrl(url: string): void {
  const current = peekHold();
  if (current && Object.keys(current.utm).length > 0) return;
  const utm = readUtmParams(url);
  if (Object.keys(utm).length > 0) writableHold().utm = utm;
}

/** Hold the label of the button that sent the person to the form (last touch wins). */
export function setCtaSource(label: CtaSource): void {
  if (isKnownCtaSource(label)) writableHold().ctaLabel = label;
}

/** Forget the label (after a successful signup from a landing form). */
export function clearCtaSource(): void {
  const current = peekHold();
  if (current) current.ctaLabel = null;
}

/** For a signup whose note box is ticked: the held values and label, whatever the analytics choice. */
export function getNoteForSignup(): {
  utm: Partial<Record<UtmKey, string>>;
  ctaLabel: CtaSource | null;
} {
  const current = peekHold();
  return { utm: { ...(current?.utm ?? {}) }, ctaLabel: current?.ctaLabel ?? null };
}

/** The held campaign values for event enrichment, only with analytics consent. */
export function getConsentedUtmParams(): Partial<Record<UtmKey, string>> {
  if (!hasAnalyticsConsent()) return {};
  return { ...(peekHold()?.utm ?? {}) };
}

/** The held label for `cta_source` on the success event, only with analytics consent. */
export function getConsentedCtaLabel(): CtaSource | null {
  if (!hasAnalyticsConsent()) return null;
  return peekHold()?.ctaLabel ?? null;
}

/** The note's tags: `utm_<key>:<value>` for each held value, then `cta_source:<label>` if asked. */
export function noteTags(
  note: { utm: Partial<Record<UtmKey, string>>; ctaLabel: CtaSource | null },
  includeLabel: boolean
): string[] {
  const tags = Object.entries(note.utm).map(([key, value]) => `${key}:${value}`);
  if (includeLabel && note.ctaLabel) tags.push(`cta_source:${note.ctaLabel}`);
  return tags;
}

/** Removes the two keys earlier versions wrote. Storage that throws is ignored. */
export function removeLegacyAttributionStorage(): void {
  for (const key of LEGACY_ATTRIBUTION_KEYS) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // storage unavailable: nothing to remove
    }
  }
}
