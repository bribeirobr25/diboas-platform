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
    'landing-b2c.json': ['demo.pain.pixHeader', 'footer.brDisclaimer'],
    'legal/cookies.json': ['sections.brazilNote'],
    'legal/privacy.json': ['sections.brazilNote'],
    'legal/terms.json': ['sections.brazilNote'],
    'strategies.json': ['footer.bcbDisclaimer'],
    'waitlist.json': ['legal.bcbDisclaimer'],
  },
  // EU IFR 2015/751 interchange-cap disclosure is an EU-only obligation
  // (Card Fees tool). Surfaced for the two EU locales only; en/pt-BR carry
  // no IFR disclosure. Crosswalk §3.5/§5.2 (REGULATORY_CROSSWALK.md).
  es: {
    'tools-card-fees.json': ['disclaimers.euIfrCap'],
  },
  de: {
    'tools-card-fees.json': ['disclaimers.euIfrCap'],
  },
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

/**
 * Extract all key paths from a nested object (dot-separated).
 */
function extractKeys(obj, prefix) {
  prefix = prefix || '';
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

/**
 * Build a flat Map<keyPath, string-value> for all leaf string values.
 * Non-string leaves (booleans, numbers, arrays) are skipped — slot-name
 * parity only meaningful for string templates.
 */
function extractStringLeaves(obj, prefix, out) {
  prefix = prefix || '';
  out = out || new Map();
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      extractStringLeaves(value, fullKey, out);
    } else if (typeof value === 'string') {
      out.set(fullKey, value);
    }
  }
  return out;
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

      const refKeys = extractKeys(refContent);
      const localeKeys = extractKeys(localeContent);

      const missing = refKeys.filter(function (k) {
        return localeKeys.indexOf(k) === -1;
      });
      const localeExclusions =
        (LOCALE_SPECIFIC_KEYS[locale] && LOCALE_SPECIFIC_KEYS[locale][file]) || [];
      const orphaned = localeKeys.filter(function (k) {
        if (refKeys.indexOf(k) !== -1) return false;
        // Check if this key matches any locale-specific exclusion prefix
        for (var i = 0; i < localeExclusions.length; i++) {
          if (k === localeExclusions[i] || k.indexOf(localeExclusions[i] + '.') === 0) {
            return false;
          }
        }
        return true;
      });

      if (missing.length > 0) {
        missingKeys[file] = missing;
      }
      if (orphaned.length > 0) {
        orphanedKeys[file] = orphaned;
      }

      // Slot-name parity (audit L24 — Phase 7 Followup carry-forward #6).
      // For every key present in BOTH ref and locale, the ICU slot-name set
      // must be identical. Mismatch = silent-fallback bug at render time.
      const refLeaves = extractStringLeaves(refContent);
      const localeLeaves = extractStringLeaves(localeContent);
      const fileSlotMismatches = [];
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
          fileSlotMismatches.push({ key: keyPath, missing: diff.missing, extra: diff.extra });
        }
      }
      if (fileSlotMismatches.length > 0) {
        slotMismatches[file] = fileSlotMismatches;
      }
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

main();
