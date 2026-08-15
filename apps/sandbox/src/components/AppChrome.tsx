'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import { LedgerReadyGate } from './LedgerReadyGate';
import { ModeChip } from './ModeChip';
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
  const goals = `/${locale}/goals`;
  const move = `/${locale}/move`;
  const learn = `/${locale}/learn`;
  const profile = `/${locale}/profile`;
  const notifications = `/${locale}/notifications`;

  // Active tab: home is exact; the others match their route prefix.
  const isHome = pathname === home || pathname === `${home}/`;
  const isGoals = pathname.startsWith(goals);
  const isMove = pathname.startsWith(move);
  const isLearn = pathname.startsWith(learn);

  return (
    <div className={styles.surround}>
      {/* A quiet brand caption in the desktop gutter so the surround around the
          phone canvas reads as intentional, not stranded (UI-UX-REDESIGN Part B, C1). */}
      <p className={styles.frameCaption} aria-hidden>
        <FormattedMessage id="common.appName" />
        <span className={styles.frameCaptionSub}>
          <FormattedMessage id="common.frameCaption" />
        </span>
      </p>
      <div className={styles.canvas}>
        <a href="#main" className={styles.skipLink}>
          <FormattedMessage id="common.skipToContent" />
        </a>
        <header className={styles.appbar}>
          <Link
            href={profile}
            className={styles.appbarIcon}
            aria-label={intl.formatMessage({ id: 'nav.profile' })}
          >
            <LucideIcon name="user" size={24} />
          </Link>
          <div className={styles.appbarCenter}>
            <Link href={home}>
              <Wordmark size="1.7rem" />
            </Link>
            <ModeChip />
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
          <Link
            href={learn}
            className={styles.tab}
            aria-current={isLearn ? 'page' : undefined}
            data-active={isLearn}
          >
            <LucideIcon name="book-open" size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id="nav.learn" />
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
