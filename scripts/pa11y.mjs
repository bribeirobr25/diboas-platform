#!/usr/bin/env node
/**
 * pa11y.mjs — single-source-of-truth pa11y runner.
 *
 * Reads `apps/web/.pa11yci.json` and runs `pa11y` against each URL with the
 * config's `defaults` applied. Converges the previously dual pa11y systems
 * (hardcoded URL chain in `apps/web/package.json` vs the JSON config) so
 * adding a new route only requires touching the JSON.
 *
 * Workaround for `pa11y-ci`'s broken transitive `globby@6` dep that fails on
 * modern Node; this 50-line wrapper replaces the third-party tool.
 */
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(__dirname, '../apps/web');
const configPath = resolve(webDir, '.pa11yci.json');
const pa11yBin = resolve(webDir, 'node_modules/.bin/pa11y');

const config = JSON.parse(await readFile(configPath, 'utf8'));
const standard = config.defaults?.standard ?? 'WCAG2AA';
const runner = config.defaults?.runners?.[0] ?? 'axe';
const urls = config.urls ?? [];

if (urls.length === 0) {
  console.error('No URLs found in .pa11yci.json');
  process.exit(1);
}

let failCount = 0;
for (const entry of urls) {
  const url = typeof entry === 'string' ? entry : entry.url;
  process.stdout.write(`\n→ ${url}\n`);
  const code = await new Promise((res) => {
    const proc = spawn(
      pa11yBin,
      [
        '--standard', standard,
        '--runner', runner,
        '--level-cap-when-needs-review', 'warning',
        url,
      ],
      { stdio: 'inherit', cwd: webDir },
    );
    proc.on('exit', (c) => res(c ?? 0));
  });
  if (code !== 0) failCount++;
}

if (failCount > 0) {
  console.error(`\n✗ pa11y failed on ${failCount} of ${urls.length} URL(s)`);
  process.exit(1);
}
console.log(`\n✓ pa11y passed on all ${urls.length} URLs`);
