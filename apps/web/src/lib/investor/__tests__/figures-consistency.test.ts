/**
 * CI consistency gate (L2) for the investor figures registry — asserts the
 * committed registry and the committed generated investor-docs.json artifacts
 * agree, on every test run (validate:market-data fixtures precedent).
 *
 * The full gate incl. local-only canon checks (FEES.md, DECISION_LOG.md) runs
 * via `pnpm validate:investor-figures`; those sources are not git-tracked, so
 * this test covers exactly the CI-safe subset.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateRegistryShape,
  checkGeneratedArtifacts,
  checkStatsBlocks,
} from '../../../../../../scripts/lib/investor-figures.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const LOCALES = ['en', 'pt-BR', 'de', 'es'] as const;

const registry = JSON.parse(readFileSync(resolve(ROOT, 'config/investor-figures.json'), 'utf8'));

const artifacts: Record<string, string> = {};
for (const locale of LOCALES) {
  artifacts[locale] = readFileSync(
    resolve(ROOT, `packages/i18n/translations/${locale}/investor-docs.json`),
    'utf8'
  );
}

describe('investor figures registry (committed state)', () => {
  it('should have a structurally valid registry', () => {
    expect(validateRegistryShape(registry)).toEqual([]);
  });

  it('should keep every registry figure sourced and dated', () => {
    for (const [id, fig] of Object.entries<Record<string, unknown>>(registry.figures)) {
      expect(fig.source, `figure ${id} needs a source`).toBeTruthy();
      expect(fig.asOf, `figure ${id} needs an asOf date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('should keep committed investor-docs artifacts consistent with the registry', () => {
    expect(checkGeneratedArtifacts(registry, artifacts)).toEqual([]);
  });

  it('should keep every committed stats band well-formed', () => {
    expect(checkStatsBlocks(artifacts)).toEqual([]);
  });
});
