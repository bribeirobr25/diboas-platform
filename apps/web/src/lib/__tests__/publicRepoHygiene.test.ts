/**
 * What this PUBLIC repository may carry (brain-program audit, 2026-10-30).
 *
 * The repository is public; private knowledge lives in the private `diboas-docs`. Four
 * defects of one family were found in tracked files, and each class is guarded here:
 *
 * - `5.702` a list item cut off mid-sentence. Inserting new bullets in #768 swallowed the
 *   closing line of three existing ones, one of them the rule "never `DROP TABLE` once real
 *   records exist". Nothing noticed: prose has no compiler.
 * - `5.701` reasoning about data-provider terms (what a provider's terms allow, that rights
 *   are not established, a risk acceptance). Stated privately; never here.
 * - `5.704` a live instruction page still stating a rule the founder superseded.
 * - `5.707` a private path that `.gitignore` did not keep out.
 *
 * Every detector carries its own both-ways self-test, measured against the real corpus
 * before it was written: a detector that cannot fire proves nothing.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = resolve(__dirname, '../../../../..');
const THIS_FILE = 'apps/web/src/lib/__tests__/publicRepoHygiene.test.ts';

function tracked(...paths: string[]): string[] {
  return execFileSync('git', ['ls-files', '-z', ...paths], { cwd: REPO, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

/* ------------------------------------------------------------- 5.702 */

/** A sentence cannot end on a comma, an operator or a function word. */
const DANGLING_END =
  /(?:[,+(—–-]|\b(?:which|that|the|a|an|and|or|to|of|in|for|with|by|before|after|is|are|was|were|when|if|than|from|as|at|on|into|its|their|this|these|Before|After)\b)\s*$/;

/** `path:line: text` for every markdown list item whose last line ends mid-sentence. */
function danglingListItems(file: string, text: string): string[] {
  const hits: string[] = [];
  let inFence = false;
  let item: { last: string; end: number } | null = null;
  const close = () => {
    if (item && DANGLING_END.test(item.last.replace(/`[^`]*`/g, 'x')))
      hits.push(`${file}:${item.end}: …${item.last.trim().slice(-60)}`);
    item = null;
  };
  text.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      close();
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      close();
      item = { last: line, end: i + 1 };
    } else if (item && line.trim() !== '' && /^\s+\S/.test(line) && !/^\s*\|/.test(line)) {
      item = { last: line, end: i + 1 };
    } else close();
  });
  close();
  return hits;
}

describe('5.702 · no list item in a tracked document ends mid-sentence', () => {
  it('should flag the three cut-off shapes #768 shipped, and pass the restored text', () => {
    const cut = [
      '- **Cache.** Guarded by `marketCacheHeaders.test.ts`, which',
      '- **Network.** the adapters still run for real. Before',
      '- **Evidence.** **rollback is stop-ingestion +',
    ];
    for (const c of cut) expect(danglingListItems('x.md', c), c).toHaveLength(1);
    const restored = [
      '- **Cache.** Guarded by `marketCacheHeaders.test.ts`, which',
      '  reads both route files — do not re-inline the header in either.',
      '- Stopped: see `x.md` and',
      '',
      '```',
      '- inside a fence and',
      '```',
    ];
    expect(danglingListItems('x.md', restored.join('\n'))).toEqual([
      'x.md:3: …- Stopped: see `x.md` and',
    ]);
  });

  it('should find no cut-off list item when every tracked doc and bootstrap file is scanned', () => {
    const files = tracked('docs', 'CLAUDE.md', 'AGENTS.md', 'README.md').filter((f) =>
      f.endsWith('.md')
    );
    expect(files.length).toBeGreaterThan(30);
    const hits = files.flatMap((f) => danglingListItems(f, readFileSync(join(REPO, f), 'utf8')));
    expect(hits).toEqual([]);
  });
});

/* ------------------------------------------------------------- 5.701 */

/**
 * Phrases of provider-terms reasoning, each measured: on 2026-10-30 they matched only the
 * sentences 5.701 removed, never our own legal pages ("Terms of Use") or the fallback code's
 * "uncleared" vocabulary.
 */
const PROVIDER_TERMS =
  /risk acceptance|contractually permitted|storage authority|not persistable|licen[cs]e review|API terms|public-domain|rights? (?:are|is) not established|TECHNICALLY ACCESSIBLE|conditions display/i;
const TEXT_FILE = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|ya?ml|sh|py|css|txt)$/;

describe('5.701 · no tracked file reasons about data-provider terms', () => {
  it('should flag the removed wording and pass our own legal-page vocabulary', () => {
    expect(PROVIDER_TERMS.test('Fetching is allowed under Founder risk acceptance.')).toBe(true);
    expect(PROVIDER_TERMS.test('the API terms restrict caching and redistribution')).toBe(true);
    expect(PROVIDER_TERMS.test('Fetch authority does not carry storage authority.')).toBe(true);
    expect(PROVIDER_TERMS.test('Terms of Use for the diBoaS pre-launch website.')).toBe(false);
    expect(PROVIDER_TERMS.test('An uncleared fallback is still refused.')).toBe(false);
  });

  it('should find none of that wording when every tracked text file is scanned', () => {
    const files = tracked().filter(
      (f) => TEXT_FILE.test(f) && f !== THIS_FILE && f !== 'pnpm-lock.yaml'
    );
    expect(files.length).toBeGreaterThan(500);
    const hits = files.filter((f) => PROVIDER_TERMS.test(readFileSync(join(REPO, f), 'utf8')));
    expect(hits).toEqual([]);
  });
});

/* ------------------------------------------------------------- 5.704 */

/** Rules the founder superseded (2026-10-28, 2026-10-30) that a live page must not restate. */
const SUPERSEDED_RULES =
  /deletion is founder-only|deletion of any document (?:is|remains) founder-only|\bno mutation\b[^.\n]{0,40}\b(?:commit|push|branch)|GPT Work may (?:create|build|change|edit)/i;

describe('5.704 · no live instruction page restates a superseded rule', () => {
  it('should flag the superseded wording and pass the current rule', () => {
    expect(SUPERSEDED_RULES.test('record substance; **deletion is founder-only**;')).toBe(true);
    expect(SUPERSEDED_RULES.test('No mutation — no `add`, `commit`, `push`')).toBe(true);
    expect(SUPERSEDED_RULES.test('GPT Work may create instruments for its experiments')).toBe(true);
    expect(SUPERSEDED_RULES.test("delete only after verifying the founder's merge")).toBe(false);
    expect(SUPERSEDED_RULES.test('a pure selector: no I/O / no mutation / deterministic')).toBe(
      false
    );
  });

  it('should find no superseded rule when the bootstrap files and docs/tech are scanned', () => {
    const files = tracked('CLAUDE.md', 'AGENTS.md', 'README.md', 'docs/tech').filter((f) =>
      f.endsWith('.md')
    );
    expect(files.length).toBeGreaterThan(20);
    const hits = files.filter((f) => SUPERSEDED_RULES.test(readFileSync(join(REPO, f), 'utf8')));
    expect(hits).toEqual([]);
  });
});

/* ------------------------------------------------------------- 5.707 */

describe('5.707 · .gitignore keeps private material out of this repository', () => {
  /** Asked of the repository's own rules only, never a personal global ignore file. */
  const ignored = (path: string): boolean => {
    try {
      execFileSync('git', ['-c', 'core.excludesFile=/dev/null', 'check-ignore', '-q', path], {
        cwd: REPO,
      });
      return true;
    } catch {
      return false;
    }
  };

  it.each([
    'diboas-docs/audit/PENDING_ALL.md',
    'diboas-media/learn/a.png',
    'BRAIN.md',
    'HANDOFF.md',
    '.claude/settings.local.json',
    'docs/audit/PENDING_ALL.md',
    'docs/a-new-private-area/x.md',
    'docs/ROOT_NOTE.md',
    '.review-gate-runs/run/log.json',
  ])('should ignore %s when it appears in the checkout', (path) => {
    expect(ignored(path)).toBe(true);
  });

  it('should keep the tracked public docs and agent files tracked', () => {
    for (const path of ['docs/tech/x.md', '.claude/agents/design-reviewer.md', 'AGENTS.md'])
      expect(ignored(path), path).toBe(false);
  });
});

/* ------------------------------------------------------------- 5.709 */

describe('5.709 · no database migration is tracked in this public repository', () => {
  it('should track no .sql file when the whole repository is listed', () => {
    expect(tracked().filter((f) => f.endsWith('.sql'))).toEqual([]);
  });
});
