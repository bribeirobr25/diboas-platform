import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * `5.729` · THE CLASS GUARD: ONE WAY TO FORMAT A PERCENTAGE.
 *
 * **Requirement:** founder ruling 2026-10-31 (decision record
 * `DR-2026-10-31-practice-projection-live-rates-and-percent-format`, P8): "7%", never
 * "7 %". `Intl.NumberFormat(locale, { style: 'percent' })`, react-intl's
 * `formatNumber(…, { style: 'percent' })` and `<FormattedNumber style="percent">` all
 * insert a no-break space before % in de/es. Eight such call sites shipped. The
 * catalogue tests cannot see them (the space is produced at render time), so this check
 * forbids the mechanism itself: percent-style formatting may appear ONLY inside
 * `packages/format`, which removes the space.
 *
 * Scope: source under `apps/web/src`, `apps/sandbox/src` and every `packages/<x>/src`
 * except `packages/format`; tests, stories and fixtures excluded (they may assert raw
 * Intl output on purpose). ICU `{x, number, percent}` / `::percent` skeletons in any
 * translation catalogue are covered too: they format through Intl the same way.
 * Not covered: a style read from a variable (`{ style }`) — none exists today
 * (measured 2026-10-31); a reviewer row covers it.
 *
 * ⚑ CODE, NOT TEXT. Each file is PARSED and only a real `style` property or JSX
 * attribute whose value is the string "percent" counts. A comment or a docstring that
 * MENTIONS the forbidden call (the `useFormatters` seam explains why it exists that way)
 * is not a use — a text grep flagged exactly that on its first run.
 */

const REPO = resolve(__dirname, '../../../../..');

const SOURCE_ROOTS = [
  'apps/web/src',
  'apps/sandbox/src',
  ...readdirSync(join(REPO, 'packages'))
    .filter((name) => name !== 'format')
    .map((name) => `packages/${name}/src`),
];

const EXCLUDED = /(?:__tests__|\.test\.|\.spec\.|\.stories\.|\/test\/|\/fixtures?\/)/;

const isPercentString = (node: ts.Node | undefined): boolean =>
  !!node &&
  (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
  node.text === 'percent';

const nameOf = (name: ts.PropertyName | ts.JsxAttributeName): string | null =>
  ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;

/**
 * Every `style: 'percent'` object property and every `style="percent"` /
 * `style={'percent'}` JSX attribute in `text`, by syntax.
 */
function percentStyleUses(text: string, fileName: string): number {
  const kind = /\.(?:tsx|jsx)$/.test(fileName) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  let uses = 0;
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      nameOf(node.name) === 'style' &&
      isPercentString(node.initializer)
    )
      uses++;
    if (ts.isJsxAttribute(node) && nameOf(node.name) === 'style') {
      const init = node.initializer;
      if (isPercentString(init)) uses++;
      else if (init && ts.isJsxExpression(init) && isPercentString(init.expression)) uses++;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return uses;
}
/** ICU number skeleton or style inside a message: `{x, number, percent}`, `::percent`. */
const ICU_PERCENT = /\{\s*[\w.]+\s*,\s*number\s*,\s*(?:percent|::[^}]*percent)/u;

function files(dir: string, test: (name: string) => boolean): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : files(full, test);
    return test(entry.name) ? [full] : [];
  });
}

const sourceFiles = SOURCE_ROOTS.flatMap((root) =>
  files(join(REPO, root), (name) => /\.(?:ts|tsx|js|jsx|mjs)$/.test(name))
).filter((file) => !EXCLUDED.test(relative(REPO, file)));

const catalogueFiles = [
  ...files(join(REPO, 'packages/i18n/translations'), (n) => n.endsWith('.json')),
  ...files(join(REPO, 'apps/sandbox/src/i18n/messages'), (n) => n.endsWith('.json')),
];

describe('5.729 · percent-style formatting lives only in @diboas/format', () => {
  it('should find no percent-style Intl / react-intl formatting outside packages/format', () => {
    const found = sourceFiles
      .filter((file) => percentStyleUses(readFileSync(file, 'utf8'), file) > 0)
      .map((file) => relative(REPO, file));
    expect(found).toEqual([]);
  });

  it('should find no ICU percent style in any translation catalogue', () => {
    const found = catalogueFiles
      .filter((file) => ICU_PERCENT.test(readFileSync(file, 'utf8')))
      .map((file) => relative(REPO, file));
    expect(found).toEqual([]);
  });

  it('should recognise every spelling it forbids, and not an icon named "percent"', () => {
    /* A detector is only as good as its patterns; prove them on real shapes. */
    for (const [planted, file] of [
      ["intl.formatNumber(x, { style: 'percent' })", 'a.ts'],
      ['new Intl.NumberFormat(l, { style: "percent", maximumFractionDigits: 2 })', 'b.ts'],
      ["new Intl.NumberFormat(l, { 'style': `percent` })", 'c.ts'],
      ['const x = <FormattedNumber value={v} style="percent" />;', 'd.tsx'],
      ["const x = <FormattedNumber value={v} style={'percent'} />;", 'e.tsx'],
    ] as const) {
      expect(percentStyleUses(planted, file), planted).toBe(1);
    }
    /* Mentions and look-alikes are not uses. */
    expect(percentStyleUses("// never call formatNumber(x, { style: 'percent' })", 'f.ts')).toBe(0);
    expect(
      percentStyleUses("/** `{ style: 'percent' }` puts a space in de */ const a = 1;", 'g.ts')
    ).toBe(0);
    expect(percentStyleUses('const x = <LucideIcon name="percent" size={18} />;', 'h.tsx')).toBe(0);
    expect(percentStyleUses("const s = { style: 'currency' };", 'i.ts')).toBe(0);
    expect(ICU_PERCENT.test('"share": "{share, number, percent} to {goal}"')).toBe(true);
    expect(ICU_PERCENT.test('"x": "{rate, number, ::percent .00}"')).toBe(true);
    expect(ICU_PERCENT.test('"apy": "{apy, number}%/yr"')).toBe(false);
  });

  it('should have scanned the real trees, so an empty result means something', () => {
    expect(sourceFiles.length).toBeGreaterThan(500);
    expect(sourceFiles.some((f) => f.includes('/apps/sandbox/src/'))).toBe(true);
    expect(sourceFiles.some((f) => f.includes('/packages/defi/src/'))).toBe(true);
    expect(catalogueFiles.length).toBeGreaterThan(100);
  });
});
