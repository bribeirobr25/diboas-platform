#!/usr/bin/env node
/**
 * CONSENT-TEXT-1 · consent texts are versioned, and a version's wording never changes (market
 * clean-up W-D1, register 5.923; spec §4).
 *
 * `config/consent-texts.json` pins, for every consent text (the banner, the two note-box texts,
 * the join notice, and in a later W-D1 group the policy paragraphs), each version's wording as a
 * SHA-256 per locale. `consentTexts.test.ts` checks the current catalogue against the current
 * version's entry. This script compares the table with the pull request's base: an existing
 * version may not change or disappear (a changed text needs a NEW version, so the evidence a
 * signup carries keeps meaning what it meant), and once the table exists it may not be deleted.
 * First introduction: a base without the table passes, so long as this branch adds it.
 *
 * Fails closed: no base, an all-zero base, or a base whose git history cannot be read.
 *
 * Usage:  node scripts/check-consent-texts-grow.mjs <base-sha>
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const TEXTS_PATH = 'config/consent-texts.json';

/** The hash of one locale's wording of a text: its keys' values in order. */
export function hashWording(values) {
  return createHash('sha256').update(JSON.stringify(values)).digest('hex');
}

/**
 * @param {{ texts?: Array<{ id: string, keys?: string[], versions?: Record<string, Record<string, string>> }> } | null} base
 * @param {{ texts?: Array<{ id: string, keys?: string[], versions?: Record<string, Record<string, string>> }> } | null} head
 * @returns {string[]} failures
 */
export function consentTextShrinkage(base, head) {
  if (base === null) return head === null ? ['the table is missing on this branch'] : [];
  if (head === null) return ['the table was deleted'];
  const failures = [];
  const headById = new Map((head.texts ?? []).map((t) => [t.id, t]));
  for (const text of base.texts ?? []) {
    const now = headById.get(text.id);
    if (!now) {
      failures.push(`${text.id}: the text is gone`);
      continue;
    }
    for (const [version, hashes] of Object.entries(text.versions ?? {})) {
      const after = now.versions?.[version];
      if (!after) {
        failures.push(`${text.id} v${version}: the version is gone`);
        continue;
      }
      for (const [locale, hash] of Object.entries(hashes)) {
        if (after[locale] !== hash)
          failures.push(`${text.id} v${version} ${locale}: the pinned wording changed`);
      }
    }
  }
  return failures;
}

function readAt(sha) {
  try {
    return JSON.parse(
      execFileSync('git', ['show', `${sha}:${TEXTS_PATH}`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    );
  } catch (error) {
    // The path not existing at the base is the first introduction; anything else fails closed.
    if (/does not exist|exists on disk, but not in/.test(String(error.stderr ?? error.message)))
      return null;
    throw error;
  }
}

export function main(argv) {
  const sha = (argv[0] ?? '').trim();
  if (!sha || /^0+$/.test(sha)) {
    console.error('CONSENT-TEXT-1 · FAIL — no base commit to compare against (fails closed).');
    return 1;
  }
  let base;
  try {
    base = readAt(sha);
  } catch (error) {
    console.error(`CONSENT-TEXT-1 · FAIL — cannot read ${TEXTS_PATH} at ${sha}: ${error.message}`);
    return 1;
  }
  const path = join(ROOT, TEXTS_PATH);
  const head = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  const failures = consentTextShrinkage(base, head);
  if (failures.length) {
    console.error(
      `CONSENT-TEXT-1 · FAIL — against ${sha.slice(0, 12)}, a pinned consent text changed. Give ` +
        'changed wording a NEW version; never edit or drop an existing one.\n' +
        failures.map((f) => `  - ${f}`).join('\n')
    );
    return 1;
  }
  console.log(
    `CONSENT-TEXT-1 · PASS — ${(head?.texts ?? []).length} texts, no pinned version changed against ${sha.slice(0, 12)}` +
      (base === null ? ' (first introduction)' : '')
  );
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main(process.argv.slice(2)));
