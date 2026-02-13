import { chromium } from 'playwright';
import fs from 'fs';

const dir = 'screenshots/test_360x800';
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
const page = await context.newPage();

// Login
await page.goto('http://localhost:3000/en/demo', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: dir + '/01_login.png', fullPage: true });

// Click Start Demo
await page.getByText('Start Demo').first().click({ timeout: 5000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: dir + '/02_home.png', fullPage: true });

// Click Add/Withdraw
const addBtn = page.locator('button').filter({ hasText: 'Add/Withdraw' }).first();
await addBtn.scrollIntoViewIfNeeded();
await addBtn.click({ force: true, timeout: 5000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: dir + '/03_deposit.png', fullPage: true });

// Click $100 quick amount
const quickBtns = page.locator('button').filter({ hasText: /^\$\d+$/ });
const count = await quickBtns.count();
console.log('Quick amount buttons found:', count);
if (count >= 3) {
  await quickBtns.nth(2).click();
  await page.waitForTimeout(500);
}

// Click Proceed (primary button)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
const proceedBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
const proceedVisible = await proceedBtn.isVisible();
console.log('Proceed button visible:', proceedVisible);
await proceedBtn.scrollIntoViewIfNeeded();
await proceedBtn.click({ force: true, timeout: 5000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: dir + '/04_confirm.png', fullPage: true });

// Check terms checkbox
const checkbox = page.locator('input[type="checkbox"]').first();
await checkbox.scrollIntoViewIfNeeded();
await checkbox.click({ force: true, timeout: 3000 });
await page.waitForTimeout(500);

// Click confirm button (primary, not disabled)
const confirmBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
const confirmVisible = await confirmBtn.isVisible();
const confirmEnabled = !(await confirmBtn.isDisabled());
console.log('Confirm button visible:', confirmVisible, 'enabled:', confirmEnabled);
const confirmText = await confirmBtn.textContent();
console.log('Confirm button text:', confirmText);
await confirmBtn.scrollIntoViewIfNeeded();
await confirmBtn.click({ force: true, timeout: 5000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: dir + '/05_processing.png', fullPage: true });

// Wait for completion (4500ms total for deposit)
await page.waitForTimeout(5000);
await page.screenshot({ path: dir + '/06_after_processing.png', fullPage: true });

// Check if we're back on home
const quickActionsVisible = await page.getByText('Quick Actions').first().isVisible().catch(() => false);
console.log('Quick Actions visible (home screen):', quickActionsVisible);

if (quickActionsVisible) {
  // Try clicking Send/Pay
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const sendBtn = page.locator('button').filter({ hasText: 'Send/Pay' }).first();
  const sendVisible = await sendBtn.isVisible().catch(() => false);
  const sendDisabled = await sendBtn.isDisabled().catch(() => true);
  console.log('Send/Pay visible:', sendVisible, 'disabled:', sendDisabled);

  const goalsBtn = page.locator('button').filter({ hasText: 'Goals' }).first();
  const goalsVisible = await goalsBtn.isVisible().catch(() => false);
  const goalsDisabled = await goalsBtn.isDisabled().catch(() => true);
  console.log('Goals visible:', goalsVisible, 'disabled:', goalsDisabled);
}

await context.close();
await browser.close();
console.log('Done!');
