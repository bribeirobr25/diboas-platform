/**
 * ⛑ LEDGER-CHAR-1 · compare two recordings case by case (the CI job `ledger-char-base`; plan P12
 * D11 as amended by P12a J5; register 5.1029).
 *
 * Reads each family file (`<family>.json`; `manifest.json` is not a family) from both folders and the
 * base's `frozen.json`, then applies `compareRecordings`. Exit codes: 0 identical; 1 any problem
 * (named), and also a folder or file that cannot be read; 2 a usage error.
 *
 * Usage: node compareOutputs.mjs <base-dir> <head-dir> <base frozen.json>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compareRecordings } from './compareRecordings.mjs';

const [baseDir, headDir, frozenPath] = process.argv.slice(2);
if (!baseDir || !headDir || !frozenPath) {
  console.error('usage: node compareOutputs.mjs <base-dir> <head-dir> <base frozen.json>');
  process.exit(2);
}

/** Every family file in `dir`, parsed. A missing folder reads as no family (the floor then fails). */
function readFamilies(dir) {
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    console.log(`::error::cannot read the recording folder ${dir}: ${error?.message ?? error}`);
    process.exit(1);
  }
  return Object.fromEntries(
    files.map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(dir, f), 'utf8'))])
  );
}

const result = compareRecordings(
  readFamilies(baseDir),
  readFamilies(headDir),
  JSON.parse(readFileSync(frozenPath, 'utf8'))
);

if (!result.ok) {
  console.log(`::error::${result.problems.length} problem(s) (LEDGER-CHAR-1):`);
  console.log(`  ${result.problems.slice(0, 50).join('\n  ')}`);
  process.exit(1);
}
console.log(`Identical: ${result.compared} recorded cases in ${result.families} families.`);
