import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * REQUIREMENT (WCAG 2.4.7 focus visible; handoff §6.6 44x44; 2026-10-18 lane audit): a
 * linked Profile row is a real box — `display: contents` drew none, so the focus outline
 * never showed and only the icon and text were clickable. Read from the stylesheet
 * (happy-dom computes no layout), as `SegmentedToggle.test.tsx` does.
 */
const css = readFileSync(join(process.cwd(), 'src/components/ProfileScreen.module.css'), 'utf8');
const rule = (selector: string) => {
  const from = css.slice(css.indexOf(`${selector} {`));
  return from.slice(0, from.indexOf('}'));
};

describe('Profile row link (focus + target)', () => {
  it('should give the link its own box, never display: contents', () => {
    expect(css.indexOf('.rowLink {')).toBeGreaterThan(-1);
    expect(rule('.rowLink')).not.toMatch(/display:\s*contents/);
    expect(rule('.rowLink')).toMatch(/display:\s*flex/);
  });

  it('should make the link at least the tap token tall', () => {
    expect(rule('.rowLink')).toMatch(/min-height:\s*var\(--sb-tap\)/);
  });
});
