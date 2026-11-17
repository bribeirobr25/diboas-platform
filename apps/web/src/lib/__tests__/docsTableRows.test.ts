/**
 * 5.959: no markdown table row in the tracked docs has more cells than its header.
 *
 * GitHub splits a table cell at every unescaped `|`, even inside backticks. The GENIUS-WALL-1
 * row of `docs/tech/engineering-gates.md` quoted a regex with bare pipes, so it rendered with 7
 * fields against the header's 5: GitHub showed "retorn" as a column and dropped everything
 * after it, the row's scope limits and sabotage evidence included. `review:authorities` reads
 * the rows' ids, not their shape, so the broken row stayed green for days. This counts cells the
 * way GitHub does (an escaped `\|` is text) and fails when a row has more than its header, the
 * shape that hides text. A row with fewer cells renders with blank cells and hides nothing; the
 * thirteen such rows found on 2026-11-17 are a separate register item, not this guard's job.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = resolve(__dirname, '../../../../..');
const DOCS = join(REPO, 'docs');

/** The number of `|` that separate cells: an escaped `\|` is part of the cell's text. */
const separators = (line: string): number => line.replace(/\\\|/g, '').split('|').length - 1;
/* GitHub's rule: every delimiter cell is one or more hyphens, with optional colons ("| - |" counts:
   a three-hyphen minimum let such a table escape this guard). */
const isDelimiterRow = (line: string): boolean => /^\|(\s*:?-+:?\s*\|)+\s*$/.test(line.trim());

/** Every row with more cells than its table's header, as `file:line (row N vs header H)`. */
function overfullRows(file: string, text: string): string[] {
  const lines = text.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i]!.startsWith('|') || !isDelimiterRow(lines[i + 1] ?? '')) continue;
    const header = separators(lines[i]!);
    let j = i + 2;
    for (; j < lines.length && lines[j]!.startsWith('|'); j += 1) {
      const row = separators(lines[j]!);
      if (row > header) out.push(`${file}:${j + 1} (${row - 1} cells vs header ${header - 1})`);
    }
    i = j - 1;
  }
  return out;
}

const trackedDocs = (): string[] =>
  (readdirSync(DOCS, { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.md'))
    .sort();

describe('docs tables render every cell (5.959)', () => {
  it('should read the gate registry among the tracked docs (the guard is not vacuous)', () => {
    expect(trackedDocs()).toContain('tech/engineering-gates.md');
  });

  it('should find no table row with more cells than its header when GitHub renders the docs', () => {
    const found = trackedDocs().flatMap((f) =>
      overfullRows(`docs/${f}`, readFileSync(join(DOCS, f), 'utf8'))
    );
    expect(found, 'escape a | inside a cell as \\| or name the words instead of a regex').toEqual(
      []
    );
  });

  it.each([
    ['a bare pipe inside backticks', '| a | b |\n| - | - |\n| x | `p|q` |', 1],
    [
      'the GENIUS row as it was (7 fields against 5)',
      '| a | b | c |\n| --- | --- | --- |\n| x | `return|retorn|rentab` | z |',
      1,
    ],
    ['an escaped pipe, which is text', '| a | b |\n| --- | --- |\n| x | `p\\|q` |', 0],
    ['a short row, which hides nothing', '| a | b | c |\n| --- | --- | --- |\n| x | y |', 0],
  ])('should count %s the way GitHub does when it renders the table', (_label, table, expected) => {
    expect(overfullRows('t.md', table)).toHaveLength(expected);
  });
});
