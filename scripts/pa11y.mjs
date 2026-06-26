#!/usr/bin/env node
/**
 * pa11y.mjs — accessibility scanner (Playwright + axe-core).
 *
 * History: this used to shell out to the `pa11y` CLI, but pa11y hardcodes
 * `page.goto(url, { waitUntil: 'networkidle2' })`. The content-rich marketing
 * pages (/, /about, /business, /strategies) keep >2 connections in flight well
 * past 120s on the 2-core CI runner (Next.js <Link> prefetch + client activity
 * that fires AFTER `load`), so `networkidle2` never settles and the scan times
 * out — even though the page is fully rendered and accessible (`load` fires in
 * ~0.3s; Lighthouse + the E2E suite load these same pages fine). pa11y exposes
 * no way to relax that wait, so we drive Playwright directly and scan on `load`.
 *
 * Reads the URL list from `apps/web/.pa11yci.json` (single source of truth —
 * adding a route only touches the JSON). Standard: WCAG 2.0/2.1 AA via axe tags.
 * Only axe `violations` fail the run; `incomplete` ("needs review") is ignored,
 * matching the previous `--level-cap-when-needs-review warning` behavior.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(__dirname, '../apps/web');
const configPath = resolve(webDir, '.pa11yci.json');

// Resolve runtime deps from the web app (where they're installed), not from this
// script's location at the repo root.
const require = createRequire(resolve(webDir, 'package.json'));
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const config = JSON.parse(await readFile(configPath, 'utf8'));
const timeout = config.defaults?.timeout ?? 120000;
const urls = (config.urls ?? []).map((e) => (typeof e === 'string' ? e : e.url));

// WCAG 2.x AA. (The config's `standard: 'WCAG2AA'` maps to these axe tags;
// wcag21aa is a superset that keeps parity with the project's stated WCAG 2.1 AA.)
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

if (urls.length === 0) {
  console.error('No URLs found in .pa11yci.json');
  process.exit(1);
}

// CI sets PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome (preinstalled).
// Locally, fall back to the `chrome` channel.
const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
} else {
  launchOptions.channel = 'chrome';
}

const browser = await chromium.launch(launchOptions);
let failCount = 0;

for (const url of urls) {
  process.stdout.write(`\n→ ${url}\n`);
  const context = await browser.newContext({ viewport: { width: 1280, height: 1024 } });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout });
    // Scan the SETTLED DOM (matches the prior pa11y networkidle behavior, so
    // results are identical for pages that settle — avoids catching transient
    // mid-hydration states like an accordion before its focus management wires
    // up). Capped, because the content-rich pages never reach network-idle on CI
    // (Next.js <Link> prefetch); for those we proceed after the cap. Hydration
    // is well finished by then, so transient a11y states have resolved.
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(300);

    const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();

    if (violations.length === 0) {
      console.log('  ✓ No accessibility violations');
    } else {
      failCount++;
      console.error(`  ✗ ${violations.length} violation(s):`);
      for (const v of violations) {
        const nodes = v.nodes.length;
        console.error(
          `    [${v.impact ?? 'n/a'}] ${v.id} — ${v.help} (${nodes} node${nodes === 1 ? '' : 's'})`
        );
        console.error(`      ${v.helpUrl}`);
      }
    }
  } catch (error) {
    failCount++;
    console.error(`  ✗ ${error.name}: ${error.message.split('\n')[0]}`);
  } finally {
    await context.close();
  }
}

await browser.close();

if (failCount > 0) {
  console.error(`\n✗ pa11y failed on ${failCount} of ${urls.length} URL(s)`);
  process.exit(1);
}
console.log(`\n✓ pa11y passed on all ${urls.length} URLs`);
