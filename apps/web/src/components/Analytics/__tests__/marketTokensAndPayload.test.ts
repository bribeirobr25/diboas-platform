/**
 * Two review-gate findings, fixed 2026-10-21 (founder decision):
 *
 *  (b) The market views pass no page data to a client provider. The mock SDK's
 *      provider received every view's data as a client prop (~19 KB on the
 *      Bitcoin view, ~38 KB on the Backdrop view, measured against production)
 *      and nothing read it.
 *  (c) The five badge/card modules size text, spacing and radii with design
 *      tokens, never literals (CLAUDE.md design-token rule; `em` and the
 *      editorial `clamp()` fluid sizes are the documented exceptions).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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
  // A declaration whose value has a px/rem literal outside clamp().
  const LITERAL =
    /^\s*(font-size|padding(-[a-z]+)?|margin(-[a-z]+)?|gap|row-gap|column-gap|border-radius|min-height)\s*:\s*(?![^;]*clamp\()[^;]*\b\d+(\.\d+)?(px|rem)\b/m;

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
    expect([...loaded]).toEqual(expect.arrayContaining(['regime', 'historical', 'methodology']));
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
    const files = ['MarketViewShell.tsx', 'UmbrellaView.tsx', 'StateViewSections.tsx'];
    const missing: string[] = [];
    for (const f of files) {
      const src = read(`app/[locale]/(landing)/market/${f}`);
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
