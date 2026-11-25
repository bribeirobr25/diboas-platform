/**
 * JSX-LEAK-1 · conditionals in the market's own folders are ternaries (market clean-up C2-S G2,
 * register `5.916`; CLAUDE.md "explicit conditional rendering": a `&&` can render a stray `0`).
 *
 * `react/jsx-no-leaked-render` (`validStrategies: ['ternary']`) is scoped to four folders in
 * `eslint.config.mjs`. A mistyped glob (no `src/` prefix, an unescaped `[locale]`) silently matches
 * nothing, so each folder is proven on its own: ESLint's resolved config for a file there carries
 * the rule at `error`, and an `&&` planted at that path is reported. CI's `lint` step then fails on
 * any real site.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = join(__dirname, '../..');
const require = createRequire(join(WEB, 'package.json'));
const { ESLint } = require('eslint') as typeof import('eslint');

/**
 * File paths in each scoped folder, at its root and one level down, where the real components live
 * (the files need not exist): a `/*` glob would match the root probe only (W-D2 audit sabotage).
 */
const FOLDERS = [
  'src/app/[locale]/(landing)/market/__probe__.tsx',
  'src/app/[locale]/(landing)/market/[view]/__probe__.tsx',
  'src/components/Analytics/__probe__.tsx',
  'src/components/Analytics/SignalCard/__probe__.tsx',
  'src/components/Market/__probe__.tsx',
  'src/components/Market/MarketCtaBand/__probe__.tsx',
  'src/lib/market/__probe__.tsx',
  'src/lib/market/nested/__probe__.tsx',
];
const PLANTED = `export function Probe({ n }: { n: number }) {\n  return <div>{n && <span>x</span>}</div>;\n}\n`;

describe('JSX-LEAK-1: the leaked-render rule reaches every market folder', () => {
  const eslint = new ESLint({ cwd: WEB });

  it.each(FOLDERS)(
    'should resolve the rule at error for %s',
    async (file) => {
      const config = await eslint.calculateConfigForFile(join(WEB, file));
      const rule = config?.rules?.['react/jsx-no-leaked-render'];
      expect(rule).toEqual([2, { validStrategies: ['ternary'] }]);
    },
    60_000
  );

  it.each(FOLDERS)(
    'should report an && planted in %s',
    async (file) => {
      const [result] = await eslint.lintText(PLANTED, { filePath: join(WEB, file) });
      expect(result.messages.map((m) => m.ruleId)).toContain('react/jsx-no-leaked-render');
    },
    60_000
  );

  it('should leave a file outside the four folders alone (the scope is the market)', async () => {
    const [result] = await eslint.lintText(PLANTED, {
      filePath: join(WEB, 'src/components/Sections/__probe__.tsx'),
    });
    expect(result.messages.map((m) => m.ruleId)).not.toContain('react/jsx-no-leaked-render');
  }, 60_000);
});
