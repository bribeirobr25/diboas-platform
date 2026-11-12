#!/usr/bin/env node
/**
 * PR-RECORD (register `5.727`) · a pull request body carries the increment-review record.
 *
 * `docs/tech/increment-review-gate.md` puts each change's record "in the commit body or PR
 * description". The brain-program batch (platform #773–#781) carried evidence sections but not
 * the record, so its system review could not close; the founder waived that batch once
 * (`DR-2026-10-31-brain-program-review-waiver`) and asked for this check so it cannot recur.
 *
 * The required fields are READ FROM THE GATE DOCUMENT's `## Return block`, never copied here, so
 * adding a field there is enforced here the same day. Each field must appear as `FIELD = value`
 * with a real value (not empty, not the template's `<…>` placeholder), and `STATE` must name one
 * of the three states the gate defines.
 *
 * ⚑ SCOPE LIMIT, stated: this checks that the record is PRESENT and FILLED, not that it is TRUE.
 * A filled-in record can still be wrong; reviewing it stays a person's job.
 *
 * Exempt, by head branch: the weekly market refresh (`editorial/market-refresh-auto`, written by
 * a workflow, reviewed as editorial content) and Dependabot (`dependabot/…`).
 *
 * Usage:  PR_BODY=… PR_HEAD=… PR_AUTHOR=… PR_HEAD_REPO=… PR_BASE_REPO=… node scripts/check-pr-record.mjs
 *         node scripts/check-pr-record.mjs --file body.md          (rehearse a body locally)
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GATE_DOC = 'docs/tech/increment-review-gate.md';

export const EXEMPT_HEADS = [/^editorial\/market-refresh-auto$/, /^dependabot\//];

/**
 * 5.835 — a branch NAME alone never exempts: anyone can name a branch `dependabot/…`.
 * An exemption needs the exempt head pattern AND a head in this repository (never a fork)
 * AND, for `dependabot/**`, the Dependabot author. A missing value fails closed (not exempt).
 *
 * Fifteenth audit (C-6): for `dependabot/**` every COMMIT must be Dependabot's too. A Dependabot
 * PR that carries someone else's commits (a fix pushed onto its branch) is no longer
 * Dependabot's change: it needs a record and goes to the founder
 * (DR-2026-11-11-dependabot-merge-delegated). No author list fails closed.
 */
export function isExempt({
  head = '',
  author = '',
  headRepo = '',
  baseRepo = '',
  commitAuthors = /** @type {string[] | undefined} */ (undefined),
}) {
  if (!EXEMPT_HEADS.some((re) => re.test(head))) return false;
  if (!headRepo || headRepo !== baseRepo) return false;
  if (/^dependabot\//.test(head)) {
    if (author !== 'dependabot[bot]') return false;
    if (!commitAuthors || commitAuthors.length === 0) return false;
    if (commitAuthors.some((a) => a !== 'dependabot[bot]')) return false;
  }
  return true;
}

/** The commit authors the workflow wrote, one login per line (absent → undefined). */
function readCommitAuthors(file) {
  if (!file) return undefined;
  try {
    return readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return undefined;
  }
}

/** The field names and the allowed STATE values, from the gate document itself. */
export function recordSpec(gateText) {
  const section = gateText.split(/^## Return block\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  const block = section.match(/```text\n([\s\S]*?)```/)?.[1] ?? '';
  const fields = [...block.matchAll(/^([A-Z][A-Z_ /]*?[A-Z])\s+=/gm)].map((m) => m[1]);
  const stateLine = block.match(/^STATE\s+=\s*(.+)$/m)?.[1] ?? '';
  const states = stateLine
    .replace(/\(.*$/, '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  return { fields, states };
}

/** Every problem with a PR body's record; empty means the record is present and filled. */
export function recordProblems(body, { fields, states }) {
  if (!fields.length) return [`no fields found in the gate document's return block (${GATE_DOC})`];
  const problems = [];
  for (const field of fields) {
    const escaped = field.replace(/[/]/g, '\\/').replace(/ /g, '\\s*');
    const line = body.match(new RegExp(`^\\s*${escaped}\\s*=[ \\t]*(.*)$`, 'm'));
    if (!line) {
      problems.push(`missing: ${field}`);
      continue;
    }
    const value = line[1].trim();
    if (!value || value.startsWith('<')) problems.push(`not filled in: ${field}`);
    else if (field === 'STATE' && states.length && !states.some((s) => value.includes(s)))
      problems.push(`STATE names none of: ${states.join(' | ')}`);
  }
  return problems;
}

function main(argv, env) {
  const at = argv.indexOf('--file');
  const body = at >= 0 ? readFileSync(argv[at + 1], 'utf8') : (env.PR_BODY ?? '');
  const head = env.PR_HEAD ?? '';
  const exempt = isExempt({
    head,
    author: env.PR_AUTHOR,
    headRepo: env.PR_HEAD_REPO,
    baseRepo: env.PR_BASE_REPO,
    commitAuthors: readCommitAuthors(
      argv.includes('--commit-authors')
        ? argv[argv.indexOf('--commit-authors') + 1]
        : env.PR_COMMIT_AUTHORS_FILE
    ),
  });
  if (exempt) {
    console.log(`PR-RECORD · exempt head branch ${head}`);
    return 0;
  }
  const spec = recordSpec(readFileSync(join(ROOT, GATE_DOC), 'utf8'));
  const problems = recordProblems(body, spec);
  if (problems.length) {
    console.error(
      `PR-RECORD · FAIL — the PR body needs the increment-review record (${GATE_DOC} § Return block):\n` +
        problems.map((p) => `  - ${p}`).join('\n')
    );
    return 1;
  }
  console.log(`PR-RECORD · PASS — all ${spec.fields.length} fields present and filled`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main(process.argv.slice(2), process.env));
