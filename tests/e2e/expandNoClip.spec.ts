/**
 * EXPAND-NO-CLIP · an opened panel shows all of its content (market clean-up W-D2 audit).
 *
 * Both expandable components once opened to a fixed max-height (the strategies table's protocol
 * detail to 300px, the protocols page's cards to 800px) with `overflow: hidden`. Sky's longer,
 * approved education text then lost the end of its risk list at 320px, and seven other protocol
 * cards were already cut on phones. Both now open to the content's real height (a grid row from 0fr
 * to 1fr). This opens every panel on both pages at 320px in every locale and fails if any open
 * panel's content is taller than what it shows.
 */
import { expect, test, type Page } from '@playwright/test';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

/**
 * Open each toggle whose `aria-controls` matches, one at a time (an accordion closes the others),
 * let it settle, and report each panel that shows less than its content.
 */
async function clippedPanels(page: Page, controls: string): Promise<string[]> {
  // Through the DOM: with 25+ cards, Playwright's wait for a "stable" element can outlast the test
  // budget. Each toggle is a real button; its own click handler runs.
  const result = await page.evaluate(async (prefix) => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 450));
    const toggles = [
      ...document.querySelectorAll<HTMLButtonElement>(`button[aria-controls^="${prefix}"]`),
    ].filter((b) => b.offsetParent !== null);
    const clipped: string[] = [];
    for (const toggle of toggles) {
      if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
      await settle();
      const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
      if (!panel) continue;
      // The content's height is the inner wrapper's when there is one: it clips its own overflow,
      // so the panel's scrollHeight alone would not see a cap (a sabotage passed that way).
      const inner = panel.firstElementChild as HTMLElement | null;
      const content = Math.max(panel.scrollHeight, inner?.scrollHeight ?? 0);
      if (content > panel.clientHeight + 1)
        clipped.push(`${panel.id}: shows ${panel.clientHeight} of ${content}px`);
    }
    return { opened: toggles.length, clipped };
  }, controls);
  expect(result.opened, `no ${controls} toggles found`).toBeGreaterThan(0);
  return result.clipped;
}

test.use({ viewport: { width: 320, height: 800 }, reducedMotion: 'reduce' });
test.setTimeout(90_000);

for (const locale of LOCALES) {
  test(`every strategies-table panel opens in full at 320px (${locale})`, async ({ page }) => {
    await page.goto(`/${locale}/strategies`);
    expect(await clippedPanels(page, 'protocol-detail-mobile-')).toEqual([]);
  });

  test(`every protocol card opens in full at 320px (${locale})`, async ({ page }) => {
    await page.goto(`/${locale}/protocols`);
    expect(await clippedPanels(page, 'expandable-content-')).toEqual([]);
  });
}
