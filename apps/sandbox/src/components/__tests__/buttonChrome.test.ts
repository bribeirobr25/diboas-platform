import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `5.207`, made mechanical.
 *
 * A `<button>` whose class declares no `background` and no `border` renders the
 * user agent's chrome: a grey plate with a PURE BLACK 2px outset border in light
 * and PURE WHITE in dark — an anti-slop Part 1 violation. The back button shipped
 * that way on every non-root screen, and the audit's own sweep for it MISSED it:
 * the sweep matched `<button … className=` on one line, and the back button's
 * className sits on the next. This reads each opening tag across lines.
 *
 * A button's chrome is decided by the UNION of its classes, so that is what is
 * checked: a modifier like `.active` or `.on` rightly declares only a background,
 * because its base class (`.segment`, `.track`) already declares the border. The
 * first version of this test judged each class alone and flagged three such
 * modifiers — a false positive in the rule, not a defect in the buttons.
 *
 * Only classes from the component's OWN module are checked; a class that has no
 * block in that module (composed elsewhere) is out of scope, not a pass.
 */
const COMPONENTS = join(process.cwd(), 'src', 'components');

/** The declarations of the first rule whose selector list includes `.cls`. */
function ruleFor(css: string, cls: string): string | null {
  const start = new RegExp(`(^|[\\s,}])\\.${cls}\\s*[,{]`, 'm').exec(css);
  if (!start) return null;
  const open = css.indexOf('{', start.index);
  const close = css.indexOf('}', open);
  return open === -1 || close === -1 ? null : css.slice(open + 1, close);
}

describe('no button renders the user agent chrome (5.207)', () => {
  it('should declare a background AND a border on every module class a button uses', () => {
    const offenders: string[] = [];
    let buttonsChecked = 0;
    for (const file of readdirSync(COMPONENTS).filter((f) => f.endsWith('.tsx'))) {
      const cssPath = join(COMPONENTS, file.replace(/\.tsx$/, '.module.css'));
      if (!existsSync(cssPath)) continue;
      const src = readFileSync(join(COMPONENTS, file), 'utf8');
      const css = readFileSync(cssPath, 'utf8');
      // Each opening <button …> tag, however many lines it spans.
      for (const tag of src.matchAll(/<button\b([\s\S]*?)>/g)) {
        const className = /className=\{([\s\S]*?)\}\s*(?:\n|\s[a-zA-Z-]+=|\/?$)/.exec(tag[1]);
        if (!className) continue;
        const classes = [...className[1].matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((m) => m[1]);
        const rules = classes
          .map((cls) => ruleFor(css, cls))
          .filter((r): r is string => r !== null);
        if (rules.length === 0) continue;
        buttonsChecked += 1;
        const hasBackground = rules.some((r) => /\bbackground(-color)?\s*:/.test(r));
        const hasBorder = rules.some((r) => /\bborder\s*:/.test(r));
        if (!hasBackground || !hasBorder) {
          offenders.push(
            `${file} ${classes.map((c) => `.${c}`).join(' ')} (${hasBackground ? '' : 'no background '}${hasBorder ? '' : 'no border'})`.trim()
          );
        }
      }
    }
    // Defect class 1: a matcher that finds no buttons asserts nothing.
    expect(buttonsChecked).toBeGreaterThan(20);
    expect(offenders).toEqual([]);
  });
});
