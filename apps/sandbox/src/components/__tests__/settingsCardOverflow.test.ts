import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * REQUIREMENT (2026-10-18 lane audit, measured in a production build): every language in
 * the Settings Language menu can be chosen. The menu is an absolutely positioned popover
 * inside a Settings card, so a clipping card (`overflow: hidden|clip|auto|scroll`) cuts it
 * off — it did: only "English" was clickable, at 375 and 1440. Read from the stylesheet
 * (happy-dom computes no layout); the browser measurement is in the lane-audit record.
 */
describe('Settings cards never clip the language menu', () => {
  it('should not clip overflow on a Settings card', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/components/SettingsScreen.module.css'),
      'utf8'
    );
    const at = css.indexOf('.card {');
    expect(at).toBeGreaterThan(-1);
    const block = css.slice(at, css.indexOf('}', at));
    expect(block).not.toMatch(/overflow(-[xy])?:\s*(hidden|clip|auto|scroll)/);
  });

  it('should keep the menu an absolutely positioned popover (what makes clipping matter)', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/components/LocaleSwitcher.module.css'),
      'utf8'
    );
    const at = css.indexOf('.menu {');
    expect(css.slice(at, css.indexOf('}', at))).toMatch(/position:\s*absolute/);
  });
});
