// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
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

const M = {
  'common.appName': 'diBoaS Sandbox',
  'common.frameCaption': 'Practice mode. Play money, real market data.',
  'common.skipToContent': 'Skip to content',
  'common.back': 'Back',
  'common.playDisclaimer': 'Everything here runs on play money.',
  'nav.home': 'Home',
  'nav.goals': 'Goals',
  'nav.move': 'Move',
  'nav.learn': 'Learn',
  'nav.profile': 'Profile',
  'nav.notifications': 'Notifications',
};

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
      expect(screen.getByText('Everything here runs on play money.')).toBeTruthy();
    }
  );

  it('should offer a way back from a screen no tab can reach', () => {
    // Settings and Practice record open from Profile. Without the contextual
    // Back control the bottom tabs could only throw the user to a different
    // section — a dead end in everything but name.
    renderAt('/en/settings');
    expect(screen.getByLabelText('Back')).toBeTruthy();
    expect(screen.queryByLabelText('Profile')).toBeNull();
  });

  it('should keep the profile door on a tab root', () => {
    renderAt('/en');
    expect(screen.getByLabelText('Profile')).toBeTruthy();
    expect(screen.queryByLabelText('Back')).toBeNull();
  });
});
