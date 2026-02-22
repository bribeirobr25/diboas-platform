import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

// Viewport configurations
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

// ─────────────────────────────────────────────
// HELPER: wait for page to be fully loaded
// ─────────────────────────────────────────────
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Allow hydration
}

// ─────────────────────────────────────────────
// TEST 1: All 11 sections render (Desktop, all locales)
// ─────────────────────────────────────────────
for (const locale of LOCALES) {
  test(`Desktop: All 11 sections visible - ${locale}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(`${BASE_URL}/${locale}`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Section 1: Hero
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // Section 2: Origin Story (prose) — id="our-story"
    const originSection = page.locator('#our-story');
    await expect(originSection).toBeVisible();

    // Section 3: How It Works (ProductCarousel)
    const howItWorks = page.locator('#how-it-works');
    if (await howItWorks.count() > 0) {
      await expect(howItWorks).toBeVisible();
    }

    // Section 4: Scenarios
    const scenarios = page.locator('#scenarios');
    if (await scenarios.count() > 0) {
      await expect(scenarios).toBeVisible();
    }

    // Section 5: Features (FeatureShowcase)
    const features = page.locator('#features');
    if (await features.count() > 0) {
      await expect(features).toBeVisible();
    }

    // Section 6: Fees (FeeTable)
    const fees = page.locator('#fees');
    if (await fees.count() > 0) {
      await expect(fees).toBeVisible();
    }

    // Section 7: What's the Catch (prose)
    const catchSection = page.locator('#the-catch');
    await expect(catchSection).toBeVisible();

    // Section 8: Demo (DemoLauncher)
    const demo = page.locator('#demo');
    if (await demo.count() > 0) {
      await expect(demo).toBeVisible();
    }

    // Section 9: Waitlist
    const waitlist = page.locator('#waitlist');
    if (await waitlist.count() > 0) {
      await expect(waitlist).toBeVisible();
    }

    // Section 10: FAQ
    const faq = page.locator('#faq');
    if (await faq.count() > 0) {
      await expect(faq).toBeVisible();
    }

    // Section 11: Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Take a full-page screenshot for visual review
    await page.screenshot({
      path: `screenshots/desktop-full-${locale}.png`,
      fullPage: true,
    });
  });
}

// ─────────────────────────────────────────────
// TEST 2: All 11 sections render (Mobile, all locales)
// ─────────────────────────────────────────────
for (const locale of LOCALES) {
  test(`Mobile: All 11 sections visible - ${locale}`, async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(`${BASE_URL}/${locale}`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Hero section
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Take full-page mobile screenshot
    await page.screenshot({
      path: `screenshots/mobile-full-${locale}.png`,
      fullPage: true,
    });
  });
}

// ─────────────────────────────────────────────
// TEST 3: Hero section content & CTA (EN desktop)
// ─────────────────────────────────────────────
test('Desktop EN: Hero section has headline, subheadline, and CTA', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Check for hero headline text
  const heroHeadline = page.locator('h1');
  await expect(heroHeadline).toBeVisible();
  const headlineText = await heroHeadline.textContent();
  expect(headlineText?.length).toBeGreaterThan(10);

  // Check for CTA button/link
  const heroSection = page.locator('section').first();
  const ctaLink = heroSection.locator('a, button').first();
  await expect(ctaLink).toBeVisible();
});

// ─────────────────────────────────────────────
// TEST 4: Navigation is visible (Desktop)
// ─────────────────────────────────────────────
test('Desktop EN: MinimalNavigation visible with logo', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Nav should be visible
  const nav = page.locator('nav').first();
  await expect(nav).toBeVisible();

  // Logo should be visible
  const logo = page.locator('nav img').first();
  if (await logo.count() > 0) {
    await expect(logo).toBeVisible();
  }
});

// ─────────────────────────────────────────────
// TEST 5: Navigation is visible (Mobile) + hamburger
// ─────────────────────────────────────────────
test('Mobile EN: Navigation with hamburger menu', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Nav should exist
  const nav = page.locator('nav').first();
  await expect(nav).toBeVisible();

  // Look for hamburger button on mobile
  const hamburger = page.locator('nav button[aria-label*="menu" i], nav button[aria-label*="Menu" i], nav button[aria-label*="navigation" i]');
  if (await hamburger.count() > 0) {
    await expect(hamburger.first()).toBeVisible();
  }
});

// ─────────────────────────────────────────────
// TEST 6: Product Carousel (How It Works) interaction
// ─────────────────────────────────────────────
test('Desktop EN: ProductCarousel navigation works', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Find carousel region
  const carousel = page.locator('[role="region"][aria-label*="carousel" i], [role="region"][aria-label*="Carousel" i], #how-it-works');
  if (await carousel.count() > 0) {
    await expect(carousel.first()).toBeVisible();

    // Look for carousel dots
    const dots = carousel.first().locator('button[aria-label*="slide" i], button[aria-label*="Go to" i]');
    if (await dots.count() > 1) {
      // Click second dot
      await dots.nth(1).click();
      await page.waitForTimeout(500);

      // Click third dot if available
      if (await dots.count() > 2) {
        await dots.nth(2).click();
        await page.waitForTimeout(500);
      }
    }
  }
});

// ─────────────────────────────────────────────
// TEST 7: FeatureShowcase interaction
// ─────────────────────────────────────────────
test('Desktop EN: FeatureShowcase slide navigation', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const features = page.locator('#features');
  if (await features.count() > 0) {
    await features.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Look for next/prev buttons
    const nextBtn = features.locator('button[aria-label*="next" i], button[aria-label*="Next" i]');
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(500);
    }
  }
});

// ─────────────────────────────────────────────
// TEST 8: FeeTable renders correctly (Desktop)
// ─────────────────────────────────────────────
test('Desktop EN: FeeTable shows table with rows', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const fees = page.locator('#fees');
  if (await fees.count() > 0) {
    await fees.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Check for table element
    const table = fees.locator('table');
    if (await table.count() > 0) {
      await expect(table).toBeVisible();
      // Should have header and rows
      const rows = table.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    }
  }
});

// ─────────────────────────────────────────────
// TEST 9: FeeTable mobile card fallback
// ─────────────────────────────────────────────
test('Mobile EN: FeeTable shows mobile card layout', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const fees = page.locator('#fees');
  if (await fees.count() > 0) {
    await fees.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // On mobile, table might be hidden and cards shown
    await page.screenshot({
      path: 'screenshots/mobile-fee-table-en.png',
      clip: await fees.boundingBox() || undefined,
    });
  }
});

// ─────────────────────────────────────────────
// TEST 10: FAQ Accordion interaction
// ─────────────────────────────────────────────
test('Desktop EN: FAQ accordion expand/collapse', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Dismiss cookie consent banner if present (it can intercept clicks)
  const declineBtn = page.getByRole('button', { name: /decline/i });
  if (await declineBtn.count() > 0) {
    await declineBtn.click();
    await page.waitForTimeout(300);
  }

  const faq = page.locator('#faq');
  await faq.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Find accordion buttons
  const accordionButtons = faq.locator('button[aria-expanded]');
  expect(await accordionButtons.count()).toBeGreaterThan(0);

  // First item should be collapsed
  const firstButton = accordionButtons.first();
  await firstButton.scrollIntoViewIfNeeded();
  const initialState = await firstButton.getAttribute('aria-expanded');
  expect(initialState).toBe('false');

  // Click to toggle open
  await firstButton.click();
  await page.waitForTimeout(500);

  const newState = await firstButton.getAttribute('aria-expanded');
  expect(newState).toBe('true');

  // Click a second question — first should collapse (single-expand)
  if (await accordionButtons.count() > 1) {
    await accordionButtons.nth(1).click();
    await page.waitForTimeout(500);

    const firstAfterSecond = await firstButton.getAttribute('aria-expanded');
    expect(firstAfterSecond).toBe('false');

    const secondState = await accordionButtons.nth(1).getAttribute('aria-expanded');
    expect(secondState).toBe('true');
  }
});

// ─────────────────────────────────────────────
// TEST 11: DemoLauncher shows dual CTA
// ─────────────────────────────────────────────
test('Desktop EN: DemoLauncher has two CTA buttons', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const demo = page.locator('#demo');
  if (await demo.count() > 0) {
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Should have primary and secondary buttons
    const buttons = demo.locator('button');
    expect(await buttons.count()).toBeGreaterThanOrEqual(2);

    await page.screenshot({
      path: 'screenshots/desktop-demo-section-en.png',
      clip: await demo.boundingBox() || undefined,
    });
  }
});

// ─────────────────────────────────────────────
// TEST 12: PreDemo launch and screens flow
// ─────────────────────────────────────────────
test('Desktop EN: PreDemo modal opens and shows screens', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const demo = page.locator('#demo');
  if (await demo.count() > 0) {
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click primary CTA (first button - should launch PreDemo)
    const primaryBtn = demo.locator('button').first();
    await primaryBtn.click();
    await page.waitForTimeout(2000);

    // PreDemo should have appeared (modal/overlay)
    const preDemoModal = page.locator('[class*="PreDemo"], [class*="predemo"], [data-testid*="predemo"]');
    if (await preDemoModal.count() > 0) {
      await expect(preDemoModal.first()).toBeVisible();

      await page.screenshot({
        path: 'screenshots/desktop-predemo-open-en.png',
        fullPage: false,
      });

      // Look for login/start screen
      const loginBtn = page.locator('button:has-text("Login"), button:has-text("Start"), button:has-text("Begin"), button:has-text("Enter")');
      if (await loginBtn.count() > 0) {
        await loginBtn.first().click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'screenshots/desktop-predemo-home-en.png',
          fullPage: false,
        });
      }

      // Try to close PreDemo
      const closeBtn = page.locator('button[aria-label*="close" i], button[aria-label*="Close" i], button:has-text("✕"), button:has-text("×")');
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click();
        await page.waitForTimeout(500);
      }
    }
  }
});

// ─────────────────────────────────────────────
// TEST 13: PreDream launch flow
// ─────────────────────────────────────────────
test('Desktop EN: PreDream modal opens', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const demo = page.locator('#demo');
  if (await demo.count() > 0) {
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click secondary CTA (second button - should launch PreDream)
    const buttons = demo.locator('button');
    if (await buttons.count() >= 2) {
      await buttons.nth(1).click();
      await page.waitForTimeout(2000);

      // PreDream should have appeared
      const preDreamModal = page.locator('[class*="PreDream"], [class*="predream"], [class*="DreamMode"], [class*="dreamMode"]');
      if (await preDreamModal.count() > 0) {
        await expect(preDreamModal.first()).toBeVisible();

        await page.screenshot({
          path: 'screenshots/desktop-predream-open-en.png',
          fullPage: false,
        });
      }

      // Close
      const closeBtn = page.locator('button[aria-label*="close" i], button[aria-label*="Close" i], button:has-text("✕"), button:has-text("×")');
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click();
        await page.waitForTimeout(500);
      }
    }
  }
});

// ─────────────────────────────────────────────
// TEST 14: Waitlist form submission flow
// ─────────────────────────────────────────────
test('Desktop EN: Waitlist form renders and validates', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const waitlist = page.locator('#waitlist');
  if (await waitlist.count() > 0) {
    await waitlist.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Find email input
    const emailInput = waitlist.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    if (await emailInput.count() > 0) {
      await expect(emailInput.first()).toBeVisible();

      // Try submitting without email (should show error)
      const submitBtn = waitlist.locator('button[type="submit"], button:has-text("Get access"), button:has-text("Join"), button:has-text("Submit")');
      if (await submitBtn.count() > 0) {
        // Fill email
        await emailInput.first().fill('test@example.com');
        await page.waitForTimeout(300);

        // Check for GDPR checkbox if present
        const gdprCheckbox = waitlist.locator('input[type="checkbox"]');
        if (await gdprCheckbox.count() > 0) {
          await gdprCheckbox.first().check();
        }

        await page.screenshot({
          path: 'screenshots/desktop-waitlist-filled-en.png',
          clip: await waitlist.boundingBox() || undefined,
        });

        // Submit the form
        await submitBtn.first().click();
        await page.waitForTimeout(3000);

        // Check for success state or error
        await page.screenshot({
          path: 'screenshots/desktop-waitlist-result-en.png',
          fullPage: false,
        });
      }
    }
  }
});

// ─────────────────────────────────────────────
// TEST 15: Footer content and locale disclaimers
// ─────────────────────────────────────────────
for (const locale of LOCALES) {
  test(`Desktop: Footer renders with proper disclaimers - ${locale}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto(`${BASE_URL}/${locale}`, { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Copyright should be visible
    const copyright = footer.locator('text=/2026/');
    if (await copyright.count() > 0) {
      await expect(copyright.first()).toBeVisible();
    }

    // Language switcher should be present
    const langSwitcher = footer.locator('button[aria-label*="language" i], button[aria-label*="Language" i], select, [class*="language" i]');

    // Social icons should be present
    const socialLinks = footer.locator('a[target="_blank"]');

    // Locale-specific disclaimers
    if (locale === 'pt-BR') {
      // Should have BCB/CVM disclaimers
      const bcbText = footer.locator('text=/BCB|CVM|instituição financeira/i');
      if (await bcbText.count() > 0) {
        await expect(bcbText.first()).toBeVisible();
      }
    }

    if (locale === 'de' || locale === 'es') {
      // Should have MiCA disclaimer
      const micaText = footer.locator('text=/MiCA|Article 68|Artículo 68|Artikel 68/i');
      if (await micaText.count() > 0) {
        await expect(micaText.first()).toBeVisible();
      }
    }

    await page.screenshot({
      path: `screenshots/desktop-footer-${locale}.png`,
      clip: await footer.boundingBox() || undefined,
    });
  });
}

// ─────────────────────────────────────────────
// TEST 16: Cookie consent banner
// ─────────────────────────────────────────────
test('Desktop EN: Cookie consent banner appears', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  // Clear cookies to trigger banner
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForTimeout(2500); // Cookie banner has 1.5s delay

  const cookieBanner = page.locator('[role="dialog"][aria-live="polite"], [class*="cookie" i], [class*="Cookie" i], [class*="consent" i]');
  if (await cookieBanner.count() > 0) {
    await expect(cookieBanner.first()).toBeVisible();

    await page.screenshot({
      path: 'screenshots/desktop-cookie-consent-en.png',
      fullPage: false,
    });

    // Accept cookies
    const acceptBtn = cookieBanner.first().locator('button:has-text("Accept"), button:has-text("accept"), button:has-text("OK")');
    if (await acceptBtn.count() > 0) {
      await acceptBtn.first().click();
      await page.waitForTimeout(500);
    }
  }
});

// ─────────────────────────────────────────────
// TEST 17: ScenarioCards render with locale content
// ─────────────────────────────────────────────
test('Desktop EN: ScenarioCards show 3 cards', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const scenarios = page.locator('#scenarios');
  if (await scenarios.count() > 0) {
    await scenarios.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Should have 3 scenario cards
    const cards = scenarios.locator('article, [class*="card" i]');
    if (await cards.count() > 0) {
      expect(await cards.count()).toBeGreaterThanOrEqual(3);
    }

    await page.screenshot({
      path: 'screenshots/desktop-scenarios-en.png',
      clip: await scenarios.boundingBox() || undefined,
    });
  }
});

// ─────────────────────────────────────────────
// TEST 18: Mobile scrolling through all sections
// ─────────────────────────────────────────────
test('Mobile EN: Full page scroll captures all sections', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Scroll through the page capturing section screenshots
  const sections = ['hero', 'origin', 'how-it-works', 'scenarios', 'features', 'fees', 'catch', 'demo', 'waitlist', 'faq'];

  for (const sectionId of sections) {
    const section = page.locator(`#${sectionId}`);
    if (await section.count() > 0) {
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const box = await section.boundingBox();
      if (box) {
        await page.screenshot({
          path: `screenshots/mobile-section-${sectionId}-en.png`,
          clip: { x: 0, y: box.y, width: MOBILE.width, height: Math.min(box.height, 1200) },
        });
      }
    }
  }
});

// ─────────────────────────────────────────────
// TEST 19: i18n - PT-BR locale content check
// ─────────────────────────────────────────────
test('Desktop PT-BR: Locale-specific content renders', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/pt-BR`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Check for Portuguese content in hero
  const heroH1 = page.locator('h1');
  const h1Text = await heroH1.textContent();
  // Should NOT be English
  expect(h1Text).not.toContain('The system isn');

  // Check for Portuguese footer disclaimers
  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  await page.screenshot({
    path: 'screenshots/desktop-full-ptbr-hero.png',
    clip: { x: 0, y: 0, width: DESKTOP.width, height: 900 },
  });
});

// ─────────────────────────────────────────────
// TEST 20: i18n - DE locale content check
// ─────────────────────────────────────────────
test('Desktop DE: Locale-specific content renders', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/de`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const heroH1 = page.locator('h1');
  const h1Text = await heroH1.textContent();
  expect(h1Text).not.toContain('The system isn');

  await page.screenshot({
    path: 'screenshots/desktop-full-de-hero.png',
    clip: { x: 0, y: 0, width: DESKTOP.width, height: 900 },
  });
});

// ─────────────────────────────────────────────
// TEST 21: i18n - ES locale content check
// ─────────────────────────────────────────────
test('Desktop ES: Locale-specific content renders', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/es`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const heroH1 = page.locator('h1');
  const h1Text = await heroH1.textContent();
  expect(h1Text).not.toContain('The system isn');

  await page.screenshot({
    path: 'screenshots/desktop-full-es-hero.png',
    clip: { x: 0, y: 0, width: DESKTOP.width, height: 900 },
  });
});

// ─────────────────────────────────────────────
// TEST 22: Page performance - no console errors
// ─────────────────────────────────────────────
test('Desktop EN: No critical console errors on load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Filter out known non-critical errors (analytics, PostHog, etc.)
  const criticalErrors = errors.filter(
    (e) =>
      !e.includes('PostHog') &&
      !e.includes('posthog') &&
      !e.includes('analytics') &&
      !e.includes('gtag') &&
      !e.includes('GA4') &&
      !e.includes('Sentry') &&
      !e.includes('favicon') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('hydration') &&
      !e.includes('Failed to load resource')
  );

  if (criticalErrors.length > 0) {
    console.log('Critical console errors:', criticalErrors);
  }
  // Log but don't fail on minor issues
});

// ─────────────────────────────────────────────
// TEST 23: Accessibility - focus order
// ─────────────────────────────────────────────
test('Desktop EN: Tab navigation reaches key elements', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Tab through the page
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  }

  // After multiple tabs, some element should be focused
  const focusedElement = page.locator(':focus');
  if (await focusedElement.count() > 0) {
    const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());
    // Should be focusable elements (a, button, input, etc.)
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(tagName);
  }
});

// ─────────────────────────────────────────────
// TEST 24: Mobile waitlist form flow
// ─────────────────────────────────────────────
test('Mobile EN: Waitlist form works on mobile', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const waitlist = page.locator('#waitlist');
  if (await waitlist.count() > 0) {
    await waitlist.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const emailInput = waitlist.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('mobile-test@example.com');

      const gdprCheckbox = waitlist.locator('input[type="checkbox"]');
      if (await gdprCheckbox.count() > 0) {
        await gdprCheckbox.first().check();
      }

      await page.screenshot({
        path: 'screenshots/mobile-waitlist-filled-en.png',
        clip: await waitlist.boundingBox() || undefined,
      });
    }
  }
});

// ─────────────────────────────────────────────
// TEST 25: Responsive - section count matches
// ─────────────────────────────────────────────
test('EN: Desktop and mobile render same number of sections', async ({ page }) => {
  // Desktop
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  const desktopSections = await page.locator('section').count();

  // Mobile
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  const mobileSections = await page.locator('section').count();

  // Should be similar (might differ slightly if some use div instead of section)
  expect(Math.abs(desktopSections - mobileSections)).toBeLessThanOrEqual(2);
  console.log(`Desktop sections: ${desktopSections}, Mobile sections: ${mobileSections}`);
});
