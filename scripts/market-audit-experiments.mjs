/**
 * Bounded adversarial experiments. No provider access, no credentials, no edits
 * to repository data or implementation. Every mutation lives in a temp copy.
 * Usage: node scripts/market-audit-experiments.mjs [--memo-only]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { sanitizeAuditEvidence } from './market-audit-evidence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'apps/web');
const SCRIPTS = path.join(WEB, 'scripts/market-refresh');
const VITEST = path.join(WEB, 'node_modules/vitest/vitest.mjs');
const TEST = 'src/lib/market/__tests__/experimentalAudit.test.ts';
const dirs = [];
const started = performance.now();
const temp = () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'market-audit-proof-')));
  dirs.push(dir);
  return dir;
};
const hashTree = (dir) => {
  const hash = createHash('sha256');
  const walk = (d) => {
    for (const item of fs
      .readdirSync(d, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, item.name);
      if (item.isDirectory()) walk(p);
      else hash.update(path.relative(dir, p)).update(fs.readFileSync(p));
    }
  };
  walk(dir);
  return hash.digest('hex');
};
function run(cwd, args, extraEnv = {}) {
  const output = path.join(temp(), 'result.json');
  const start = performance.now();
  const result = spawnSync(
    process.execPath,
    [VITEST, 'run', ...args, '--reporter=json', `--outputFile=${output}`],
    {
      cwd,
      encoding: 'utf8',
      timeout: 30_000,
      env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test', TZ: 'UTC', ...extraEnv },
    }
  );
  if (result.error) throw result.error;
  if (!fs.existsSync(output)) throw new Error(`No structured results: ${result.stderr}`);
  const json = JSON.parse(fs.readFileSync(output, 'utf8'));
  return {
    status: result.status,
    seconds: Number(((performance.now() - start) / 1000).toFixed(3)),
    passed: json.numPassedTests,
    failed: json.numFailedTests,
    failures: json.testResults
      .flatMap((f) => f.assertionResults)
      .filter((t) => t.status === 'failed')
      .map((t) => ({
        name: t.fullName,
        message: t.failureMessages.join('\n').replace(/\u001b\[[0-9;]*m/g, ''),
      })),
  };
}
const mutations = [
  {
    id: 'M06',
    file: 'run.mjs',
    needle: 'await maybeSnapshotEtfShares();\n    return;',
    replacement: 'await maybeSnapshotEtfShares();',
    test: 'A03',
    expected: /expected.*deeply equal \[\]/s,
  },
  {
    id: 'M01',
    file: 'lib/etf-flows.mjs',
    needle: 'if (!isCompleteSnapshot(snap)) {',
    replacement: 'if (false) {',
    test: 'A01',
    expected: /refused.*recorded|recorded.*refused/s,
  },
  {
    id: 'M02',
    file: 'lib/etf-flows.mjs',
    needle: 'if (ETF01_SUSPENSION.active) return [suspendedEtfSignal(snapshots)];',
    replacement: 'if (false) return [suspendedEtfSignal(snapshots)];',
    test: 'B01',
    expected: /suspended/,
  },
  {
    id: 'M03',
    file: 'lib/data-status.mjs',
    needle: 'cov.latestCompleteAnchor ?? snapshots[0]?.anchor ?? ymd(run)',
    replacement: 'cov.latestRecordAnchor ?? snapshots[0]?.anchor ?? ymd(run)',
    test: 'B02',
    expected: /2026-10-09/,
  },
  {
    id: 'M04',
    file: 'lib/etf-flows.mjs',
    needle: "return { outcome: 'already-recorded' };",
    replacement:
      "fs.appendFileSync(ledgerPath, JSON.stringify(snap) + '\\n'); return { outcome: 'already-recorded' };",
    test: 'A02',
    expected: /expected.*to be/s,
  },
  {
    id: 'M05',
    file: 'lib/template-select.mjs',
    needle: 'if (!byLocale[locale]) {',
    replacement: 'if (!byLocale[locale]) return set[locale]; if (false) {',
    test: 'C01',
    expected: /to throw/,
  },
];
const report = {
  seed: 20261020,
  sequenceLimit: 200,
  childTimeoutMs: 30000,
  mutations: [],
  memo: [],
};
const before = hashTree(SCRIPTS);
try {
  if (!process.argv.includes('--memo-only')) {
    for (const m of mutations) {
      const control = run(WEB, [TEST, '-t', m.test]);
      if (control.status !== 0 || control.passed < 1)
        throw new Error(`${m.id}: control did not pass`);
      const copy = path.join(temp(), 'market-refresh');
      fs.cpSync(SCRIPTS, copy, { recursive: true });
      const file = path.join(copy, m.file);
      const text = fs.readFileSync(file, 'utf8');
      if (text.split(m.needle).length !== 2) throw new Error(`${m.id}: mutation target not unique`);
      fs.writeFileSync(file, text.replace(m.needle, m.replacement));
      const mutant = run(WEB, [TEST, '-t', m.test], { MARKET_AUDIT_SCRIPTS: copy });
      const caught =
        mutant.status !== 0 &&
        mutant.failed > 0 &&
        mutant.failures.some((f) => f.name.includes(m.test) && m.expected.test(f.message));
      report.mutations.push({
        id: m.id,
        test: m.test,
        caught,
        controlSeconds: control.seconds,
        mutantSeconds: mutant.seconds,
        failedAssertions: mutant.failed,
        evidence: mutant.failures.map((f) => ({
          name: f.name,
          message: f.message.split('\n').slice(0, 8).join('\n'),
        })),
      });
      if (!caught) throw new Error(`${m.id}: not caught by the intended assertion`);
    }
  }

  // Execute the EXISTING gate, not a reimplementation of its regex.
  const gate = 'src/lib/market-data/__tests__/memoFigureReconciliation.test.ts';
  const words = {
    en: 'The score is fourteen out of fourteen.',
    'pt-BR': 'O score é quatorze de quatorze.',
    es: 'La puntuación es catorce de catorce.',
    de: 'Der Score beträgt vierzehn von vierzehn.',
  };
  for (const mode of ['valid', 'invented-numeral', 'wrong-score-words', 'wrong-score-digits']) {
    const root = temp();
    fs.mkdirSync(path.dirname(path.join(root, gate)), { recursive: true });
    fs.copyFileSync(path.join(WEB, gate), path.join(root, gate));
    fs.writeFileSync(
      path.join(root, 'vitest.config.mjs'),
      "export default {test:{environment:'node'}};\n"
    );
    const shared = path.join(root, 'data/market/shared');
    fs.mkdirSync(shared, { recursive: true });
    fs.writeFileSync(
      path.join(shared, 'computed.json'),
      JSON.stringify({
        computed_at: '2026-10-19T06:20:00Z',
        score: 10,
        signals: [{ id: 'ETF-01', state: 'UNAVAILABLE', detail: 'Synthetic suspension.' }],
      })
    );
    fs.writeFileSync(
      path.join(shared, 'regime.json'),
      JSON.stringify({
        score: 10,
        last_updated_at: '2026-10-19T06:20:00Z',
        summary: Object.fromEntries(
          Object.entries(words).map(([locale, text]) => [
            locale,
            {
              short:
                mode === 'wrong-score-words'
                  ? text
                  : mode === 'invented-numeral'
                    ? '99999.123%'
                    : mode === 'wrong-score-digits'
                      ? '14/14'
                      : '10/14',
              detailed: '',
              key_supportive_factors: [],
              key_headwinds: [],
            },
          ])
        ),
      })
    );
    const result = run(root, [gate, '--config', path.join(root, 'vitest.config.mjs')]);
    report.memo.push({
      mode,
      status: result.status,
      passed: result.passed,
      failed: result.failed,
      seconds: result.seconds,
    });
    const expectedFailures = mode === 'invented-numeral' ? 4 : 0;
    if (result.failed !== expectedFailures)
      throw new Error(`Memo ${mode}: behavior changed; reassess finding`);
  }
  report.sourceHashBefore = before;
  report.sourceHashAfter = hashTree(SCRIPTS);
  if (before !== report.sourceHashAfter)
    throw new Error('Source implementation changed during experiments');
  report.seconds = Number(((performance.now() - started) / 1000).toFixed(3));
  console.log(JSON.stringify(sanitizeAuditEvidence(report, ROOT), null, 2));
} finally {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
}
