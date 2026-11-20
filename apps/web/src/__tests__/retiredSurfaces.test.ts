/**
 * ⛑ RETIRED-SURFACES-1 guard 1 · no retired surface is named (plan P13; register `5.112`).
 *
 * The interactive demo (PR-1, 2026-11-19), Dream Mode, the waitlist modal and its provider
 * (PR-2, 2026-11-20) were deleted; their old addresses answer a 308 to Practice from
 * `middleware.ts`. This guard fails when anything brings them back by name: an import of a
 * deleted module (by path, or by the name it binds: the layout imported the provider through a
 * barrel), a deleted route constant, a `/demo` path or a bare `dream-mode` in any string or
 * template (so `` `${BRAND.url}/${locale}/demo` `` is caught, not only `href="/demo"`), a retired
 * source or analytics event name, a deleted i18n namespace, or a retired surface's name in a
 * user-facing catalogue (German writes "Dream-Mode", pt-BR "Modo Sonho", es "Modo Sueño").
 * Named exemption by key, with a pinned count: the Terms (`legal/terms.json`
 * `sections.aboutDiboas.items` and `sections.preLaunchLimitations.simulationTools`) still name
 * Dream Mode twice per locale; they are Legal's text until the request `5.1004` is answered.
 *
 * Read with the TypeScript parser, so comments never count and a string is a string.
 * A retired segment written as its own string next to a path (`'/' + 'demo'`,
 * `` `/${locale}/${'demo'}` ``) is caught too; an entry for a retired page in the SEO page list
 * (which feeds the sitemap) is refused here and by the sitemap check in guard 2.
 * Scope limit, stated: a segment held in a variable (`const s = 'demo'; `/${s}``) or split
 * inside a word (`'/de' + 'mo'`) escapes this scan and the unit link test; only the browser test
 * (guard 10) would see it, and only on the four landings.
 * Named exemption: `middleware.ts`'s redirect pattern (a regular expression, not a string, so it
 * is not scanned; guard 3 proves what it answers).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';
import { parseSource } from '@diboas/test-support';
import { describe, expect, it } from 'vitest';
import { PAGE_SEO_CONFIG } from '@/lib/seo/constants';

const WEB = join(__dirname, '../..');
const SRC = join(WEB, 'src');
const REPO = join(WEB, '../..');
const EMAIL_SRC = join(REPO, 'packages/email/src');
const I18N_SRC = join(REPO, 'packages/i18n/src');
const TRANSLATIONS = join(REPO, 'packages/i18n/translations');

/** Deleted modules: no import, static or dynamic, may name them. */
const RETIRED_MODULES =
  /(^|\/)(PreDemo|DemoLauncher|pre-demo|PreDream|pre-dream|dream-mode|WaitingListModal|WaitingListProvider|WaitlistModalForm|WaitlistModalSuccess|useWaitlistModalForm|modalSignupBody|WaitlistPosition)(\/|$)/;
/** Names the deleted modules exported: no import or export may bind them, whatever the path. */
const RETIRED_BINDINGS = new Set([
  'WaitingListProvider',
  'useWaitingListModal',
  'WaitingListModal',
  'WaitlistModalForm',
  'WaitlistModalSuccess',
  'useWaitlistModalForm',
  'buildModalSignupBody',
  'DemoLauncher',
  'PreDemo',
  'PreDream',
]);
/** Deleted route constants. */
const RETIRED_ROUTES = /\bROUTES\.(DEMO|DREAM_MODE)\b/;
/**
 * A retired path inside a string: `/demo` (not `/demos`, `/demo-day`, `/demo_x`), and
 * `dream-mode` anywhere, bare included (the sitemap's noindex set held it bare).
 */
const RETIRED_PATH = /\/demo(?![\w-])|(^|[^\w-])dream-mode(?![\w-])/i;
/** A retired route's segment on its own: flagged when it is concatenated or templated into a path. */
const RETIRED_SEGMENTS = new Set(['demo', 'dream-mode']);
/**
 * Retired waitlist sources and PostHog event names (plan P13, D6 and D9). A source name also
 * starts the events that carried it (`dream_mode_gate_join_click`), so each is a prefix.
 */
const RETIRED_LITERALS =
  /^(dream_mode|interactive_demo|app_link)(_|$)|pre_dream_|pre_demo_|waiting_list_modal_/;
/** Deleted i18n namespaces: never registered, never named in a string (a stale load only logs). */
const RETIRED_NAMESPACES = ['preDemo', 'dreamMode', 'preDream'];
/**
 * The retired surfaces' user-facing names in each locale. Case-sensitive: a name is written
 * capitalized, and a lowercase path (`/en/dream-modes`) is the path rule's business.
 */
const RETIRED_NAMES =
  /Interactive Demo|Demo Interativa|Demo Interactiva|Interaktive Demo|Dream[ -]?Mode|Modo Sonho|Modo Sueño/;
/**
 * The Terms' mentions, Legal's text until `5.1004`: exempt by key, one mention per key per
 * locale (a mention moved between keys, added or lost fails).
 */
const TERMS_EXEMPT_KEYS = [
  'sections.aboutDiboas.items',
  'sections.preLaunchLimitations.simulationTools',
];

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
    // The one named exemption in code: middleware.ts's redirect pattern, the declaration that
    // answers the retired addresses (guard 3 proves what it matches). Nothing else is exempt.
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(sf) === 'RETIRED_SURFACE_PATH' &&
      rel(file) === 'apps/web/middleware.ts'
    )
      return;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      if (spec && ts.isStringLiteral(spec) && RETIRED_MODULES.test(spec.text))
        found.push({ at: where(spec), what: `imports ${spec.text}` });
    }
    if (
      (ts.isImportSpecifier(node) || ts.isExportSpecifier(node)) &&
      RETIRED_BINDINGS.has((node.propertyName ?? node.name).text)
    )
      found.push({ at: where(node), what: `binds ${(node.propertyName ?? node.name).text}` });
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
    if (
      ts.isStringLiteralLike(node) &&
      RETIRED_SEGMENTS.has(node.text.toLowerCase()) &&
      (ts.isTemplateSpan(node.parent) ||
        (ts.isBinaryExpression(node.parent) &&
          node.parent.operatorToken.kind === ts.SyntaxKind.PlusToken) ||
        // `['', locale, 'demo'].join('/')`
        (ts.isArrayLiteralExpression(node.parent) &&
          ts.isPropertyAccessExpression(node.parent.parent) &&
          node.parent.parent.name.text === 'join'))
    )
      found.push({ at: where(node), what: `segment "${node.text}" joined into a path` });
    for (const piece of pieces) {
      if (RETIRED_PATH.test(piece)) found.push({ at: where(node), what: `path "${piece}"` });
      for (const ns of RETIRED_NAMESPACES)
        if (piece === ns || piece.startsWith(`${ns}.`))
          found.push({ at: where(node), what: `namespace "${piece}"` });
      if (RETIRED_NAMES.test(piece)) found.push({ at: where(node), what: `name "${piece}"` });
      if (RETIRED_LITERALS.test(piece))
        found.push({ at: where(node), what: `retired source or event "${piece}"` });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

const FILES = [...walk(SRC), join(WEB, 'middleware.ts'), ...walk(EMAIL_SRC), ...walk(I18N_SRC)];

describe('RETIRED-SURFACES-1 · no retired surface is named (P13)', { timeout: 30_000 }, () => {
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

  it('should find no import, binding, route, path, source, event, namespace or name of a retired surface in the code', () => {
    expect(FILES.flatMap((f) => scan(f)).map((x) => `${x.at} ${x.what}`)).toEqual([]);
  });

  it('should keep no retired page in the SEO page list (it feeds the sitemap)', () => {
    expect(Object.keys(PAGE_SEO_CONFIG).filter((k) => RETIRED_SEGMENTS.has(k))).toEqual([]);
    expect(Object.keys(PAGE_SEO_CONFIG)).not.toContain('dream-mode');
    expect(Object.keys(PAGE_SEO_CONFIG).length).toBeGreaterThan(10);
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

  it("should keep a retired surface's name out of every catalogue but the Terms' two keys", () => {
    const strings = (value: unknown, path: string, out: Array<[string, string]>) => {
      if (typeof value === 'string') out.push([path, value]);
      else if (Array.isArray(value)) value.forEach((v, i) => strings(v, path, out));
      else if (value && typeof value === 'object')
        for (const [k, v] of Object.entries(value)) strings(v, path ? `${path}.${k}` : k, out);
      return out;
    };
    const hits: string[] = [];
    const termsCount: Record<string, number> = {};
    const visit = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) visit(full);
        else if (name.endsWith('.json')) {
          const isTerms = rel(full).endsWith('/legal/terms.json');
          for (const [path, text] of strings(JSON.parse(readFileSync(full, 'utf8')), '', [])) {
            // a retired path in a catalogue string (a lesson link, an href) is never exempt
            if (RETIRED_PATH.test(text)) hits.push(`${rel(full)} ${path} (path)`);
            const n = (text.match(new RegExp(RETIRED_NAMES.source, 'g')) ?? []).length;
            if (n === 0) continue;
            const key = isTerms
              ? TERMS_EXEMPT_KEYS.find((k) => path === k || path.startsWith(`${k}.`))
              : undefined;
            if (key)
              termsCount[`${rel(full)} ${key}`] = (termsCount[`${rel(full)} ${key}`] ?? 0) + n;
            else hits.push(`${rel(full)} ${path}`);
          }
        }
      }
    };
    visit(TRANSLATIONS);
    expect(hits).toEqual([]);
    // the exemption is pinned: a third mention in the Terms fails, and so does losing one silently
    const locales = readdirSync(TRANSLATIONS).filter((d) =>
      statSync(join(TRANSLATIONS, d)).isDirectory()
    );
    expect(locales.sort()).toEqual(['de', 'en', 'es', 'pt-BR']);
    for (const locale of locales)
      for (const key of TERMS_EXEMPT_KEYS)
        expect(
          termsCount[`packages/i18n/translations/${locale}/legal/terms.json ${key}`] ?? 0,
          `${locale} Terms ${key}`
        ).toBe(1);
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
      'const k = { demo: 1 };',
      "if (kind === 'demo') run();",
      "const a = '/en/dream-modes';",
      "const a = 'dream-mode-x';",
      "const t = 'Dream Trip';",
      "const t = 'Traumreise';",
      "const target = 'calculator';",
      "const s = 'landing_b2c';",
      "const s = 'app_linker';",
      "const p = ['a', 'demo'].length;",
      "import { WaitlistForm } from './WaitlistForm';",
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
      "const h = '/' + 'demo';",
      'const h = `/${locale}/${"demo"}`;',
      "const r = '/en/dream-mode';",
      "const n = new Set(['dream-mode', 'share']);",
      "import { WaitingListProvider } from '@/components/WaitingList';",
      "export { useWaitingListModal } from './x';",
      "import X from './WaitingListModal';",
      'const h = ROUTES.DREAM_MODE;',
      "load(['dreamMode', 'preDream']);",
      "const s = 'dream_mode';",
      "track({ name: 'pre_dream_started' });",
      "track({ name: 'waiting_list_modal_opened' });",
      "track({ name: 'dream_mode_gate_join_click' });",
      "const h = ['', locale, 'demo'].join('/');",
      "const t = 'Modo Sonho';",
      "const t = 'Dream-Mode-Rechner';",
    ])
      expect(probe(bad).length, bad).toBeGreaterThan(0);
  });
});
