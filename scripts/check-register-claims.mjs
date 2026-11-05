#!/usr/bin/env node
/**
 * REG-CLAIMS-1 · two open docs PRs must never claim the same register id (register 5.782).
 *
 * The register (`audit/PENDING_ALL.md`, private docs) hands out ids through a NEXT FREE marker
 * on `main`. A claim made on an open branch is invisible there, so two lanes reading the same
 * marker claim the same ids: it happened four times (2026-08-12, 2026-08-24, and twice on
 * 2026-11-05). This check compares the ids THIS checkout adds to the register (its rows minus
 * main's rows) with the ids every OTHER open docs PR adds, and fails on any overlap.
 *
 * Inputs:
 *   DIBOAS_DOCS_DIR   the docs checkout under test (scripts/lib/docs-root.mjs resolves it)
 *   live (default)    `gh` reads main's register and each open PR's register through the API
 *                     (repository from DOCS_REPO, default bribeirobr25/diboas-docs). This
 *                     checkout's own PR is skipped by head BRANCH (GITHUB_HEAD_REF, else the
 *                     checkout's branch) OR head COMMIT (a detached checkout has no branch);
 *                     each PR's register is read at its head commit (works for a fork too);
 *                     500+ open PRs → INCOMPLETE, never a silent pass
 *   --main <file> --other <name>=<file> …   fixtures instead of the API (tests, offline rehearsal)
 *
 * Exit: 0 PASS · 1 FAIL (an overlap) · 2 INCOMPLETE (a register could not be read — never a pass).
 * Node built-ins only: the docs CI runs it without an install step.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { docsRootProblem, resolveDocsRoot } from './lib/docs-root.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const REGISTER = 'audit/PENDING_ALL.md';
/**
 * A row header in any of the register's three forms — `> **5.N** — `, `> **5.N — title**` and
 * the table row `| **5.N** |` — read exactly as the register gate reads them (review-gate.mjs
 * checkRegister). Sixth audit (2026-11-05): the first version counted only the first form.
 */
const ROW = /^(?:\||>) \*\*(\d+\.\d+)(?:\*\*|\s|—)/gm;
const PR_LIMIT = 500;

/** The ids that have a row of their own (index mentions and prose are not claims). */
export function rowIds(text) {
  return new Set([...text.matchAll(ROW)].map((m) => m[1]));
}

/** Ids a register adds on top of main's. */
export function addedIds(text, mainText) {
  const main = rowIds(mainText);
  return [...rowIds(text)].filter((id) => !main.has(id));
}

/** Overlaps between this checkout's added ids and each other register's added ids. */
export function findOverlaps(selfText, mainText, others) {
  const mine = new Set(addedIds(selfText, mainText));
  const found = [];
  for (const [name, text] of others) {
    const shared = addedIds(text, mainText).filter((id) => mine.has(id));
    if (shared.length)
      found.push({ name, ids: shared.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })) });
  }
  return { mine: [...mine], found };
}

function gh(args) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function registerAt(repo, ref) {
  return gh([
    'api',
    '-H',
    'Accept: application/vnd.github.raw',
    `repos/${repo}/contents/${REGISTER}?ref=${encodeURIComponent(ref)}`,
  ]);
}

/** This checkout's own PR: by branch name, or by head commit when the checkout is detached. */
function selfIdentity(docsDir) {
  const git = (args) => {
    try {
      return execFileSync('git', ['-C', docsDir, ...args], { encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  };
  return {
    branch: process.env.GITHUB_HEAD_REF || git(['branch', '--show-current']),
    sha: git(['rev-parse', 'HEAD']),
  };
}

function parseArgs(argv) {
  const out = { main: null, others: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--main') out.main = argv[++i];
    else if (argv[i] === '--other') {
      const [name, ...rest] = argv[++i].split('=');
      out.others.push([name, rest.join('=')]);
    } else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return out;
}

function main() {
  let docsDir;
  let selfText;
  let mainText;
  let others;
  try {
    const root = resolveDocsRoot(ROOT);
    const problem = docsRootProblem(ROOT, root);
    if (problem) throw new Error(problem);
    if (!root.dir) throw new Error('no private docs checkout (set DIBOAS_DOCS_DIR)');
    docsDir = root.dir;
    selfText = readFileSync(join(docsDir, REGISTER), 'utf8');
    const args = parseArgs(process.argv.slice(2));
    if (args.main) {
      mainText = readFileSync(args.main, 'utf8');
      others = args.others.map(([name, file]) => [name, readFileSync(file, 'utf8')]);
    } else {
      const repo = process.env.DOCS_REPO || 'bribeirobr25/diboas-docs';
      const self = selfIdentity(docsDir);
      mainText = registerAt(repo, 'main');
      const heads = JSON.parse(
        gh([
          'pr',
          'list',
          '-R',
          repo,
          '--state',
          'open',
          '--limit',
          String(PR_LIMIT),
          '--json',
          'number,headRefName,headRefOid',
        ])
      );
      if (heads.length >= PR_LIMIT)
        throw new Error(`${PR_LIMIT}+ open docs PRs: more than one page`);
      others = heads
        .filter((pr) => pr.headRefName !== self.branch && pr.headRefOid !== self.sha)
        .map((pr) => [`#${pr.number} ${pr.headRefName}`, registerAt(repo, pr.headRefOid)]);
    }
  } catch (err) {
    // An error CODE or our own wording only: a raw message can carry a machine path (5.697).
    const why =
      err && err.code
        ? err.code
        : err && err.status !== undefined
          ? `gh exit ${err.status}`
          : String(err.message || err).split('\n')[0];
    console.error(`REG-CLAIMS · INCOMPLETE — a register could not be read (${why}).`);
    console.error('A skipped check is not a pass.');
    process.exit(2);
  }
  const { mine, found } = findOverlaps(selfText, mainText, others);
  if (found.length) {
    console.error(
      `REG-CLAIMS · FAIL — ids this checkout adds are also added by another open docs PR:`
    );
    for (const f of found) console.error(`  ${f.name}: ${f.ids.join(', ')}`);
    console.error(
      'The PR that claimed later renumbers: re-read NEXT FREE on main and every open PR, then move.'
    );
    process.exit(1);
  }
  console.log(
    `REG-CLAIMS · PASS — ${mine.length} id(s) added here, none claimed by the ${others.length} other open docs PR(s).`
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
