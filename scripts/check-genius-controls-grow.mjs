#!/usr/bin/env node
/**
 * GENIUS controls only grow (register `5.958`, plan P9 §6 item 6, founder D7 in
 * `DR-2026-11-17-p9-genius-lexicon-decisions`).
 *
 * `config/genius-wall-controls.json` pins every form the GENIUS wall's lexicon names, and both
 * walls hold count floors on its lists. A floor catches a DELETED control but not a REPLACED one:
 * review proved that rewriting the controls of a removed alternative ("wuchs") into strings that
 * still pair through another word ("rendeu wuchs") kept every count, every test and the duplicate
 * check green while the wall had narrowed. So this check compares the fixture against the pull
 * request's base: every entry of a coverage list on the base must still be there, verbatim, and
 * the window may not shrink.
 *
 * `nonEarnForms` (the look-alikes the lexicon must never match, D4) is a ceiling, not coverage: an
 * entry may leave only by a founder ruling, which the PR record names. Its removal is printed, not
 * blocked, because the ruling lives in the record, not in the file.
 *
 * Fails closed: no base, an all-zero base, or a base whose fixture cannot be read is a failure.
 *
 * Usage:  node scripts/check-genius-controls-grow.mjs <base-sha>
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CONTROLS_PATH = 'config/genius-wall-controls.json';
/**
 * The lists whose entries pin what the wall catches; each may only grow. Every OTHER list found on
 * the base (except the `nonEarnForms` ceiling) is compared too, so renaming or dropping a list in
 * the same pull request that edits this constant cannot take it out of the check (code review).
 */
export const COVERAGE_LISTS = [
  'stableForms',
  'earnForms',
  'rateForms',
  'earnNearForms',
  'breaches',
];

/**
 * @param {Record<string, unknown>} base the fixture on the pull request's base
 * @param {Record<string, unknown>} head the fixture on this branch
 * @returns {{ failures: string[], notices: string[] }}
 */
export function controlsShrinkage(base, head) {
  const failures = [];
  const notices = [];
  const onBase = Object.keys(base).filter((k) => Array.isArray(base[k]) && k !== 'nonEarnForms');
  for (const key of [...new Set([...COVERAGE_LISTS, ...onBase])]) {
    const before = base[key] ?? [];
    const after = head[key];
    if (!Array.isArray(before)) {
      failures.push(`${key}: not a list on the base`);
      continue;
    }
    if (!Array.isArray(after)) {
      if (before.length > 0) failures.push(`${key}: the list is gone on this branch`);
      continue;
    }
    const now = new Set(after);
    for (const entry of before) {
      if (!now.has(entry)) failures.push(`${key}: "${entry}" disappeared`);
    }
  }
  const window = { before: base.windowChars, after: head.windowChars };
  if (
    typeof window.before !== 'number' ||
    typeof window.after !== 'number' ||
    window.after < window.before
  ) {
    failures.push(`windowChars: ${window.before} → ${window.after} (the window may not shrink)`);
  }
  const ceilingNow = new Set(Array.isArray(head.nonEarnForms) ? head.nonEarnForms : []);
  for (const entry of Array.isArray(base.nonEarnForms) ? base.nonEarnForms : []) {
    if (!ceilingNow.has(entry)) {
      notices.push(
        `nonEarnForms: "${entry}" removed: the PR record must name the founder's ruling`
      );
    }
  }
  return { failures, notices };
}

function readBase(sha) {
  return JSON.parse(
    execFileSync('git', ['show', `${sha}:${CONTROLS_PATH}`], { cwd: ROOT, encoding: 'utf8' })
  );
}

export function main(argv) {
  const sha = (argv[0] ?? '').trim();
  if (!sha || /^0+$/.test(sha)) {
    console.error(
      'GENIUS controls · FAIL — no base commit to compare against (fails closed). Pass the pull ' +
        "request's base SHA, or the push's previous commit."
    );
    return 1;
  }
  let base;
  try {
    base = readBase(sha);
  } catch (error) {
    console.error(
      `GENIUS controls · FAIL — cannot read ${CONTROLS_PATH} at ${sha} (fails closed): ${error.message}`
    );
    return 1;
  }
  const head = JSON.parse(readFileSync(join(ROOT, CONTROLS_PATH), 'utf8'));
  const { failures, notices } = controlsShrinkage(base, head);
  // A GitHub annotation, so a removed look-alike shows on the pull request even when the job is green.
  for (const n of notices) console.log(`::warning title=GENIUS nonEarnForms::${n}`);
  if (failures.length) {
    console.error(
      `GENIUS controls · FAIL — a control disappeared against ${sha.slice(0, 12)}. Controls may ` +
        'only grow: a removed or rewritten control is how a narrowed lexicon stays green.\n' +
        failures.map((f) => `  - ${f}`).join('\n')
    );
    return 1;
  }
  const total = COVERAGE_LISTS.reduce(
    (n, k) => n + (Array.isArray(head[k]) ? head[k].length : 0),
    0
  );
  console.log(`GENIUS controls · PASS — ${total} controls, none lost against ${sha.slice(0, 12)}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main(process.argv.slice(2)));
