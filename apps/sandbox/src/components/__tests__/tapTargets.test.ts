import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * REQUIREMENT (handoff §6.6 / `5.234`: every touch target >= 44x44; 2026-10-18 lane
 * audit): the links the audit measured below the floor reach it — either the element is
 * at least the tap token tall, or a transparent ::after sized from the token carries the
 * hit area (for inline text links whose look and baseline must not move). Read from the
 * stylesheets (happy-dom computes no layout), as `SegmentedToggle.test.tsx` does.
 */
const read = (file: string) => readFileSync(join(process.cwd(), 'src/components', file), 'utf8');
function block(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`);
  expect(at, `${selector} not found`).toBeGreaterThan(-1);
  const from = css.slice(at);
  return from.slice(0, from.indexOf('}'));
}

const TALL: [string, string][] = [
  ['GoalsListScreen.module.css', '.detailHead'],
  ['LegalReadiness.module.css', '.heading'],
  ['LegalReadiness.module.css', '.infoRow'],
];
const EXTENDED: [string, string][] = [
  ['HomeScreen.module.css', '.viewAll'],
  ['ComprehensionCheck.module.css', '.skip'],
];

describe('touch targets reach the 44px floor', () => {
  for (const [file, selector] of TALL) {
    it(`should size ${selector} (${file}) from the tap token`, () => {
      expect(block(read(file), selector)).toMatch(/min-height:\s*var\(--sb-tap\)/);
    });
  }
  for (const [file, selector] of EXTENDED) {
    it(`should extend ${selector} (${file}) with a transparent tap-token ::after`, () => {
      const css = read(file);
      expect(block(css, selector)).toMatch(/position:\s*relative/);
      const after = block(css, `${selector}::after`);
      expect(after).toMatch(/height:\s*var\(--sb-tap\)/);
      expect(after).toMatch(/width:\s*100%/);
      expect(after).not.toMatch(/background/);
    });
  }
});
