/**
 * Register 5.738 · in a centre-aligned CinematicHero every text block is centred on its column.
 *
 * Measured on the rendered TEXT (a DOM Range over each block's contents), not on the block's
 * box: `text-align: center` already centres text inside a box, so a box that hugs the left
 * edge shows up as text centred on the wrong point. Proven at 1440 px, where the 44ch second
 * sub-headline is narrower than its 704 px column (at 375 px the box fills the column, so the
 * defect cannot show there; 375 stays in the visual check).
 *
 * Sabotage evidence: against diboas.com before the fix (PLAYWRIGHT_TEST_BASE_URL), /protocols
 * fails on its second sub-headline.
 */
import { test, expect } from '@playwright/test';

const CENTRED_HERO_PAGES = [
  '/en/protocols',
  '/en/tools',
  '/en/learn',
  '/en/strategies',
  '/en/about',
];
const TOLERANCE_PX = 2;

test.describe('centre-aligned hero text is centred (5.738)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of CENTRED_HERO_PAGES) {
    test(`${route}: every text block in the centred hero sits on the column's centre`, async ({
      page,
    }) => {
      await page.goto(route);
      const hero = page.locator('[data-align="center"]').first();
      await expect(hero, `${route} must render a centre-aligned hero`).toBeVisible();

      const offsets = await hero.evaluate((root) => {
        const heading = root.querySelector('h1');
        const column = heading?.parentElement;
        if (!heading || !column) return null;
        const colRect = column.getBoundingClientRect();
        const colCentre = colRect.left + colRect.width / 2;
        return [...column.querySelectorAll(':scope > h1, :scope > p')].map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const r = range.getBoundingClientRect();
          return {
            text: (el.textContent ?? '').trim().slice(0, 40),
            offset: Math.round((r.left + r.width / 2 - colCentre) * 10) / 10,
          };
        });
      });

      expect(offsets, `${route}: the hero's text column was not found`).not.toBeNull();
      expect(offsets!.length).toBeGreaterThan(0);
      for (const block of offsets!) {
        expect(
          Math.abs(block.offset),
          `${route}: "${block.text}" is ${block.offset}px off the column's centre`
        ).toBeLessThanOrEqual(TOLERANCE_PX);
      }
    });
  }
});
