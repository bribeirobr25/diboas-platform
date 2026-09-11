import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * I-1d — the L1 semantic token architecture, held as executable rules.
 *
 * `tokens.css` states six themes (neutral / practice / real × light / dark),
 * built from three tiers: T0 `--palette-*` literals, T1 `--sb-mode-*` the
 * active mode's ramp, T2 `--sb-*` roles. This suite resolves the file the way
 * the browser's cascade does — selector specificity, then source order, then
 * `var()` substitution — for every theme, and asserts the properties the
 * architecture exists to guarantee.
 *
 * Every expected value is DERIVED from a requirement, never read off the file
 * under test (coding-standards rule 4): WCAG 2.1 thresholds, the Minimum UI
 * System's six required themes, Mode × Appearance §18's "brand color ≠
 * financial outcome", and the rule that a dark mode must not depend on which
 * of two mechanisms selected it.
 */

const SRC = join(process.cwd(), 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const TOKENS = read('styles/tokens.css');

// ── a small, honest CSS reader ─────────────────────────────────────────────
type Block = { selector: string; darkMedia: boolean; decls: [string, string][]; order: number };

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function parseDecls(body: string): [string, string][] {
  const out: [string, string][] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i <= body.length; i++) {
    const ch = body[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if ((ch === ';' && depth === 0) || i === body.length) {
      const decl = body.slice(start, i);
      const colon = decl.indexOf(':');
      if (colon > 0)
        out.push([
          decl.slice(0, colon).trim(),
          decl
            .slice(colon + 1)
            .replace(/\s+/g, ' ')
            .trim(),
        ]);
      start = i + 1;
    }
  }
  return out;
}

function parseBlocks(css: string): Block[] {
  const s = stripComments(css);
  const blocks: Block[] = [];
  let order = 0;
  const walk = (from: number, to: number, darkMedia: boolean) => {
    let i = from;
    while (i < to) {
      const open = s.indexOf('{', i);
      if (open < 0 || open >= to) return;
      const head = s.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (depth > 0 && j < s.length) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') depth--;
        j++;
      }
      if (head.startsWith('@media'))
        walk(open + 1, j - 1, darkMedia || /prefers-color-scheme:\s*dark/.test(head));
      else
        blocks.push({
          selector: head.replace(/\s+/g, ' '),
          darkMedia,
          decls: parseDecls(s.slice(open + 1, j - 1)),
          order: order++,
        });
      i = j;
    }
  };
  walk(0, s.length, false);
  return blocks;
}

// ── the theme state and a root-selector matcher ────────────────────────────
type Mode = 'neutral' | 'practice' | 'real';
type State = { mode: Mode; theme: 'light' | 'dark' | null; system: 'light' | 'dark' };

/** Specificity of a `:root…` compound against a state, or null if it does not match. */
function matchRoot(compound: string, st: State): number | null {
  let rest = compound.trim();
  if (!rest.startsWith(':root')) return null;
  rest = rest.slice(':root'.length);
  let specificity = 1;
  const attr = (name: string, value?: string) => {
    const current = name === 'data-theme' ? st.theme : st.mode === 'neutral' ? null : st.mode;
    return value === undefined ? current !== null : current === value;
  };
  while (rest.length) {
    const not = rest.match(/^:not\(\[(data-theme|data-mode)(?:='([^']*)')?\]\)/);
    if (not) {
      if (attr(not[1], not[2])) return null;
      specificity++;
      rest = rest.slice(not[0].length);
      continue;
    }
    const has = rest.match(/^\[(data-theme|data-mode)(?:='([^']*)')?\]/);
    if (has) {
      if (!attr(has[1], has[2])) return null;
      specificity++;
      rest = rest.slice(has[0].length);
      continue;
    }
    return null;
  }
  return specificity;
}

const BLOCKS = parseBlocks(TOKENS);

function computedProps(st: State): Map<string, string> {
  const winner = new Map<string, { key: [number, number]; value: string }>();
  for (const b of BLOCKS) {
    if (b.darkMedia && st.system !== 'dark') continue;
    const specs = b.selector
      .split(',')
      .map((c) => matchRoot(c, st))
      .filter((x): x is number => x !== null);
    if (!specs.length) continue;
    const key: [number, number] = [Math.max(...specs), b.order];
    for (const [prop, value] of b.decls) {
      if (!prop.startsWith('--')) continue;
      const cur = winner.get(prop);
      if (!cur || key[0] > cur.key[0] || (key[0] === cur.key[0] && key[1] >= cur.key[1]))
        winner.set(prop, { key, value });
    }
  }
  return new Map([...winner].map(([k, v]) => [k, v.value]));
}

function resolve(value: string, props: Map<string, string>, depth = 0): string {
  if (depth > 30) throw new Error(`var() cycle near ${value}`);
  return value.replace(
    /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g,
    (_m, name: string, fallback?: string) => {
      if (RUNTIME_VARS.has(name)) return `<runtime ${name}>`;
      const v = props.get(name);
      if (v !== undefined) return resolve(v, props, depth + 1);
      if (fallback !== undefined) return resolve(fallback.trim(), props, depth + 1);
      return `<undefined ${name}>`;
    }
  );
}

// ── colour maths (WCAG 2.1 relative luminance) ─────────────────────────────
type RGBA = [number, number, number, number];
function parseColor(v: string): RGBA {
  const s = v.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{6})$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)).concat(1) as RGBA;
  m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  m = s.match(/^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*transparent\)$/);
  if (m) {
    const c = parseColor(m[1]);
    return [c[0], c[1], c[2], c[3] * (+m[2] / 100)];
  }
  throw new Error(`not a colour: ${v}`);
}
const over = (fg: RGBA, bg: RGBA): RGBA =>
  [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1) as RGBA;
const channel = (c: number) => {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const luminance = (c: RGBA) =>
  0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
const contrast = (a: RGBA, b: RGBA) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// ── the six themes ──────────────────────────────────────────────────────────
const MODES: Mode[] = ['neutral', 'practice', 'real'];
const light = (mode: Mode): State => ({ mode, theme: null, system: 'light' });
const darkExplicit = (mode: Mode): State => ({ mode, theme: 'dark', system: 'light' });
const darkSystem = (mode: Mode): State => ({ mode, theme: null, system: 'dark' });
const THEMES = MODES.flatMap((mode) => [
  { name: `${mode}-light`, state: light(mode) },
  { name: `${mode}-dark`, state: darkExplicit(mode) },
]);

const declared = (prefix: RegExp) => [
  ...new Set(BLOCKS.flatMap((b) => b.decls.map(([p]) => p)).filter((p) => prefix.test(p))),
];
const ROLES = declared(/^--sb-/).filter((p) => !/^--sb-mode-\d+$/.test(p));
const COLOUR_ROLES = ROLES.filter(
  (r) => !/^--sb-(sans|serif|heading|radius-|tap|canvas-width|tabbar-h|elevation-)/.test(r)
);

const valueIn = (role: string, st: State) => resolve(`var(${role})`, computedProps(st));
const colourIn = (role: string, st: State) => parseColor(valueIn(role, st));

// Every text pair clears 4.5:1 (WCAG 1.4.3); graphics clear 3:1 (1.4.11).
const TEXT_PAIRS: [string, string][] = [
  ['--sb-text-primary', '--sb-canvas-base'],
  ['--sb-text-primary', '--sb-surface-primary'],
  ['--sb-text-primary', '--sb-surface-accent'],
  ['--sb-text-secondary', '--sb-surface-primary'],
  ['--sb-text-secondary', '--sb-surface-secondary'],
  ['--sb-text-muted', '--sb-surface-primary'],
  ['--sb-text-muted', '--sb-canvas-base'],
  ['--sb-text-accent', '--sb-surface-primary'],
  ['--sb-text-accent', '--sb-canvas-base'],
  ['--sb-text-accent', '--sb-surface-accent'],
  ['--sb-text-accent-strong', '--sb-surface-primary'],
  ['--sb-text-link', '--sb-surface-primary'],
  ['--sb-text-link', '--sb-canvas-base'],
  ['--sb-text-on-accent-subtle', '--sb-mode-accent-subtle'],
  ['--sb-text-on-plate', '--sb-state-success-subtle'],
  ['--sb-text-on-plate', '--sb-state-warning-subtle'],
  ['--sb-action-primary-text', '--sb-action-primary'],
  ['--sb-action-primary-text', '--sb-action-primary-hover'],
  ['--sb-action-secondary-text', '--sb-surface-primary'],
  ['--sb-action-inverse-text', '--sb-action-inverse'],
  ['--sb-action-inverse-text', '--sb-action-inverse-hover'],
  ['--sb-text-inverse', '--sb-surface-inverse'],
  ['--sb-text-inverse-muted', '--sb-surface-inverse'],
  ['--sb-text-inverse', '--sb-surface-focused'],
  ['--sb-mode-accent-bright', '--sb-surface-inverse'],
  ['--sb-state-warning', '--sb-surface-primary'],
  ['--sb-state-warning-on-subtle', '--sb-state-warning-subtle'],
  ['--sb-state-success-on-subtle', '--sb-state-success-subtle'],
  ['--sb-financial-positive', '--sb-surface-primary'],
  ['--sb-financial-negative', '--sb-surface-primary'],
  ['--sb-identity-available', '--sb-surface-primary'],
  ['--sb-identity-working', '--sb-surface-primary'],
  ['--sb-identity-emergency', '--sb-surface-primary'],
];
const GRAPHIC_PAIRS: [string, string][] = [
  ['--sb-mode-accent', '--sb-surface-primary'],
  ['--sb-mode-accent', '--sb-canvas-base'],
  ['--sb-focus-ring', '--sb-surface-primary'],
  ['--sb-focus-ring', '--sb-canvas-base'],
  ['--sb-text-on-fill', '--sb-mode-accent-fill'],
  ['--sb-text-on-fill', '--sb-identity-goal-0'],
  ['--sb-text-on-fill', '--sb-identity-goal-1'],
  ['--sb-text-on-fill', '--sb-identity-goal-2'],
  ['--sb-text-on-fill', '--sb-identity-goal-3'],
  ['--sb-state-warning-on-fill', '--sb-state-warning-fill'],
];

function pairRatio(fg: string, bg: string, st: State) {
  // A translucent background is composited over the card it sits on; a
  // translucent foreground over that result — what the eye actually receives.
  const base = colourIn('--sb-surface-primary', st);
  const b = over(colourIn(bg, st), base);
  return contrast(over(colourIn(fg, st), b), b);
}

// ── component CSS, for the consumer-side rules ──────────────────────────────
function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === '__tests__' ? [] : cssFiles(p);
    return p.endsWith('.module.css') ? [p] : [];
  });
}
const COMPONENT_CSS = cssFiles(SRC).map((p) => ({
  file: relative(SRC, p),
  css: readFileSync(p, 'utf8'),
}));
const GLOBALS = read('styles/globals.css');
const CONSUMERS = [...COMPONENT_CSS, { file: 'styles/globals.css', css: GLOBALS }];

/** `next/font` sets this one on <html> at runtime; it is not a design token. */
const RUNTIME_VARS = new Set(['--font-sandbox-serif']);
/** Theme overrides that change LAYOUT (not colour) per appearance, with why. */
const STRUCTURAL_OVERRIDES: Record<string, string> = {
  'components/Consent.module.css':
    'dark rows become elevated cards (mockup 09-consent-dark) — gap/padding, not a colour value',
};

describe('the six themes resolve completely', () => {
  it.each(THEMES)('should resolve every role in $name with nothing undefined', ({ state }) => {
    const unresolved = ROLES.filter((r) => valueIn(r, state).includes('<undefined'));
    expect(unresolved).toEqual([]);
  });

  it.each(MODES)('should resolve %s identically whichever mechanism selects dark', (mode) => {
    // An explicit in-app choice and the OS preference are two doors into the
    // same room: the CSS duplicates the dark blocks, so this is the guard that
    // the copies never drift.
    for (const role of ROLES) {
      const explicit = valueIn(role, darkExplicit(mode));
      expect(valueIn(role, darkSystem(mode)), role).toBe(explicit);
      expect(valueIn(role, { mode, theme: 'dark', system: 'dark' }), role).toBe(explicit);
      // …and an explicit LIGHT choice beats a dark OS.
      expect(valueIn(role, { mode, theme: 'light', system: 'dark' }), role).toBe(
        valueIn(role, light(mode))
      );
    }
  });

  it('should make each mode actually re-point the accent family, in both appearances', () => {
    // A mode block that silently failed to apply would leave all three modes
    // identical — the one failure a resolution test alone would not notice.
    for (const pick of [light, darkExplicit]) {
      for (const role of [
        '--sb-mode-accent',
        '--sb-action-primary',
        '--sb-text-accent',
        '--sb-canvas-base',
        '--sb-surface-inverse',
      ]) {
        const values = MODES.map((m) => valueIn(role, pick(m)));
        expect(new Set(values).size, `${role} across modes`).toBe(3);
      }
    }
  });
});

describe('mode never recolours an outcome (Mode × Appearance §18)', () => {
  const OUTCOME = ROLES.filter((r) => /^--sb-(financial|state|identity)-/.test(r));

  it('should declare financial / state / identity roles from the palette only, never the mode ramp', () => {
    const offenders = BLOCKS.flatMap((b) =>
      b.decls
        .filter(([p, v]) => OUTCOME.includes(p) && /--sb-mode-/.test(v))
        .map(([p]) => `${b.selector} ${p}`)
    );
    expect(OUTCOME.length).toBeGreaterThan(10);
    expect(offenders).toEqual([]);
  });

  it.each(['light', 'dark'] as const)(
    'should resolve every outcome role to the same colour in all three modes (%s)',
    (appearance) => {
      const pick = appearance === 'light' ? light : darkExplicit;
      for (const role of OUTCOME) {
        expect(new Set(MODES.map((m) => valueIn(role, pick(m)))).size, role).toBe(1);
      }
    }
  );
});

describe('every foreground clears its background in every theme', () => {
  it.each(THEMES)('should hold the text pairs at >= 4.5:1 in $name', ({ state }) => {
    const failing = TEXT_PAIRS.map(([fg, bg]) => ({
      fg,
      bg,
      ratio: +pairRatio(fg, bg, state).toFixed(2),
    })).filter((p) => p.ratio < 4.5);
    expect(failing).toEqual([]);
  });

  it.each(THEMES)('should hold the graphic pairs at >= 3:1 in $name', ({ state }) => {
    const failing = GRAPHIC_PAIRS.map(([fg, bg]) => ({
      fg,
      bg,
      ratio: +pairRatio(fg, bg, state).toFixed(2),
    })).filter((p) => p.ratio < 3);
    expect(failing).toEqual([]);
  });

  it('should cover every colour role that is painted as a foreground', () => {
    // A new on-colour that no pair checks is the exact gap the pre-I-1d layer
    // had (white under a fill that turned light in dark). Surfaces are the
    // backgrounds of pairs; everything else must appear as a foreground.
    const foregrounds = new Set([...TEXT_PAIRS, ...GRAPHIC_PAIRS].map(([fg]) => fg));
    const backgrounds = new Set([...TEXT_PAIRS, ...GRAPHIC_PAIRS].map(([, bg]) => bg));
    const exempt =
      /^--sb-(canvas|surface|border|action-primary-hover|action-secondary-(border|hover)|action-inverse-hover|mode-accent-subtle|mode-accent-fill|state-(success|warning)-subtle|state-warning-fill|identity-goal)/;
    const uncovered = COLOUR_ROLES.filter(
      (r) => !foregrounds.has(r) && !backgrounds.has(r) && !exempt.test(r)
    );
    expect(uncovered).toEqual([]);
  });
});

describe('components consume roles, and only roles', () => {
  const COLOUR_PROPS =
    /^(color|background(-color)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|box-shadow|accent-color|caret-color|text-decoration-color)$/;

  it('should reference only tokens that tokens.css declares', () => {
    const known = new Set(BLOCKS.flatMap((b) => b.decls.map(([p]) => p)));
    const undefinedRefs = CONSUMERS.flatMap(({ file, css }) =>
      [...stripComments(css).matchAll(/var\(\s*(--[\w-]+)/g)]
        .map((m) => m[1])
        .filter((v) => !known.has(v) && !RUNTIME_VARS.has(v))
        .map((v) => `${file}: ${v}`)
    );
    expect(undefinedRefs).toEqual([]);
  });

  it('should never reach past the roles into the palette or the mode ramp', () => {
    const offenders = CONSUMERS.flatMap(({ file, css }) =>
      [...stripComments(css).matchAll(/var\(\s*(--palette-[\w-]+|--sb-mode-\d+)/g)].map(
        (m) => `${file}: ${m[1]}`
      )
    );
    expect(offenders).toEqual([]);
  });

  it('should carry no literal colour in a colour-bearing property', () => {
    const offenders = CONSUMERS.flatMap(({ file, css }) =>
      parseBlocks(css).flatMap((b) =>
        b.decls
          .filter(
            ([p, v]) =>
              COLOUR_PROPS.test(p) &&
              /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(white|black)\b/i.test(
                v.replace(/url\([^)]*\)/g, '')
              )
          )
          .map(([p, v]) => `${file} ${b.selector} { ${p}: ${v} }`)
      )
    );
    expect(offenders).toEqual([]);
  });

  it('should keep theme and mode decisions in tokens.css, not in components', () => {
    // A component that re-colours itself per theme is how HomeScreen's tones,
    // StrategyDetail's hero and ExitCeremony's card each carried a private dark
    // palette. Image swaps (a different photograph per appearance) and the
    // allow-listed structural overrides are the only theme-conditional rules.
    const offenders = COMPONENT_CSS.flatMap(({ file, css }) =>
      parseBlocks(css)
        .filter((b) => /data-theme|data-mode/.test(b.selector) || b.darkMedia)
        .filter(() => !STRUCTURAL_OVERRIDES[file])
        .flatMap((b) =>
          b.decls
            .filter(([p]) => p !== 'background-image' && p !== 'content')
            .map(([p]) => `${file} ${b.selector} { ${p} }`)
        )
    );
    const modeInComponents = COMPONENT_CSS.filter(({ css }) =>
      /data-mode/.test(stripComments(css))
    ).map((c) => c.file);
    expect(offenders).toEqual([]);
    expect(modeInComponents).toEqual([]);
  });
});

describe('the token file carries nothing dead, and the copy is gone (5.215)', () => {
  const referencedAnywhere = (name: string) =>
    CONSUMERS.some(({ css }) => stripComments(css).includes(`var(${name})`)) ||
    BLOCKS.some((b) => b.decls.some(([p, v]) => p !== name && v.includes(`var(${name})`)));

  it('should reference every declared role, palette entry, ramp step and scale token', () => {
    const everything = declared(/^--/);
    const dead = everything.filter((t) => !referencedAnywhere(t));
    expect(everything.length).toBeGreaterThan(100);
    expect(dead).toEqual([]);
  });

  it('should no longer ship the copied apps/web token file', () => {
    expect(existsSync(join(SRC, 'styles/design-tokens.css'))).toBe(false);
    const layout = read('app/[locale]/layout.tsx');
    expect(layout).toMatch(/import '@\/styles\/tokens\.css';/);
    expect(layout).not.toMatch(/design-tokens/);
  });
});
