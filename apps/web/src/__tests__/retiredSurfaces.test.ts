/**
 * ⛑ RETIRED-SURFACES-1 guard 1 · no retired surface is named (plan P13; register `5.112`).
 *
 * The interactive demo was deleted on 2026-11-19 (PR-1); its old addresses answer a 308 to
 * Practice from `middleware.ts`. This guard fails when anything brings it back by name: an import
 * of a deleted module, the deleted route constant, a `/demo` path in any string or template (so
 * `` `${BRAND.url}/${locale}/demo` `` is caught, not only `href="/demo"`), the deleted i18n
 * namespace, or the demo's name in a user-facing catalogue. Dream Mode joins the lists in PR-2.
 *
 * Read with the TypeScript parser, so comments never count and a string is a string.
 * Scope limit, stated: a path assembled from fragments (`'/de' + 'mo'`) escapes this scan;
 * guard 2 (every internal link resolves) and the browser test (guard 10) back it up.
 * Named exemption: `middleware.ts`'s redirect pattern (a regular expression, not a string, so it
 * is not scanned; guard 3 proves what it answers).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';
import { parseSource } from '@diboas/test-support';
import { describe, expect, it } from 'vitest';

const WEB = join(__dirname, '../..');
const SRC = join(WEB, 'src');
const REPO = join(WEB, '../..');
const EMAIL_SRC = join(REPO, 'packages/email/src');
const I18N_SRC = join(REPO, 'packages/i18n/src');
const TRANSLATIONS = join(REPO, 'packages/i18n/translations');

/** Deleted modules: no import, static or dynamic, may name them. */
const RETIRED_MODULES = /(^|\/)(PreDemo|DemoLauncher|pre-demo)(\/|$)/;
/** Deleted route constants. */
const RETIRED_ROUTES = /\bROUTES\.DEMO\b/;
/** A retired path segment inside a string: `/demo`, not `/demos`, `/demo-day`, `/demo_x`. */
const RETIRED_PATH = /\/demo(?![\w-])/i;
/** Deleted i18n namespaces: never registered, never named in a string (a stale load only logs). */
const RETIRED_NAMESPACES = ['preDemo'];
/** The demo's user-facing name in each locale. */
const RETIRED_NAMES = /Interactive Demo|Demo Interativa|Demo Interactiva|Interaktive Demo/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'node_modules' || name === 'fixtures') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const rel = (file: string) => relative(REPO, file).split(sep).join('/');

interface Finding {
  at: string;
  what: string;
}

/** Every string a source file holds: literals, template pieces, and the module names it imports. */
function scan(file: string, text = readFileSync(file, 'utf8')): Finding[] {
  const found: Finding[] = [];
  const sf = parseSource(text, file);
  const where = (node: ts.Node) =>
    `${rel(file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      if (spec && ts.isStringLiteral(spec) && RETIRED_MODULES.test(spec.text))
        found.push({ at: where(spec), what: `imports ${spec.text}` });
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      RETIRED_MODULES.test(node.arguments[0].text)
    )
      found.push({ at: where(node), what: `import(${node.arguments[0].text})` });
    if (ts.isPropertyAccessExpression(node) && RETIRED_ROUTES.test(node.getText(sf)))
      found.push({ at: where(node), what: node.getText(sf) });
    const pieces: string[] = [];
    if (ts.isStringLiteralLike(node)) pieces.push(node.text);
    if (ts.isTemplateExpression(node)) {
      // join the static pieces with a stand-in segment, so `/${locale}/demo` reads as a path
      pieces.push([node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join('x'));
    }
    if (ts.isJsxText(node)) pieces.push(node.text);
    for (const piece of pieces) {
      if (RETIRED_PATH.test(piece)) found.push({ at: where(node), what: `path "${piece}"` });
      for (const ns of RETIRED_NAMESPACES)
        if (piece === ns || piece.startsWith(`${ns}.`))
          found.push({ at: where(node), what: `namespace "${piece}"` });
      if (RETIRED_NAMES.test(piece)) found.push({ at: where(node), what: `name "${piece}"` });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

const FILES = [...walk(SRC), join(WEB, 'middleware.ts'), ...walk(EMAIL_SRC), ...walk(I18N_SRC)];

describe('RETIRED-SURFACES-1 · no retired surface is named (P13)', () => {
  it('should walk the code that could name one (the scan is not vacuous)', () => {
    const seen = FILES.map(rel);
    expect(seen.length).toBeGreaterThan(400);
    for (const part of [
      'apps/web/src/config/',
      'apps/web/src/components/',
      'apps/web/src/lib/',
      'apps/web/middleware.ts',
      'packages/email/src/',
      'packages/i18n/src/',
    ])
      expect(
        seen.some((f) => f.startsWith(part)),
        part
      ).toBe(true);
  });

  it('should find no import, route, path, namespace or name of the demo in the code', () => {
    expect(FILES.flatMap((f) => scan(f)).map((x) => `${x.at} ${x.what}`)).toEqual([]);
  });

  it('should register no retired namespace and ship no file for one', () => {
    const config = readFileSync(join(I18N_SRC, 'config.ts'), 'utf8');
    for (const ns of RETIRED_NAMESPACES) {
      expect(config).not.toContain(`'${ns}'`);
      for (const locale of readdirSync(TRANSLATIONS))
        expect(
          () => statSync(join(TRANSLATIONS, locale, `${ns}.json`)),
          `${locale}/${ns}`
        ).toThrow();
    }
  });

  it("should keep the demo's name out of every user-facing catalogue", () => {
    const hits: string[] = [];
    const visit = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) visit(full);
        else if (name.endsWith('.json') && RETIRED_NAMES.test(readFileSync(full, 'utf8')))
          hits.push(rel(full));
      }
    };
    visit(TRANSLATIONS);
    expect(hits).toEqual([]);
  });

  /* Negative controls: what must NOT trip the scan, and what must. */
  it('should tell a retired path from a lookalike (both directions)', () => {
    const probe = (code: string) => scan(join(SRC, 'probe.ts'), code).map((x) => x.what);
    for (const ok of [
      "const a = '/demos';",
      "const a = '/demo-day';",
      "const a = '/learn/demo-talk';",
      '// a comment naming /demo',
      "const id = 'demo';",
    ])
      expect(probe(ok), ok).toEqual([]);
    for (const bad of [
      "const a = '/demo';",
      'const a = `${base}/${locale}/demo`;',
      "const a = '/en/demo?utm_source=x';",
      "import X from '@/components/PreDemo';",
      "const L = () => import('@/components/Sections/DemoLauncher');",
      'const h = ROUTES.DEMO;',
      "load(['preDemo']);",
      "const t = 'Try the Interactive Demo';",
    ])
      expect(probe(bad).length, bad).toBeGreaterThan(0);
  });
});
