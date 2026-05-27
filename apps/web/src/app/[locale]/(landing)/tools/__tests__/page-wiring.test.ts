/**
 * Phase 7 §7.3 — Page-wiring smoke tests for all 10 tools (plus the lesson).
 *
 * Per `docs/tools/README.md` §9.1, this is the highest-value test gap: a
 * silent drop of `engine="tool"` or `enablePathDependent` would NOT break any
 * existing engine-level unit test (the engines stay green; they just stop
 * being called). The component-level page-wiring smoke is the only thing
 * that catches it.
 *
 * Implementation: read each page.tsx as source and assert the key wiring
 * tokens are present. This is a static-analysis test (no rendering) — it
 * catches "did this page drop the engine prop?" without paying the cost of a
 * full Next.js test harness. Brittle to file restructure on purpose: if the
 * page.tsx layout changes, this test forces the maintainer to revisit the
 * wiring intentionally.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Tests run with cwd = apps/web by default (per vitest config in package.json).
const PAGES_DIR = resolve(process.cwd(), 'src/app/[locale]/(landing)/tools');

function pageSource(slug: string): string {
  return readFileSync(resolve(PAGES_DIR, slug, 'page.tsx'), 'utf-8');
}

describe('Tool page-wiring smoke tests', () => {
  describe('compound-interest', () => {
    const src = pageSource('compound-interest');
    it('passes engine="tool"', () => {
      expect(src).toMatch(/engine="tool"/);
    });
    it('does NOT pass enablePathDependent', () => {
      expect(src).not.toMatch(/enablePathDependent/);
    });
    it('passes recurringSliderMax (C6)', () => {
      expect(src).toMatch(/recurringSliderMax/);
    });
  });

  describe('retirement', () => {
    const src = pageSource('retirement');
    it('passes engine="tool"', () => {
      expect(src).toMatch(/engine="tool"/);
    });
    it('does NOT pass enablePathDependent', () => {
      expect(src).not.toMatch(/enablePathDependent/);
    });
    it('passes recurringSliderMax (C6)', () => {
      expect(src).toMatch(/recurringSliderMax/);
    });
  });

  describe('goal-savings', () => {
    const src = pageSource('goal-savings');
    it('passes engine="tool"', () => {
      expect(src).toMatch(/engine="tool"/);
    });
    it('passes enablePathDependent (the ONE tool that does)', () => {
      expect(src).toMatch(/enablePathDependent/);
    });
    it('hides the retrospective toggle for USD locale (C8)', () => {
      // C8 close: `enablePathDependent={locale !== 'en'}` — the !== 'en' check
      // is the load-bearing token.
      expect(src).toMatch(/locale\s*!==\s*['"]en['"]/);
    });
    it('passes recurringSliderMax (C6)', () => {
      expect(src).toMatch(/recurringSliderMax/);
    });
  });

  describe('emergency-fund', () => {
    const src = pageSource('emergency-fund');
    it('renders EmergencyFundCalculator', () => {
      expect(src).toMatch(/EmergencyFundCalculator/);
    });
  });

  describe('time-to-target', () => {
    const src = pageSource('time-to-target');
    it('renders TimeToTargetCalculator', () => {
      expect(src).toMatch(/TimeToTargetCalculator/);
    });
  });

  describe('inflation-impact', () => {
    const src = pageSource('inflation-impact');
    it('renders InflationImpactCalculator', () => {
      expect(src).toMatch(/InflationImpactCalculator/);
    });
  });

  describe('currency-depreciation', () => {
    const src = pageSource('currency-depreciation');
    it('renders CurrencyDepreciationCalculator', () => {
      expect(src).toMatch(/CurrencyDepreciationCalculator/);
    });
  });

  describe('card-fees', () => {
    const src = pageSource('card-fees');
    it('renders CardFeesCalculator', () => {
      expect(src).toMatch(/CardFeesCalculator/);
    });
  });

  describe('idle-cash', () => {
    const src = pageSource('idle-cash');
    it('renders IdleCashCalculator', () => {
      expect(src).toMatch(/IdleCashCalculator/);
    });
  });

  describe('asset-history', () => {
    const src = pageSource('asset-history');
    it('renders AssetHistoryCalculator', () => {
      expect(src).toMatch(/AssetHistoryCalculator/);
    });
  });

  describe('tools index', () => {
    const src = readFileSync(resolve(PAGES_DIR, 'page.tsx'), 'utf-8');
    it('imports SHIPPED_TOOLS from lib/tools (NOT a local literal)', () => {
      expect(src).toMatch(/SHIPPED_TOOLS/);
      expect(src).toMatch(/from\s+['"]@\/lib\/tools['"]/);
      // The local literal `const SHIPPED_TOOLS = [...]` MUST NOT be defined
      // here anymore (Phase 4 §4.2 consolidated it to lib/tools).
      expect(src).not.toMatch(/const\s+SHIPPED_TOOLS\s*:\s*ReadonlyArray/);
    });
    it('uses explicit VALID_AUDIENCES allowlist (C41)', () => {
      expect(src).toMatch(/VALID_AUDIENCES/);
    });
  });
});

describe('Lesson page-wiring smoke test (out-of-/tools scope but shares the engine)', () => {
  it('LessonThreeBeat renders CompoundInterestCalculator WITHOUT engine="tool"', () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        'src/components/Sections/Lesson/variants/LessonThreeBeat/LessonThreeBeat.tsx'
      ),
      'utf-8'
    );
    expect(src).toMatch(/CompoundInterestCalculator/);
    // The lesson MUST NOT use engine="tool" — that would silently flip the
    // lesson to the hedged engine and produce non-pedagogical numbers.
    expect(src).not.toMatch(/engine="tool"/);
  });
});
