/**
 * group-summaries.mjs — pure group-summary selection + composition for the
 * market-refresh generator. Extracted from generate.mjs (B1, 2026-08-11) so
 * the template-selection rules are unit-testable from vitest, mirroring the
 * regime-engine.mjs precedent. No I/O here — callers inject computed state
 * and the template library via `ctx`.
 *
 * Selection ladder for a 'mixed' group:
 *   1. composeMixed(): name the actual split when both sides are non-empty.
 *   2. relative_strength only — 'mixedBackdropOnly' when BOTH BTC-relative
 *      reads (REL-01 gold, REL-02 Nasdaq) are INACTIVE: the group's point is
 *      REL-03 (the Nasdaq's own health), so the generic claim "Bitcoin leads
 *      on part of the board" would be false. First hit 2026-08-10; shipped
 *      that week as an editorial override, made durable here.
 *   3. generic 'mixed' template.
 */

// Shared group max points.
export const MAX_BY_GROUP = {
  btc_structure: 6,
  macro_environment: 3,
  institutional_demand: 2,
  relative_strength: 3,
};

// Signal ids per group (single source — used by the composed 'mixed' group
// summaries; groupLevel/groupSummary key off group_totals).
export const GROUP_SIGNALS = {
  btc_structure: ['BTC-01', 'BTC-02', 'BTC-03', 'BTC-04'],
  macro_environment: ['MAC-01', 'MAC-02', 'MAC-03'],
  institutional_demand: ['ETF-01'],
  relative_strength: ['REL-01', 'REL-02', 'REL-03'],
};

// Localized list conjunction ("A, B and C").
export const LOCALE_AND = { en: 'and', 'pt-BR': 'e', es: 'y', de: 'und' };

// Group status chip ← the SAME band that selects the group summary copy
// (groupLevel below), so the chip and the sentence can never disagree.
export const GROUP_STATUS = { weak: 'WEAK', mixed: 'MIXED', strong: 'CONSTRUCTIVE' };

export function groupLevel(points, max) {
  const r = points / max;
  if (r < 1 / 3) return 'weak';
  if (r <= 2 / 3) return 'mixed';
  return 'strong';
}

/** Localized list join: 1 → "a"; 2 → "a and b"; 3+ → "a, b and c". */
export function joinList(parts, locale) {
  const and = LOCALE_AND[locale] ?? 'and';
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} ${and} ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} ${and} ${parts[parts.length - 1]}`;
}

/** Shared template-slot filler (also used by generate.mjs — single copy). */
export function fill(template, slots) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in slots ? slots[k] : `{${k}}`));
}

/** The signals a group's 'mixed' copy may compose over. Relative strength uses
 *  only its two BTC-vs-benchmark signals (REL-03 is a backdrop, not a lead/lag). */
function composableIds(groupId) {
  return groupId === 'relative_strength' ? ['REL-01', 'REL-02'] : GROUP_SIGNALS[groupId];
}

/** Option B: name the actual split in a mixed group instead of "part/the rest".
 *  Splits the group's composable signals into supportive (ACTIVE) and against
 *  (INACTIVE), maps to plain labels, and fills the group's mixedComposed frame.
 *  Returns null (→ fall through the selection ladder) when the frame or a
 *  needed label is not yet localized, or when either side is empty (then
 *  "split" wouldn't be true anyway). */
export function composeMixed(ctx, groupId, locale, points, max) {
  const frame = ctx.groupTpl[groupId]?.mixedComposed?.[locale];
  if (!frame) return null;
  const ids = composableIds(groupId);
  const labelOf = (id) => ctx.signalLabels[id]?.[locale];
  const supportive = ids.filter((id) => ctx.byId[id]?.state === 'ACTIVE').map(labelOf);
  const against = ids.filter((id) => ctx.byId[id]?.state === 'INACTIVE').map(labelOf);
  if (!supportive.length || !against.length) return null;
  if ([...supportive, ...against].some((x) => !x)) return null;
  let out = fill(frame, {
    supportive: joinList(supportive, locale),
    against: joinList(against, locale),
    points: String(points),
    max: String(max),
  });
  // Spanish contractions: a benchmark label ("el oro", "el Nasdaq") can follow
  // "a"/"de" in the composed frame — "a el" → "al", "de el" → "del".
  if (locale === 'es') out = out.replace(/ a el /g, ' al ').replace(/ de el /g, ' del ');
  return out;
}

/**
 * ctx: { byId, groupTotals, groupTpl, signalLabels }
 *   byId         — computed.json signals keyed by id
 *   groupTotals  — computed.json group_totals
 *   groupTpl     — templates/group-summaries.json
 *   signalLabels — templates/signal-labels.json
 */
export function groupSummary(ctx, groupId, locale) {
  const points = ctx.groupTotals[groupId];
  const max = MAX_BY_GROUP[groupId];
  let level = groupLevel(points, max);
  // Honesty override (2026-07-11 audit): a group scored 0 only because its
  // signal is UNAVAILABLE must not read as observed-weak. The /market page's
  // whole identity is honest unavailability — say "unavailable, not weak".
  if (
    groupId === 'institutional_demand' &&
    ctx.byId['ETF-01']?.state === 'UNAVAILABLE' &&
    ctx.groupTpl[groupId].unavailable
  ) {
    level = 'unavailable';
  }
  if (level === 'mixed') {
    const composed = composeMixed(ctx, groupId, locale, points, max);
    if (composed) return composed;
    // B1 (2026-08-11): relative_strength 'mixed' with BOTH BTC-relative reads
    // INACTIVE — the point is REL-03 alone, so the backdrop-only variant is the
    // only honest copy ("trails both gold and the Nasdaq"). Requiring both
    // INACTIVE (not merely no ACTIVE) keeps the claim false-proof if a REL
    // signal is ever UNAVAILABLE.
    const bothTrail = composableIds(groupId).every((id) => ctx.byId[id]?.state === 'INACTIVE');
    if (
      groupId === 'relative_strength' &&
      bothTrail &&
      ctx.groupTpl[groupId].mixedBackdropOnly?.[locale]
    ) {
      return fill(ctx.groupTpl[groupId].mixedBackdropOnly[locale], {
        points: String(points),
        max: String(max),
      });
    }
  }
  return fill(ctx.groupTpl[groupId][level][locale], {
    points: String(points),
    max: String(max),
  });
}
