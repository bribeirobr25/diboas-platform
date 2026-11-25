/**
 * Two review-gate findings, fixed 2026-10-21 (founder decision):
 *
 *  (b) The market views pass no page data to a client provider. The mock SDK's
 *      provider received every view's data as a client prop (~19 KB on the
 *      Bitcoin view, ~38 KB on the Backdrop view, measured against production)
 *      and nothing read it.
 *  (c) The five badge/card modules size text, spacing and radii with design
 *      tokens, never literals (CLAUDE.md design-token rule; `em` is the documented
 *      exception).
 *  (e) No fluid size is written as a literal anywhere in the market's folders (C2-S G2,
 *      `5.914`): the 25 `clamp()` literals became 20 `--editorial-*` tokens with the same
 *      values, pinned here. The file list is walked, not hand-kept (a plan reviewer found
 *      the old five-module list missed three of the five files that held them).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

const SRC = path.resolve(__dirname, '../../..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

describe('(b) no client data provider on the market views', () => {
  it('should not wrap the views in a provider that takes the page data', () => {
    const shell = read('app/[locale]/(landing)/market/MarketViewShell.tsx');
    expect(shell).not.toMatch(/initialData=\{/);
    expect(shell).not.toMatch(/AnalyticsProvider/);
    expect(fs.existsSync(path.join(SRC, 'lib/analytics-sdk/mock-client.tsx'))).toBe(false);
  });
});

describe('(c) the badge/card modules use tokens for text, spacing and radii', () => {
  const MODULES = [
    'SignalCard/SignalCard.module.css',
    'DataFreshnessBadge/DataFreshnessBadge.module.css',
    'RegimeScore/RegimeScore.module.css',
    'ConfidenceBadge/ConfidenceBadge.module.css',
    'RegimeLabel/RegimeLabel.module.css',
  ];
  // A declaration whose value has a px/rem literal (no clamp() exemption since 5.914).
  const LITERAL =
    /^\s*(font-size|padding(-[a-z]+)?|margin(-[a-z]+)?|gap|row-gap|column-gap|border-radius|min-height)\s*:\s*[^;]*\b\d+(\.\d+)?(px|rem)\b/m;

  it('should have no literal sizes in any of the five modules', () => {
    for (const m of MODULES) {
      const css = read(`components/Analytics/${m}`).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(css.match(LITERAL)?.[0] ?? null, m).toBeNull();
    }
  });
});

describe('(d) a client component on the market views gets only the fields it declares (5.390)', () => {
  // A prop passed to a client component is serialised into the page payload.
  // Every loaded market JSON carries internal `_comment` / `_translation_status`
  // notes, so handing a client component the whole loaded object (`regime`,
  // `historical`, …) published them on every page. The class rule: no client
  // component is mounted with a whole loaded object as a prop.
  const VIEWS = ['MarketViewShell.tsx', 'UmbrellaView.tsx', 'StateViewSections.tsx'].map((f) =>
    read(`app/[locale]/(landing)/market/${f}`)
  );
  const clientComponents = fs
    .readdirSync(path.join(SRC, 'components/Analytics'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(SRC, 'components/Analytics', d.name, `${d.name}.tsx`))
    .filter((f) => fs.existsSync(f) && /^\s*['"]use client['"]/m.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.basename(f, '.tsx'));
  // Identifiers bound to a whole loaded object: `const x = initialData.y` and
  // `….data.y` (the umbrella reads each destination's loaded data that way).
  const loaded = new Set(
    VIEWS.flatMap((src) => [
      ...[...src.matchAll(/const (\w+) = initialData\.\w+;/g)].map((m) => m[1]),
      ...[...src.matchAll(/const (\w+) = [^;]*\.data\.\w+[^;]*;/g)].map((m) => m[1]),
      'initialData',
    ])
  );

  it('should find the client components and the loaded objects it guards', () => {
    expect(clientComponents).toEqual(
      expect.arrayContaining(['RegimeScore', 'SignalCard', 'HistoricalRegimeChart'])
    );
    expect([...loaded]).toEqual(
      expect.arrayContaining(['regime', 'historical', 'productDisclaimer'])
    );
  });

  it('should never pass a whole loaded object to a client component', () => {
    const offenders: string[] = [];
    for (const src of VIEWS) {
      for (const name of clientComponents) {
        for (const m of src.matchAll(new RegExp(`<${name}\\b[\\s\\S]*?/>`, 'g'))) {
          for (const p of m[0].matchAll(/\b(\w+)=\{(\w+)\}/g)) {
            if (loaded.has(p[2])) offenders.push(`<${name} ${p[1]}={${p[2]}}>`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('(e) every date the market views format is formatted in UTC (5.631)', () => {
  it('should pass timeZone UTC to every date format in the market views', () => {
    // presentationState.ts formats the history chart's day and month labels on
    // the server for those views (PR #897 added the month labels).
    const files = [
      'app/[locale]/(landing)/market/MarketViewShell.tsx',
      'app/[locale]/(landing)/market/UmbrellaView.tsx',
      'app/[locale]/(landing)/market/StateViewSections.tsx',
      'lib/market/presentationState.ts',
    ];
    const missing: string[] = [];
    for (const f of files) {
      const src = read(f);
      for (const m of src.matchAll(
        /toLocaleDateString\([^)]*\{[\s\S]*?\}\)|DateTimeFormat\([^)]*\)/g
      )) {
        if (!/timeZone:\s*'UTC'/.test(m[0])) missing.push(`${f}: ${m[0].slice(0, 40)}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('(f) the Backdrop conditions are defined once (5.631)', () => {
  it('should name MAC-01..03 only in BACKDROP_CONDITIONS among the views and the umbrella model', () => {
    const files = [
      'app/[locale]/(landing)/market/StateViewSections.tsx',
      'app/[locale]/(landing)/market/UmbrellaView.tsx',
      'lib/market/umbrellaModel.ts',
    ];
    const copies = files.filter((f) => /['"]MAC-0[123]['"]/.test(read(f)));
    expect(copies).toEqual([]);
    expect(read('lib/market/presentationState.ts')).toMatch(/export const BACKDROP_CONDITIONS/);
  });
});

describe('(e) the market writes no fluid size as a literal (5.914)', () => {
  const ROOTS = ['app/[locale]/(landing)/market', 'components/Analytics', 'components/Market'];
  const walk = (dir: string): string[] =>
    fs.readdirSync(path.join(SRC, dir), { withFileTypes: true }).flatMap((d) => {
      const rel = path.join(dir, d.name);
      if (d.isDirectory()) return d.name === '__tests__' ? [] : walk(rel);
      return /\.(module\.css|tsx)$/.test(d.name) && !/\.stories\.tsx$/.test(d.name) ? [rel] : [];
    });
  const FILES = ROOTS.flatMap(walk);
  /** A clamp()/min()/max() with a length inside, once every `var(...)` is removed (a `var()`'s own
   *  bracket would end the match early; the audit planted `clamp(var(--x), 2vw, 3rem)`). */
  const FLUID =
    /\b(?:clamp|min|max)\(\s*[^)]*\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|dvh|svh|lvh|ch|vmin|vmax)\b/i;
  /** A calc() with a viewport unit is a fluid size too. */
  const VIEWPORT_CALC = /\bcalc\([^;]*\b\d+(?:\.\d+)?(?:vw|vh|dvh|svh|lvh|vmin|vmax)\b/i;
  const withoutVars = (text: string) => {
    let out = text;
    for (let i = 0; i < 5 && /var\([^()]*\)/.test(out); i++)
      out = out.replace(/var\([^()]*\)/g, '0');
    return out;
  };

  it('should walk the market folders (the scan is not vacuous)', () => {
    expect(FILES.filter((f) => f.endsWith('.module.css')).length).toBeGreaterThanOrEqual(13);
  });

  it('should find no clamp(), min() or max() size literal in any market CSS module or inline style', () => {
    const offenders = FILES.filter((f) => {
      const raw = read(f);
      if (f.endsWith('.tsx')) {
        // Any clamp()/min()/max()/calc() inside a string or template literal (an inline style, a
        // hoisted style object, a class string): the market sizes nothing from TSX.
        const code = stripComments(raw, f);
        return /(['"`])[^'"`\n]*\b(?:clamp|min|max|calc)\([^'"`\n]*\1/i.test(code);
      }
      const css = withoutVars(raw.replace(/\/\*[\s\S]*?\*\//g, ''));
      return FLUID.test(css) || VIEWPORT_CALC.test(css);
    });
    expect(offenders).toEqual([]);
  });

  it('should keep each fluid token at the value the market held before 5.914', () => {
    // Comments stripped first: a commented-out token must not count as declared.
    const tokens = read('styles/design-tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const PINNED: Record<string, string> = {
      'spacing-hero-top': 'clamp(140px, 20vh, 220px)',
      'spacing-hero-bottom': 'clamp(56px, 9vh, 110px)',
      'spacing-section': 'clamp(56px, 10vh, 120px)',
      'spacing-block-md': 'clamp(28px, 5vh, 46px)',
      'spacing-block-sm': 'clamp(28px, 5vh, 44px)',
      'spacing-block-lg': 'clamp(28px, 5vh, 50px)',
      'spacing-rule': 'clamp(36px, 6vh, 64px)',
      'spacing-columns': 'clamp(36px, 6vw, 80px)',
      'spacing-signal-gap': 'clamp(16px, 3vw, 46px)',
      'spacing-signal': 'clamp(20px, 2.6vw, 32px)',
      'font-size-hero': 'clamp(3.2rem, 9vw, 8rem)',
      'font-size-lead': 'clamp(1.1rem, 1.7vw, 1.4rem)',
      'font-size-section': 'clamp(1.9rem, 4vw, 3.1rem)',
      'font-size-cta-body': 'clamp(1.05rem, 1.6vw, 1.25rem)',
      'font-size-signal-value': 'clamp(1.2rem, 2.4vw, 1.8rem)',
      'font-size-signal-figure': 'clamp(1.4rem, 2.6vw, 2.1rem)',
      'font-size-score': 'clamp(3.5rem, 10vw, 6rem)',
      'font-size-summary': 'clamp(1.1rem, 1.6vw, 1.3rem)',
      'font-size-summary-sm': 'clamp(1.02rem, 1.4vw, 1.2rem)',
      'font-size-summary-lg': 'clamp(1.15rem, 1.7vw, 1.4rem)',
    };
    for (const [name, value] of Object.entries(PINNED)) {
      const defs = [...tokens.matchAll(new RegExp(`--editorial-${name}:\\s*([^;]+);`, 'g'))];
      expect(
        defs.map((d) => d[1]),
        name
      ).toEqual([value]);
    }
  });

  it('should declare every --editorial-* token the market refers to', () => {
    const tokens = read('styles/design-tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const declared = new Set([...tokens.matchAll(/(--editorial-[\w-]+)\s*:/g)].map((m) => m[1]));
    const missing = FILES.flatMap((f) =>
      [...read(f).matchAll(/var\((--editorial-[\w-]+)/g)]
        .map((m) => m[1])
        .filter((name) => !declared.has(name))
        .map((name) => `${f}: ${name}`)
    );
    expect(missing).toEqual([]);
  });
});
