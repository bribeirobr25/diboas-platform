/**
 * Extract the memo gate's orphaned figures from vitest output (PENDING_ALL 5.467).
 *
 *   <vitest output> | node apps/web/scripts/market-refresh/lib/memo-orphans.mjs
 *
 * WHY. The weekly workflow used to pull the orphan list out of the log with
 * `grep -oE '…: [^:]*'`. Every orphan is itself formatted `field: value`, so
 * that pattern stopped at the SECOND colon and the refresh PR body showed
 * `detailed: 17.5 | detailed` while the gate had found 14 orphans per locale
 * (#629; the same on #674). An editor fixed the one figure shown and CI stayed
 * red. The list is now taken from between the message's own delimiters — the
 * em-dash that opens it and the `: expected [` that closes it — which no orphan
 * can contain.
 */

import fs from 'node:fs';
import { isDirectInvocation } from './invocation.mjs';

const MESSAGE = /figures with no engine value behind them[^—\n]*—\s*(.*?):\s*expected \[/g;
// The interim latest-ETF-week check (5.469) fails with its own message; surface
// it too, or a memo failing ONLY that check shows the "no orphan list" fallback.
const ETF_MESSAGE = /latest spot-ETF week missing — ([^:\n]+): (.*?): expected /g;

/**
 * @param {string} text vitest output (any reporter that prints the assertion message)
 * @returns {string[]} unique findings in first-seen order, e.g. `detailed: 17.5`,
 *   `latest spot-ETF week (en): quotes +$548M but not the latest week (-$236M)`
 */
export function extractOrphans(text) {
  const seen = new Set();
  for (const m of String(text).matchAll(MESSAGE)) {
    for (const item of m[1].split(' | ')) {
      const o = item.trim();
      if (o) seen.add(o);
    }
  }
  for (const m of String(text).matchAll(ETF_MESSAGE)) {
    seen.add(`latest spot-ETF week (${m[1].trim()}): ${m[2].trim()}`);
  }
  return [...seen];
}

if (isDirectInvocation(import.meta.url)) {
  const orphans = extractOrphans(fs.readFileSync(0, 'utf8'));
  // One per line: the PR body renders them in a code block. An empty result
  // prints nothing, and the workflow's `-s` check shows its fallback pointer.
  if (orphans.length) process.stdout.write(`${orphans.join('\n')}\n`);
}
