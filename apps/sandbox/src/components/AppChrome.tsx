'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FrameCaption } from './FrameCaption';
import { LucideIcon } from './LucideIcon';
import { LedgerReadyGate } from './LedgerReadyGate';
import { Wordmark } from './Wordmark';
import styles from './AppChrome.module.css';

/**
 * The mobile-app shell (docs/sandbox-app/UI-UX-REDESIGN.md §4): a constrained
 * canvas centered on a calm surround (reads as a phone on desktop, full-width
 * on mobile), a minimal top app bar, a scrolling content area, and a bottom
 * tab bar in the thumb zone (UX-57). The play chip lives in the top bar so
 * every screen is labeled play money (R-4); the full disclaimer scrolls at the
 * end of content.
 */
export function AppChrome({ locale, children }: { locale: string; children: ReactNode }) {
  const intl = useIntl();
  const pathname = usePathname();
  const home = `/${locale}`;
  const move = `/${locale}/move`;
  const goals = `/${locale}/goals`;
  const profile = `/${locale}/profile`;
  const notifications = `/${locale}/notifications`;

  // Active tab: home is exact; move matches its route prefix. The Goals + Learn
  // tabs are disabled until their screens ship (founder 2026-08-16) — no active
  // state, no navigation.
  const isHome = pathname === home || pathname === `${home}/`;
  const isMove = pathname.startsWith(move);
  const isGoals = pathname.startsWith(goals);

  return (
    <div className={styles.surround}>
      {/* A quiet brand caption in the desktop gutter so the surround around the
          phone canvas reads as intentional, not stranded (UI-UX-REDESIGN Part B, C1). */}
      <FrameCaption />
      <div className={styles.canvas}>
        {/* Home only: the coastal hero band sits behind a transparent app bar
            and the play-balance hero (mockup 02, issue #3). Decorative. */}
        {isHome ? <div className={styles.heroBackdrop} aria-hidden /> : null}
        <a href="#main" className={styles.skipLink}>
          <FormattedMessage id="common.skipToContent" />
        </a>
        <header className={styles.appbar} data-hero={isHome ? 'true' : undefined}>
          <Link
            href={profile}
            className={styles.appbarIcon}
            aria-label={intl.formatMessage({ id: 'nav.profile' })}
          >
            <LucideIcon name="user" size={24} />
          </Link>
          {/* No chip here (founder 2026-08-21): the sandbox framing is carried
              ONCE, by the frame caption above the canvas — the bar was stating
              the same thing three ways.

              The founder also asked for the SHORT logo (mockup 02's palm mark)
              rather than the wordmark. Blocked on an asset, deliberately not
              faked: the only monogram in the repo
              (`apps/web/public/assets/logos/logo-icon-monogram.avif`) is the
              opaque app-icon used solely as a schema.org publisher logo, and
              every icon PNG is background-baked too (verified: no alpha
              channel on any of them). Cropping the palm out of the wordmark
              would be exactly the fabricated asset the compliance gate
              forbids. The wordmark stands until a transparent mark ships;
              swapping it is then one line. */}
          <div className={styles.appbarCenter}>
            <Link href={home} aria-label={intl.formatMessage({ id: 'nav.home' })}>
              <Wordmark size="1.7rem" />
            </Link>
          </div>
          <Link
            href={notifications}
            className={styles.appbarIcon}
            aria-label={intl.formatMessage({ id: 'nav.notifications' })}
          >
            <LucideIcon name="bell" size={22} />
          </Link>
        </header>

        <div className={styles.scroll}>
          <main id="main" className={styles.main}>
            {/* Hold ledger-reading content until hydrate settles — the shell
                (app bar, tab bar, PLAY MONEY badge) stays up around it (§7). */}
            <LedgerReadyGate>{children}</LedgerReadyGate>
          </main>
          {/* The full disclaimer rides on home/first-run only; the persistent
              PLAY MONEY chip (above) is the per-screen label (R-4). */}
          {isHome ? (
            <p className={styles.disclaimer}>
              <FormattedMessage id="common.playDisclaimer" />
            </p>
          ) : null}
        </div>

        <nav className={styles.tabbar} aria-label={intl.formatMessage({ id: 'common.appName' })}>
          <Link
            href={home}
            className={styles.tab}
            aria-current={isHome ? 'page' : undefined}
            data-active={isHome}
          >
            <LucideIcon name="home" size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id="nav.home" />
            </span>
          </Link>
          <Link
            href={goals}
            className={styles.tab}
            aria-current={isGoals ? 'page' : undefined}
            data-active={isGoals}
          >
            <LucideIcon name="target" size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id="nav.goals" />
            </span>
          </Link>
          <Link
            href={move}
            className={styles.tab}
            aria-current={isMove ? 'page' : undefined}
            data-active={isMove}
          >
            <LucideIcon name="arrow-right-left" size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id="nav.move" />
            </span>
          </Link>
          <span className={styles.tab} data-disabled="true" aria-disabled="true">
            <LucideIcon name="book-open" size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id="nav.learn" />
            </span>
          </span>
        </nav>
      </div>
    </div>
  );
}
