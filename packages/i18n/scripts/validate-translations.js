#!/usr/bin/env node

/**
 * Translation Validation Script
 *
 * Validates that all locale directories have the same JSON files,
 * matching key structures, AND matching ICU slot-name sets as the
 * reference locale (en).
 *
 * Slot-name parity (Phase 7 Followup carry-forward #6 / audit L24):
 *   catches the silent-fallback bug where a locale renames a slot
 *   (e.g. `{rate}` → `{taxa}`) — react-intl would leave the literal
 *   `{taxa}` text in the rendered UI without any runtime warning.
 *
 * Usage:
 *   node packages/i18n/scripts/validate-translations.js
 *
 * Exit codes:
 *   0 - All locales match
 *   1 - Mismatches found (missing/orphaned files, missing/orphaned keys,
 *       or ICU slot-name set divergence per key)
 *
 * Arrays (register 5.733): an array's items are keys like any other — `.0`, `.1` … — the
 * same flattening the site reads (`apps/web/src/lib/learn/i18nArrays.ts`). So an array
 * string gets slot parity, and an item-count difference is a missing or orphaned index
 * key. The pure functions are exported for tests; `main()` runs only when executed.
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations');
const REFERENCE_LOCALE = 'en';

/**
 * Keys that are intentionally locale-specific and should not be
 * flagged as orphaned when they exist only in a non-reference locale.
 * Format: { locale: { file: [keyPrefix, ...] } }
 */
const LOCALE_SPECIFIC_KEYS = {
  'pt-BR': {
    'landing-b2b.json': ['calculator.fields.currencyLoss', 'footer.bcbDisclaimer'],
    'landing-b2c.json': ['demo.pain.pixHeader', 'footer.brDisclaimer', 'ptbr'],
    'legal/cookies.json': ['sections.brazilNote'],
    // `sections.yourRights.table.rows.7` — Brazil's LGPD adds an eighth right (Revisão de
    // Decisões Automatizadas), the last row of the rights table. Owned by Legal: the
    // exclusion names that one index, so any other row-count change still fails (5.733).
    'legal/privacy.json': ['sections.brazilNote', 'sections.yourRights.table.rows.7'],
    'legal/terms.json': ['sections.brazilNote'],
    'strategies.json': ['footer.bcbDisclaimer'],
    'waitlist.json': ['legal.bcbDisclaimer'],
  },
  // EU IFR 2015/751 interchange-cap disclosure is an EU-only obligation
  // (Card Fees tool). Surfaced for the two EU locales only; en/pt-BR carry
  // no IFR disclosure. Crosswalk §3.5/§5.2 (REGULATORY_CROSSWALK.md).
  es: {
    'tools-card-fees.json': ['disclaimers.euIfrCap'],
    'landing-b2c.json': ['draper'],
  },
  de: {
    'tools-card-fees.json': ['disclaimers.euIfrCap'],
    'landing-b2c.json': ['draper'],
  },
};

/**
 * Reference-locale (en) keys that intentionally exist ONLY in the reference
 * locale and must NOT be required in target locales — the symmetric counterpart
 * to LOCALE_SPECIFIC_KEYS (which suppresses target-only orphans). Used for the
 * en-only Draper landing copy (LandingEn): target locales carry their own
 * different copy (pt-BR uses `ptbr`; es/de use their own `draper` values), so
 * en's `draper.*` keys must not be flagged as "missing" in pt-BR/es/de.
 *
 * Format: { file: [keyPrefix, ...] }  (applies to every target locale)
 */
const REFERENCE_ONLY_KEYS = {
  'landing-b2c.json': ['draper'],
};

/**
 * Translation keys with intentional ICU slot-name divergence per locale.
 * Phase 7 Followup left these as documented carry-forwards; the validator
 * should not flag them. Remove entries here when the underlying carry-forward
 * is closed.
 *
 * Format: { file: { keyPath: [locale, ...] } }
 *   "locale" = the locale that diverges from the reference (en).
 */
const LOCALE_SPECIFIC_SLOTS = {
  // Phase 7 Followup carry-forward #3 (EN idleCash.source editorial deferral).
  // EN literal cites `3.5%` Bankrate (no slot); pt-BR/es/de use `{rate}` from
  // bankRates.{locale}.savings. Awaiting product/marketing decision to either
  // (a) add `bankRates.en.businessHighYield: 3.5` field, or
  // (b) align EN literal with FDIC `0.32%`.
  'landing-b2b.json': {
    'b2bGoals.cards.idleCash.source': ['pt-BR', 'es', 'de'],
  },
  // Phase 7 Followup CC8 — CLOSED 2026-05-20 via Phase 8 Item B.
  // The `catch.feeParagraph` key now carries the fee citation uniformly across
  // all 4 locales (with locale-specific narrative position injected by
  // ProseSection). The old positional fee paragraphs (catch.paragraphs.p5 in
  // en/es/de, catch.paragraphs.p4 in pt-BR) were reverted to literal text and
  // are no longer the rendered fee citation.
};

/**
 * Recursively discover all JSON files under a directory,
 * returning paths relative to that directory.
 */
function discoverJsonFiles(dir, base) {
  base = base || dir;
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...discoverJsonFiles(fullPath, base));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(path.relative(base, fullPath));
    }
  }
  return results.sort();
}

/** A non-empty object or array: its entries are keys (array items by index, `.0`, `.1` …). */
function isBranch(value) {
  return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
}

/**
 * Extract all key paths from a nested object (dot-separated). Arrays descend by index,
 * so an item-count mismatch shows as missing or orphaned `.N` keys (5.733). An empty
 * object or array is one key.
 */
function extractKeys(obj, prefix) {
  prefix = prefix || '';
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (isBranch(obj[key])) {
      keys.push(...extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

/**
 * Build a flat Map<keyPath, string-value> for all leaf string values, descending into
 * arrays by index (5.733: array strings get slot parity too). Non-string leaves
 * (booleans, numbers) are skipped — slot-name parity is only meaningful for templates.
 */
function extractStringLeaves(obj, prefix, out) {
  prefix = prefix || '';
  out = out || new Map();
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    const value = obj[key];
    if (isBranch(value)) {
      extractStringLeaves(value, fullKey, out);
    } else if (typeof value === 'string') {
      out.set(fullKey, value);
    }
  }
  return out;
}

/** True when `key` is `prefix` itself or sits under it. */
function underPrefix(key, prefixes) {
  for (let i = 0; i < prefixes.length; i++) {
    if (key === prefixes[i] || key.indexOf(prefixes[i] + '.') === 0) return true;
  }
  return false;
}

/**
 * Compare one catalogue file of a target locale with the reference (pure: no I/O).
 * Returns the reference keys the locale misses, the locale keys the reference lacks
 * (both after the documented exclusions), and every ICU slot-name mismatch.
 */
function compareFile(file, locale, refContent, localeContent) {
  const refKeys = extractKeys(refContent);
  const localeKeys = extractKeys(localeContent);
  const refKeySet = new Set(refKeys);
  const localeKeySet = new Set(localeKeys);
  const refOnly = REFERENCE_ONLY_KEYS[file] || [];
  const localeOnly = (LOCALE_SPECIFIC_KEYS[locale] && LOCALE_SPECIFIC_KEYS[locale][file]) || [];

  const missing = refKeys.filter(function (k) {
    return !localeKeySet.has(k) && !underPrefix(k, refOnly);
  });
  const orphaned = localeKeys.filter(function (k) {
    return !refKeySet.has(k) && !underPrefix(k, localeOnly);
  });

  // Slot-name parity (audit L24): for every key present in BOTH ref and locale, the ICU
  // slot-name set must be identical. Mismatch = silent-fallback bug at render time.
  const refLeaves = extractStringLeaves(refContent);
  const localeLeaves = extractStringLeaves(localeContent);
  const slotMismatches = [];
  const slotExclusions = LOCALE_SPECIFIC_SLOTS[file] || {};
  for (const [keyPath, refValue] of refLeaves) {
    const localeValue = localeLeaves.get(keyPath);
    if (typeof localeValue !== 'string') continue; // key absent / not a string in locale
    // Skip keys that intentionally diverge per locale (documented carry-forwards).
    const exclusionLocales = slotExclusions[keyPath];
    if (Array.isArray(exclusionLocales) && exclusionLocales.indexOf(locale) !== -1) continue;
    const refSlots = extractSlots(refValue);
    const localeSlots = extractSlots(localeValue);
    // Only check keys that have slots in at least one side.
    if (refSlots.size === 0 && localeSlots.size === 0) continue;
    const diff = diffSlots(refSlots, localeSlots);
    if (diff !== null) {
      slotMismatches.push({ key: keyPath, missing: diff.missing, extra: diff.extra });
    }
  }
  return { missing: missing, orphaned: orphaned, slotMismatches: slotMismatches };
}

/**
 * Extract top-level ICU slot names from a template string.
 *
 * Only matches slot names at brace-depth 1 — i.e. the first identifier after
 * an outer-level `{`. Sub-clause text inside ICU `select`/`plural` branches
 * (e.g., `{mode, select, lumpSum {Monthly contribution}}`) is correctly
 * skipped — those branch contents legitimately differ per locale.
 *
 * Examples:
 *   `{rate}`                                              → {rate}
 *   `{rate} (min {min}, max {max})`                       → {rate, min, max}
 *   `{mode, select, lumpSum {Lump-sum} other {Monthly}}`  → {mode}
 *   `{count, plural, one {# item} other {# items}}`       → {count}
 *
 * Returns a Set of slot names. Order-independent comparison.
 */
function extractSlots(template) {
  const slots = new Set();
  if (typeof template !== 'string') return slots;
  let depth = 0;
  for (let i = 0; i < template.length; i++) {
    const ch = template[i];
    if (ch === '{') {
      depth++;
      // Only extract slot name when we just opened a top-level expression.
      if (depth === 1) {
        const m = template.slice(i + 1).match(/^(\w+)(?=[},\s])/);
        if (m) slots.add(m[1]);
      }
    } else if (ch === '}') {
      depth--;
      if (depth < 0) depth = 0; // tolerate unbalanced templates
    }
  }
  return slots;
}

/**
 * Compare two slot sets and return mismatch detail (or null if identical).
 * Audit L24 (Phase 7 Followup): catches the silent-fallback failure mode where
 * a locale renames a slot (e.g. `{rate}` → `{taxa}`) and react-intl silently
 * leaves the literal `{taxa}` text in the rendered UI.
 */
function diffSlots(refSlots, localeSlots) {
  const missing = [];
  const extra = [];
  for (const s of refSlots) if (!localeSlots.has(s)) missing.push(s);
  for (const s of localeSlots) if (!refSlots.has(s)) extra.push(s);
  if (missing.length === 0 && extra.length === 0) return null;
  return { missing: missing.sort(), extra: extra.sort() };
}

function main() {
  console.log('Validating translations...\n');

  const refDir = path.join(TRANSLATIONS_DIR, REFERENCE_LOCALE);
  if (!fs.existsSync(refDir)) {
    console.error('ERROR: Reference locale directory not found: ' + refDir);
    process.exit(1);
  }

  // Discover all locales
  const allLocales = fs
    .readdirSync(TRANSLATIONS_DIR, { withFileTypes: true })
    .filter(function (e) {
      return e.isDirectory();
    })
    .map(function (e) {
      return e.name;
    })
    .sort();

  const targetLocales = allLocales.filter(function (l) {
    return l !== REFERENCE_LOCALE;
  });

  console.log('Reference locale: ' + REFERENCE_LOCALE);
  console.log('Target locales:   ' + targetLocales.join(', '));

  // Discover reference files
  const refFiles = discoverJsonFiles(refDir);
  console.log('Reference files:  ' + refFiles.length + '\n');

  let totalErrors = 0;

  for (const locale of targetLocales) {
    const localeDir = path.join(TRANSLATIONS_DIR, locale);
    const localeFiles = discoverJsonFiles(localeDir);

    const missingFiles = [];
    const orphanedFiles = [];
    const missingKeys = {};
    const orphanedKeys = {};
    const slotMismatches = {}; // file -> [{ key, missing, extra }]

    // Check for missing files in this locale
    for (const file of refFiles) {
      if (localeFiles.indexOf(file) === -1) {
        missingFiles.push(file);
      }
    }

    // Check for orphaned files (exist in locale but not in reference)
    for (const file of localeFiles) {
      if (refFiles.indexOf(file) === -1) {
        orphanedFiles.push(file);
      }
    }

    // Compare key structures for shared files
    const sharedFiles = refFiles.filter(function (f) {
      return localeFiles.indexOf(f) !== -1;
    });
    for (const file of sharedFiles) {
      var refContent, localeContent;
      try {
        refContent = JSON.parse(fs.readFileSync(path.join(refDir, file), 'utf8'));
      } catch (e) {
        console.error(
          '  ERROR: Failed to parse ' + REFERENCE_LOCALE + '/' + file + ': ' + e.message
        );
        totalErrors++;
        continue;
      }
      try {
        localeContent = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf8'));
      } catch (e) {
        console.error('  ERROR: Failed to parse ' + locale + '/' + file + ': ' + e.message);
        totalErrors++;
        continue;
      }

      const result = compareFile(file, locale, refContent, localeContent);
      if (result.missing.length > 0) missingKeys[file] = result.missing;
      if (result.orphaned.length > 0) orphanedKeys[file] = result.orphaned;
      if (result.slotMismatches.length > 0) slotMismatches[file] = result.slotMismatches;
    }

    // Report for this locale
    const localeErrors =
      missingFiles.length +
      orphanedFiles.length +
      Object.keys(missingKeys).reduce(function (sum, f) {
        return sum + missingKeys[f].length;
      }, 0) +
      Object.keys(orphanedKeys).reduce(function (sum, f) {
        return sum + orphanedKeys[f].length;
      }, 0) +
      Object.keys(slotMismatches).reduce(function (sum, f) {
        return sum + slotMismatches[f].length;
      }, 0);

    if (localeErrors === 0) {
      console.log('[' + locale + '] OK (' + sharedFiles.length + ' files, all keys match)');
    } else {
      console.log('[' + locale + '] ' + localeErrors + ' issue(s):');

      if (missingFiles.length > 0) {
        console.log('  Missing files (' + missingFiles.length + '):');
        missingFiles.forEach(function (f) {
          console.log('    - ' + f);
        });
      }

      if (orphanedFiles.length > 0) {
        console.log('  Orphaned files (' + orphanedFiles.length + '):');
        orphanedFiles.forEach(function (f) {
          console.log('    - ' + f);
        });
      }

      for (var file in missingKeys) {
        console.log('  Missing keys in ' + file + ' (' + missingKeys[file].length + '):');
        missingKeys[file].forEach(function (k) {
          console.log('    - ' + k);
        });
      }

      for (var file in orphanedKeys) {
        console.log('  Orphaned keys in ' + file + ' (' + orphanedKeys[file].length + '):');
        orphanedKeys[file].forEach(function (k) {
          console.log('    - ' + k);
        });
      }

      for (var file in slotMismatches) {
        console.log(
          '  ICU slot-name mismatches in ' + file + ' (' + slotMismatches[file].length + '):'
        );
        slotMismatches[file].forEach(function (m) {
          var parts = [];
          if (m.missing.length > 0)
            parts.push('missing in ' + locale + ': ' + m.missing.join(', '));
          if (m.extra.length > 0) parts.push('extra in ' + locale + ': ' + m.extra.join(', '));
          console.log('    - ' + m.key + ' (' + parts.join('; ') + ')');
        });
      }

      totalErrors += localeErrors;
    }
  }

  console.log('');
  if (totalErrors > 0) {
    console.log('FAIL: ' + totalErrors + ' translation issue(s) found.');
    process.exit(1);
  } else {
    console.log('OK: All translations are in sync across ' + allLocales.length + ' locales.');
    process.exit(0);
  }
}

module.exports = {
  extractKeys: extractKeys,
  extractStringLeaves: extractStringLeaves,
  extractSlots: extractSlots,
  diffSlots: diffSlots,
  compareFile: compareFile,
  LOCALE_SPECIFIC_KEYS: LOCALE_SPECIFIC_KEYS,
};

if (require.main === module) main();
