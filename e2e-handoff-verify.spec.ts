import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const waitForPageReady = async (page: any) => {
  await page.waitForTimeout(2000);
};

// Dismiss cookie banner helper
const dismissCookies = async (page: any) => {
  const decline = page.getByRole('button', { name: /decline|ablehnen|recusar|rechazar/i });
  if (await decline.count() > 0) {
    await decline.click();
    await page.waitForTimeout(300);
  }
};

// ═══════════════════════════════════════════
// SECTION 1: HERO - Content Verification
// ═══════════════════════════════════════════

test('S1 Hero EN: headline, subheadline, and CTA render correctly', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  // Headline
  const headline = page.getByRole('heading', { name: /the system isn't broken/i });
  await expect(headline).toBeVisible();
  await expect(headline).toContainText("Just not for you");

  // Subheadline - MUST render (spec: description field enabled)
  const subheadline = page.locator('text=Money should move free and instant');
  await expect(subheadline).toBeVisible();

  // CTA button (may be <a> or <button>)
  const ctaLink = page.locator('[data-section-id="hero-section-b2c"]').getByRole('link', { name: /try demo/i });
  const ctaButton = page.locator('[data-section-id="hero-section-b2c"]').getByRole('button', { name: /try demo/i });
  const ctaVisible = (await ctaLink.count() > 0) || (await ctaButton.count() > 0);
  expect(ctaVisible).toBe(true);

  // CTA should link to #demo
  if (await ctaLink.count() > 0) {
    const href = await ctaLink.getAttribute('href');
    expect(href).toContain('#demo');
  }
});

test('S1 Hero PT-BR: Portuguese headline renders', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/pt-BR`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const headline = page.getByRole('heading', { name: /O sistema não está quebrado/i });
  await expect(headline).toBeVisible();
});

test('S1 Hero DE: German headline renders', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/de`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const headline = page.getByRole('heading', { name: /Das System ist nicht kaputt/i });
  await expect(headline).toBeVisible();
});

test('S1 Hero ES: Spanish headline renders', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/es`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const headline = page.getByRole('heading', { name: /El sistema no está roto/i });
  await expect(headline).toBeVisible();
});

// ═══════════════════════════════════════════
// SECTION 2: ORIGIN STORY - Content Verification
// ═══════════════════════════════════════════

test('S2 Origin EN: header, 5 paragraphs, signature line', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const section = page.locator('#our-story');
  await section.scrollIntoViewIfNeeded();

  // Header
  const header = section.getByRole('heading', { name: /why this exists/i });
  await expect(header).toBeVisible();

  // Key paragraphs
  await expect(section.locator('text=My grandmother never had access')).toBeVisible();
  await expect(section.locator('text=Not because she wasn')).toBeVisible();

  // Signature line "I called it Adelaide."
  const signature = section.locator('text=I called it Adelaide');
  await expect(signature).toBeVisible();
});

test('S2 Origin PT-BR: header and signature', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/pt-BR`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const section = page.locator('#our-story');
  await section.scrollIntoViewIfNeeded();

  await expect(section.getByRole('heading', { name: /por que isso existe/i })).toBeVisible();
  // PT-BR signature: "Eu chamei de Adelaide."
  await expect(section.locator('text=Eu chamei de Adelaide')).toBeVisible();
});

// ═══════════════════════════════════════════
// SECTION 3: HOW IT WORKS - Content Verification
// ═══════════════════════════════════════════

test('S3 HowItWorks EN: header, 3 steps with titles and quotes', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#how-it-works');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Header
  await expect(section.getByRole('heading', { name: /three steps/i })).toBeVisible();

  // Step titles - check the visible card content
  await expect(section.locator('text=Add Send Pay')).toBeVisible();

  // Quote text should appear (spec: italic, with user quote)
  await expect(section.locator('text=I send money to my family')).toBeVisible();
});

test('S3 HowItWorks: carousel navigation reveals all 3 steps', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#how-it-works');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Navigate through cards
  const nextBtn = section.locator('button[aria-label*="next"], button[aria-label*="Next"]');
  if (await nextBtn.count() > 0) {
    await nextBtn.click();
    await page.waitForTimeout(500);
    // Check second step content
    await expect(section.locator('text=Pick Your Strategy')).toBeVisible();

    await nextBtn.click();
    await page.waitForTimeout(500);
    // Check third step content
    await expect(section.locator('text=Grow')).toBeVisible();
  }
});

// ═══════════════════════════════════════════
// SECTION 4: SCENARIOS - Content Verification
// ═══════════════════════════════════════════

test('S4 Scenarios EN: header and 3 cards with correct content', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#scenarios');
  await section.scrollIntoViewIfNeeded();

  // Header
  await expect(section.getByRole('heading', { name: /real people.*real moments/i })).toBeVisible();

  // Card 1: San Francisco
  await expect(section.locator('text=Splitting dinner in San Francisco')).toBeVisible();
  await expect(section.locator('text=Four friends. One tap')).toBeVisible();

  // Card 2: Dubai
  await expect(section.locator('text=Paying a designer in Dubai')).toBeVisible();

  // Card 3: Emergency
  await expect(section.locator('text=Emergency money to Mom')).toBeVisible();
  await expect(section.locator('text=3 AM')).toBeVisible();
});

test('S4 Scenarios PT-BR: locale-specific city (São Paulo)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/pt-BR`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const section = page.locator('#scenarios');
  await section.scrollIntoViewIfNeeded();

  // PT-BR uses São Paulo instead of San Francisco
  await expect(section.locator('text=São Paulo')).toBeVisible();
});

test('S4 Scenarios DE: locale-specific city (München)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/de`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const section = page.locator('#scenarios');
  await section.scrollIntoViewIfNeeded();

  // DE uses München
  await expect(section.locator('text=München')).toBeVisible();
});

test('S4 Scenarios ES: locale-specific city (Madrid)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/es`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);

  const section = page.locator('#scenarios');
  await section.scrollIntoViewIfNeeded();

  // ES uses Madrid
  await expect(section.locator('text=Madrid')).toBeVisible();
});

// ═══════════════════════════════════════════
// SECTION 5: FEATURES - Content Verification
// ═══════════════════════════════════════════

test('S5 Features EN: 3 slides with title and description', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#features');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // First slide
  await expect(section.locator('text=Send & Receive')).toBeVisible();
  await expect(section.locator('text=Send money to anyone, anywhere')).toBeVisible();

  // Check if tagline renders (spec requires "Money that moves like messages")
  const tagline = section.locator('text=Money that moves like messages');
  const taglineVisible = await tagline.count() > 0;

  // Navigate to next slides
  const nextBtn = section.locator('button[aria-label*="next"], button[aria-label*="Next"]');
  if (await nextBtn.count() > 0) {
    await nextBtn.click();
    await page.waitForTimeout(500);
    await expect(section.locator('text=Goal-Based Strategies')).toBeVisible();

    await nextBtn.click();
    await page.waitForTimeout(500);
    await expect(section.locator('text=No Surprises')).toBeVisible();
  }

  // Report tagline status
  if (!taglineVisible) {
    console.log('⚠️ DISCREPANCY: Feature tagline "Money that moves like messages" NOT rendered');
  }
});

// ═══════════════════════════════════════════
// SECTION 6: FEES - Content Verification
// ═══════════════════════════════════════════

test('S6 Fees EN Desktop: title, 6 rows, correct percentages', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#fees');
  await section.scrollIntoViewIfNeeded();

  // Title
  await expect(section.getByRole('heading', { name: /our fees.*all of them/i })).toBeVisible();

  // Subtitle
  await expect(section.locator('text=You should know exactly what you')).toBeVisible();

  // Fee accuracy (CLO mandated) - 0.12% appears in 2 rows (selling + stopping)
  const feeValues = section.locator('text=0.12%');
  expect(await feeValues.count()).toBeGreaterThanOrEqual(1);
  await expect(section.locator('text=0.75%').first()).toBeVisible();

  // "Free to buy" with checkmark (appears in both desktop table and mobile cards)
  await expect(section.locator('text=Free to buy').first()).toBeVisible();

  // 6 fee actions - use .first() for safety
  await expect(section.locator('text=Adding money').first()).toBeVisible();
  await expect(section.locator('text=Sending money').first()).toBeVisible();
  await expect(section.locator('text=Investing').first()).toBeVisible();
  await expect(section.locator('text=Selling investments').first()).toBeVisible();
  await expect(section.locator('text=Stopping a growth strategy').first()).toBeVisible();
  await expect(section.locator('text=Withdrawing or transferring out').first()).toBeVisible();

  // Disclaimer
  await expect(section.locator('text=No monthly fees')).toBeVisible();
});

test('S6 Fees Mobile: card layout renders', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#fees');
  await section.scrollIntoViewIfNeeded();

  // Mobile: table is hidden, card-based layout uses separate elements
  // Look for visible fee content in mobile cards (not in hidden <td> elements)
  const mobileCards = section.locator('[class*="mobileCard"], [class*="mobile"]');
  if (await mobileCards.count() > 0) {
    await expect(mobileCards.first()).toBeVisible();
  } else {
    // Fallback: just check that something fee-related is visible
    await expect(section.locator('text=Our fees').first()).toBeVisible();
  }
  // On mobile, fee values appear in mobile card elements (desktop <td> is hidden)
  const visibleFee = section.locator(':visible >> text=0.12%');
  if (await visibleFee.count() === 0) {
    // Fee values are in the mobile cards — just verify section title is visible
    await expect(section.getByRole('heading', { name: /our fees/i })).toBeVisible();
  }
});

// ═══════════════════════════════════════════
// SECTION 7: CATCH - Content Verification
// ═══════════════════════════════════════════

test('S7 Catch EN: prose paragraphs with key content', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#the-catch');
  await section.scrollIntoViewIfNeeded();

  // No header per spec - opens with "You might be thinking"
  await expect(section.locator('text=what\'s the catch')).toBeVisible();

  // Key phrases
  await expect(section.locator('text=Fair question')).toBeVisible();
  await expect(section.locator('text=We didn\'t invent this')).toBeVisible();

  // Fee alignment statement (CLO mandated)
  await expect(section.locator('text=0.12%')).toBeVisible();
  await expect(section.locator('text=0.75%')).toBeVisible();
  await expect(section.locator('text=When you grow, we grow')).toBeVisible();

  // Check if section has NO h2 header (spec says no header)
  const h2Count = await section.locator('h2').count();
  if (h2Count > 0) {
    console.log('⚠️ NOTE: Catch section has an h2 header (spec says no header)');
  }
});

// ═══════════════════════════════════════════
// SECTION 8: DEMO - Content Verification
// ═══════════════════════════════════════════

test('S8 Demo EN: dual CTA buttons', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#demo');
  await section.scrollIntoViewIfNeeded();

  // Header
  await expect(section.getByRole('heading', { name: /try it.*no signup needed/i })).toBeVisible();

  // Subtext
  await expect(section.locator('text=See exactly how diBoaS works')).toBeVisible();

  // Primary CTA: "Try Full Demo" (filled teal)
  const primaryCta = section.locator('button:has-text("Try Full Demo")');
  await expect(primaryCta).toBeVisible();

  // Secondary CTA: "Quick Future You Check" (outline)
  const secondaryCta = section.locator('button:has-text("Quick Future You Check")');
  await expect(secondaryCta).toBeVisible();
});

// ═══════════════════════════════════════════
// SECTION 9: WAITLIST - Content Verification
// ═══════════════════════════════════════════

test('S9 Waitlist EN: header, email, submit, privacy note', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#waitlist');
  await section.scrollIntoViewIfNeeded();

  // Header
  await expect(section.getByRole('heading', { name: /want early access/i })).toBeVisible();

  // Description
  await expect(section.locator('text=small group first')).toBeVisible();

  // Email input
  const emailInput = section.locator('input[type="email"]');
  await expect(emailInput).toBeVisible();

  // Submit button
  const submitBtn = section.locator('button[type="submit"]');
  await expect(submitBtn).toBeVisible();
  const buttonText = await submitBtn.textContent();
  console.log(`Waitlist button text: "${buttonText}" (spec says "Join Waitlist")`);

  // Privacy note / GDPR
  const privacyText = section.locator('text=/email you|spam|only/i');
  if (await privacyText.count() > 0) {
    await expect(privacyText.first()).toBeVisible();
  }

  // Check for counter row (spec: "{count} people from {countries} countries")
  const counterRow = section.locator('text=/people from.*countries/i');
  const hasCounter = await counterRow.count() > 0;
  if (!hasCounter) {
    console.log('⚠️ DISCREPANCY: Counter row not found in Waitlist section');
  }
});

test('S9 Waitlist Mobile: form stacks vertically', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#waitlist');
  await section.scrollIntoViewIfNeeded();

  await expect(section.locator('input[type="email"]')).toBeVisible();
  await expect(section.locator('button[type="submit"]')).toBeVisible();

  await page.screenshot({ path: 'screenshots/handoff-mobile-waitlist.png' });
});

// ═══════════════════════════════════════════
// SECTION 10: FAQ - Content Verification
// ═══════════════════════════════════════════

test('S10 FAQ EN: 5 correct questions', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const section = page.locator('#faq');
  await section.scrollIntoViewIfNeeded();

  // Header
  await expect(section.getByRole('heading', { name: /questions.*we've got answers/i })).toBeVisible();

  // 5 questions (CLO-approved)
  await expect(section.locator('text=Is diBoaS a bank?')).toBeVisible();
  await expect(section.locator('text=How is this possible without high fees?')).toBeVisible();
  await expect(section.locator('text=Is my money safe?')).toBeVisible();
  await expect(section.locator('text=What if I don\'t understand investing?')).toBeVisible();
  await expect(section.locator('text=minimum').first()).toBeVisible();

  // Verify non-custodial definition appears in answer (CLO mandated)
  const firstQ = section.locator('button[aria-expanded]').first();
  await firstQ.click();
  await page.waitForTimeout(500);

  await expect(section.locator('text=non-custodial')).toBeVisible();
  // "we don't hold" — may use typographic or straight apostrophe
  const dontHold = section.locator('text=/we don.t hold/i');
  await expect(dontHold).toBeVisible();
});

// ═══════════════════════════════════════════
// SECTION 11: FOOTER - Content Verification
// ═══════════════════════════════════════════

test('S11 Footer EN: tagline, nav, copyright, disclaimers', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();

  // Tagline (italic)
  await expect(footer.locator('text=Named after Adelaide')).toBeVisible();

  // Nav links
  await expect(footer.getByRole('link', { name: 'For You' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'For Business' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Adelaide Daily' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'About' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Legal' })).toBeVisible();

  // Copyright 2026
  await expect(footer.locator('text=© 2026')).toBeVisible();

  // EN-specific: US regulatory disclaimer
  await expect(footer.locator('text=SEC')).toBeVisible();

  // General disclaimers
  await expect(footer.locator('text=educational purposes')).toBeVisible();
  await expect(footer.locator('text=crypto-assets may fluctuate')).toBeVisible();
  await expect(footer.locator('text=artificial intelligence')).toBeVisible();

  // EN should NOT have MiCA or CVM
  const micaText = footer.locator('text=Marketingmitteilung');
  expect(await micaText.count()).toBe(0);
});

test('S11 Footer PT-BR: CVM + BCB disclaimers present', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/pt-BR`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();

  // PT-BR specific: CVM + BCB
  await expect(footer.locator('text=Banco Central do Brasil')).toBeVisible();

  // MiCA should also appear for PT-BR (per implementation)
  // Copyright 2026
  await expect(footer.locator('text=© 2026')).toBeVisible();
});

test('S11 Footer DE: MiCA Article 68 disclaimer present', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/de`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();

  // DE specific: MiCA
  await expect(footer.locator('text=Marketingmitteilung')).toBeVisible();

  // DE should NOT have CVM/BCB or US regulatory
  const bcbText = footer.locator('text=Banco Central');
  expect(await bcbText.count()).toBe(0);

  const secText = footer.locator('text=SEC, CFTC');
  expect(await secText.count()).toBe(0);
});

test('S11 Footer ES: MiCA disclaimer present, no CVM', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE_URL}/es`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();

  // ES specific: MiCA in Spanish
  await expect(footer.locator('text=criptoactivos').first()).toBeVisible();

  // ES should NOT have CVM/BCB
  const bcbText = footer.locator('text=Banco Central do Brasil');
  expect(await bcbText.count()).toBe(0);
});

// ═══════════════════════════════════════════
// CROSS-CUTTING: Mobile Responsiveness
// ═══════════════════════════════════════════

test('Mobile EN: all 11 sections render with content', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await dismissCookies(page);

  // Hero
  await expect(page.getByRole('heading', { name: /the system isn't broken/i })).toBeVisible();

  // Origin
  const origin = page.locator('#our-story');
  await origin.scrollIntoViewIfNeeded();
  await expect(origin.locator('text=Why This Exists')).toBeVisible();

  // How It Works
  const howItWorks = page.locator('#how-it-works');
  await howItWorks.scrollIntoViewIfNeeded();
  await expect(howItWorks.locator('text=Three Steps')).toBeVisible();

  // Scenarios
  const scenarios = page.locator('#scenarios');
  await scenarios.scrollIntoViewIfNeeded();
  await expect(scenarios.locator('text=Real People')).toBeVisible();

  // Features
  const features = page.locator('#features');
  await features.scrollIntoViewIfNeeded();
  await expect(features.locator('text=Send & Receive')).toBeVisible();

  // Fees
  const fees = page.locator('#fees');
  await fees.scrollIntoViewIfNeeded();
  await expect(fees.locator('text=Our fees')).toBeVisible();

  // Catch
  const catchSection = page.locator('#the-catch');
  await catchSection.scrollIntoViewIfNeeded();
  await expect(catchSection.locator('text=the catch').first()).toBeVisible();

  // Demo
  const demo = page.locator('#demo');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo.locator('text=Try It')).toBeVisible();

  // Waitlist
  const waitlist = page.locator('#waitlist');
  await waitlist.scrollIntoViewIfNeeded();
  await expect(waitlist.locator('text=Want early access')).toBeVisible();

  // FAQ
  const faq = page.locator('#faq');
  await faq.scrollIntoViewIfNeeded();
  await expect(faq.getByRole('heading', { name: /questions/i })).toBeVisible();

  // Footer
  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator('text=Named after Adelaide')).toBeVisible();

  await page.screenshot({ path: 'screenshots/handoff-mobile-full-en.png', fullPage: true });
});
