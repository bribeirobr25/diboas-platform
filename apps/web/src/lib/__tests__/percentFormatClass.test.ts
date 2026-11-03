import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { findPercentFormatViolations } from '@diboas/format';

/**
 * `5.729` · THE CLASS GUARD: ONE WAY TO FORMAT A PERCENTAGE, IN CODE.
 *
 * **Requirement:** founder ruling 2026-10-31 (decision record
 * `DR-2026-10-31-practice-projection-live-rates-and-percent-format`, P8): "7%", never
 * "7 %", never "7 percent". `Intl.NumberFormat(locale, { style: 'percent' })`, react-intl's
 * `formatNumber(…, { style: 'percent' })`, `<FormattedNumber style="percent">` and
 * `{ style: 'unit', unit: 'percent' }` all insert a no-break space before % in de/es;
 * eight such call sites shipped. The catalogue tests cannot see them (the space is made at
 * render time), so this file guards the CODE, in two rules:
 *
 * 1. **No `'percent'` string anywhere in source outside `packages/format`, except as an
 *    icon name.** Forbidding the literal itself — not only `style: 'percent'` — is what
 *    catches every spelling the first version missed (audit 2026-11-03): `as const`,
 *    `satisfies`, parentheses, a ternary, a `const STYLE = 'percent'`, `unit: 'percent'`,
 *    a computed key. The only legitimate use measured in the repo is the icon name
 *    (`<LucideIcon name="percent">`, an `…ICON…` map).
 * 2. **Every string the code writes is held to the same text rule as the catalogues**
 *    (`findPercentFormatViolations`): string literals, template literals (each `${…}`
 *    read as a placeholder, so `` `${x} %` `` is seen), and JSX text with its expressions
 *    (so `{value} %` and `{value}{' '}%` are seen). This covers copy kept in TS files
 *    (SEO keywords, OG text, config) and ICU strings in `defaultMessage`.
 *
 * ⚑ CODE, NOT TEXT. Files are PARSED; a comment or docstring that MENTIONS the forbidden
 * call is not a use (the `useFormatters` seam explains why it exists that way).
 *
 * Scope: `apps/*\/src`, `apps/*\/scripts` (rule 1) and every `packages/<x>/src` except
 * `packages/format`; tests, specs, stories and e2e excluded (they may assert raw Intl
 * output on purpose). Rule 2 runs on `src` trees only: `scripts/` print operator logs,
 * not user-facing copy, and the /market text they generate is checked as DATA by
 * `apps/web/src/lib/i18n/__tests__/percentFormat.test.ts`.
 * **Not covered:** a `'percent'` built at run time (`'per' + 'cent'`) — none exists.
 */

const REPO = resolve(__dirname, '../../../../..');

const PACKAGE_SRC = readdirSync(join(REPO, 'packages'))
  .filter((name) => name !== 'format' && existsSync(join(REPO, 'packages', name, 'src')))
  .map((name) => `packages/${name}/src`);

const APP_SRC = ['apps/web/src', 'apps/sandbox/src'];
const APP_SCRIPTS = ['apps/web/scripts', 'apps/sandbox/scripts'].filter((dir) =>
  existsSync(join(REPO, dir))
);

const EXCLUDED = /(?:__tests__|\.test\.|\.spec\.|\.stories\.|\/e2e\/)/;
const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts)$/;

function files(dir: string): string[] {
  /* No try/catch: a root that cannot be read must FAIL, not read as "nothing found". */
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory())
      return ['node_modules', 'dist', '.next'].includes(entry.name) ? [] : files(full);
    return SOURCE_FILE.test(entry.name) && !EXCLUDED.test(relative(REPO, full)) ? [full] : [];
  });
}

function parse(text: string, fileName: string): ts.SourceFile {
  const kind = /\.(?:tsx|jsx)$/.test(fileName) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
}

const nameOf = (name: ts.Node | undefined): string | null =>
  name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : null;

/** The one legitimate `'percent'`: an icon name. */
function isIconName(literal: ts.Node): boolean {
  const parent = literal.parent;
  if (ts.isJsxAttribute(parent)) return nameOf(parent.name) === 'name';
  if (ts.isPropertyAssignment(parent)) {
    /* `{ fees: 'percent' }` inside a `const …ICON… = {…}` map. */
    let node: ts.Node = parent.parent;
    while (node && !ts.isVariableDeclaration(node) && !ts.isSourceFile(node)) node = node.parent;
    return !!node && ts.isVariableDeclaration(node) && /icon/i.test(nameOf(node.name) ?? '');
  }
  return false;
}

/** Rule 1: every `'percent'` literal that is not an icon name. Returns their lines. */
function percentLiterals(text: string, fileName: string): number[] {
  const source = parse(text, fileName);
  const lines: number[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      node.text === 'percent' &&
      !isIconName(node)
    ) {
      lines.push(source.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return lines;
}

/** JSX reads whitespace that contains a line break as nothing; other whitespace stays. */
const jsxText = (text: string) => text.replace(/\s*\n\s*/g, '');

/**
 * Rule 2's input: every string the code writes, as text a reader would see, with each
 * interpolation shown as `{x}` so the shared rule can see "placeholder, space, %".
 */
function writtenStrings(text: string, fileName: string): string[] {
  const source = parse(text, fileName);
  const out: string[] = [];
  const exprText = (expr: ts.Expression | undefined): string =>
    expr && (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr))
      ? expr.text
      : '{x}';
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text);
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
      !(
        ts.isBinaryExpression(node.parent) &&
        node.parent.operatorToken.kind === ts.SyntaxKind.PlusToken
      )
    ) {
      /* The outermost `a + ' %' + b` chain, read left to right as one string. */
      const operands: ts.Expression[] = [];
      const flatten = (e: ts.Expression): void => {
        if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken) {
          flatten(e.left);
          flatten(e.right);
        } else operands.push(e);
      };
      flatten(node);
      if (operands.some((e) => ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e))) {
        out.push(operands.map(exprText).join(''));
      }
    }
    if (ts.isTemplateExpression(node)) {
      out.push(node.head.text + node.templateSpans.map((s) => `{x}${s.literal.text}`).join(''));
    }
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      out.push(
        node.children
          .map((child) =>
            ts.isJsxText(child)
              ? jsxText(child.text)
              : ts.isJsxExpression(child)
                ? exprText(child.expression)
                : '<el>'
          )
          .join('')
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

const read = (file: string) => readFileSync(file, 'utf8');
const rule1Files = [...APP_SRC, ...APP_SCRIPTS, ...PACKAGE_SRC].flatMap((root) =>
  files(join(REPO, root))
);
const rule2Files = [...APP_SRC, ...PACKAGE_SRC].flatMap((root) => files(join(REPO, root)));

describe('5.729 · percent formatting lives only in @diboas/format', () => {
  it('should find no "percent" string outside packages/format except icon names (rule 1)', () => {
    const found = rule1Files.flatMap((file) =>
      percentLiterals(read(file), file).map((line) => `${relative(REPO, file)}:${line}`)
    );
    expect(found).toEqual([]);
  });

  it('should find no string in code that writes a percentage any other way than "7%" (rule 2)', () => {
    const found = rule2Files.flatMap((file) =>
      writtenStrings(read(file), file).flatMap((s) =>
        findPercentFormatViolations(s).map((v) => `${relative(REPO, file)}: ${v.kind} "${v.match}"`)
      )
    );
    expect(found).toEqual([]);
  });

  it('should recognise every spelling rule 1 forbids, and not an icon named "percent"', () => {
    /* Each spelling the audit of 2026-11-03 planted past the first version, plus the originals. */
    for (const [planted, file] of [
      ["intl.formatNumber(x, { style: 'percent' })", 'a.ts'],
      ['new Intl.NumberFormat(l, { style: "percent", maximumFractionDigits: 2 })', 'b.ts'],
      ["new Intl.NumberFormat(l, { 'style': `percent` })", 'c.ts'],
      ['const x = <FormattedNumber value={v} style="percent" />;', 'd.tsx'],
      ["const x = <FormattedNumber value={v} style={'percent'} />;", 'e.tsx'],
      ["const o = { style: 'percent' as const };", 'f.ts'],
      ["const o = { style: ('percent') };", 'g.ts'],
      ["const o = { ['style']: 'percent' };", 'h.ts'],
      ["const style = 'percent'; const o = { style };", 'i.ts'],
      ["const o = { style: p ? 'percent' : 'decimal' };", 'j.ts'],
      ["const x = <FormattedNumber style={'percent' as const} />;", 'k.tsx'],
      ["const o = { style: 'unit', unit: 'percent' };", 'l.ts'],
      ["const o = { style: 'percent' } satisfies Intl.NumberFormatOptions;", 'm.ts'],
      ["module.exports = { style: 'percent' };", 'n.cjs'],
    ] as const) {
      expect(percentLiterals(planted, file).length, planted).toBe(1);
    }
    /* Mentions and icon names are not uses. */
    expect(percentLiterals("// never call formatNumber(x, { style: 'percent' })", 'o.ts')).toEqual(
      []
    );
    expect(percentLiterals("/** `{ style: 'percent' }` */ const a = 1;", 'p.ts')).toEqual([]);
    expect(percentLiterals('const x = <LucideIcon name="percent" size={18} />;', 'q.tsx')).toEqual(
      []
    );
    expect(percentLiterals("const SOURCE_ICON = { fees: 'percent' };", 'r.ts')).toEqual([]);
    expect(percentLiterals("const o = { style: 'currency' };", 's.ts')).toEqual([]);
  });

  it('should see a percentage written in code the way the reader sees it (rule 2)', () => {
    const violations = (code: string, file = 'x.tsx') =>
      writtenStrings(code, file).flatMap((s) => findPercentFormatViolations(s));
    for (const planted of [
      "const k = ['save 10 percent'];",
      'const s = `${rate} %`;',
      "const s = rate + ' %';",
      'const e = <span>{rate} %</span>;',
      "const e = <span>{rate}{' '}%</span>;",
      "const m = { defaultMessage: '{v, number, percent}' };",
    ]) {
      expect(violations(planted).length, planted).toBeGreaterThan(0);
    }
    for (const fine of [
      'const s = `${rate}%`;',
      'const e = <span>{rate}%</span>;',
      'const e = (\n  <span>\n    {rate}\n    %\n  </span>\n);',
      '// a comment saying 7 % is not written anywhere',
      "import x from './10 percent';",
    ]) {
      expect(violations(fine), fine).toEqual([]);
    }
  });

  it('should have scanned the real trees, so an empty result means something', () => {
    for (const root of [...APP_SRC, ...PACKAGE_SRC]) {
      expect(files(join(REPO, root)).length, root).toBeGreaterThan(0);
    }
    expect(PACKAGE_SRC).toEqual(expect.arrayContaining(['packages/defi/src', 'packages/ui/src']));
    expect(APP_SCRIPTS).toContain('apps/web/scripts');
    expect(rule1Files.some((f) => f.includes('/apps/web/scripts/market-refresh/'))).toBe(true);
    expect(rule2Files.length).toBeGreaterThan(500);
  });
});
