/**
 * Register 5.738 · every width-capped text block of a centre-aligned CinematicHero is centred.
 *
 * A block with a `max-width` narrower than its column sits at the column's left edge unless
 * the centre variant gives it auto inline margins. `text-align: center` on the container
 * centres the TEXT inside each box, not the box: `/protocols` showed its second sub-headline
 * (`.subheadline2`, 44ch) hugging the left of a 704 px column (centred at 590 px of 720,
 * measured on diboas.com at 1440 px, 2026-11-03).
 *
 * The class list is DERIVED, never hand-kept: the classes the content component renders
 * (`styles.*` in CinematicHeroContent.tsx) intersected with the classes the module caps with
 * `max-width`. A new capped block without a centre rule fails here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(DIR, 'CinematicHero.module.css'), 'utf8');
const content = fs.readFileSync(path.join(DIR, 'content/CinematicHeroContent.tsx'), 'utf8');

/** Top-level rules only (`@media` / `@supports` blocks are skipped), comments removed. */
function topLevelRules(source: string): Array<{ selectors: string[]; body: string }> {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Array<{ selectors: string[]; body: string }> = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open === -1) break;
    const prelude = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    if (!prelude.startsWith('@')) {
      rules.push({
        selectors: prelude.split(',').map((s) => s.trim().replace(/\s+/g, ' ')),
        body: text.slice(open + 1, j - 1),
      });
    }
    i = j;
  }
  return rules;
}

const rules = topLevelRules(css);

const renderedClasses = new Set(
  [...content.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((m) => m[1] as string)
);

const cappedClasses = rules
  .filter((r) => r.selectors.length === 1 && /^\.[A-Za-z0-9_]+$/.test(r.selectors[0] ?? ''))
  .filter((r) => /(^|;|\s)max-width\s*:/.test(r.body))
  .map((r) => (r.selectors[0] as string).slice(1));

const cappedAndRendered = cappedClasses.filter((c) => renderedClasses.has(c));

function centresInline(body: string): boolean {
  const auto = (prop: string) => new RegExp(`(^|;|\\s)${prop}\\s*:\\s*auto\\s*(;|$)`).test(body);
  const shorthand = /(^|;|\s)margin\s*:\s*\S+\s+auto\s*(\S+\s*)?(;|$)/.test(body);
  const inline = /(^|;|\s)margin-inline\s*:\s*auto\s*(;|$)/.test(body);
  return (auto('margin-left') && auto('margin-right')) || shorthand || inline;
}

describe('CinematicHero centre variant (5.738)', () => {
  it('should find the width-capped blocks the content renders (the derivation is not vacuous)', () => {
    expect(cappedAndRendered).toEqual(expect.arrayContaining(['content', 'subheadline']));
  });

  it.each(cappedAndRendered)('should centre the .%s box when the hero is centre-aligned', (cls) => {
    const centred = rules.some(
      (r) => r.selectors.includes(`.hero[data-align='center'] .${cls}`) && centresInline(r.body)
    );
    expect(centred, `.hero[data-align='center'] .${cls} must set auto inline margins`).toBe(true);
  });
});
