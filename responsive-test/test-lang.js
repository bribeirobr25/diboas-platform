const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  await page.click('.minimal-nav-hamburger');
  await page.waitForTimeout(500);

  const menu = await page.evaluate(() => {
    const langContainer = document.querySelector('.minimal-nav-mobile-lang');
    if (!langContainer) return 'NO LANG CONTAINER';
    const buttons = langContainer.querySelectorAll('button');
    return {
      buttonCount: buttons.length,
      buttons: Array.from(buttons).map(btn => ({
        label: btn.getAttribute('aria-label') || btn.textContent.trim(),
        active: btn.getAttribute('aria-current') === 'page',
        width: Math.round(btn.getBoundingClientRect().width),
        height: Math.round(btn.getBoundingClientRect().height),
      })),
      containerWidth: Math.round(langContainer.getBoundingClientRect().width),
    };
  });
  console.log('Mobile menu language switcher:');
  console.log(JSON.stringify(menu, null, 2));

  await ctx.close();
  const dCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const dPage = await dCtx.newPage();
  await dPage.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 60000 });
  await dPage.waitForTimeout(2000);

  const desktop = await dPage.evaluate(() => {
    const langDesktop = document.querySelector('.minimal-nav-lang-desktop');
    if (!langDesktop) return 'NO DESKTOP LANG';
    const dropdown = langDesktop.querySelector('button');
    return {
      display: getComputedStyle(langDesktop).display,
      buttonText: dropdown ? dropdown.textContent.trim() : 'N/A',
    };
  });
  console.log('Desktop language switcher:', JSON.stringify(desktop));

  await browser.close();
})().catch(e => console.error(e));
