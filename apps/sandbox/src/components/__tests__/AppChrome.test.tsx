// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { AppChrome } from '../AppChrome';

/**
 * The shell's two structural duties: the R-4 play-money label on every screen,
 * and a way back out of a screen the tab bar cannot reach.
 */
let pathname = '/en';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ back: vi.fn() }),
}));

/**
 * The REAL catalog. An abbreviated stub would make the R-4 assertion below
 * circular — it would prove that the element renders whatever this file put in
 * it, not that the shipped play-money disclosure appears. Emptying
 * `common.playDisclaimer` must fail this test.
 */
const M = getMessages('en');
const DISCLAIMER = M['common.playDisclaimer'];

const renderAt = (path: string) => {
  pathname = path;
  return render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <AppChrome locale="en">
        <p>content</p>
      </AppChrome>
    </IntlProvider>
  );
};

describe('AppChrome — the shell duties', () => {
  // R-4: "labeled as play money on every screen where a balance or result
  // renders — no exceptions, no screens that could screenshot as real". This
  // regressed once already: the app-bar chip was removed and the only label
  // left was the frame caption, which is desktop-only AND aria-hidden, so on a
  // phone every screen but Home rendered balances unlabelled. Home alone is
  // not enough — assert a screen the user reaches with money on it.
  it.each(['/en', '/en/goals', '/en/month', '/en/move', '/en/time-machine'])(
    'should label play money on %s',
    (path) => {
      renderAt(path);
      expect(screen.getByText(DISCLAIMER)).toBeTruthy();
      // and it is the real disclosure, not an empty or placeholder string
      expect(DISCLAIMER).toMatch(/never converts to real money/i);
    }
  );

  it('should offer a way back from a screen no tab can reach', () => {
    // Settings and Practice record open from Profile. Without the contextual
    // Back control the bottom tabs could only throw the user to a different
    // section — a dead end in everything but name.
    renderAt('/en/settings');
    expect(screen.getByLabelText(M['common.back'])).toBeTruthy();
    expect(screen.queryByLabelText(M['nav.profile'])).toBeNull();
  });

  it('should keep the profile door on a tab root', () => {
    renderAt('/en');
    expect(screen.getByLabelText(M['nav.profile'])).toBeTruthy();
    expect(screen.queryByLabelText(M['common.back'])).toBeNull();
  });
});
