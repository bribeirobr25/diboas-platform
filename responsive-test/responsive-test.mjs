/**
 * Responsive Testing Script for PreDemo + PreDream flows
 * Tests across 12 viewport sizes (4 mobile, 4 tablet, 4 desktop)
 * Takes screenshots at every screen transition
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000/en/demo';

const VIEWPORTS = [
  // Mobile
  { name: '360x800', width: 360, height: 800, category: 'mobile' },
  { name: '390x844', width: 390, height: 844, category: 'mobile' },
  { name: '393x873', width: 393, height: 873, category: 'mobile' },
  { name: '412x915', width: 412, height: 915, category: 'mobile' },
  // Tablet
  { name: '768x1024', width: 768, height: 1024, category: 'tablet' },
  { name: '800x1280', width: 800, height: 1280, category: 'tablet' },
  { name: '820x1180', width: 820, height: 1180, category: 'tablet' },
  { name: '1280x800', width: 1280, height: 800, category: 'tablet' },
  // Desktop
  { name: '920x1080', width: 920, height: 1080, category: 'desktop' },
  { name: '1280x720', width: 1280, height: 720, category: 'desktop' },
  { name: '1366x768', width: 1366, height: 768, category: 'desktop' },
  { name: '1536x864', width: 1536, height: 864, category: 'desktop' },
];

const issues = [];

function logIssue(viewport, screen, severity, description) {
  const issue = { viewport: viewport.name, category: viewport.category, screen, severity, description };
  issues.push(issue);
  console.log(`  ⚠️  [${severity}] ${screen}: ${description}`);
}

async function screenshot(page, viewport, screenName, dir) {
  const filename = `${viewport.name}_${screenName}.png`;
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 ${screenName}`);
  return filepath;
}

async function checkOverflow(page, viewport, screenName) {
  const overflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      bodyScrollWidth: body.scrollWidth,
      htmlClientWidth: html.clientWidth,
      hasHorizontalOverflow: body.scrollWidth > html.clientWidth + 2,
    };
  });
  if (overflow.hasHorizontalOverflow) {
    logIssue(viewport, screenName, 'HIGH', `Horizontal overflow detected (scrollWidth: ${overflow.bodyScrollWidth} > clientWidth: ${overflow.htmlClientWidth})`);
  }
}

async function checkElementVisibility(page, viewport, screenName, selector, label) {
  try {
    const el = page.locator(selector).first();
    const isVisible = await el.isVisible({ timeout: 2000 });
    if (!isVisible) {
      logIssue(viewport, screenName, 'MEDIUM', `${label} not visible`);
      return false;
    }
    const box = await el.boundingBox();
    if (box) {
      if (box.x + box.width > viewport.width + 5) {
        logIssue(viewport, screenName, 'HIGH', `${label} overflows right edge (x:${Math.round(box.x)} + w:${Math.round(box.width)} > ${viewport.width})`);
      }
      if (box.width < 20) {
        logIssue(viewport, screenName, 'MEDIUM', `${label} too narrow (width: ${Math.round(box.width)}px)`);
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function checkTextTruncation(page, viewport, screenName) {
  const truncated = await page.evaluate(() => {
    const results = [];
    const allElements = document.querySelectorAll('button, h1, h2, h3, p, span, label, a');
    for (const el of allElements) {
      const style = getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 2 && style.overflow !== 'hidden' && style.textOverflow !== 'ellipsis') {
        const text = el.textContent?.trim().substring(0, 40);
        if (text && text.length > 3) {
          results.push(text);
        }
      }
    }
    return results;
  });
  if (truncated.length > 0) {
    logIssue(viewport, screenName, 'LOW', `Text may be clipped: ${truncated.slice(0, 3).join(', ')}`);
  }
}

async function waitForScreen(page, ms = 800) {
  await page.waitForTimeout(ms);
}

async function runTestForViewport(browser, viewport) {
  const dir = path.join('screenshots', `${viewport.category}_${viewport.name}`);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${viewport.name} (${viewport.category})`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.category === 'mobile' ? 2 : 1,
  });
  const page = await context.newPage();

  try {
    // ===== PREDEMO FLOW =====
    console.log('\n  --- PreDemo Flow ---');

    // 1. Login screen
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await waitForScreen(page, 2000);
    await screenshot(page, viewport, '01_login', dir);
    await checkOverflow(page, viewport, 'login');
    await checkElementVisibility(page, viewport, 'login', 'text="Start Demo"', 'Start Demo button');

    // 2. Click Start Demo -> loading screens
    await page.getByText('Start Demo').first().click({ timeout: 5000 });
    await waitForScreen(page, 1500);
    await screenshot(page, viewport, '02_creating_account', dir);
    await checkOverflow(page, viewport, 'creating_account');

    await waitForScreen(page, 2000);
    await screenshot(page, viewport, '03_creating_wallet', dir);
    await checkOverflow(page, viewport, 'creating_wallet');

    // 3. Home screen - wait for it to fully load
    await waitForScreen(page, 3000);
    await screenshot(page, viewport, '04_home', dir);
    await checkOverflow(page, viewport, 'home');
    await checkTextTruncation(page, viewport, 'home');

    // Check quick action buttons visibility (text from i18n: "Add/Withdraw", "Send/Pay", "Invest", "Goals")
    await checkElementVisibility(page, viewport, 'home', 'text="Add/Withdraw"', 'Add/Withdraw button');
    await checkElementVisibility(page, viewport, 'home', 'text="Send/Pay"', 'Send/Pay button');
    await checkElementVisibility(page, viewport, 'home', 'text="Invest"', 'Invest button');
    await checkElementVisibility(page, viewport, 'home', 'text="Goals"', 'Goals button');

    // Scroll home to see activity feed
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitForScreen(page, 300);
    await screenshot(page, viewport, '04b_home_bottom', dir);

    // 4. Deposit screen - Click "Add/Withdraw" button
    await page.evaluate(() => window.scrollTo(0, 0));
    await waitForScreen(page, 300);
    await page.getByText('Add/Withdraw', { exact: false }).first().click({ timeout: 5000 });
    await waitForScreen(page, 1000);
    await screenshot(page, viewport, '05_deposit', dir);
    await checkOverflow(page, viewport, 'deposit');
    await checkTextTruncation(page, viewport, 'deposit');

    // Click a quick amount button
    try {
      // Quick amounts are buttons with text like "$20", "$50", "$100"
      const quickBtns = page.locator('button').filter({ hasText: /^\$\d+$/ });
      const count = await quickBtns.count();
      if (count >= 3) {
        await quickBtns.nth(2).click(); // Click $100
        await waitForScreen(page, 500);
      }
      await screenshot(page, viewport, '06_deposit_filled', dir);
    } catch (e) {
      console.log(`  ℹ️  Could not click quick amount: ${e.message}`);
    }

    // Scroll to see fee breakdown and Proceed button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitForScreen(page, 300);
    await screenshot(page, viewport, '06b_deposit_bottom', dir);

    // Click Proceed
    try {
      await page.getByText('Proceed', { exact: true }).first().click({ timeout: 5000 });
      await waitForScreen(page, 1000);
    } catch (e) {
      // Try scrolling to make it visible first
      try {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await waitForScreen(page, 300);
        await page.getByText('Proceed', { exact: true }).first().click({ timeout: 3000 });
        await waitForScreen(page, 1000);
      } catch {
        logIssue(viewport, 'deposit', 'HIGH', `Could not click Proceed: ${e.message}`);
      }
    }

    // 5. Deposit confirmation
    await screenshot(page, viewport, '07_deposit_confirm', dir);
    await checkOverflow(page, viewport, 'deposit_confirm');
    await checkTextTruncation(page, viewport, 'deposit_confirm');

    // Scroll to see terms and confirm button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitForScreen(page, 300);
    await screenshot(page, viewport, '07b_deposit_confirm_bottom', dir);

    // Check terms checkbox and click confirm
    try {
      // Dismiss any floating elements first
      await page.evaluate(() => {
        document.querySelectorAll('[class*="chat"], [class*="widget"], [class*="floating"]').forEach(el => el.remove());
      });

      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.scrollIntoViewIfNeeded();
      await checkbox.click({ force: true, timeout: 3000 });
      await waitForScreen(page, 500);

      // Use CSS selector for primary button and force click
      const confirmBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
      await confirmBtn.scrollIntoViewIfNeeded();
      await waitForScreen(page, 200);
      await confirmBtn.click({ force: true, timeout: 5000 });
      await waitForScreen(page, 2000);
      await screenshot(page, viewport, '08_deposit_processing', dir);
      await checkOverflow(page, viewport, 'deposit_processing');

      // Wait for full processing: 1500 + 1500 + 1500 = 4500ms total
      await waitForScreen(page, 4000);
      await screenshot(page, viewport, '09_deposit_complete', dir);
    } catch (e) {
      logIssue(viewport, 'deposit_confirm', 'HIGH', `Could not complete deposit: ${e.message}`);
    }

    // 6. Wait for return to home (COMPLETE_DEPOSIT dispatches after 4500ms from confirm)
    await waitForScreen(page, 4000);
    // Wait for the Quick Actions heading to appear (means we're on home)
    try {
      await page.getByText('Quick Actions').first().waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      // If still not on home, try waiting more
      await waitForScreen(page, 3000);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await waitForScreen(page, 500);
    await screenshot(page, viewport, '10_home_after_deposit', dir);
    await checkOverflow(page, viewport, 'home_after_deposit');

    // 7. Send screen - click "Send/Pay"
    try {
      const sendBtn = page.locator('button').filter({ hasText: 'Send/Pay' }).first();
      await sendBtn.scrollIntoViewIfNeeded();
      await sendBtn.click({ force: true, timeout: 5000 });
      await waitForScreen(page, 1000);
      await screenshot(page, viewport, '11_send', dir);
      await checkOverflow(page, viewport, 'send');
      await checkTextTruncation(page, viewport, 'send');

      // Select a recipient
      try {
        const select = page.locator('select').first();
        if (await select.isVisible({ timeout: 2000 })) {
          const options = await select.locator('option').allTextContents();
          if (options.length > 1) {
            await select.selectOption({ index: 1 });
            await waitForScreen(page, 300);
          }
        }
      } catch { /* no select found */ }

      // Click a quick amount
      try {
        const quickBtns = page.locator('button').filter({ hasText: /^\$\d+$/ });
        const count = await quickBtns.count();
        if (count > 0) {
          await quickBtns.nth(0).click();
          await waitForScreen(page, 500);
        }
      } catch { /* continue */ }

      await screenshot(page, viewport, '12_send_filled', dir);

      // Scroll and click Proceed
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await waitForScreen(page, 300);
      await screenshot(page, viewport, '12b_send_bottom', dir);

      try {
        const proceedBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
        await proceedBtn.scrollIntoViewIfNeeded();
        await proceedBtn.click({ force: true, timeout: 5000 });
        await waitForScreen(page, 1000);
        await screenshot(page, viewport, '13_send_confirm', dir);
        await checkOverflow(page, viewport, 'send_confirm');

        // Scroll to bottom for terms
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await waitForScreen(page, 300);
        await screenshot(page, viewport, '13b_send_confirm_bottom', dir);

        // Check terms and confirm
        const checkbox = page.locator('input[type="checkbox"]').first();
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.click({ force: true, timeout: 3000 });
        await waitForScreen(page, 500);

        const confirmBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true, timeout: 5000 });
        await waitForScreen(page, 2000);
        await screenshot(page, viewport, '14_send_processing', dir);

        // Send: processingDelay(1500) + completeDelay(1500) = 3000ms
        await waitForScreen(page, 3000);
        await screenshot(page, viewport, '15_send_complete', dir);
      } catch (e) {
        logIssue(viewport, 'send_flow', 'MEDIUM', `Could not complete send: ${e.message}`);
      }
    } catch (e) {
      logIssue(viewport, 'send', 'MEDIUM', `Send/Pay not clickable: ${e.message}`);
    }

    // Wait for return to home
    await waitForScreen(page, 4000);
    try {
      await page.getByText('Quick Actions').first().waitFor({ state: 'visible', timeout: 8000 });
    } catch { await waitForScreen(page, 3000); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await waitForScreen(page, 500);
    await screenshot(page, viewport, '16_home_after_send', dir);

    // 8. Buy screen - click "Invest"
    try {
      const investBtn = page.locator('button').filter({ hasText: 'Invest' }).first();
      await investBtn.scrollIntoViewIfNeeded();
      await investBtn.click({ force: true, timeout: 5000 });
      await waitForScreen(page, 1000);
      await screenshot(page, viewport, '17_buy', dir);
      await checkOverflow(page, viewport, 'buy');
      await checkTextTruncation(page, viewport, 'buy');

      // Try to select an asset
      try {
        const assetCards = page.locator('[class*="assetItem"]:not([class*="Disabled"]):not([class*="disabled"])');
        const assetCount = await assetCards.count();
        if (assetCount > 0) {
          await assetCards.first().click();
          await waitForScreen(page, 300);
        }

        // Click quick amount
        const quickBtns = page.locator('button').filter({ hasText: /^\$\d+$/ });
        const count = await quickBtns.count();
        if (count > 0) {
          await quickBtns.nth(0).click();
          await waitForScreen(page, 500);
        }
      } catch { /* continue */ }

      await screenshot(page, viewport, '18_buy_filled', dir);

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await waitForScreen(page, 300);
      await screenshot(page, viewport, '18b_buy_bottom', dir);

      // Click Proceed
      try {
        const proceedBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
        await proceedBtn.scrollIntoViewIfNeeded();
        await proceedBtn.click({ force: true, timeout: 5000 });
        await waitForScreen(page, 1000);
        await screenshot(page, viewport, '19_buy_confirm', dir);
        await checkOverflow(page, viewport, 'buy_confirm');

        // Scroll to bottom for terms
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await waitForScreen(page, 300);
        await screenshot(page, viewport, '19b_buy_confirm_bottom', dir);

        // Check terms and confirm
        const checkbox = page.locator('input[type="checkbox"]').first();
        await checkbox.scrollIntoViewIfNeeded();
        await checkbox.click({ force: true, timeout: 3000 });
        await waitForScreen(page, 500);

        const confirmBtn = page.locator('button[class*="primaryButton"]:not([disabled])').first();
        await confirmBtn.scrollIntoViewIfNeeded();
        await confirmBtn.click({ force: true, timeout: 5000 });
        await waitForScreen(page, 2000);
        await screenshot(page, viewport, '20_buy_processing', dir);

        // Buy: processingDelay(1500) + completeDelay(1500) = 3000ms
        await waitForScreen(page, 3000);
        await screenshot(page, viewport, '21_buy_complete', dir);
      } catch (e) {
        logIssue(viewport, 'buy_flow', 'MEDIUM', `Could not complete buy: ${e.message}`);
      }
    } catch (e) {
      logIssue(viewport, 'buy', 'MEDIUM', `Invest not clickable: ${e.message}`);
    }

    // Wait for return to home
    await waitForScreen(page, 4000);
    try {
      await page.getByText('Quick Actions').first().waitFor({ state: 'visible', timeout: 8000 });
    } catch { await waitForScreen(page, 3000); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await waitForScreen(page, 500);
    await screenshot(page, viewport, '22_home_after_buy', dir);

    // 9. Wallet details - click balance card
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await waitForScreen(page, 300);
      const balanceCard = page.locator('[class*="balanceCard"], [role="button"]').first();
      if (await balanceCard.isVisible({ timeout: 3000 })) {
        await balanceCard.click();
        await waitForScreen(page, 1000);
        await screenshot(page, viewport, '23_wallet_details', dir);
        await checkOverflow(page, viewport, 'wallet_details');
        await checkTextTruncation(page, viewport, 'wallet_details');

        // Scroll through wallet details
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
        await waitForScreen(page, 300);
        await screenshot(page, viewport, '24_wallet_details_mid', dir);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 2 / 3));
        await waitForScreen(page, 300);
        await screenshot(page, viewport, '25_wallet_details_lower', dir);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await waitForScreen(page, 300);
        await screenshot(page, viewport, '25b_wallet_details_bottom', dir);

        // Try Export Private Key
        try {
          const exportBtn = page.getByText('Export Private Key').first();
          if (await exportBtn.isVisible({ timeout: 2000 })) {
            await exportBtn.scrollIntoViewIfNeeded();
            await exportBtn.click();
            await waitForScreen(page, 500);
            await screenshot(page, viewport, '26_export_key_modal', dir);
            await checkOverflow(page, viewport, 'export_key_modal');

            // Close modal - find the close button (SVG icon, empty text, class contains "Close" or "close")
            try {
              // The close button has class exportModalClose and empty text content
              const closeBtn = await page.evaluate(() => {
                const btns = document.querySelectorAll('button');
                for (const btn of btns) {
                  if (btn.className.toLowerCase().includes('close') && btn.className.toLowerCase().includes('modal')) {
                    btn.click();
                    return true;
                  }
                }
                return false;
              });
              if (!closeBtn) {
                await page.keyboard.press('Escape');
              }
              await waitForScreen(page, 500);
            } catch {
              await page.keyboard.press('Escape');
              await waitForScreen(page, 500);
            }
          }
        } catch { /* export key not found */ }

        // Go back to home from wallet details
        try {
          await page.evaluate(() => window.scrollTo(0, 0));
          await waitForScreen(page, 500);
          // Click back button via evaluate (CSS module classes are hashed)
          await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
              if (btn.className.toLowerCase().includes('back') && btn.textContent?.includes('Back')) {
                btn.click();
                return;
              }
            }
          });
          await waitForScreen(page, 1000);
        } catch {
          // continue
        }
      }
    } catch (e) {
      logIssue(viewport, 'wallet_details', 'MEDIUM', `Could not access wallet details: ${e.message}`);
    }

    // ===== PREDREAM FLOW =====
    console.log('\n  --- PreDream Flow ---');

    // Make sure we're on the home screen first
    try {
      await page.getByText('Quick Actions').first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Not on home, try navigating there
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
      await waitForScreen(page, 2000);
      // Click Start Demo if needed
      try {
        const startBtn = page.getByText('Start Demo');
        if (await startBtn.first().isVisible({ timeout: 1000 })) {
          // We're back at login - skip PreDream for this viewport
          logIssue(viewport, 'goals', 'MEDIUM', 'Could not return to home after wallet details; skipping PreDream');
          await context.close();
          console.log(`  ✅ ${viewport.name} complete (PreDemo only)`);
          return;
        }
      } catch { /* not on login */ }
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await waitForScreen(page, 500);

    // Take a screenshot to see where we are
    await screenshot(page, viewport, '26b_before_goals', dir);

    // 10. Click Goals button -> Dream Mode
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await waitForScreen(page, 500);
      // Click Goals using evaluate (bypasses CSS module class hashing)
      const clicked = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent?.includes('Goals') && !btn.disabled) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      if (!clicked) {
        throw new Error('Goals button not found or disabled');
      }
      await waitForScreen(page, 1500);
    } catch (e) {
      logIssue(viewport, 'goals', 'HIGH', `Could not click Goals: ${e.message}`);
      await context.close();
      return;
    }

    // PreDream - Disclaimer screen
    await screenshot(page, viewport, '27_dream_disclaimer', dir);
    await checkOverflow(page, viewport, 'dream_disclaimer');
    await checkTextTruncation(page, viewport, 'dream_disclaimer');

    // Scroll to see full disclaimer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitForScreen(page, 300);
    await screenshot(page, viewport, '27b_dream_disclaimer_bottom', dir);

    try {
      // Check disclaimer checkbox
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.scrollIntoViewIfNeeded();
      await checkbox.click({ force: true, timeout: 3000 });
      await waitForScreen(page, 500);

      // Click "Enter Dream Mode"
      const enterBtn = page.locator('button').filter({ hasText: 'Enter Dream Mode' }).first();
      await enterBtn.scrollIntoViewIfNeeded();
      await enterBtn.click({ force: true, timeout: 5000 });
      await waitForScreen(page, 1000);

      // Welcome screen
      await screenshot(page, viewport, '28_dream_welcome', dir);
      await checkOverflow(page, viewport, 'dream_welcome');
      await checkTextTruncation(page, viewport, 'dream_welcome');

      // Click "Let's explore"
      await page.getByText("Let's explore").first().click({ timeout: 5000 });
      await waitForScreen(page, 1000);

      // Path Select screen
      await screenshot(page, viewport, '29_dream_pathselect', dir);
      await checkOverflow(page, viewport, 'dream_pathselect');
      await checkTextTruncation(page, viewport, 'dream_pathselect');

      // Scroll to see all paths
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await waitForScreen(page, 300);
      await screenshot(page, viewport, '29b_dream_pathselect_bottom', dir);

      // Select "Balanced Growth" path
      try {
        await page.getByText('Balanced Growth').first().click({ timeout: 5000 });
      } catch {
        // fallback: click second card
        const cards = page.locator('[class*="pathCard"]');
        if (await cards.count() >= 2) {
          await cards.nth(1).click();
        }
      }
      await waitForScreen(page, 1000);

      // Input screen
      await screenshot(page, viewport, '30_dream_input', dir);
      await checkOverflow(page, viewport, 'dream_input');
      await checkTextTruncation(page, viewport, 'dream_input');

      // Scroll to see full input
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await waitForScreen(page, 300);
      await screenshot(page, viewport, '30b_dream_input_bottom', dir);

      // Click next button "For How Long?"
      try {
        await page.getByText('For How Long?').first().click({ timeout: 5000 });
      } catch {
        // Fallback: try other button text
        try {
          const btns = page.locator('[class*="primaryButton"]');
          const count = await btns.count();
          if (count > 0) {
            await btns.last().click({ timeout: 3000 });
          }
        } catch (e) {
          logIssue(viewport, 'dream_input', 'HIGH', `Could not advance from input: ${e.message}`);
        }
      }
      await waitForScreen(page, 1000);

      // Timeframe screen
      await screenshot(page, viewport, '31_dream_timeframe', dir);
      await checkOverflow(page, viewport, 'dream_timeframe');
      await checkTextTruncation(page, viewport, 'dream_timeframe');

      // Select "5 Years"
      try {
        await page.getByText('5 Years', { exact: true }).first().click({ timeout: 3000 });
        await waitForScreen(page, 300);
      } catch {
        const cards = page.locator('[class*="timeframeCard"]');
        if (await cards.count() >= 3) {
          await cards.nth(2).click();
          await waitForScreen(page, 300);
        }
      }
      await screenshot(page, viewport, '32_dream_timeframe_selected', dir);

      // Click "Show me what happens"
      try {
        await page.getByText('Show me what happens').first().click({ timeout: 5000 });
      } catch {
        const btns = page.locator('[class*="primaryButton"]');
        const count = await btns.count();
        if (count > 0) {
          await btns.last().click({ timeout: 3000 });
        }
      }
      await waitForScreen(page, 500);

      // Simulation screen - capture at start
      await screenshot(page, viewport, '33_dream_simulation_start', dir);
      await checkOverflow(page, viewport, 'dream_simulation');
      await checkElementVisibility(page, viewport, 'dream_simulation', '[class*="simulationValue"]', 'Simulation value');
      await checkElementVisibility(page, viewport, 'dream_simulation', '[class*="growthBadge"]', 'Growth badge');
      await checkElementVisibility(page, viewport, 'dream_simulation', '[class*="timeBadge"]', 'Time badge');
      await checkElementVisibility(page, viewport, 'dream_simulation', '[class*="indicatorRow"]', 'Indicator row');

      // Capture mid-animation
      await waitForScreen(page, 1500);
      await screenshot(page, viewport, '34_dream_simulation_mid', dir);

      // Wait for auto-advance to results (3s animation + 0.5s delay)
      await waitForScreen(page, 2500);

      // Results screen
      await screenshot(page, viewport, '35_dream_results', dir);
      await checkOverflow(page, viewport, 'dream_results');
      await checkTextTruncation(page, viewport, 'dream_results');

      // Scroll through results
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
      await waitForScreen(page, 300);
      await screenshot(page, viewport, '36_dream_results_mid', dir);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 2 / 3));
      await waitForScreen(page, 300);
      await screenshot(page, viewport, '37_dream_results_share', dir);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await waitForScreen(page, 300);
      await screenshot(page, viewport, '38_dream_results_bottom', dir);

      // Check share section visibility
      await checkElementVisibility(page, viewport, 'dream_results', 'text="Share my dream"', 'Share section');
      // Check action buttons
      await checkElementVisibility(page, viewport, 'dream_results', 'text="Try Different Numbers"', 'Try Different button');

    } catch (e) {
      logIssue(viewport, 'dream_flow', 'HIGH', `PreDream flow error: ${e.message}`);
    }

  } catch (e) {
    logIssue(viewport, 'general', 'CRITICAL', `Test failed: ${e.message}`);
  } finally {
    await context.close();
  }

  console.log(`  ✅ ${viewport.name} complete`);
}

async function main() {
  console.log('🔍 Starting Responsive Testing');
  console.log(`   URL: ${BASE_URL}`);
  console.log(`   Viewports: ${VIEWPORTS.length}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: true });

  for (const viewport of VIEWPORTS) {
    await runTestForViewport(browser, viewport);
  }

  await browser.close();

  // Generate report
  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 RESPONSIVE TESTING REPORT');
  console.log(`${'='.repeat(60)}`);

  if (issues.length === 0) {
    console.log('\n✅ No issues found across all viewports!');
  } else {
    // Group by severity
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');
    const low = issues.filter(i => i.severity === 'LOW');

    console.log(`\nTotal Issues: ${issues.length}`);
    if (critical.length) console.log(`  🔴 CRITICAL: ${critical.length}`);
    if (high.length) console.log(`  🟠 HIGH: ${high.length}`);
    if (medium.length) console.log(`  🟡 MEDIUM: ${medium.length}`);
    if (low.length) console.log(`  🔵 LOW: ${low.length}`);

    // Group by viewport
    const byViewport = {};
    for (const issue of issues) {
      if (!byViewport[issue.viewport]) byViewport[issue.viewport] = [];
      byViewport[issue.viewport].push(issue);
    }

    console.log('\n--- Issues by Viewport ---\n');
    for (const [vp, vpIssues] of Object.entries(byViewport)) {
      console.log(`📱 ${vp} (${vpIssues[0].category}):`);
      for (const issue of vpIssues) {
        const icon = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵' }[issue.severity];
        console.log(`  ${icon} [${issue.screen}] ${issue.description}`);
      }
      console.log('');
    }

    // Group by screen for cross-viewport issues
    const byScreen = {};
    for (const issue of issues) {
      const key = `${issue.screen}:${issue.description}`;
      if (!byScreen[key]) byScreen[key] = { screen: issue.screen, description: issue.description, severity: issue.severity, viewports: [] };
      byScreen[key].viewports.push(issue.viewport);
    }

    const crossViewport = Object.values(byScreen).filter(i => i.viewports.length > 1);
    if (crossViewport.length > 0) {
      console.log('--- Issues Affecting Multiple Viewports ---\n');
      for (const issue of crossViewport) {
        const icon = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵' }[issue.severity];
        console.log(`${icon} [${issue.screen}] ${issue.description}`);
        console.log(`   Affects: ${issue.viewports.join(', ')}\n`);
      }
    }
  }

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    viewports: VIEWPORTS.map(v => v.name),
    totalIssues: issues.length,
    issues,
  };
  fs.writeFileSync('screenshots/report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Full report saved to: responsive-test/screenshots/report.json');
  console.log('📸 Screenshots saved to: responsive-test/screenshots/');
}

main().catch(console.error);
