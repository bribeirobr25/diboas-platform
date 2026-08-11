/**
 * editorial-overrides.mjs — cycle-scoping guard for editorial-override.json
 * (B2, 2026-08-11). An override replaces a generated string for ONE cycle: the
 * reviewer stamps `_cycle` with the cycle date (computed_at's YYYY-MM-DD). On
 * any later cycle the stamp no longer matches, so the whole file is IGNORED
 * with a loud warning instead of silently pinning last week's judgment onto
 * new data (the stale-override trap: applyOverride is otherwise unconditional,
 * and hand-deleting the file was the only expiry before this guard).
 */

/**
 * Returns the overrides to apply this cycle, or {} when the file is absent,
 * empty, or stale. `raw` is the parsed editorial-override.json (or null),
 * `computedAt` is computed.json's computed_at ISO timestamp.
 */
export function activeOverrides(raw, computedAt, warn = console.warn) {
  if (!raw) return {};
  const keys = Object.keys(raw).filter((k) => !k.startsWith('_'));
  if (!keys.length) return {};
  const cycle = computedAt.slice(0, 10);
  if (raw._cycle !== cycle) {
    warn(
      `⚠ editorial-override.json IGNORED: _cycle ${
        raw._cycle ? `"${raw._cycle}"` : 'is missing'
      } but this cycle is ${cycle}. Overrides are cycle-scoped — after reviewing ` +
        `this cycle's output, restamp _cycle or delete the file. ${keys.length} override key(s) skipped.`
    );
    return {};
  }
  return raw;
}
