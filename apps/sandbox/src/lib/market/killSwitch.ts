/**
 * THE OPERATIONAL KILL SWITCH — turning an external source off by configuration.
 *
 * ⚑ WHY THIS IS NOT A `CAPABILITIES` ROW. `CAPABILITIES` is a registry of
 * BOOLEAN FEATURE flags, each with one env variable and one production policy.
 * Source disablement is neither boolean nor per-feature: it is a SET, over a
 * registry that already exists (`EVIDENCE_SOURCES`), and its authority lives in
 * `SOURCE_DISPOSITIONS` rather than here. Forcing it into the capability table
 * would have needed one flag per source, i.e. a second registry shadowing the
 * first — which is exactly the duplication the canon's shared-infrastructure
 * rule exists to prevent. The `CAPABILITIES` DISCIPLINE is kept: an explicit
 * opt-in, parsed strictly, with the production policy stated in the code.
 *
 * ⚑ IT CAN ONLY SUBTRACT. This names sources to DISABLE. There is deliberately
 * no variable that can enable one, because configuration must never be able to
 * re-open what Legal closed in `SOURCE_DISPOSITIONS`. `permitsUse` consults
 * this set first and refuses; it never consults it to grant. The kill switch is
 * therefore monotone-restrictive by construction rather than by review, and
 * that property is sabotage-proven.
 *
 * ```text
 * MARKET_SOURCES_DISABLED = defillama,coingecko
 * ```
 *
 * PRODUCTION POLICY: allowed in every deployment. Turning a source OFF is
 * always a safe direction — it can only move Product toward the existing
 * controlled-unavailable state, never toward asserting something it should not.
 * That asymmetry is why this needs no clearance to use, while nothing here can
 * grant one.
 */

/**
 * Sources the deployment has switched off.
 *
 * ⚑ WHEN A CHANGE TAKES EFFECT (corrected, lane audit 2026-10-20). This function
 * itself reads the variable on every call, but its only callers are the provider
 * factory's memoised getters, which build each provider ONCE per server instance and
 * capture the set at that moment. So a changed value applies to a NEW instance — on
 * Vercel, where an environment change reaches only new deployments anyway, that means
 * the next deployment. The earlier text promised "without a deploy"; an operator waiting
 * for that in an incident would have waited for nothing. Redeploy to apply it.
 *
 * Unknown ids are kept rather than rejected: they simply never match a real
 * source. Dropping them silently would be fine too, but keeping them means a
 * typo disables nothing instead of throwing at request time, and the factory
 * test asserts a typo is inert.
 */
export function disabledSources(): ReadonlySet<string> {
  const raw = process.env.MARKET_SOURCES_DISABLED;
  if (!raw) return EMPTY;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return ids.length > 0 ? new Set(ids) : EMPTY;
}

const EMPTY: ReadonlySet<string> = new Set();
