const { chromium } = require('@playwright/test');

(async () => {
  const logs = [];
  const errors = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    errors.push({ message: err.message });
  });

  // Helper: click with force to bypass sticky header interception
  async function safeClick(locator, label) {
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
      await locator.click({ timeout: 5000 });
      console.log(`  Clicked: ${label}`);
      return true;
    } catch {
      try {
        await locator.click({ force: true, timeout: 3000 });
        console.log(`  Force-clicked: ${label}`);
        return true;
      } catch (e2) {
        console.log(`  Skip: ${label} (${e2.message.substring(0, 60)})`);
        return false;
      }
    }
  }

  // ============================
  // 1. LANDING PAGE
  // ============================
  console.log('\n=== 1. LANDING PAGE ===');
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log('--- Auto-play (10s) ---');
  await page.waitForTimeout(10000);

  console.log('--- FeatureShowcase navigation ---');
  try {
    const nextButtons = page.locator('button[aria-label*="next" i], button[aria-label*="Next" i]');
    const count = await nextButtons.count();
    console.log(`  Found ${count} next buttons`);
    for (let i = 0; i < Math.min(count, 3); i++) {
      const btn = nextButtons.nth(i);
      if (await btn.isVisible()) {
        await safeClick(btn, `next-${i} (1st)`);
        await page.waitForTimeout(600);
        await safeClick(btn, `next-${i} (2nd)`);
        await page.waitForTimeout(600);
      }
    }
  } catch (e) { console.log('  Next btn error:', e.message.substring(0, 80)); }

  try {
    const prevButtons = page.locator('button[aria-label*="previous" i], button[aria-label*="Previous" i]');
    const count = await prevButtons.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      const btn = prevButtons.nth(i);
      if (await btn.isVisible()) {
        await safeClick(btn, `prev-${i}`);
        await page.waitForTimeout(600);
      }
    }
  } catch (e) { console.log('  Prev btn error:', e.message.substring(0, 80)); }

  console.log('--- Carousel dots ---');
  try {
    const dots = page.locator('button[aria-label*="slide" i]');
    const dotCount = await dots.count();
    console.log(`  Found ${dotCount} carousel dots`);
    for (let i = 0; i < Math.min(dotCount, 6); i++) {
      const dot = dots.nth(i);
      if (await dot.isVisible()) {
        await safeClick(dot, `dot-${i}`);
        await page.waitForTimeout(400);
      }
    }
  } catch (e) { console.log('  Dot error:', e.message.substring(0, 80)); }

  // ============================
  // 2. PRE-DEMO FLOW
  // ============================
  console.log('\n=== 2. PRE-DEMO (DEPOSIT FLOW) ===');
  await page.goto('http://localhost:3000/en/demo', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  try {
    // Click Deposit quick action (first quick action button, has data-autofocus)
    const depositBtn = page.locator('[data-autofocus]').first();
    if (await depositBtn.isVisible({ timeout: 3000 })) {
      await safeClick(depositBtn, 'Deposit quick action');
      await page.waitForTimeout(1500);

      // Click a quick amount ($100)
      const quickAmounts = page.locator('button').filter({ hasText: /^\$100$/ });
      if (await quickAmounts.count() > 0) {
        await safeClick(quickAmounts.first(), '$100 quick amount');
        await page.waitForTimeout(800);
      }

      // Click the primary action button (Continue/Deposit)
      const primaryBtn = page.locator('button').filter({ hasText: /deposit|continue|confirm/i }).first();
      if (await primaryBtn.isVisible({ timeout: 2000 })) {
        await safeClick(primaryBtn, 'Primary action');
        await page.waitForTimeout(1500);
      }

      // Try confirm button if on confirmation screen
      const confirmBtn = page.locator('button').filter({ hasText: /confirm/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await safeClick(confirmBtn, 'Confirm');
        await page.waitForTimeout(1500);
      }

      // Click back to home
      const backBtn = page.locator('button').filter({ hasText: /back|home/i }).first();
      if (await backBtn.isVisible({ timeout: 2000 })) {
        await safeClick(backBtn, 'Back button');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('  Deposit button not found, trying generic buttons');
      const allButtons = page.locator('main button:visible');
      const btnCount = await allButtons.count();
      console.log(`  Found ${btnCount} buttons in main`);
      for (let i = 0; i < Math.min(btnCount, 4); i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent();
        if (text && !text.includes('×')) {
          await safeClick(btn, text.trim().substring(0, 30));
          await page.waitForTimeout(1000);
        }
      }
    }
  } catch (e) { console.log('  PreDemo error:', e.message.substring(0, 80)); }

  // PreDemo: Send flow
  console.log('\n=== 3. PRE-DEMO (SEND FLOW) ===');
  await page.goto('http://localhost:3000/en/demo', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  try {
    // The quick action buttons are in a grid; Send is the second one
    const quickActions = page.locator('button[data-autofocus], button[data-autofocus] ~ button');
    const qCount = await quickActions.count();
    console.log(`  Found ${qCount} quick action siblings`);

    // Try clicking by text
    const sendBtn = page.locator('button').filter({ hasText: /send/i }).first();
    if (await sendBtn.isVisible({ timeout: 3000 })) {
      await safeClick(sendBtn, 'Send quick action');
      await page.waitForTimeout(1500);

      // Quick amount
      const amount = page.locator('button').filter({ hasText: /^\$100$/ });
      if (await amount.count() > 0) {
        await safeClick(amount.first(), '$100');
        await page.waitForTimeout(800);
      }

      // Primary action
      const primary = page.locator('button').filter({ hasText: /send|continue|confirm/i }).last();
      if (await primary.isVisible({ timeout: 2000 })) {
        await safeClick(primary, 'Send action');
        await page.waitForTimeout(1500);
      }
    }
  } catch (e) { console.log('  Send flow error:', e.message.substring(0, 80)); }

  // PreDemo: Buy flow
  console.log('\n=== 4. PRE-DEMO (BUY/INVEST FLOW) ===');
  await page.goto('http://localhost:3000/en/demo', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  try {
    const buyBtn = page.locator('button').filter({ hasText: /invest|buy/i }).first();
    if (await buyBtn.isVisible({ timeout: 3000 })) {
      await safeClick(buyBtn, 'Buy/Invest quick action');
      await page.waitForTimeout(1500);

      // Category tabs
      const tabs = page.locator('button').filter({ hasText: /crypto|etf|stock|gold/i });
      const tabCount = await tabs.count();
      console.log(`  Found ${tabCount} category tabs`);
      for (let i = 0; i < Math.min(tabCount, 4); i++) {
        const tab = tabs.nth(i);
        const text = await tab.textContent();
        await safeClick(tab, `Tab: ${text?.trim()}`);
        await page.waitForTimeout(600);
      }
    }
  } catch (e) { console.log('  Buy flow error:', e.message.substring(0, 80)); }

  // PreDemo: Wallet details
  console.log('\n=== 5. PRE-DEMO (WALLET DETAILS) ===');
  await page.goto('http://localhost:3000/en/demo', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  try {
    // Click balance card to see wallet details
    const balanceCard = page.locator('button').filter({ hasText: /tap to view|wallet|balance/i }).first();
    if (await balanceCard.isVisible({ timeout: 3000 })) {
      await safeClick(balanceCard, 'Balance card / Tap to view');
      await page.waitForTimeout(1500);
    }
  } catch (e) { console.log('  Wallet details error:', e.message.substring(0, 80)); }

  // ============================
  // 6. PRE-DREAM FLOW
  // ============================
  console.log('\n=== 6. PRE-DREAM FLOW ===');
  await page.goto('http://localhost:3000/en/dream-mode', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  try {
    // WelcomeScreen: Click "Let's explore" or "Try Demo"
    const exploreBtn = page.locator('button').filter({ hasText: /explore|try|start|begin|dream/i }).first();
    if (await exploreBtn.isVisible({ timeout: 3000 })) {
      await safeClick(exploreBtn, 'Explore/Try button');
      await page.waitForTimeout(1500);
    }

    // PathSelectorScreen or InputScreen: Click primary button
    const nextBtn = page.locator('button').filter({ hasText: /next|how long|continue/i }).first();
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      await safeClick(nextBtn, 'Next/How Long button');
      await page.waitForTimeout(1500);
    }

    // TimeframeScreen: Click "Show me what happens"
    const simulateBtn = page.locator('button').filter({ hasText: /show|simulate|what happens/i }).first();
    if (await simulateBtn.isVisible({ timeout: 3000 })) {
      await safeClick(simulateBtn, 'Simulate button');
      await page.waitForTimeout(3000); // Simulation takes time
    }

    // ResultsScreen: Check buttons
    const tryDiffBtn = page.locator('button').filter({ hasText: /different|try again/i }).first();
    if (await tryDiffBtn.isVisible({ timeout: 3000 })) {
      await safeClick(tryDiffBtn, 'Try Different Numbers');
      await page.waitForTimeout(1000);
    }
  } catch (e) { console.log('  PreDream error:', e.message.substring(0, 80)); }

  // ============================
  // 7. WAITLIST SIGNUP
  // ============================
  console.log('\n=== 7. WAITLIST SIGNUP ===');
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 })) {
      await emailInput.fill('playwright-audit@example.com');
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible({ timeout: 2000 })) await checkbox.check();
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible({ timeout: 2000 })) {
        await submitBtn.click();
        console.log('  Submitted waitlist form');
        await page.waitForTimeout(3000);
      }
    }
  } catch (e) { console.log('  Waitlist error:', e.message.substring(0, 80)); }

  await page.waitForTimeout(2000);
  await browser.close();

  // ============================
  // REPORT
  // ============================
  console.log('\n\n========================================');
  console.log('=== BROWSER CONSOLE AUDIT REPORT ===');
  console.log('========================================\n');

  const meaningful = logs.filter(l =>
    !l.text.includes('[HMR]') &&
    !l.text.includes('React DevTools') &&
    !l.text.includes('[Fast Refresh]') &&
    !l.text.includes('Download the React')
  );

  console.log(`Total console messages: ${logs.length}`);
  console.log(`Meaningful messages: ${meaningful.length}`);
  console.log(`Page errors: ${errors.length}\n`);

  const syntheticEvents = meaningful.filter(l => l.text.includes('SyntheticBaseEvent'));
  const circularErrors = meaningful.filter(l => l.text.includes('circular structure') || l.text.includes('Failed to log to storage'));
  const slideChanges = meaningful.filter(l => l.text.includes('slide changed') || l.text.includes('auto-rotated'));
  const infoSlides = slideChanges.filter(l => l.type === 'info');
  const debugSlides = slideChanges.filter(l => l.type === 'debug');
  const warningLogs = meaningful.filter(l => l.type === 'warning');
  const errorLogs = meaningful.filter(l => l.type === 'error');

  console.log('--- KEY METRICS ---');
  console.log(`SyntheticBaseEvent leaks: ${syntheticEvents.length} ${syntheticEvents.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Circular structure errors: ${circularErrors.length} ${circularErrors.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Slide change logs total: ${slideChanges.length}`);
  console.log(`  INFO level (user clicks): ${infoSlides.length}`);
  console.log(`  DEBUG level (auto-play): ${debugSlides.length}`);
  console.log(`Warnings: ${warningLogs.length}`);
  console.log(`Errors (browser console): ${errorLogs.length}`);

  if (errors.length > 0) {
    console.log('\n--- PAGE ERRORS (uncaught) ---');
    errors.forEach(e => console.log(`  ERR: ${e.message.substring(0, 150)}`));
  }
  if (syntheticEvents.length > 0) {
    console.log('\n--- SYNTHETIC EVENT LEAKS ---');
    syntheticEvents.forEach(l => console.log(`  LEAK: ${l.text.substring(0, 150)}`));
  }
  if (circularErrors.length > 0) {
    console.log('\n--- CIRCULAR ERRORS ---');
    circularErrors.forEach(l => console.log(`  ERR: ${l.text.substring(0, 150)}`));
  }
  if (warningLogs.length > 0) {
    console.log('\n--- WARNINGS ---');
    warningLogs.forEach(l => console.log(`  WARN: ${l.text.substring(0, 200)}`));
  }
  if (errorLogs.length > 0) {
    console.log('\n--- CONSOLE ERRORS ---');
    errorLogs.forEach(l => console.log(`  ERR: ${l.text.substring(0, 200)}`));
  }

  // Show only non-debug meaningful messages to reduce noise
  const nonDebug = meaningful.filter(l => l.type !== 'debug');
  console.log(`\n--- NON-DEBUG MESSAGES (${nonDebug.length}) ---`);
  nonDebug.forEach(l => {
    const tag = l.type === 'error' ? 'ERR' : l.type === 'warning' ? 'WARN' : 'INFO';
    console.log(`  [${tag}] ${l.text.substring(0, 200)}`);
  });

  console.log('\n=== AUDIT COMPLETE ===');
})();
