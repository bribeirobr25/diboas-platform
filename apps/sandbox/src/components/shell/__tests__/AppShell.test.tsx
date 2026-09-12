// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { SHELL_SURFACES, type ShellSurface } from '@/lib/shell/family';
import { AppShellRoute } from '../AppShellRoute';

/**
 * The shell's duties, carried over from `AppChrome.test.tsx` when the shell
 * split into its L2 components — plus the ones the family model adds.
 *
 * The two original duties are kept verbatim in intent, because both were
 * regressions once:
 *
 * 1. **R-4 on every screen where money renders.** It broke when the app bar was
 *    reduced to the mark alone and the only remaining label was the frame
 *    caption, which is desktop-only AND `aria-hidden` — so on a phone every
 *    screen but Home rendered balances unlabelled. Legal `L-QA1` restates it:
 *    a header mode marker *"does not, by itself, discharge R-4"*.
 * 2. **A way back from a screen no destination can reach.** Settings and
 *    Practice Record open from Profile; without the contextual Back the bottom
 *    navigation could only throw the user into a different section.
 */
const M = getMessages('en');
const DISCLAIMER = M['common.playDisclaimer'];

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
        <p>content</p>
      </AppShellRoute>
    </IntlProvider>
  );
};

/** Surfaces inside the app, from the declaration — not a hand-kept list. */
const inApp = (Object.keys(SHELL_SURFACES) as ShellSurface[]).filter(
  (id) => SHELL_SURFACES[id].family === 'S1' || SHELL_SURFACES[id].family === 'S2'
);
const pathFor = (surface: ShellSurface) =>
  surface === '' ? '/en' : `/en/${surface.replace('[id]', 'a-goal-id')}`;

describe('AppShell — the duties that regressed before', () => {
  it.each(inApp.map((s) => [s, pathFor(s)]))(
    'should label play money on the %s surface',
    (_surface, path) => {
      renderAt(path);
      expect(screen.getByText(DISCLAIMER)).toBeTruthy();
      // …and it is the shipped disclosure, not an empty or placeholder string.
      expect(DISCLAIMER).toMatch(/never converts to real money/i);
    }
  );

  it('should offer a way back from a screen no destination can reach', () => {
    renderAt('/en/settings');
    expect(screen.getByLabelText(M['common.back'])).toBeTruthy();
    expect(screen.queryByLabelText(M['nav.profile'])).toBeNull();
  });

  it('should keep the profile door on a top-level destination', () => {
    renderAt('/en');
    expect(screen.getByLabelText(M['nav.profile'])).toBeTruthy();
    expect(screen.queryByLabelText(M['common.back'])).toBeNull();
  });
});

describe('AppShell — the chrome follows the DECLARED family, not the URL', () => {
  it('should show both header utilities on a top-level destination (S1, Spec §4.1)', () => {
    renderAt('/en/goals');
    expect(screen.getByLabelText(M['nav.profile'])).toBeTruthy();
    expect(screen.getByLabelText(M['nav.notifications'])).toBeTruthy();
  });

  it('should not offer Alerts inside a focused task (S2, Spec §5.1)', () => {
    // "Most focused flows should have no competing top-level Profile control";
    // the same reasoning keeps the bell out of a task.
    renderAt('/en/goals/new');
    expect(screen.queryByLabelText(M['nav.notifications'])).toBeNull();
    expect(screen.getByLabelText(M['common.back'])).toBeTruthy();
  });

  it.each(
    inApp.filter((s) => SHELL_SURFACES[s].bottomNav === 'hidden').map((s) => [s, pathFor(s)])
  )('should hide the navigation during %s (Spec §5.2)', (_surface, path) => {
    renderAt(path);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it.each(
    inApp.filter((s) => SHELL_SURFACES[s].bottomNav === 'visible').map((s) => [s, pathFor(s)])
  )('should keep the navigation while browsing %s', (_surface, path) => {
    renderAt(path);
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('should offer exactly the five canonical destinations, labelled (Spec §8, §26)', () => {
    renderAt('/en');
    const nav = screen.getByRole('navigation');
    for (const id of ['nav.home', 'nav.goals', 'nav.move', 'nav.learn', 'nav.community']) {
      // Labels are ALWAYS visible: "icon alone is insufficient" (§26).
      expect(nav.textContent, id).toContain(M[id]);
    }
    // Five, and no sixth: the set is closed (§10).
    expect(nav.querySelectorAll('a, span[aria-disabled]').length).toBe(5);
  });

  it('should mark the selected destination for assistive tech, not by colour alone', () => {
    // SHELL-2 / P01 A11Y-01. `aria-current` is the machine-readable half; the
    // indicator bar and the bolder label are the visual halves (CSS).
    renderAt('/en/move');
    const current = screen.getByRole('navigation').querySelectorAll('[aria-current="page"]');
    expect(current.length).toBe(1);
    expect(current[0].textContent).toContain(M['nav.move']);
  });

  it('should send Community to its own surface and leave Learn inert (§9.5, §23, F-04)', () => {
    renderAt('/en');
    const nav = screen.getByRole('navigation');
    const community = [...nav.querySelectorAll('a')].find((a) =>
      a.textContent?.includes(M['nav.community'])
    );
    expect(community?.getAttribute('href')).toBe('/en/community');
    // Learn has no approved explainer copy yet, so it stays visible, labelled
    // and inert rather than navigating to nothing (5.201/5.202).
    const learn = [...nav.querySelectorAll('[aria-disabled="true"]')].find((el) =>
      el.textContent?.includes(M['nav.learn'])
    );
    expect(learn).toBeTruthy();
    expect(learn?.tagName).toBe('SPAN');
  });
});

describe('AppShell — mode truth ships without the re-tint (5.282)', () => {
  it('should state the surface mode on the document while the palette stays off', () => {
    renderAt('/en');
    expect(document.documentElement.getAttribute('data-mode')).toBe('practice');
    expect(document.documentElement.hasAttribute('data-palette')).toBe(false);
  });

  it('should never render the ModeMarker as a control (SHELL-3)', () => {
    // Shell Spec §17: no global public toggle, no hidden gesture, no
    // destination that silently changes financial mode.
    renderAt('/en');
    const header = screen.getByRole('banner');
    for (const control of header.querySelectorAll('a, button')) {
      const label = control.getAttribute('aria-label') ?? '';
      expect(label.toLowerCase()).not.toContain('practice');
      expect(label.toLowerCase()).not.toContain('real money');
    }
  });
});
