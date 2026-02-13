import { chromium } from 'playwright';
import fs from 'fs';

const dir = 'screenshots/full_test';
fs.mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
const page = await context.newPage();

// Login and complete deposit quickly
await page.goto('http://localhost:3000/en/demo', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);
await page.getByText('Start Demo').first().click();
await page.waitForTimeout(6500);

// Complete deposit
const addBtn = page.locator('button').filter({ hasText: 'Add/Withdraw' }).first();
await addBtn.click({ force: true });
await page.waitForTimeout(1000);
const quickBtns = page.locator('button').filter({ hasText: /^\$\d+$/ });
if (await quickBtns.count() >= 3) await quickBtns.nth(2).click();
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
let btn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
await btn.click({ force: true });
await page.waitForTimeout(1000);
let cb = page.locator('input[type="checkbox"]').first();
await cb.click({ force: true });
await page.waitForTimeout(500);
btn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
await btn.click({ force: true });
await page.waitForTimeout(8000);
console.log('Deposit complete, on home');

// Wallet details
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
const balanceCard = page.locator('[role="button"]').first();
await balanceCard.click();
await page.waitForTimeout(1000);

// Export key modal
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
const exportBtn = page.getByText('Export Private Key').first();
if (await exportBtn.isVisible({ timeout: 2000 })) {
  await exportBtn.scrollIntoViewIfNeeded();
  await exportBtn.click();
  await page.waitForTimeout(500);

  // Close modal
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.className.toLowerCase().includes('close') && btn.className.toLowerCase().includes('modal')) {
        btn.click();
        return;
      }
    }
  });
  await page.waitForTimeout(500);
}

// Go back from wallet details
await page.evaluate(() => {
  window.scrollTo(0, 0);
});
await page.waitForTimeout(300);
await page.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.className.toLowerCase().includes('back') && btn.textContent?.includes('Back')) {
      btn.click();
      return;
    }
  }
});
await page.waitForTimeout(1000);

// Check we're on home
const onHome = await page.getByText('Quick Actions').first().isVisible().catch(() => false);
console.log('On home after wallet details:', onHome);

// Click Goals
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
const goalsClicked = await page.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent?.includes('Goals') && !btn.disabled) {
      btn.click();
      return true;
    }
  }
  return false;
});
console.log('Goals clicked:', goalsClicked);
await page.waitForTimeout(1500);
await page.screenshot({ path: dir + '/01_dream_disclaimer.png', fullPage: true });

// Check disclaimer checkbox and enter
cb = page.locator('input[type="checkbox"]').first();
await cb.scrollIntoViewIfNeeded();
await cb.click({ force: true });
await page.waitForTimeout(500);
const enterBtn = page.locator('button').filter({ hasText: 'Enter Dream Mode' }).first();
await enterBtn.scrollIntoViewIfNeeded();
await enterBtn.click({ force: true });
await page.waitForTimeout(1000);
await page.screenshot({ path: dir + '/02_dream_welcome.png', fullPage: true });

// Let's explore
await page.getByText("Let's explore").first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: dir + '/03_dream_pathselect.png', fullPage: true });

// Select Balanced Growth
await page.getByText('Balanced Growth').first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: dir + '/04_dream_input.png', fullPage: true });

// For How Long?
await page.getByText('For How Long?').first().click();
await page.waitForTimeout(1000);
await page.screenshot({ path: dir + '/05_dream_timeframe.png', fullPage: true });

// Select 5 Years
await page.getByText('5 Years', { exact: true }).first().click();
await page.waitForTimeout(300);

// Show me what happens
await page.getByText('Show me what happens').first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: dir + '/06_dream_simulation.png', fullPage: true });

// Wait for results
await page.waitForTimeout(4000);
await page.screenshot({ path: dir + '/07_dream_results.png', fullPage: true });

// Scroll results
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: dir + '/08_dream_results_bottom.png', fullPage: true });

console.log('Full flow complete!');
await context.close();
await browser.close();
