import { chromium } from 'playwright';
import fs from 'fs';

const dir = 'screenshots/goals_test';
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
const page = await context.newPage();

// Login and complete deposit quickly
await page.goto('http://localhost:3000/en/demo', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
await page.getByText('Start Demo').first().click();
await page.waitForTimeout(6000); // Wait for home

// Complete deposit
const addBtn = page.locator('button').filter({ hasText: 'Add/Withdraw' }).first();
await addBtn.click({ force: true });
await page.waitForTimeout(1000);
const quickBtns = page.locator('button').filter({ hasText: /^\$\d+$/ });
if (await quickBtns.count() >= 3) await quickBtns.nth(2).click();
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
const proceedBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
await proceedBtn.click({ force: true });
await page.waitForTimeout(1000);
const checkbox = page.locator('input[type="checkbox"]').first();
await checkbox.click({ force: true });
await page.waitForTimeout(500);
const confirmBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
await confirmBtn.click({ force: true });
await page.waitForTimeout(8000); // Wait for deposit to complete

// Now on home, go to wallet details
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
const balanceCard = page.locator('[role="button"]').first();
await balanceCard.click();
await page.waitForTimeout(1000);
await page.screenshot({ path: dir + '/01_wallet_details.png', fullPage: true });

// Scroll down, see export key
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
const exportBtn = page.getByText('Export Private Key').first();
if (await exportBtn.isVisible({ timeout: 2000 })) {
  await exportBtn.scrollIntoViewIfNeeded();
  await exportBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: dir + '/02_export_modal.png', fullPage: true });

  // Close modal - try X button
  const closeBtn = page.locator('button').filter({ hasText: '×' }).first();
  const closeVisible = await closeBtn.isVisible().catch(() => false);
  console.log('Close button (×) visible:', closeVisible);

  // Try finding close button by other means
  const allBtns = await page.locator('button').all();
  for (let i = 0; i < allBtns.length; i++) {
    const text = await allBtns[i].textContent();
    const ariaLabel = await allBtns[i].getAttribute('aria-label');
    if (text.includes('×') || text.includes('✕') || text.includes('Close') || ariaLabel?.includes('close')) {
      console.log(`Found close button at index ${i}: text="${text}", aria-label="${ariaLabel}"`);
    }
  }

  // Check DOM for close/modal elements
  const modalHTML = await page.evaluate(() => {
    const modal = document.querySelector('[class*="exportModal"], [class*="Modal"]');
    if (modal) {
      const buttons = modal.querySelectorAll('button');
      return Array.from(buttons).map(b => ({ text: b.textContent?.trim(), classes: b.className }));
    }
    return 'no modal found';
  });
  console.log('Modal buttons:', JSON.stringify(modalHTML));

  // Press Escape to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

// Go back to home
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

// Check current page state
const pageContent = await page.evaluate(() => {
  return {
    hasQuickActions: !!document.querySelector('*[class*="quickAction"]'),
    hasBackButton: !!document.querySelector('*[class*="backButton"]'),
    hasWalletTitle: document.body.textContent?.includes('Your Wallets'),
    url: window.location.href,
  };
});
console.log('Current page state:', JSON.stringify(pageContent));

// Try clicking back
if (pageContent.hasBackButton) {
  const backBtn = page.locator('[class*="backButton"]').first();
  await backBtn.click({ force: true });
  await page.waitForTimeout(1000);
}

await page.screenshot({ path: dir + '/03_after_back.png', fullPage: true });

// Check if Goals is visible
const goalsBtn = page.locator('button').filter({ hasText: 'Goals' }).first();
const goalsVisible = await goalsBtn.isVisible().catch(() => false);
console.log('Goals button visible:', goalsVisible);

if (goalsVisible) {
  await goalsBtn.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: dir + '/04_dream_disclaimer.png', fullPage: true });
  console.log('Successfully navigated to Dream Mode!');
} else {
  console.log('Goals not visible, checking what screen we are on');
  await page.screenshot({ path: dir + '/04_current_state.png', fullPage: true });
}

await context.close();
await browser.close();
console.log('Done!');
