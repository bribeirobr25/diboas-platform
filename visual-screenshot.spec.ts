import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'screenshots/visual-audit';

/**
 * Most-used device viewports (StatCounter Global Stats 2025-2026):
 * - Mobile:  iPhone SE (375x667), iPhone 14/15 (390x844), Samsung Galaxy S (412x915), Galaxy A (360x780)
 * - Tablet:  iPad portrait (768x1024), iPad landscape (1024x768)
 * - Desktop: MacBook Air (1440x900), Full HD (1920x1080), Standard (1280x800)
 */
const DEVICES = [
  // Mobile devices (< 768px breakpoint)
  { name: 'iPhoneSE',       width: 375,  height: 667,  category: 'mobile' },
  { name: 'iPhone14Pro',    width: 390,  height: 844,  category: 'mobile' },
  { name: 'GalaxyS22',      width: 412,  height: 915,  category: 'mobile' },
  { name: 'GalaxyA',        width: 360,  height: 780,  category: 'mobile' },
  // Tablet (768px breakpoint)
  { name: 'iPadPortrait',   width: 768,  height: 1024, category: 'tablet' },
  { name: 'iPadLandscape',  width: 1024, height: 768,  category: 'tablet' },
  // Desktop (>= 1024px breakpoint)
  { name: 'Desktop1280',    width: 1280, height: 800,  category: 'desktop' },
  { name: 'MacBookAir',     width: 1440, height: 900,  category: 'desktop' },
  { name: 'FullHD',         width: 1920, height: 1080, category: 'desktop' },
] as const;

/** Sections with responsive layout changes (two-column, grid, carousel) */
const LAYOUT_SECTIONS = [
  { name: 'S01-Hero',       locator: '[data-section-id="hero-section-b2c"]', fallback: 'section:first-of-type' },
  { name: 'S02-Origin',     locator: '[data-section-id="origin-story-section-b2c"]' },
  { name: 'S03-HowItWorks', locator: '[data-section-id="how-it-works-section-b2c"]' },
  { name: 'S04-Scenarios',  locator: '[data-section-id="scenarios-section-b2c"]' },
  { name: 'S05-Features',   locator: '[data-section-id="features-section-b2c"]' },
  { name: 'S06-Fees',       locator: '[data-section-id="fees-section-b2c"]' },
  { name: 'S07-Catch',      locator: '[data-section-id="catch-section-b2c"]' },
  { name: 'S08-Demo',        locator: '[data-section-id="demo-section-b2c"]' },
  { name: 'S09-SocialProof', locator: '[data-section-id="social-proof-section-b2c"]' },
  { name: 'S10-Waitlist',   locator: '[data-testid="waitlist-section-b2c"]' },
  { name: 'S11-FAQ',        locator: '[data-section-id="faq-section-b2c"]' },
  { name: 'S12-Footer',     locator: 'footer' },
];

async function dismissCookies(page: import('@playwright/test').Page) {
  try {
    const btn = page.locator('button:has-text("Accept")');
    if (await btn.isVisible({ timeout: 2000 })) {
      await btn.click();
      await page.waitForTimeout(500);
    }
  } catch { /* no cookie banner */ }
}

// Full-page screenshot at each device viewport
for (const device of DEVICES) {
  test(`${device.name} (${device.width}x${device.height}): Full page`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await dismissCookies(page);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/fullpage-${device.name}.png`,
      fullPage: true,
    });
  });
}

// Per-section screenshots at each device viewport
for (const device of DEVICES) {
  test(`${device.name} (${device.width}x${device.height}): All sections`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await dismissCookies(page);

    for (const section of LAYOUT_SECTIONS) {
      let el = page.locator(section.locator);
      if (!(await el.count())) {
        if ('fallback' in section && section.fallback) {
          el = page.locator(section.fallback);
        } else {
          continue;
        }
      }
      await el.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await el.first().screenshot({
        path: `${SCREENSHOT_DIR}/${section.name}-${device.name}.png`,
      });
    }
  });
}
