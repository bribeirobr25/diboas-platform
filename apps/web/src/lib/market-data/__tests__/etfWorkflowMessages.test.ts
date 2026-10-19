/**
 * The weekly workflow's ETF wording, executed (2026-10-19).
 *
 * Two messages were wrong. With the suspension state unreadable, the PR body
 * fell into the "not suspended" branch and promised that ETF-01 "publishes
 * UNAVAILABLE (gapped)" unless re-run before Friday. And for a week that
 * already has an INCOMPLETE ledger record (2026-10-16), it said "a later
 * complete collection for the same week is still accepted", which the
 * preservation rule does not allow.
 *
 * This test runs the workflow's own `run:` scripts with bash, under GitHub's
 * shell flags (`bash --noprofile --norc -eo pipefail`): the ETF step, then the
 * PR-body step fed with the ETF step's outputs. For the refused, unknown and
 * incomplete-record cases the ETF step runs the REAL `run.mjs` against a
 * throw-away copy of the scripts, a synthetic ledger, a fixed clock and a stub
 * network (`fixtures/etfSnapshotNetworkStub.mjs`), so the exit code, the
 * ledger bytes and the evidence file are measured, not assumed. The success
 * case replaces only the snapshot command with a zero exit: on this branch a
 * successful `--etf-snapshot` continues into the full pipeline, which cannot
 * run offline.
 *
 * Rules only; nothing under apps/web/data is read or written.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import {
  ETF_SHARES_ARCHIVE,
  ETF_SNAPSHOT_ATTEMPTS,
  ETF_SNAPSHOT_EXIT,
} from '../../../../scripts/market-refresh/lib/etf-flows.mjs';
import { REPO_ROOT } from '../../../../scripts/market-refresh/providers/inrepo.mjs';

const WEB = path.join(__dirname, '../../../..');
const REPO = path.join(WEB, '../..');
const SCRIPTS = path.join(WEB, 'scripts/market-refresh');
const STUB = pathToFileURL(
  path.join(WEB, 'src/lib/market/__tests__/fixtures/etfSnapshotNetworkStub.mjs')
).href;
const WORKFLOW = fs.readFileSync(
  path.join(REPO, '.github/workflows/market-refresh-weekly.yml'),
  'utf8'
);
const SNAPSHOT_CMD = 'node apps/web/scripts/market-refresh/run.mjs --etf-snapshot --no-archive';
const SUSPENSION_MODULE = './apps/web/scripts/market-refresh/lib/etf-suspension.mjs';
const FUNDS = [
  'IBIT',
  'FBTC',
  'GBTC',
  'BTC',
  'ARKB',
  'BITB',
  'HODL',
  'BTCO',
  'EZBC',
  'BRRR',
  'BTCW',
];

/** A named step's whole YAML block, from its `- name:` to the next step. */
function stepBlock(name: string): string {
  const start = WORKFLOW.indexOf(`- name: ${name}`);
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1);
  const rest = WORKFLOW.slice(start);
  const next = rest.slice(1).search(/\n {6}- (name|uses):/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

/** The `run: |` block of a named step, dedented. */
function runScript(name: string): string {
  const start = WORKFLOW.indexOf(`- name: ${name}`);
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1);
  const rest = WORKFLOW.slice(start);
  const next = rest.slice(1).search(/\n {6}- (name|uses):/);
  const step = next === -1 ? rest : rest.slice(0, next + 1);
  const lines = step.split('\n');
  // A one-line `run: <command>` (the core step) as well as a `run: |` block.
  const inline = lines.map((l) => /^\s*run: (?!\|)(.+)$/.exec(l)).find(Boolean);
  if (inline) return inline[1];
  const at = lines.findIndex((l) => /^\s*run: \|\s*$/.test(l));
  expect(at, `step "${name}" has no run block`).toBeGreaterThan(-1);
  const indent = lines[at].search(/\S/) + 2;
  return lines
    .slice(at + 1)
    .filter((l) => l.trim() === '' || l.search(/\S/) >= indent)
    .map((l) => l.slice(indent))
    .join('\n');
}

/** `${{ steps.<id>.outputs.<k> }}` → value; `${{ env.X }}`/others → ''. */
function expand(script: string, outputs: Record<string, string>): string {
  return script.replace(/\$\{\{\s*([^}]+?)\s*\}\}/g, (_, expr: string) => {
    const m = /^steps\.etf\.outputs\.(\w+)$/.exec(expr);
    if (m) return outputs[m[1]] ?? '';
    if (expr === 'steps.memo.outputs.status') return 'ok';
    return '';
  });
}

function bash(script: string, cwd: string, env: Record<string, string>) {
  return spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], {
    cwd,
    encoding: 'utf8',
    // A clean environment: nothing from the developer's shell leaks in.
    env: {
      NODE_ENV: 'test',
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      ...env,
    } as NodeJS.ProcessEnv,
    timeout: 30_000,
  });
}

const parseOutputs = (file: string) =>
  Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
  ) as Record<string, string>;

const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});
const sha = (p: string) =>
  fs.existsSync(p) ? createHash('sha256').update(fs.readFileSync(p)).digest('hex') : 'absent';

const fund = (shares: number | null) => ({ shares, price: 40, lastUpdated: null });
const record = (anchor: string, shares: number | null) => ({
  anchor,
  funds: Object.fromEntries(FUNDS.map((t, i) => [t, fund(shares === null ? null : shares + i)])),
});

/** The step's `env:` mapping, resolved from the ETF outputs (as GitHub does). */
function stepEnv(name: string, outputs: Record<string, string>): Record<string, string> {
  const start = WORKFLOW.indexOf(`- name: ${name}`);
  const step = WORKFLOW.slice(start, WORKFLOW.indexOf('run: |', start));
  const env: Record<string, string> = {};
  const block = /\n {8}env:\n((?: {10}[^\n]*\n)+)/.exec(step);
  for (const line of block?.[1].split('\n') ?? []) {
    const m = /^ {10}([A-Z_]+): (.+)$/.exec(line);
    if (m) env[m[1]] = expand(m[2], outputs);
  }
  return env;
}

/** A throw-away repo root: the scripts, and a ledger whose latest record is incomplete. */
function sandbox(suspended: boolean) {
  // realpath: macOS reaches the temp dir through the /var -> /private/var symlink.
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'etf-workflow-')));
  dirs.push(root);
  fs.cpSync(SCRIPTS, path.join(root, 'apps/web/scripts/market-refresh'), { recursive: true });
  // The suspension switch is SET per case in the copy, never read from the
  // committed one: both states are exercised, and a future decision to
  // reactivate ETF-01 does not turn these tests red.
  const switchFile = path.join(root, 'apps/web/scripts/market-refresh/lib/etf-suspension.mjs');
  const src = fs.readFileSync(switchFile, 'utf8');
  expect(src.match(/ {2}active: (true|false),/g)).toHaveLength(1);
  fs.writeFileSync(switchFile, src.replace(/ {2}active: (true|false),/, `  active: ${suspended},`));
  // The sandbox mirrors where the pipeline itself writes (its own constants),
  // so this test never names, reads or writes the committed artefacts.
  const ledger = path.join(root, path.relative(REPO_ROOT, ETF_SHARES_ARCHIVE));
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  fs.writeFileSync(
    ledger,
    [record('2026-10-09', 1_000_000), record('2026-10-16', null)]
      .map((r) => `${JSON.stringify(r)}\n`)
      .join('')
  );
  return {
    root,
    ledger,
    attempts: path.join(root, path.relative(REPO_ROOT, ETF_SNAPSHOT_ATTEMPTS)),
  };
}

type Case = {
  now: string;
  suspended?: boolean; // default true
  completePull?: boolean; // the stub returns share counts for every fund
  snapshotExit?: number; // replace the snapshot command with this exit (synthetic cases only)
  breakSuspensionLookup?: boolean;
};

/** Run the ETF step, then the PR-body step with its outputs. */
function runWorkflow(c: Case) {
  const box = sandbox(c.suspended ?? true);
  const outputsFile = path.join(box.root, 'github-output');
  const runnerTemp = path.join(box.root, 'runner-temp');
  fs.mkdirSync(runnerTemp);
  fs.writeFileSync(outputsFile, '');
  const netLog = path.join(box.root, 'net.log');
  fs.writeFileSync(netLog, '');
  let etf = runScript('ETF-01 weekly snapshot (optional leg)');
  expect(etf).toContain(SNAPSHOT_CMD);
  if (c.snapshotExit !== undefined) etf = etf.replace(SNAPSHOT_CMD, `(exit ${c.snapshotExit})`);
  if (c.breakSuspensionLookup) {
    expect(etf).toContain(SUSPENSION_MODULE);
    etf = etf.replace(SUSPENSION_MODULE, './apps/web/scripts/market-refresh/lib/absent.mjs');
  }
  const ledgerBefore = sha(box.ledger);
  const step = bash(etf, box.root, {
    GITHUB_OUTPUT: outputsFile,
    POLYGON_API_KEY: 'test-dummy-key',
    NODE_OPTIONS: `--import=${STUB}`,
    SNAPSHOT_STUB_LOG: netLog,
    SNAPSHOT_STUB_NOW: c.now,
    SNAPSHOT_STUB_FIXTURE: JSON.stringify({
      funds: Object.fromEntries(
        FUNDS.map((t, i) => [t, { shares: c.completePull ? 2_000_000 + i : null, price: 40 }])
      ),
    }),
  });
  const outputs = parseOutputs(outputsFile);
  const body = bash(expand(runScript('Compose PR body'), outputs), box.root, {
    RUNNER_TEMP: runnerTemp,
    ...stepEnv('Compose PR body', outputs),
  });
  expect(body.status, body.stderr).toBe(0);
  return {
    step,
    outputs,
    log: step.stdout,
    body: fs.readFileSync(path.join(runnerTemp, 'pr-body.md'), 'utf8'),
    ledgerUnchanged: sha(box.ledger) === ledgerBefore,
    ledgerAnchors: fs
      .readFileSync(box.ledger, 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l).anchor as string),
    attempts: fs.existsSync(box.attempts)
      ? fs.readFileSync(box.attempts, 'utf8').trim().split('\n')
      : [],
    requests: fs.readFileSync(netLog, 'utf8').trim().split('\n').filter(Boolean),
  };
}

/** Claims no run can establish: a consequence, a deadline, or a back-fill verdict. */
const UNPROVEN =
  /before Friday|re-run|publishes UNAVAILABLE|will be gapped|cannot be back-?filled/i;
const RETRY = 'A later complete collection for this week can still be accepted.';
/** The title for outcomes that ESTABLISH that no complete snapshot was recorded (20, 21). */
const NOT_RECORDED_TITLE = 'ETF-01 collection did not record a complete snapshot this week';
const ERROR_TITLE = 'ETF-01 collection step ended with an error';
/** Any ETF section heading the PR body can carry. */
const ETF_HEADING = '## ETF-01 collection';
/** A claim that nothing was recorded: never allowed when the outcome is unknown. */
const CLAIMS_NOTHING_RECORDED =
  /did not record|no (complete )?snapshot (was )?recorded|nothing (was )?recorded|before anything was recorded|not added to the ledger/i;
/** The PR body's ETF section only: the rest (memo, override instructions) is not this rule's. */
function etfSection(body: string): string {
  const at = body.indexOf(ETF_HEADING);
  expect(at, 'no ETF section in the PR body').toBeGreaterThan(-1);
  const end = body.indexOf('**Review the plain-language summary', at);
  return body.slice(at, end === -1 ? undefined : end);
}

describe('the weekly workflow ETF wording, executed', () => {
  it('maps the exit codes it relies on to the ones run.mjs uses', () => {
    const etf = runScript('ETF-01 weekly snapshot (optional leg)');
    expect(etf).toContain(`${ETF_SNAPSHOT_EXIT.refused}) outcome=refused ;;`);
    expect(etf).toContain(`${ETF_SNAPSHOT_EXIT.incompleteRecord}) outcome=incomplete-record ;;`);
  });

  it('keeps the core refresh unconditional on the ETF step (the other signals are processed)', () => {
    // The WHOLE step block: YAML key order is free, so an `if:` written after
    // `run:` must be seen too.
    expect(stepBlock('Refresh pipeline (fetch → gate → compute → archive)')).not.toMatch(/\bif:/);
  });

  it('suspended + an incomplete pull: refused, kept as evidence, retry stated, no consequence promised', () => {
    const r = runWorkflow({ now: '2026-10-26T06:20:00Z' }); // anchor 2026-10-23
    expect(r.step.status).toBe(0); // fail-open: the job carries on
    expect(r.outputs).toMatchObject({ suspended: 'true', outcome: 'refused', status: 'failed' });
    expect(r.ledgerUnchanged).toBe(true);
    expect(r.attempts).toHaveLength(1);
    expect(JSON.parse(r.attempts[0])).toMatchObject({
      anchor: '2026-10-23',
      outcome: 'refused-incomplete',
    });
    expect(r.outputs.note).toContain('kept in etf-snapshot-attempts.jsonl');
    expect(r.outputs.note).toContain(RETRY);
    expect(r.outputs.note).toContain(
      'ETF-01 is suspended, so the score and the other signals are unaffected.'
    );
    expect(r.log).toContain(`::warning::${r.outputs.note}`);
    expect(etfSection(r.body)).toContain(r.outputs.note);
    expect(etfSection(r.body)).not.toMatch(UNPROVEN);
    expect(etfSection(r.body)).not.toMatch(/gapped/i);
  });

  it('suspension state unreadable: neutral wording, no gapped verdict, other signals continue', () => {
    const r = runWorkflow({ now: '2026-10-26T06:20:00Z', breakSuspensionLookup: true });
    expect(r.step.status).toBe(0);
    expect(r.outputs).toMatchObject({ suspended: 'unknown', outcome: 'refused', status: 'failed' });
    expect(r.outputs.title).toBe(NOT_RECORDED_TITLE);
    expect(etfSection(r.body)).toMatch(new RegExp(`^## ${NOT_RECORDED_TITLE}\n`));
    expect(r.outputs.note).toContain(
      'The suspension state could not be read in this run. The core refresh and the other signals continue.'
    );
    expect(etfSection(r.body)).toContain(r.outputs.note);
    expect(etfSection(r.body)).not.toMatch(UNPROVEN);
    expect(etfSection(r.body)).not.toMatch(/gapped|UNAVAILABLE/i);
    expect(r.ledgerUnchanged).toBe(true);
  });

  it('a week already in the ledger as INCOMPLETE: preserved, not collected again, no retry promised', () => {
    const r = runWorkflow({ now: '2026-10-19T13:14:00Z' }); // anchor 2026-10-16, already recorded
    expect(r.step.status).toBe(0);
    expect(r.outputs).toMatchObject({
      suspended: 'true',
      outcome: 'incomplete-record',
      status: 'failed',
    });
    expect(r.ledgerUnchanged).toBe(true);
    expect(r.attempts).toEqual([]); // nothing new was collected, so no evidence row
    expect(r.requests).toEqual([]); // and no request was made
    expect(r.outputs.note).toContain('preserved as written');
    expect(r.outputs.note).toContain('does not collect this week again');
    expect(r.outputs.note).not.toContain(RETRY);
    expect(etfSection(r.body)).not.toMatch(/can still be accepted|still accepted/i);
    expect(etfSection(r.body)).toContain(r.outputs.note);
    expect(etfSection(r.body)).not.toMatch(UNPROVEN);
  });

  it('a successful collection: no warning, no ETF section in the PR body', () => {
    const r = runWorkflow({ now: '2026-10-26T06:20:00Z', snapshotExit: 0 });
    expect(r.step.status).toBe(0);
    expect(r.outputs).toMatchObject({ outcome: 'ok', status: 'ok' });
    expect(r.outputs.note).toBeUndefined();
    expect(r.log).not.toContain('::warning::');
    expect(r.body).not.toContain(ETF_HEADING);
    expect(r.body).not.toMatch(/ETF-01/);
    expect(r.ledgerUnchanged).toBe(true);
  });

  it('not suspended + an incomplete pull: no scoring consequence promised', () => {
    const r = runWorkflow({ now: '2026-10-26T06:20:00Z', suspended: false });
    expect(r.step.status).toBe(0);
    expect(r.outputs).toMatchObject({ suspended: 'false', outcome: 'refused', status: 'failed' });
    expect(r.outputs.note).toContain(
      'The core refresh and the other signals continue. ETF-01 is scored from complete records only.'
    );
    expect(etfSection(r.body)).toContain(r.outputs.note);
    expect(etfSection(r.body)).not.toMatch(UNPROVEN);
    expect(etfSection(r.body)).not.toMatch(/gapped|UNAVAILABLE/i);
    expect(r.ledgerUnchanged).toBe(true);
  });

  it('a complete snapshot recorded, then the rest of the run failed: no ETF warning, the week stands', () => {
    // The real run.mjs: it records the week, then the full pipeline it continues
    // into is refused by the stub network (exit 22). Nothing may say the week
    // was not recorded.
    const r = runWorkflow({ now: '2026-10-26T06:20:00Z', completePull: true });
    expect(r.step.status).toBe(0);
    expect(r.outputs).toMatchObject({ outcome: 'recorded', status: 'ok' });
    expect(r.ledgerAnchors).toEqual(['2026-10-09', '2026-10-16', '2026-10-23']);
    expect(r.log).toContain('::notice::ETF-01 snapshot recorded for this week.');
    expect(r.log).not.toContain('::warning::');
    expect(r.body).not.toContain(ETF_HEADING);
    expect(r.attempts).toEqual([]);
  });

  it('a generic error: title and note neutral in the log AND the PR body, never "nothing recorded"', () => {
    const r = runWorkflow({ now: '2026-10-26T06:20:00Z', snapshotExit: 1 });
    expect(r.step.status).toBe(0);
    expect(r.outputs).toMatchObject({ outcome: 'error', status: 'failed', title: ERROR_TITLE });
    const note =
      `${ERROR_TITLE}. Whether this week's snapshot was recorded is not established by this run ` +
      `(see this step's log). ETF-01 is suspended, so the score and the other signals are unaffected.`;
    expect(r.outputs.note).toBe(note);
    // The full message, in the log and in the PR body, title included.
    expect(r.log).toContain(`::warning::${note}`);
    expect(etfSection(r.body)).toBe(`## ${ERROR_TITLE}\n\n${note}\n\n`);
    expect(r.log).not.toMatch(CLAIMS_NOTHING_RECORDED);
    expect(etfSection(r.body)).not.toMatch(CLAIMS_NOTHING_RECORDED);
    expect(etfSection(r.body)).not.toMatch(/can still be accepted/i);
    expect(etfSection(r.body)).not.toMatch(UNPROVEN);
  });

  it('keeps a failure of the core refresh step blocking the workflow', () => {
    // The ETF step is fail-open; the core step must not be. Executed: its own
    // script with the pipeline command failing, under GitHub's shell flags.
    // Neither the step (whole block, any key order) nor the job may turn its
    // failure into a pass.
    expect(stepBlock('Refresh pipeline (fetch → gate → compute → archive)')).not.toMatch(
      /continue-on-error/
    );
    const job = WORKFLOW.slice(WORKFLOW.indexOf('\njobs:'), WORKFLOW.indexOf('\n    steps:'));
    expect(job).toContain('  refresh:');
    expect(job).not.toMatch(/continue-on-error/);
    const script = runScript('Refresh pipeline (fetch → gate → compute → archive)');
    expect(script).toContain('node apps/web/scripts/market-refresh/run.mjs --append-btc');
    expect(script).not.toMatch(/\|\| *true|\|\| *:|set \+e/);
    const r = bash(
      script.replace('node apps/web/scripts/market-refresh/run.mjs --append-btc', '(exit 1)'),
      os.tmpdir(),
      {}
    );
    expect(r.status).not.toBe(0);
  });
});
