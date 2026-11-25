/**
 * Campaign values with a known shape (market clean-up W-D1, register 5.924; spec §3.1, §3.10,
 * §3.11). One home for the five campaign keys, the shape every kept value must have, and the raw
 * query reader every reader of campaign values shares.
 *
 * **Import-free on purpose:** `readRawQueryValues` is also compiled into GA4's inline bootstrap
 * (`SCRUB_URL_INLINE_JS_SHAPED`, built from this function's own source text), so it may use
 * nothing outside its own body; the browser module, the scrubbers and the server read the same
 * function.
 *
 * **The raw rule** (the rule PostHog masks by, so every value the site reads is one PostHog masks
 * or drops): take the part before `#`, after the first `?`; split on `&`, then each part on `?`; a
 * piece's name is everything before its first `=`, compared raw and never decoded; a piece with no
 * `=` has no value; the value is everything after the first `=`, `+` read as a space, then
 * decoded (an undecodable value is no value); the first occurrence of a name wins, even when its
 * value is later refused by the shape.
 */

/** The five campaign keys, exported once and imported wherever they are named. */
export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

/** The shape of a kept value: 13 + 37 = 50 characters, the tag limit (`utm_campaign:` + value). */
export const UTM_VALUE_SOURCE = '^[a-z0-9][a-z0-9._-]{0,36}$';
const UTM_VALUE = new RegExp(UTM_VALUE_SOURCE);

/**
 * The first raw value of each listed name in `url`'s query, by the raw rule above. Self-contained
 * (its source text is compiled into the inline GA4 bootstrap): no reference outside its body.
 */
export function readRawQueryValues(url: string, names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const seen: Record<string, boolean> = {};
  if (typeof url !== 'string') return out;
  const hash = url.indexOf('#');
  const head = hash >= 0 ? url.slice(0, hash) : url;
  const start = head.indexOf('?');
  if (start < 0) return out;
  const parts = head.slice(start + 1).split('&');
  for (let i = 0; i < parts.length; i++) {
    const pieces = parts[i].split('?');
    for (let j = 0; j < pieces.length; j++) {
      const piece = pieces[j];
      const eq = piece.indexOf('=');
      const name = eq >= 0 ? piece.slice(0, eq) : piece;
      if (names.indexOf(name) < 0 || seen[name] === true) continue;
      seen[name] = true;
      if (eq < 0) continue;
      try {
        out[name] = decodeURIComponent(piece.slice(eq + 1).replace(/\+/g, ' '));
      } catch (e) {
        // an undecodable value is no value (and the name stays taken: the first occurrence wins)
      }
    }
  }
  return out;
}

/**
 * Every piece of `url`'s query by the raw rule, in order, with its value left **undecoded**
 * (`null` when the piece has no `=`). For checks that must see exactly what was stored, such as
 * PostHog's literal `<masked>` (`posthogLegacySessionCleanup.ts`). `readRawQueryValues` keeps its
 * own copy of the split, because its source must stay self-contained for the inline bootstrap.
 */
export function rawQueryPieces(url: string): Array<[name: string, value: string | null]> {
  if (typeof url !== 'string') return [];
  const hash = url.indexOf('#');
  const head = hash >= 0 ? url.slice(0, hash) : url;
  const start = head.indexOf('?');
  if (start < 0) return [];
  const out: Array<[string, string | null]> = [];
  for (const part of head.slice(start + 1).split('&')) {
    for (const piece of part.split('?')) {
      const eq = piece.indexOf('=');
      out.push(eq >= 0 ? [piece.slice(0, eq), piece.slice(eq + 1)] : [piece, null]);
    }
  }
  return out;
}

/** True when `value` already has the shape, as received (the server's check: never rewrites). */
export function isShapedUtmValue(value: unknown): value is string {
  return typeof value === 'string' && UTM_VALUE.test(value);
}

/** The value trimmed and lower-cased if it then has the shape; `null` otherwise. */
export function shapeUtmValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const shaped = value.trim().toLowerCase();
  return UTM_VALUE.test(shaped) ? shaped : null;
}

/** The shaped campaign values of `url`, by the raw rule; keys whose first value fails are absent. */
export function readUtmParams(url: string): Partial<Record<UtmKey, string>> {
  const raw = readRawQueryValues(url, UTM_KEYS);
  const out: Partial<Record<UtmKey, string>> = {};
  for (const key of UTM_KEYS) {
    const shaped = shapeUtmValue(raw[key]);
    if (shaped !== null) out[key] = shaped;
  }
  return out;
}

/** True when `name` is a campaign key or ends in one (`$initial_utm_source`, `utm_source`). */
export function isCampaignPropertyName(name: string): boolean {
  for (const key of UTM_KEYS) if (name === key || name.endsWith(`_${key}`)) return true;
  return false;
}
