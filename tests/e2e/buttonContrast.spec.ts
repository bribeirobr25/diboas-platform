/**
 * BTN-CONTRAST-1 · the cookie banner's Accept button keeps its white label at 4.5:1 or more
 * (market clean-up W-D1, register 5.1010, the founder's ruling L7: a darker teal fill, white text;
 * spec §3.8). Runs in the default `chromium` project of the required `e2e` job, on the production
 * build: it reads Accept's COMPUTED colours at rest and on hover (after the banner's colour
 * transitions settle), parses every gradient stop, takes the worst, and blends any translucent
 * colour over the opaque backdrop behind it. A value it cannot parse is a failure. A source check
 * pins Accept to the strong teal tokens.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator } from '@playwright/test';

type RGBA = [number, number, number, number];

function parseColors(value: string): RGBA[] {
  const found = [...value.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => {
    const parts = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1] as RGBA;
  });
  if (found.some((c) => c.some((n) => Number.isNaN(n)))) throw new Error(`unparseable: ${value}`);
  return found;
}

const over = (top: RGBA, bottom: RGBA): RGBA => {
  const a = top[3];
  return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1) as RGBA;
};
const luminance = ([r, g, b]: RGBA) => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: RGBA, b: RGBA) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The worst label contrast over the button's fill, at its current state. */
async function worstContrast(button: Locator): Promise<number> {
  await button.evaluate(async (el) => {
    for (let i = 0; i < 50 && el.getAnimations({ subtree: true }).length > 0; i++)
      await new Promise((r) => setTimeout(r, 50));
  });
  const read = await button.evaluate((el) => {
    const own = getComputedStyle(el);
    // the first ancestor with an opaque, non-gradient background is the backdrop
    let backdrop = 'rgb(255, 255, 255)';
    for (let p = el.parentElement; p; p = p.parentElement) {
      const bg = getComputedStyle(p).backgroundColor;
      if (!/rgba\([^)]*,\s*0\)$/.test(bg) && bg !== 'transparent' && !/,\s*0\.\d+\)$/.test(bg)) {
        backdrop = bg;
        break;
      }
    }
    return { image: own.backgroundImage, color: own.backgroundColor, label: own.color, backdrop };
  });
  const backdrop = parseColors(read.backdrop)[0];
  const stops =
    read.image && read.image !== 'none' ? parseColors(read.image) : parseColors(read.color);
  if (stops.length === 0) throw new Error(`no fill to measure: ${JSON.stringify(read)}`);
  const fills = stops.map((stop) => (stop[3] < 1 ? over(stop, backdrop) : stop));
  const label = parseColors(read.label)[0];
  return Math.min(...fills.map((fill) => contrast(label[3] < 1 ? over(label, fill) : label, fill)));
}

test.describe('BTN-CONTRAST-1: the banner Accept button', () => {
  test('should keep its label at 4.5:1 or more on its worst stop, at rest and on hover', async ({
    page,
  }) => {
    await page.goto('/en');
    const banner = page.getByRole('dialog');
    await banner.waitFor({ state: 'visible', timeout: 15_000 });
    const accept = banner.getByRole('button', { name: 'Accept cookies' });
    expect(await worstContrast(accept)).toBeGreaterThanOrEqual(4.5);
    await accept.hover();
    expect(await worstContrast(accept)).toBeGreaterThanOrEqual(4.5);
  });

  test('should take its fill and label from the strong teal tokens', () => {
    const css = readFileSync(
      join(__dirname, '../../apps/web/src/components/CookieConsent/CookieConsent.module.css'),
      'utf8'
    );
    const rule = /\.buttonAccept\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/background:\s*var\(--cta-bg-primary-fixed-gradient\)/);
    expect(rule).toMatch(/color:\s*var\(--cta-color-primary-fixed\)/);
  });
});
