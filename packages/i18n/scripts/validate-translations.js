#!/usr/bin/env node

/**
 * Translation Validation Script
 *
 * Validates that all locale directories have the same JSON files
 * and matching key structures as the reference locale (en).
 *
 * Usage:
 *   node packages/i18n/scripts/validate-translations.js
 *
 * Exit codes:
 *   0 - All locales match
 *   1 - Mismatches found (missing files, missing keys, orphaned keys)
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
    'waitlist.json': ['legal.bcbDisclaimer']
  }
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

function main() {
  console.log('Validating translations...\n');

  const refDir = path.join(TRANSLATIONS_DIR, REFERENCE_LOCALE);
  if (!fs.existsSync(refDir)) {
    console.error('ERROR: Reference locale directory not found: ' + refDir);
    process.exit(1);
  }

  // Discover all locales
  const allLocales = fs.readdirSync(TRANSLATIONS_DIR, { withFileTypes: true })
    .filter(function (e) { return e.isDirectory(); })
    .map(function (e) { return e.name; })
    .sort();

  const targetLocales = allLocales.filter(function (l) { return l !== REFERENCE_LOCALE; });

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
    const sharedFiles = refFiles.filter(function (f) { return localeFiles.indexOf(f) !== -1; });
    for (const file of sharedFiles) {
      var refContent, localeContent;
      try {
        refContent = JSON.parse(fs.readFileSync(path.join(refDir, file), 'utf8'));
      } catch (e) {
        console.error('  ERROR: Failed to parse ' + REFERENCE_LOCALE + '/' + file + ': ' + e.message);
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

      const missing = refKeys.filter(function (k) { return localeKeys.indexOf(k) === -1; });
      const localeExclusions = (LOCALE_SPECIFIC_KEYS[locale] && LOCALE_SPECIFIC_KEYS[locale][file]) || [];
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
    }

    // Report for this locale
    const localeErrors = missingFiles.length
      + orphanedFiles.length
      + Object.keys(missingKeys).reduce(function (sum, f) { return sum + missingKeys[f].length; }, 0)
      + Object.keys(orphanedKeys).reduce(function (sum, f) { return sum + orphanedKeys[f].length; }, 0);

    if (localeErrors === 0) {
      console.log('[' + locale + '] OK (' + sharedFiles.length + ' files, all keys match)');
    } else {
      console.log('[' + locale + '] ' + localeErrors + ' issue(s):');

      if (missingFiles.length > 0) {
        console.log('  Missing files (' + missingFiles.length + '):');
        missingFiles.forEach(function (f) { console.log('    - ' + f); });
      }

      if (orphanedFiles.length > 0) {
        console.log('  Orphaned files (' + orphanedFiles.length + '):');
        orphanedFiles.forEach(function (f) { console.log('    - ' + f); });
      }

      for (var file in missingKeys) {
        console.log('  Missing keys in ' + file + ' (' + missingKeys[file].length + '):');
        missingKeys[file].forEach(function (k) { console.log('    - ' + k); });
      }

      for (var file in orphanedKeys) {
        console.log('  Orphaned keys in ' + file + ' (' + orphanedKeys[file].length + '):');
        orphanedKeys[file].forEach(function (k) { console.log('    - ' + k); });
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
