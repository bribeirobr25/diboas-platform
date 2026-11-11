/**
 * STORE-ENV-1 · the store's writer token is reachable only from `main` (register 5.872;
 * founder 2026-11-11, DR-2026-11-11-market-cleanup-decisions item 1).
 *
 * Requirement: MARKET_DATA_TOKEN is an environment secret of `market-data`, whose deployment
 * branch rule admits `main` only. The one job that reads it (`market-data-collect.yml`
 * `collect`) declares that environment; nothing passes the token in from a caller (a
 * workflow_call cannot carry an environment secret, and a passed repository secret would
 * bypass the branch rule); no other workflow reads it. The branch rule itself lives in the
 * repository settings, outside the code: it was verified through the API when it was set
 * (2026-11-11) and is re-checked in the record of every PR that touches these files.
 *
 * Reads the workflow files only. Outside the weekly-gate directories (GATE-BOUND-1).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const WORKFLOWS = join(__dirname, '../../../../../../.github/workflows');
const read = (name: string) => readFileSync(join(WORKFLOWS, name), 'utf8');

describe('STORE-ENV-1: the store writer token is bound to the main-only environment', () => {
  const collect = read('market-data-collect.yml');

  it('should declare the market-data environment on the job that reads the token', () => {
    const job = collect.slice(collect.indexOf('\n  collect:\n'));
    const header = job.slice(0, job.indexOf('\n    steps:'));
    expect(header).toMatch(/\n {4}environment: market-data\n/);
    expect(job).toContain('${{ secrets.MARKET_DATA_TOKEN }}');
  });

  it('should not accept the token from a caller when the workflow is called', () => {
    const call = collect.slice(
      collect.indexOf('\n  workflow_call:'),
      collect.indexOf('\npermissions:')
    );
    expect(call).not.toMatch(/\n {4}secrets:/);
    expect(call).not.toMatch(/MARKET_DATA_TOKEN:/);
  });

  it('should pass no secrets when the weekly refresh calls the collection', () => {
    const weekly = read('market-refresh-weekly.yml');
    const topup = weekly.slice(weekly.indexOf('\n  topup:'), weekly.indexOf('\n  refresh:'));
    expect(topup).toContain('uses: ./.github/workflows/market-data-collect.yml');
    expect(topup).not.toMatch(/\n {4}secrets:/);
  });

  it('should read the token in no other workflow', () => {
    const readers = readdirSync(WORKFLOWS)
      .filter((f) => /\.ya?ml$/.test(f))
      .filter((f) => /secrets\.MARKET_DATA_TOKEN\b/.test(read(f)));
    expect(readers).toEqual(['market-data-collect.yml']);
  });
});
