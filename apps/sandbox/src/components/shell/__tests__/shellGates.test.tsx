// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { getMessages } from '@/i18n/loadMessages';
import { SHELL_SURFACES, type ShellSurface } from '@/lib/shell/family';
import { AppShellRoute } from '../AppShellRoute';

/**
 * `SHELL-1` · `SHELL-2` · `SHELL-3` — the three shell gates, registered
 * PLANNED/UNENFORCED in `docs/tech/engineering-gates.md` since 2026-09-10.
 * This file is what makes them LIVE, one describe per row so the registry and
 * the suite stay legible against each other.
 *
 * None of them may be called live until it has been sabotage-proven; each is,
 * in the commit that adds it.
 */

const M = getMessages('en');
const SRC = join(process.cwd(), 'src');

let pathname = '/en';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ back: vi.fn() }),
}));

const renderAt = (path: string) => {
  pathname = path;
  return render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <AppShellRoute locale="en" paletteEnabled={false}>
        <p>screen content</p>
      </AppShellRoute>
    </IntlProvider>
  );
};

function sourceFiles(dir: string, match: RegExp): { file: string; text: string }[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory())
      return entry === 'node_modules' ? [] : sourceFiles(full, match);
    return match.test(entry)
      ? [{ file: relative(SRC, full), text: readFileSync(full, 'utf8') }]
      : [];
  });
}

const inAppSurfaces = (Object.keys(SHELL_SURFACES) as ShellSurface[]).filter(
  (id) => SHELL_SURFACES[id].family === 'S1' || SHELL_SURFACES[id].family === 'S2'
);
const pathFor = (surface: ShellSurface) =>
  surface === '' ? '/en' : `/en/${surface.replace('[id]', 'a-goal-id')}`;

describe('SHELL-1 — a Practice surface never renders money without the in-flow disclosure', () => {
  /**
   * Legal `L-QA1`: the header `PRACTICE · SIMULATED` marker *"does not, by
   * itself, discharge R-4"* — both the persistent marker and the in-flow
   * disclosure are required. The row also names the four insufficient forms:
   * colour alone, desktop-only text, `aria-hidden` text, and a detached footer.
   */
  it.each(inAppSurfaces.map((s) => [s, pathFor(s)]))(
    'should carry the disclosure inside the content flow on %s',
    (_surface, path) => {
      const { container } = renderAt(path);
      const line = screen.getByText(M['common.playDisclaimer']);
      // Not `aria-hidden`, and not inside an `aria-hidden` subtree: the frame
      // caption is exactly that, which is how this regressed the first time.
      expect(line.closest('[aria-hidden]')).toBeNull();
      // In the content flow — a sibling of the screen, not chrome pinned
      // outside the scroll region (a "detached footer" in the row's words).
      const scroll = line.parentElement;
      expect(scroll?.contains(container.querySelector('main'))).toBe(true);
    }
  );

  it('should keep the desktop-only frame caption aria-hidden, so it cannot be mistaken for the disclosure', () => {
    renderAt('/en');
    const caption = document.querySelector('[aria-hidden] , [aria-hidden="true"]');
    expect(caption).toBeTruthy();
    // The disclosure and the caption are different nodes with different text.
    expect(caption?.textContent).not.toContain(M['common.playDisclaimer']);
  });
});

describe('SHELL-2 — a selected destination is never distinguishable by colour alone', () => {
  /**
   * Shell Spec §26 (*"selected state survives without color"*) and P01
   * `A11Y-01`. Three signals: `aria-current` for assistive tech, an indicator
   * element that exists only when selected, and a heavier label. Colour is the
   * third reinforcement, never the only one.
   */
  it('should mark the selected destination with aria-current and a non-colour indicator', () => {
    renderAt('/en/move');
    const selected = screen.getByRole('navigation').querySelector('[aria-current="page"]');
    expect(selected).toBeTruthy();
    // The indicator element rides inside the selected item only.
    expect(selected?.querySelector('span[aria-hidden]')).toBeTruthy();
    const others = [...screen.getByRole('navigation').querySelectorAll('a')].filter(
      (a) => a.getAttribute('aria-current') !== 'page'
    );
    expect(others.length).toBeGreaterThan(0);
  });

  it('should PAINT the selected indicator and thicken its label, not merely recolour', () => {
    /**
     * This assertion was weaker than the thing it guards, and a sabotage run
     * proved it: deleting the rule that paints the indicator left the old
     * check satisfied, because it only asked whether SOME `[data-selected]`
     * block mentioned a non-colour property — and the label's `font-weight`
     * rule answered yes. The DOM test above catches the element disappearing;
     * nothing caught the CSS that makes it visible.
     *
     * So both non-colour signals are now named individually: the indicator is
     * painted with something that is not `transparent`, and the selected label
     * changes weight. Either one going missing fails here.
     */
    const css = readFileSync(join(SRC, 'components/shell/BottomNavigation.module.css'), 'utf8');
    const blockFor = (selector: string): string | null => {
      const match = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
      return match ? match[1] : null;
    };

    const indicator = blockFor("\\.tab\\[data-selected='true'\\]\\s+\\.indicator");
    expect(indicator, 'no rule paints the selected indicator').toBeTruthy();
    const painted = /background(?:-color)?:\s*([^;]+);/.exec(indicator ?? '')?.[1]?.trim();
    expect(painted, 'the selected indicator declares no background').toBeTruthy();
    expect(painted).not.toMatch(/^(?:transparent|none)$/);

    const label = blockFor("\\.tab\\[data-selected='true'\\]\\s+\\.tabLabel");
    expect(label, 'no rule thickens the selected label').toBeTruthy();
    expect(label).toMatch(/font-weight/);
  });
});

describe('SHELL-3 — no mode-mutating path, and the marker is never a control', () => {
  /**
   * Shell Spec §17: no global public mode toggle, no hidden gesture, no
   * bottom-nav destination that silently changes financial mode. Minimum UI
   * §10.2: the marker is *"never implemented as an unauthorized global mode
   * switch"*.
   */
  it('should offer no shell control that claims to change mode', () => {
    renderAt('/en');
    for (const control of document.querySelectorAll('a, button')) {
      const target = `${control.getAttribute('href') ?? ''} ${control.getAttribute('aria-label') ?? ''}`;
      expect(target.toLowerCase()).not.toMatch(/mode|switch-to|real-money|practice\?/);
    }
  });

  it('should let ONLY ModeStamp write the mode attributes', () => {
    // The mode is a declared value stamped in one place. A component reaching
    // for `data-mode` itself would be a second, unreviewed source of mode
    // truth — and the palette attribute is what the provisional re-tint hangs
    // on (5.282), so a stray writer could re-tint production.
    const writers = sourceFiles(SRC, /\.tsx?$/)
      .filter(({ file }) => !file.includes('__tests__') && !file.endsWith('.stories.tsx'))
      .filter(({ text }) => /setAttribute\(\s*['"]data-(mode|palette)['"]/.test(text))
      .map(({ file }) => file);
    expect(writers).toEqual(['components/ModeStamp.tsx']);
  });

  it('should keep the mode palette behind its capability by default', () => {
    // The truth ships; the re-tint waits for the calibration review. With the
    // capability off, a Practice surface states its mode and renders neutral.
    renderAt('/en');
    expect(document.documentElement.getAttribute('data-mode')).toBe('practice');
    expect(document.documentElement.hasAttribute('data-palette')).toBe(false);
  });
});
