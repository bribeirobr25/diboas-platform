const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });

  // === TEST 1: Desktop — CTA then LanguageSwitcher order + spacing ===
  console.log('=== DESKTOP NAV (1200px) ===');
  const dCtx = await browser.newContext({ viewport: { width: 1200, height: 768 } });
  const dPage = await dCtx.newPage();
  await dPage.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 60000 });
  await dPage.waitForTimeout(2000);

  const desktopOrder = await dPage.evaluate(() => {
    const actions = document.querySelector('.minimal-nav-actions');
    if (!actions) return 'NO ACTIONS';
    const children = Array.from(actions.children);
    return children.map(child => {
      const rect = child.getBoundingClientRect();
      const s = getComputedStyle(child);
      let type = 'unknown';
      if (child.classList.contains('minimal-nav-cta-desktop')) type = 'CTA';
      else if (child.classList.contains('minimal-nav-lang-desktop')) type = 'LANG';
      else if (child.classList.contains('minimal-nav-hamburger')) type = 'HAMBURGER';
      return {
        type,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        display: s.display,
        marginLeft: s.marginLeft,
      };
    });
  });
  console.log('Desktop nav actions order (left to right):');
  for (const item of desktopOrder) {
    console.log('  ' + item.type + ': L=' + item.left + ' R=' + item.right + ' display=' + item.display + ' ml=' + item.marginLeft);
  }

  // Verify dropdown works
  const langBtn = await dPage.$('.minimal-nav-lang-desktop button');
  if (langBtn) {
    await langBtn.click();
    await dPage.waitForTimeout(300);
    const dropdown = await dPage.evaluate(() => {
      const menu = document.querySelector('[class*=dropdownMenu]');
      if (!menu) return { found: false };
      const rect = menu.getBoundingClientRect();
      return {
        found: true,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        visible: rect.height > 10,
      };
    });
    console.log('Dropdown menu:', JSON.stringify(dropdown));
  }
  await dCtx.close();

  // === TEST 2: Mobile — SVG flags ===
  console.log('\n=== MOBILE MENU (375px) ===');
  const mCtx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const mPage = await mCtx.newPage();
  await mPage.goto('http://localhost:3000/en', { waitUntil: 'networkidle', timeout: 60000 });
  await mPage.waitForTimeout(2000);
  await mPage.click('.minimal-nav-hamburger');
  await mPage.waitForTimeout(500);

  const mobileFlags = await mPage.evaluate(() => {
    const langContainer = document.querySelector('.minimal-nav-mobile-lang');
    if (!langContainer) return 'NO LANG CONTAINER';
    const buttons = langContainer.querySelectorAll('button');
    return {
      buttonCount: buttons.length,
      buttons: Array.from(buttons).map(btn => {
        const svg = btn.querySelector('svg');
        const code = btn.querySelector('[class*=localeCode]');
        const emoji = btn.querySelector('[class*=flagEmoji]');
        return {
          hasSVG: !!svg,
          hasEmoji: !!emoji,
          code: code ? code.textContent.trim() : 'N/A',
          active: btn.getAttribute('aria-current') === 'page',
          label: btn.getAttribute('aria-label'),
        };
      }),
    };
  });
  console.log(JSON.stringify(mobileFlags, null, 2));
  await mCtx.close();

  await browser.close();
  console.log('\nDone!');
})().catch(e => console.error(e));
