/**
 * STORE-ENV-1 · the store's writer token is reachable only from `main` (register 5.872;
 * founder 2026-11-11, DR-2026-11-11-market-cleanup-decisions item 1).
 *
 * Requirement: MARKET_DATA_TOKEN is an environment secret of `market-data`, whose deployment
 * branch rule admits `main` only. The one job that reads it (`market-data-collect.yml`
 * `collect`) declares that environment. A called workflow receives an environment secret
 * only when its caller passes it by name, and resolves it to an empty string otherwise
 * (GitHub docs, reusable workflows): the 2026-11-24 top-up ran with no token for that
 * reason (register 5.1030). So the called workflow declares the token `required: true`,
 * and every caller passes that one secret by name and nothing more (no `inherit`); the
 * value is still the environment's, because the job that reads it declares the
 * environment. No other workflow reads it. The branch rule itself lives in the repository
 * settings, outside the code: it was verified through the API when it was set
 * (2026-11-11) and is re-checked in the record of every PR that touches these files.
 *
 * Reads the workflow files only. Outside the weekly-gate directories (GATE-BOUND-1).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const WORKFLOWS = join(__dirname, '../../../../../../.github/workflows');
/** A workflow's text with its comment lines removed, so a comment can neither satisfy nor trip a check. */
const read = (name: string) =>
  readFileSync(join(WORKFLOWS, name), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
const workflowFiles = () => readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f));
const COLLECT = 'market-data-collect.yml';
const PASS_BY_NAME =
  /\n {4}secrets:\n {6}MARKET_DATA_TOKEN: \$\{\{ secrets\.MARKET_DATA_TOKEN \}\}\n/;

/** Each job block (two-space indent) of a workflow that calls the collection. */
function callerJobs(text: string): string[] {
  const jobs = text.slice(text.indexOf('\njobs:\n'));
  return jobs
    .split(/\n(?= {2}[A-Za-z0-9_-]+:\n)/)
    .filter((job) => job.includes(`uses: ./.github/workflows/${COLLECT}`));
}

describe('STORE-ENV-1: the store writer token is bound to the main-only environment', () => {
  const collect = read(COLLECT);

  it('should declare the market-data environment on the job that reads the token', () => {
    const job = collect.slice(collect.indexOf('\n  collect:\n'));
    const header = job.slice(0, job.indexOf('\n    steps:'));
    expect(header).toMatch(/\n {4}environment: market-data\n/);
    expect(job).toContain('${{ secrets.MARKET_DATA_TOKEN }}');
  });

  it('should require exactly the token from a caller when the workflow is called (5.1030)', () => {
    const call = collect.slice(
      collect.indexOf('\n  workflow_call:'),
      collect.indexOf('\npermissions:')
    );
    const secrets = call.slice(call.indexOf('\n    secrets:\n'));
    expect(call).toMatch(/\n {4}secrets:\n {6}MARKET_DATA_TOKEN:\n {8}required: true\n/);
    // nothing but the token is declared under secrets (the next key is back at four spaces)
    const declared = secrets.slice(1).split(/\n(?= {4}\S)/)[0];
    expect(declared.match(/\n {6}[A-Z0-9_]+:/g)).toEqual(['\n      MARKET_DATA_TOKEN:']);
  });

  it('should pass the token by name, and nothing else, from every caller (5.1030)', () => {
    const callers = workflowFiles().flatMap((f) => callerJobs(read(f)).map((job) => ({ f, job })));
    expect(callers.map(({ f }) => f)).toEqual(['market-refresh-weekly.yml']);
    for (const { job } of callers) {
      expect(job).toMatch(PASS_BY_NAME);
      expect(job).not.toMatch(/secrets:\s*inherit/);
      expect(job.match(/\$\{\{ secrets\.[A-Z0-9_]+ \}\}/g)).toEqual([
        '${{ secrets.MARKET_DATA_TOKEN }}',
      ]);
    }
  });

  it('should name the token in no other workflow, and in the caller only inside the call', () => {
    const named = workflowFiles().filter((f) => /secrets\.MARKET_DATA_TOKEN\b/.test(read(f)));
    expect(named.sort()).toEqual([COLLECT, 'market-refresh-weekly.yml']);
    const weekly = read('market-refresh-weekly.yml');
    const outsideCalls = callerJobs(weekly).reduce((rest, job) => rest.replace(job, ''), weekly);
    expect(outsideCalls).not.toMatch(/secrets\.MARKET_DATA_TOKEN\b/);
  });
});
