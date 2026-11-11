/**
 * RETRY-TUESDAY-1 · the weekly `decide` step, run as on Actions (post-merge audit, 2026-11-11).
 * Stand-in `gh` (the run list and each run's jobs) and `date` (GNU `-d`, fixed clock); real jq and
 * node. Requirement: only a run whose refresh job succeeded counts as a refresh (a skipped run
 * ends "success" too), and a lookup that fails stops the step instead of reading as "no refresh".
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const REPO = path.resolve(__dirname, '../../../../../..');
const WF = fs.readFileSync(path.join(REPO, '.github/workflows/market-refresh-weekly.yml'), 'utf8');
const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

function stepScript(name: string): string {
  const start = WF.indexOf(`- name: ${name}`);
  expect(start).toBeGreaterThan(-1);
  const rest = WF.slice(start);
  const next = rest.slice(1).search(/\n {6}- (name|uses):|\n {2}[a-z]+:\n/);
  const lines = (next === -1 ? rest : rest.slice(0, next + 1)).split('\n');
  const at = lines.findIndex((l) => /^\s*run: \|/.test(l));
  const indent = lines[at].search(/\S/) + 2;
  return lines
    .slice(at + 1)
    .filter((l) => l.trim() === '' || l.search(/\S/) >= indent)
    .map((l) => l.slice(indent))
    .join('\n');
}

type Run = {
  databaseId: number;
  conclusion: string;
  status: string;
  createdAt: string;
  displayTitle: string;
};

function decide(runs: Run[], jobs: Record<number, string | null>, env: Record<string, string>) {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'decide-'));
  roots.push(ws);
  fs.mkdirSync(path.join(ws, 'apps/web'), { recursive: true });
  fs.symlinkSync(path.join(REPO, 'apps/web/scripts'), path.join(ws, 'apps/web/scripts'));
  const bin = path.join(ws, '.bin');
  fs.mkdirSync(bin);
  const data = path.join(ws, '.data');
  fs.mkdirSync(data);
  fs.writeFileSync(path.join(data, 'runs.json'), JSON.stringify(runs));
  for (const [id, j] of Object.entries(jobs))
    if (j !== null) fs.writeFileSync(path.join(data, `${id}.json`), j);
  fs.writeFileSync(
    path.join(bin, 'gh'),
    `#!/bin/bash
case "$1 $2" in
  "run list") cat "${data}/runs.json" ;;
  "pr list") exit 0 ;;
  "run view") f="${data}/$3.json"; [ -f "$f" ] || { echo "HTTP 502" >&2; exit 1; }; cat "$f" ;;
esac
`,
    { mode: 0o755 }
  );
  // record what the step hands the decision script, then run the real node
  fs.writeFileSync(
    path.join(bin, 'node'),
    `#!/bin/bash\nprintf '%s|%s\\n' "\${REFRESHED_RUNS:-}" "\${REFUSED_RUNS:-}" > "${ws}/handed"\nexec "${process.execPath}" "$@"\n`,
    { mode: 0o755 }
  );
  // GNU date's "-d '-10 days'" with a fixed clock (macOS date has no -d)
  fs.writeFileSync(path.join(bin, 'date'), `#!/bin/bash\necho 2026-11-15T13:00:00Z\n`, {
    mode: 0o755,
  });
  const out = path.join(ws, 'out');
  fs.writeFileSync(out, '');
  const r = spawnSync(
    'bash',
    ['-e', '-o', 'pipefail', '-c', stepScript('Decide whether this run refreshes')],
    {
      cwd: ws,
      encoding: 'utf8',
      env: {
        NODE_ENV: 'test',
        PATH: `${bin}:${process.env.PATH}`,
        RUNNER_TEMP: ws,
        GITHUB_OUTPUT: out,
        GITHUB_REPOSITORY: 'o/r',
        GH_TOKEN: 'x',
        ...env,
      } as NodeJS.ProcessEnv,
    }
  );
  const outputs = Object.fromEntries(
    fs
      .readFileSync(out, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
  );
  const handed = fs.existsSync(path.join(ws, 'handed'))
    ? fs.readFileSync(path.join(ws, 'handed'), 'utf8').trim().split('|')
    : null;
  return { status: r.status, outputs, stderr: r.stderr, handed };
}

const jobsJson = (refresh: string) =>
  JSON.stringify({
    jobs: [
      { name: 'decide', conclusion: 'success', steps: [] },
      { name: 'refresh', conclusion: refresh, steps: [] },
    ],
  });
const run = (id: number, createdAt: string, conclusion = 'success'): Run => ({
  databaseId: id,
  conclusion,
  status: 'completed',
  createdAt,
  displayTitle: 'Market Refresh (weekly)',
});

describe('the decide step, run as on Actions', () => {
  // the reviewer's sequence: a manual refresh on Friday, then a Tuesday the 5-day rule skipped
  const runs = [run(2, '2026-11-24T13:00:00Z'), run(1, '2026-11-20T10:00:00Z')];

  it("should refresh on Wednesday when Tuesday's run only skipped", () => {
    const r = decide(
      runs,
      { 1: jobsJson('success'), 2: jobsJson('skipped') },
      {
        RETRY_SCHEDULE: 'true',
        SCHEDULED: 'true',
      }
    );
    expect(r.status, r.stderr).toBe(0);
    // run 1 refreshed; run 2 ended "success" but only skipped: it must not be handed on as done
    // (the decision itself, at a fixed clock, is retry-decision's unit tests)
    expect(r.handed).toEqual([',1', '']);
    expect(r.outputs.run).toMatch(/^(true|false)$/);
  }, 30_000);

  it('should fail the step, not guess, when a run cannot be read', () => {
    const r = decide(
      runs,
      { 1: jobsJson('success'), 2: null },
      { RETRY_SCHEDULE: 'true', SCHEDULED: 'true' }
    );
    expect(r.status).not.toBe(0);
    expect(r.outputs.run).toBeUndefined();
    expect(r.handed).toBeNull(); // the decision script never ran on a partial list
  }, 30_000);
});
