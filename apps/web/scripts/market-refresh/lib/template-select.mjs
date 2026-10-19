/**
 * template-select.mjs — pick the sentence template for a signal record.
 *
 * One STATE can have more than one reason. ETF-01 is UNAVAILABLE while the
 * ledger warms up, when a weekly snapshot is missing (`gapped`, 5.301) and
 * while the 2026-10-18 suspension is active (`suspended`). A record names its
 * reason in `values.variant`, and that variant selects its own wording.
 *
 * FAIL-CLOSED ON A MISSING VARIANT (2026-10-18). This used to fall back to the
 * state's default sentence when a variant had no template for a locale. For
 * ETF-01 the default UNAVAILABLE sentence is the WARM-UP wording ("{snapshots}
 * of {warmupTarget} recorded"), so one missing translation would have published
 * "13 of 5 snapshots recorded" for a suspended signal, in one language only,
 * with every gate green. A declared variant that cannot be rendered is now an
 * error that stops the generator, exactly like an empty slot does.
 *
 * @param {Record<string, any>} set — signal-sentences.json[id][state]
 * @param {string|undefined} variant — the record's `values.variant`
 * @param {string} locale
 * @param {string} context — for the error message
 * @returns {string}
 */
export function selectSignalTemplate(set, variant, locale, context) {
  if (variant) {
    const byLocale = set?.variants?.[variant];
    if (!byLocale) {
      throw new Error(`${context}: variant '${variant}' has no templates`);
    }
    if (!byLocale[locale]) {
      throw new Error(
        `${context}: variant '${variant}' has no ${locale} template — refusing to fall back ` +
          `to the state's default sentence`
      );
    }
    return byLocale[locale];
  }
  if (!set?.[locale]) throw new Error(`${context}: no ${locale} template`);
  return set[locale];
}
