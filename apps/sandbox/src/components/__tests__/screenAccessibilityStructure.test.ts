import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Two structural a11y rules the automated gates cannot see, made mechanical.
 *
 * `pa11y` would not catch either: heading structure is axe's best-practice
 * tier, and `5.208` records that pa11y runs `--filter web` and never looks at
 * this app at all. So these survived on a live public surface until the
 * 2026-09-10 audit read the hydrated DOM.
 *
 * **What it found.** `/move` (`MoneyOut.tsx`) was the ONE screen of fourteen
 * with no heading element, and its `aria-labelledby="move-title"` pointed at
 * the balance NUMBER — so the region's accessible name was literally "0.00".
 * Confirmed in-browser before the fix: the accessibility tree read
 * `region "0,00"`.
 */

const COMPONENTS = join(process.cwd(), 'src', 'components');
const read = (f: string) => readFileSync(join(COMPONENTS, f), 'utf8');

/** Every full-screen surface. Doors like `MoneyOut` are screens by route. */
const SCREENS = readdirSync(COMPONENTS)
  .filter((f) => /Screen\.tsx$/.test(f) || f === 'MoneyOut.tsx')
  .sort();

describe('every screen is navigable by heading', () => {
  it('should have found the screens at all, so this suite cannot pass vacuously', () => {
    // Defect class 1: a glob that matches nothing asserts nothing.
    expect(SCREENS.length).toBeGreaterThanOrEqual(13);
    expect(SCREENS).toContain('MoneyOut.tsx');
  });

  it.each(SCREENS)('should give %s at least one heading element', (file) => {
    // A screen with no heading gives screen-reader heading navigation nothing
    // to land on — worse than a level skip, which is what the standards name.
    expect(read(file)).toMatch(/<h[1-6][\s>]/);
  });

  it('should never name a region by an AMOUNT (a value is not a label)', () => {
    // The exact defect: `id="move-title"` sat on the formatted balance, so the
    // region announced "0.00". Any `aria-labelledby` target must be a heading
    // or a text label — never the element that renders the number.
    const source = read('MoneyOut.tsx');
    const labelId = source.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelId).toBe('move-title');
    // The id must live on the heading…
    expect(source).toMatch(new RegExp(`<h1 id="${labelId}"`));
    // …and NOT on the balance span that renders the FormattedNumber.
    const balanceSpan = source.match(/<span className=\{styles\.balance\}>/);
    expect(balanceSpan).not.toBeNull();
    expect(source).not.toMatch(new RegExp(`<span id="${labelId}"`));
  });
});

describe('the accessible-name utility is defined once', () => {
  it('should keep .srOnly in globals.css and nowhere else (principle 4)', () => {
    // It existed as four byte-identical copies before this audit, and a fifth
    // was about to be added. One definition, or the next reader copies it again.
    const globals = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8');
    expect(globals).toMatch(/^\.srOnly \{/m);

    const duplicates = readdirSync(COMPONENTS)
      .filter((f) => f.endsWith('.module.css'))
      .filter((f) => /^\.srOnly\s*\{/m.test(read(f)));
    expect(duplicates).toEqual([]);
  });
});
