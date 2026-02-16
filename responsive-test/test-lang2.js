const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });

  // === TEST 1: Mobile inline flags ===
  console.log('=== MOBILE MENU (375px) ===');
  const mCtx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const mPage = await mCtx.newPage();
  await mPage.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 60000 });
  await mPage.waitForTimeout(2000);
  await mPage.click('.minimal-nav-hamburger');
  await mPage.waitForTimeout(500);

  const mobile = await mPage.evaluate(() => {
    const langContainer = document.querySelector('.minimal-nav-mobile-lang');
    if (!langContainer) return 'NO LANG CONTAINER';
    const buttons = langContainer.querySelectorAll('button');
    return {
      buttonCount: buttons.length,
      buttons: Array.from(buttons).map(btn => {
        const flag = btn.querySelector('[class*=flagEmoji]');
        const code = btn.querySelector('[class*=localeCode]');
        return {
          flag: flag ? flag.textContent.trim() : 'N/A',
          code: code ? code.textContent.trim() : 'N/A',
          active: btn.getAttribute('aria-current') === 'page',
          width: Math.round(btn.getBoundingClientRect().width),
          height: Math.round(btn.getBoundingClientRect().height),
        };
      }),
      layout: 'inline flags with codes',
    };
  });
  console.log(JSON.stringify(mobile, null, 2));
  await mCtx.close();

  // === TEST 2: Desktop dropdown z-index ===
  console.log('\n=== DESKTOP DROPDOWN Z-INDEX (1024px) ===');
  const dCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const dPage = await dCtx.newPage();
  await dPage.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 60000 });
  await dPage.waitForTimeout(2000);

  // Click the language dropdown
  const langBtn = await dPage.$('.minimal-nav-lang-desktop button');
  if (langBtn) {
    await langBtn.click();
    await dPage.waitForTimeout(300);

    const dropdown = await dPage.evaluate(() => {
      const menu = document.querySelector('[class*=dropdownMenu]');
      if (!menu) return 'DROPDOWN NOT FOUND';
      const rect = menu.getBoundingClientRect();
      const s = getComputedStyle(menu);
      // Check if it's visible (not clipped)
      const navContent = document.querySelector('.minimal-navigation-content');
      const navRect = navContent ? navContent.getBoundingClientRect() : null;
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        zIndex: s.zIndex,
        visible: rect.height > 0 && rect.width > 0,
        navBottom: navRect ? Math.round(navRect.bottom) : 'N/A',
        dropdownBelowNav: navRect ? rect.top >= navRect.bottom - 10 : 'unknown',
      };
    });
    console.log('Dropdown:', JSON.stringify(dropdown, null, 2));
  } else {
    console.log('Could not find language button on desktop');
  }

  await browser.close();
  console.log('\nDone!');
})().catch(e => console.error(e));
