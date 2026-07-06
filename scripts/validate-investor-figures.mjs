#!/usr/bin/env node
/**
 * validate-investor-figures.mjs — two-layer consistency gate for the investor
 * figures registry. Wired into `pnpm validate:all` as `validate:investor-figures`.
 *
 * L2 (always, CI-safe — committed artifacts only):
 *   - registry validates against config/investor-figures.schema.json (ajv)
 *   - no "{{fig:" residue in any committed investor-docs.json
 *   - forbidLiterals of ACTIVE figures absent from every investor-docs.json
 *   - protected literals (Year-1 users target) still present per locale
 *
 * L1 (local only — docs/full-view + docs/agents are NOT git-tracked, so these
 * checks auto-skip in CI with a notice):
 *   - every source:"FEES.md" figure's canonical values appear in the matching
 *     FEES.md table row
 *   - every DECISION_LOG# figure's entry heading + anchors exist in the log
 *
 * See docs/audit/FIGURES_REGISTRY_IMPLEMENTATION_PLAN_2026-07-06.md §0.5.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import {
  validateRegistryShape,
  checkGeneratedArtifacts,
  checkCanonicalSources,
} from './lib/investor-figures.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'pt-BR', 'de', 'es'];

const fail = (errors) => {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\nvalidate:investor-figures FAILED (${errors.length} error(s))`);
  process.exit(1);
};

// ── Load registry + schema ─────────────────────────────────────────────
const registry = JSON.parse(readFileSync(resolve(ROOT, 'config/investor-figures.json'), 'utf8'));
const schema = JSON.parse(
  readFileSync(resolve(ROOT, 'config/investor-figures.schema.json'), 'utf8')
);

// ── L2.1: schema validation (ajv, design-tokens precedent) ─────────────
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
if (!validate(registry)) {
  fail(validate.errors.map((e) => `schema: ${e.instancePath || '(root)'} ${e.message}`));
}
const shapeErrors = validateRegistryShape(registry);
if (shapeErrors.length) fail(shapeErrors.map((e) => `shape: ${e}`));

// ── L2.2-2.4: committed generated artifacts ────────────────────────────
const artifacts = {};
for (const locale of LOCALES) {
  artifacts[locale] = readFileSync(
    resolve(ROOT, `packages/i18n/translations/${locale}/investor-docs.json`),
    'utf8'
  );
}
const artifactErrors = checkGeneratedArtifacts(registry, artifacts);
if (artifactErrors.length) fail(artifactErrors);
console.log(
  `  ✓ L2: schema valid, ${Object.keys(registry.figures).length} figures, artifacts consistent (4 locales)`
);

// ── L1: canonical local-only sources (auto-skip in CI) ─────────────────
const feesPath = resolve(ROOT, 'docs/full-view/FEES.md');
const logPath = resolve(ROOT, 'docs/agents/DECISION_LOG.md');
const sources = {};
if (existsSync(feesPath)) sources.feesMd = readFileSync(feesPath, 'utf8');
if (existsSync(logPath)) sources.decisionLog = readFileSync(logPath, 'utf8');

if (!sources.feesMd && !sources.decisionLog) {
  console.log('  ○ L1: local-only canon (FEES.md / DECISION_LOG.md) not on disk — skipped (CI)');
} else {
  const sourceErrors = checkCanonicalSources(registry, sources);
  if (sourceErrors.length) fail(sourceErrors);
  console.log(
    `  ✓ L1: canon checks green (${sources.feesMd ? 'FEES.md' : ''}${sources.feesMd && sources.decisionLog ? ' + ' : ''}${sources.decisionLog ? 'DECISION_LOG.md' : ''})`
  );
}

console.log('\nvalidate:investor-figures OK');
