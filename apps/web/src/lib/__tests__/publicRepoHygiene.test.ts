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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = resolve(__dirname, '../../../../..');
const THIS_FILE = 'apps/web/src/lib/__tests__/publicRepoHygiene.test.ts';

function tracked(...paths: string[]): string[] {
  return execFileSync('git', ['ls-files', '-z', ...paths], { cwd: REPO, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

/* ------------------------------------------------------------- 5.702 */

/**
 * A sentence cannot end on a comma, an operator or a function word. A word joined by a hyphen
 * is not a function word ("as-is", "opt-in"), so those are left alone.
 */
const DANGLING_END =
  /(?:[,+(—–]|(?<![-\w])(?:which|that|the|a|an|and|or|to|of|for|with|by|before|after|than|from|because|but))\s*$/i;
/** A leftover editing instruction on a line of its own: how #768's fourth damage looked. */
const STRAY_EDIT_LINE = /^\s*\((?:blank line|insert|add|paste|move|then|new line)[^)]*\)\s*$/i;
const LIST_ITEM = /^([-*+]|\d+[.)])\s+/;

/**
 * `path:line: text` for every markdown list item whose text ends mid-sentence (or leaves a
 * code span open), and for every stray editing-instruction line. Quote markers are read
 * through, and a non-blank line that starts no new item, heading or table continues the
 * item, as markdown itself reads it.
 */
function danglingListItems(file: string, text: string): string[] {
  const hits: string[] = [];
  let inFence = false;
  let item: { last: string; body: string; end: number } | null = null;
  const close = () => {
    if (item) {
      const open = item.body.split('`').length % 2 === 0;
      if (open || DANGLING_END.test(item.last.replace(/`[^`]*`/g, 'x')))
        hits.push(`${file}:${item.end}: …${item.last.trim().slice(-60)}`);
    }
    item = null;
  };
  text.split('\n').forEach((raw, i) => {
    if (STRAY_EDIT_LINE.test(raw)) hits.push(`${file}:${i + 1}: stray edit line ${raw.trim()}`);
    const line = raw.replace(/^\s*(?:>\s?)+/, (m) => ' '.repeat(m.length));
    if (/^\s*```/.test(line)) {
      close();
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const t = line.trim();
    if (LIST_ITEM.test(t)) {
      close();
      item = { last: line, body: line, end: i + 1 };
    } else if (item && t !== '' && !t.startsWith('#') && !t.startsWith('|')) {
      item = { last: line, body: `${item.body}\n${line}`, end: i + 1 };
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

  it('should flag the stray editing line #768 left, and pass endings that only look dangling', () => {
    expect(danglingListItems('x.md', '- one.\n  (blank line, then)\n')).toEqual([
      'x.md:2: stray edit line (blank line, then)',
    ]);
    const fine = [
      '- Ship it as-is',
      '- Users opt-in',
      '> 1. **Quoted.** After it, a missing record is a',
      '>    FAIL with no waiver.',
      '- A span `Page.setWebLifecycleState',
      '{state}` then returns.',
    ];
    expect(danglingListItems('x.md', fine.join('\n'))).toEqual([]);
  });

  it('should find no cut-off list item or stray editing line when every tracked markdown file is scanned', () => {
    const files = tracked().filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThan(45);
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
  /risk acceptance|contractually permitted|storage authority|not persistable|licen[cs]e review|API terms|public-domain|rights? (?:are|is) not established|TECHNICALLY ACCESSIBLE|conditions display|free-tier entitlement|legally cleared|use-specific clearance|in Legal['’]s own words|not a rights grant/i;
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
  /deletion is founder-only|deletion of any document (?:is|remains) founder-only|\bno mutation\b[^.\n]{0,40}\b(?:commit|push|branch)|GPT Work may (?:create|build|change|edit)|archive-with-status-header, never delete|invoked by \*\*no CI\s+workflow/i;

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
      execFileSync(
        'git',
        [
          '-c',
          'core.excludesFile=/dev/null',
          '-c',
          'core.ignorecase=false',
          'check-ignore',
          '-q',
          path,
        ],
        {
          cwd: REPO,
        }
      );
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
    // 5.722: other spellings and places of the same private material
    'apps/web/diboas-docs/x.md',
    'diboas-docs-main/x.md',
    'brain.md',
    'Handoff.md',
    'apps/web/.claude/settings.local.json',
    '.claude/projects/x/memory/MEMORY.md',
    'cc-sync/a.md',
    'gpt-sync/a.md',
    'decisions/a.md',
    'lanes/webapp/HANDOFF.md',
    'audit/PENDING_ALL.md',
    'PENDING_ALL.md',
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

/* ------------------------------------------------------------- 5.713 */

describe('5.713 · a gate change is never answered by a cached test pass', () => {
  it('should make scripts/** an input of every test task and pass DIBOAS_DOCS_DIR through', () => {
    const turbo = JSON.parse(readFileSync(join(REPO, 'turbo.json'), 'utf8')) as {
      tasks: { test: { inputs?: string[]; passThroughEnv?: string[] } };
    };
    expect(turbo.tasks.test.inputs).toEqual(
      expect.arrayContaining(['$TURBO_DEFAULT$', '$TURBO_ROOT$/scripts/**'])
    );
    expect(turbo.tasks.test.passThroughEnv).toContain('DIBOAS_DOCS_DIR');
  });
});

/* ------------------------------------------------------------- 5.718 */

/** Commands a script may start that live on the machine, not in `node_modules`. */
const SYSTEM_COMMANDS = new Set([
  'node',
  'pnpm',
  'npm',
  'npx',
  'bash',
  'sh',
  'echo',
  'sleep',
  'rm',
  'cp',
  'mkdir',
  'du',
  'git',
  'cd',
  'test',
  'true',
  'exit',
  'gitleaks',
]);

describe('5.718 · every package script starts a tool that is installed', () => {
  it('should resolve the first command of every script segment in every workspace', () => {
    const packages = [
      'package.json',
      ...['apps', 'packages'].flatMap((d) =>
        readdirSync(join(REPO, d)).map((n) => `${d}/${n}/package.json`)
      ),
    ].filter((f) => existsSync(join(REPO, f)));
    expect(packages.length).toBeGreaterThan(6);
    const missing: string[] = [];
    for (const file of packages) {
      const pkg = JSON.parse(readFileSync(join(REPO, file), 'utf8')) as {
        scripts?: Record<string, string>;
      };
      const dir = dirname(join(REPO, file));
      for (const [name, command] of Object.entries(pkg.scripts ?? {}))
        for (const segment of command.split(/&&|\|\||;|\|/)) {
          const bin = segment
            .trim()
            .replace(/^(?:[A-Z_]+=\S+\s+)+/, '')
            .split(/\s+/)[0];
          if (!bin || SYSTEM_COMMANDS.has(bin) || /^[.$]/.test(bin)) continue;
          if (![dir, REPO].some((d) => existsSync(join(d, 'node_modules', '.bin', bin))))
            missing.push(`${file} → "${name}" starts \`${bin}\`, which is not installed`);
        }
    }
    expect(missing).toEqual([]);
  });
});
