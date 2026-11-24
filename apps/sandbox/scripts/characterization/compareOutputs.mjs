/**
 * ⛑ LEDGER-CHAR-1 · compare two `char:update` outputs case by case (the CI job
 * `ledger-char-base`; plan P12 D11).
 *
 * Every case the BASE recorded must exist in the HEAD recording with the same bytes. Cases only
 * the head has are new (allowed in exact mode, plan D11/D14) and are listed. Exit 1 on any lost
 * or changed case, with the first differences named.
 *
 * Usage: node compareOutputs.mjs <base-dir> <head-dir>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [baseDir, headDir] = process.argv.slice(2);
if (!baseDir || !headDir) {
  console.error('usage: node compareOutputs.mjs <base-dir> <head-dir>');
  process.exit(2);
}

const families = readdirSync(baseDir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
const problems = [];
const added = [];
let compared = 0;
for (const file of families) {
  const base = JSON.parse(readFileSync(join(baseDir, file), 'utf8'));
  let head = {};
  try {
    head = JSON.parse(readFileSync(join(headDir, file), 'utf8'));
  } catch {
    problems.push(`${file}: missing from the PR's recording`);
    continue;
  }
  for (const [id, recorded] of Object.entries(base)) {
    compared += 1;
    if (!(id in head)) problems.push(`${file} · ${id}: lost`);
    else if (JSON.stringify(head[id]) !== JSON.stringify(recorded))
      problems.push(`${file} · ${id}: changed`);
  }
  for (const id of Object.keys(head)) if (!(id in base)) added.push(`${file} · ${id}`);
}

if (added.length) console.log(`New cases (allowed): ${added.length}\n  ${added.join('\n  ')}`);
if (problems.length) {
  console.log(`::error::${problems.length} recorded case(s) lost or changed (LEDGER-CHAR-1):`);
  console.log(`  ${problems.slice(0, 50).join('\n  ')}`);
  process.exit(1);
}
console.log(`Identical: ${compared} recorded cases in ${families.length} families.`);
