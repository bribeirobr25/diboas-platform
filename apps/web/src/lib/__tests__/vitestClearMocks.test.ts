/**
 * Every workspace's Vitest config states `clearMocks: true` (fifteenth audit D-2). Vitest 5 made
 * it the default; before, only apps/web cleared mocks (in its setup), so the other workspaces'
 * mock semantics changed silently with the upgrade. Written out, a future default change cannot
 * move them again unnoticed. Comments are stripped before reading (5.623).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { stripComments } from '@diboas/test-support';
import { describe, expect, it } from 'vitest';

const REPO = resolve(__dirname, '../../../../..');

function vitestConfigs(): string[] {
  return ['apps', 'packages'].flatMap((top) =>
    readdirSync(join(REPO, top)).flatMap((name) =>
      ['vitest.config.mts', 'vitest.config.ts']
        .map((f) => join(top, name, f))
        .filter((rel) => existsSync(join(REPO, rel)))
    )
  );
}

describe('Vitest configs state clearMocks (fifteenth audit D-2)', () => {
  it('should find a config in every workspace with tests', () => {
    expect(vitestConfigs().length).toBeGreaterThanOrEqual(6);
  });

  it('should set clearMocks: true in every one', () => {
    const missing = vitestConfigs().filter(
      (rel) => !/\bclearMocks:\s*true\b/.test(stripComments(readFileSync(join(REPO, rel), 'utf8')))
    );
    expect(missing).toEqual([]);
  });
});
