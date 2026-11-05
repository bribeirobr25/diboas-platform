/**
 * Register 5.738 · every width-capped block of a centre-aligned CinematicHero is centred.
 *
 * A block narrower than its column sits at the column's left edge unless its inline margins
 * resolve to `auto`: `text-align: center` on the container centres the TEXT inside each box,
 * not the box. `/protocols` showed its second sub-headline (`.subheadline2`, 44ch) hugging the
 * left of a 704 px column (129.9 px off centre on diboas.com at 1440 px, 2026-11-03).
 *
 * How the guard reads the stylesheet:
 * - every rule, top-level and inside `@media`/`@supports`, with each comma-separated selector
 *   on its own (a cap or an override cannot hide in a combined or conditional rule);
 * - a block is "capped" when any rule ending in its class sets `max-width`, `width`,
 *   `max-inline-size` or `inline-size` to something other than a full-width value;
 * - the classes the component renders are read from every source file of the component
 *   (`styles.x` and `styles['x']`); a computed `styles[expr]` fails, because it cannot be read;
 * - each side's margin is resolved like the cascade does for the centre variant: the
 *   declaration from the most specific, then latest, top-level rule wins, and any conditional
 *   (`@media`) rule that sets a side to something other than `auto` fails outright.
 * The capped list is pinned, so a new capped block must be added here (and so reviewed).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(DIR, 'CinematicHero.module.css'), 'utf8');

const sourceFiles = fs
  .readdirSync(DIR, { recursive: true, encoding: 'utf8' })
  .filter((f) => /\.tsx?$/.test(f) && !/(__tests__|\.stories\.|\.test\.)/.test(f));
const source = sourceFiles.map((f) => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n');

interface Rule {
  selector: string;
  body: string;
  order: number;
  conditional: boolean;
}

function normaliseSelector(sel: string): string {
  return sel
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/\[data-align=([A-Za-z-]+)\]/g, "[data-align='$1']");
}

/** Splits a selector list at commas that are not inside parentheses or brackets. */
function splitTopLevel(prelude: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of prelude) {
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  parts.push(cur);
  return parts;
}

/** Every style rule, split per selector, with its source order and whether an at-rule wraps it. */
function parseRules(text: string, conditional = false, start = { n: 0 }): Rule[] {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  let i = 0;
  while (i < clean.length) {
    const open = clean.indexOf('{', i);
    if (open === -1) break;
    const prelude = clean.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < clean.length && depth > 0) {
      if (clean[j] === '{') depth += 1;
      else if (clean[j] === '}') depth -= 1;
      j += 1;
    }
    const body = clean.slice(open + 1, j - 1);
    if (prelude.startsWith('@')) {
      rules.push(...parseRules(body, true, start));
    } else {
      const order = start.n++;
      for (const sel of splitTopLevel(prelude)) {
        rules.push({ selector: normaliseSelector(sel), body, order, conditional });
      }
    }
    i = j;
  }
  return rules;
}

const rules = parseRules(css);

/** The class the selector's last compound targets, if it is a class selector. */
function targetClass(selector: string): string | null {
  const last = selector.split(/[ >+~]+/).pop() ?? '';
  const m = /\.([A-Za-z0-9_-]+)(?::[\w-]+(?:\([^)]*\))?)*$/.exec(last);
  return m ? (m[1] as string) : null;
}

/** Selectors that apply when the hero is NOT centre-aligned are irrelevant here. */
function appliesToCentreVariant(selector: string): boolean {
  const aligns = [...selector.matchAll(/\[data-align='([^']*)'\]/g)].map((m) => m[1]);
  return aligns.every((a) => a === 'center');
}

function specificity(selector: string): number {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classLike = (selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  const types = (selector.match(/(^|[ >+~])[a-z][\w-]*/g) ?? []).length;
  return ids * 10000 + classLike * 100 + types;
}

function declarations(body: string): Array<[string, string]> {
  return body
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d.includes(':'))
    .map((d) => {
      const at = d.indexOf(':');
      return [
        d.slice(0, at).trim().toLowerCase(),
        d
          .slice(at + 1)
          .replace(/!important/i, '')
          .trim(),
      ] as [string, string];
    });
}

/** Inline (left/right) margin values a declaration list sets, in LTR, in declaration order. */
function inlineMargins(body: string): { left?: string; right?: string } {
  const out: { left?: string; right?: string } = {};
  for (const [prop, value] of declarations(body)) {
    const v = value.split(/\s+/).filter(Boolean);
    if (prop === 'margin') {
      if (v.length === 1) out.left = out.right = v[0];
      else if (v.length === 2 || v.length === 3) out.left = out.right = v[1];
      else if (v.length === 4) [out.right, out.left] = [v[1], v[3]];
    } else if (prop === 'margin-inline') {
      out.left = v[0];
      out.right = v[1] ?? v[0];
    } else if (prop === 'margin-left' || prop === 'margin-inline-start') out.left = v[0];
    else if (prop === 'margin-right' || prop === 'margin-inline-end') out.right = v[0];
  }
  return out;
}

const FULL_WIDTH = /^(100%|auto|none|var\(--percent-100\))$/;
const CAP_PROPS = new Set(['max-width', 'width', 'max-inline-size', 'inline-size']);

const cappedClasses = [
  ...new Set(
    rules
      .filter((r) => declarations(r.body).some(([p, v]) => CAP_PROPS.has(p) && !FULL_WIDTH.test(v)))
      .map((r) => targetClass(r.selector))
      .filter((c): c is string => c !== null)
  ),
];

/** Every local name the component's files import the CSS module under (not only `styles`). */
const moduleAliases = [
  ...new Set(
    [...source.matchAll(/import\s+(\w+)\s+from\s+['"][^'"]*CinematicHero\.module\.css['"]/g)].map(
      (m) => m[1] as string
    )
  ),
];

const renderedClasses = new Set(
  moduleAliases.flatMap((alias) => [
    ...[
      ...source.matchAll(
        new RegExp(
          `\\b${alias}(?:\\?\\.|\\.)([A-Za-z0-9_]+)|\\b${alias}\\[\\s*['"]([A-Za-z0-9_-]+)['"]\\s*\\]`,
          'g'
        )
      ),
    ].map((m) => (m[1] ?? m[2]) as string),
    ...[...source.matchAll(new RegExp(`\\{([^}]+)\\}\\s*=\\s*${alias}\\b`, 'g'))].flatMap((m) =>
      (m[1] as string).split(',').map((x) => (x.split(':')[0] as string).trim())
    ),
  ])
);

const cappedAndRendered = cappedClasses.filter((c) => renderedClasses.has(c)).sort();

/** The inline margins a block resolves to in the centre variant, or why it cannot be trusted. */
function resolvedCentreMargins(cls: string): {
  left?: string;
  right?: string;
  conditional: string[];
} {
  const relevant = rules.filter(
    (r) => targetClass(r.selector) === cls && appliesToCentreVariant(r.selector)
  );
  const conditional = relevant
    .filter((r) => r.conditional)
    .flatMap((r) => {
      const m = inlineMargins(r.body);
      return [m.left, m.right]
        .filter((v): v is string => v !== undefined && v !== 'auto')
        .map((v) => `${r.selector} → ${v}`);
    });
  const winners = relevant
    .filter((r) => !r.conditional)
    .sort((a, b) => specificity(a.selector) - specificity(b.selector) || a.order - b.order);
  const resolved: { left?: string; right?: string } = {};
  for (const r of winners) Object.assign(resolved, inlineMargins(r.body));
  return { ...resolved, conditional };
}

/**
 * Constructs this reader cannot resolve are REFUSED rather than trusted (fourth audit,
 * 2026-11-05): a margin under `!important` (it overrides the cascade order the resolver
 * models), `:is()` / `:where()` / `:not()` (specificity the resolver does not weigh), CSS
 * nesting, attribute-class selectors, and any rule setting a margin or width whose target is
 * not a plain class (it could reach a capped block by element or position).
 */
const UNRESOLVABLE: Array<[string, (r: Rule) => boolean]> = [
  ['a margin under !important', (r) => /(^|;|\s)margin[\w-]*\s*:[^;]*!important/i.test(r.body)],
  [':is() / :where() / :not()', (r) => /:(is|where|not)\(/.test(r.selector)],
  ['CSS nesting', (r) => /&/.test(r.selector) || /\{/.test(r.body)],
  ['an attribute-class selector', (r) => /\[class/.test(r.selector)],
  [
    'a margin or width rule whose target is not a plain class',
    (r) =>
      targetClass(r.selector) === null &&
      /(^|;|\s)(margin|width|max-width|inline-size|max-inline-size)[\w-]*\s*:/.test(r.body),
  ],
];

describe('CinematicHero centre variant (5.738)', () => {
  it('should use no CSS construct the centring reader cannot resolve when the module is parsed', () => {
    const found = rules.flatMap((r) =>
      UNRESOLVABLE.filter(([, test]) => test(r)).map(([why]) => `${r.selector} — ${why}`)
    );
    expect(found).toEqual([]);
  });

  it('should find the CSS module under at least one import name when reading the component', () => {
    expect(moduleAliases.length).toBeGreaterThan(0);
  });

  it('should derive exactly the capped blocks the hero renders when reading the stylesheet', () => {
    expect(cappedAndRendered).toEqual(['container', 'content', 'subheadline', 'subheadline2']);
  });

  it('should read every rendered class when the component names its classes literally', () => {
    expect(source).not.toMatch(/styles\[\s*(?!['"])/);
  });

  it.each(cappedAndRendered)(
    'should resolve auto inline margins for .%s when the hero is centre-aligned',
    (cls) => {
      const { left, right, conditional } = resolvedCentreMargins(cls);
      expect(conditional, `.${cls}: a conditional rule moves it off centre`).toEqual([]);
      expect({ left, right }, `.${cls} must resolve to auto inline margins`).toEqual({
        left: 'auto',
        right: 'auto',
      });
    }
  );
});

describe('centre-margin reader (self-test)', () => {
  it.each([
    ['margin: 0 auto', 'auto', 'auto'],
    ['margin: auto', 'auto', 'auto'],
    ['margin: 0 auto 1rem', 'auto', 'auto'],
    ['margin: 1rem auto 0 auto', 'auto', 'auto'],
    ['margin-inline: auto', 'auto', 'auto'],
    ['margin-inline: auto auto', 'auto', 'auto'],
    ['margin-inline-start: auto; margin-inline-end: auto', 'auto', 'auto'],
    ['margin-left: auto; margin-right: auto', 'auto', 'auto'],
    ['margin: 0 auto; margin-left: 0', '0', 'auto'],
    ['margin: auto 0', '0', '0'],
    ['margin: 0 0 0 auto', 'auto', '0'],
  ])('should read "%s" as left %s, right %s when parsing a declaration list', (body, l, r) => {
    expect(inlineMargins(body)).toEqual({ left: l, right: r });
  });
});

/**
 * The rendered guard (`tests/e2e/heroCentring.spec.ts`) measures a hand-written list of pages.
 * This pins that list to the source: every file that centre-aligns a cinematic hero, and the
 * route the e2e must cover for it (fourth audit, 2026-11-05). A sixth centred hero fails here
 * until it is added to both.
 */
describe('CinematicHero centre variant · the e2e covers every centred hero (5.738)', () => {
  const WEB_SRC = path.resolve(DIR, '../../..');
  const CENTRED_CALLERS: Record<string, string> = {
    'components/Pages/Protocols/sections/ProtocolsHeroSection.tsx': '/en/protocols',
    'components/Pages/StrategiesClientSections.tsx': '/en/strategies',
    'components/Sections/LearnIndex/LearnIndex.tsx': '/en/learn',
    'components/Sections/ToolsIndex/ToolsIndex.tsx': '/en/tools',
    'config/landing-about.ts': '/en/about',
  };

  it('should find exactly the pinned centre-aligned hero callers when scanning the source', () => {
    const found = (fs.readdirSync(WEB_SRC, { recursive: true, encoding: 'utf8' }) as string[])
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /\.tsx?$/.test(f) && !/(__tests__|\.test\.|\.stories\.)/.test(f))
      .filter((f) => {
        const src = fs.readFileSync(path.join(WEB_SRC, f), 'utf8');
        return (
          /align="center"|align: 'center'/.test(src) &&
          /CinematicHero|variant: 'cinematic'|variant="cinematic"/.test(src)
        );
      })
      .sort();
    expect(found).toEqual(Object.keys(CENTRED_CALLERS).sort());
  });

  it('should list every centred hero route in the rendered guard when its pages are read', () => {
    const spec = fs.readFileSync(
      path.resolve(WEB_SRC, '../../../tests/e2e/heroCentring.spec.ts'),
      'utf8'
    );
    for (const route of Object.values(CENTRED_CALLERS)) expect(spec).toContain(`'${route}'`);
  });
});
