/**
 * Register 5.738 · centred text blocks really sit on the centre, measured in the rendered page.
 *
 * Measured on the rendered TEXT (a DOM Range over each block's contents), not on the box:
 * `text-align: center` already centres text inside a box, so a box hugging the left edge
 * shows up as text centred on the wrong point. Three things are measured:
 * 1. each hero text block against the hero's text column, with the number of blocks pinned
 *    per page (a block that stops rendering cannot pass by being absent);
 * 2. the text column against the hero itself (a shifted column cannot pass by moving its
 *    blocks with it);
 * 3. the CTA row, when a centred hero renders one (none does today; measured if it appears).
 * Plus the similar case the search found: the waitlist form, 10 px left of its centred column.
 *
 * Proven at 1440 px and 768 px, where the capped blocks are narrower than their columns (at
 * 375 px they fill the column, so the defect cannot show there; 375 stays in the visual check).
 *
 * Sabotage evidence: against diboas.com before this fix (PLAYWRIGHT_TEST_BASE_URL), /protocols
 * fails on its second sub-headline (−129.9 px) and the waitlist form fails (−10 px).
 */
import { test, expect, type Page } from '@playwright/test';

/** Every page rendering a centre-aligned CinematicHero, with its number of text blocks. */
const CENTRED_HERO_PAGES: ReadonlyArray<readonly [string, number]> = [
  ['/en/protocols', 3],
  ['/en/tools', 3],
  ['/en/learn', 2],
  ['/en/strategies', 2],
  ['/en/about', 2],
];
const WAITLIST_PAGES = ['/en', '/en/business'];
const WIDTHS = [1440, 768];
const TOLERANCE_PX = 2;

interface Offset {
  label: string;
  offset: number;
}

async function heroOffsets(
  page: Page
): Promise<{ blocks: Offset[]; column: number; cta: number | null } | null> {
  return page
    .locator('[data-align="center"]')
    .first()
    .evaluate((hero) => {
      const centre = (r: DOMRect) => r.left + r.width / 2;
      const round = (n: number) => Math.round(n * 10) / 10;
      const heading = hero.querySelector('h1');
      const column = heading?.parentElement;
      if (!heading || !column) return null;
      const colCentre = centre(column.getBoundingClientRect());
      const blocks = [...column.querySelectorAll(':scope > h1, :scope > p')].map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return {
          label: (el.textContent ?? '').trim().slice(0, 40),
          offset: round(centre(range.getBoundingClientRect()) - colCentre),
        };
      });
      const ctaKids = [...column.querySelectorAll(':scope > div > a, :scope > div > button')];
      let cta: number | null = null;
      if (ctaKids.length > 0) {
        const rects = ctaKids.map((k) => k.getBoundingClientRect());
        const left = Math.min(...rects.map((r) => r.left));
        const right = Math.max(...rects.map((r) => r.right));
        cta = round((left + right) / 2 - colCentre);
      }
      return {
        blocks,
        column: round(colCentre - centre(hero.getBoundingClientRect())),
        cta,
      };
    });
}

test.describe('centre-aligned hero text is centred (5.738)', () => {
  for (const width of WIDTHS) {
    test.describe(`at ${width} px`, () => {
      test.use({ viewport: { width, height: 900 } });

      for (const [route, expectedBlocks] of CENTRED_HERO_PAGES) {
        test(`should centre every hero text block when ${route} renders its centred hero`, async ({
          page,
        }) => {
          await page.goto(route);
          await expect(page.locator('[data-align="center"]').first()).toBeVisible();
          const m = await heroOffsets(page);

          expect(m, `${route}: the hero's text column was not found`).not.toBeNull();
          expect(
            m!.blocks.map((b) => b.label),
            `${route}: hero text blocks`
          ).toHaveLength(expectedBlocks);
          expect(
            Math.abs(m!.column),
            `${route}: the text column is ${m!.column}px off the hero's centre`
          ).toBeLessThanOrEqual(TOLERANCE_PX);
          for (const b of m!.blocks) {
            expect(
              Math.abs(b.offset),
              `${route}: "${b.label}" is ${b.offset}px off centre`
            ).toBeLessThanOrEqual(TOLERANCE_PX);
          }
          if (m!.cta !== null) {
            expect(
              Math.abs(m!.cta),
              `${route}: the CTA row is ${m!.cta}px off centre`
            ).toBeLessThanOrEqual(TOLERANCE_PX);
          }
        });
      }

      for (const route of WAITLIST_PAGES) {
        test(`should centre the waitlist form when ${route} renders the waitlist section`, async ({
          page,
        }) => {
          await page.goto(route);
          const form = page.locator('main form').first();
          await expect(form).toBeVisible();
          // Against the VIEWPORT, not the nearest centred ancestor: `text-align` is inherited,
          // so that ancestor is always the form's own parent and a shifted column would move
          // the form with it (fourth audit, 2026-11-05). The waitlist section spans the page.
          const offset = await form.evaluate((f) => {
            const r = f.getBoundingClientRect();
            const viewportCentre = document.documentElement.clientWidth / 2;
            return Math.round((r.left + r.width / 2 - viewportCentre) * 10) / 10;
          });
          expect(offset, `${route}: the waitlist form was not measured`).not.toBeNull();
          expect(
            Math.abs(offset!),
            `${route}: the waitlist form is ${offset}px off the page centre`
          ).toBeLessThanOrEqual(TOLERANCE_PX);
        });
      }
    });
  }
});
