'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import { LedgerReadyGate } from './LedgerReadyGate';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ModeChip } from './ModeChip';
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
  const activity = `/${locale}/history`;
  const newGoal = `/${locale}/goals/new`;

  // Active tab: home is exact; activity/new-goal match their prefix.
  const isHome = pathname === home || pathname === `${home}/`;
  const isActivity = pathname.startsWith(activity);
  const isNewGoal = pathname.startsWith(newGoal);

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
          <Link href={home} className={styles.brand}>
            <LucideIcon name="palmtree" size={18} />
            <span>
              <FormattedMessage id="common.appName" />
            </span>
          </Link>
          <div className={styles.appbarRight}>
            <LocaleSwitcher locale={locale} variant="bare" />
            <ModeChip />
          </div>
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
            <LucideIcon name="wallet" size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id="common.navHome" />
            </span>
          </Link>
          <Link
            href={newGoal}
            className={styles.tabPrimary}
            aria-current={isNewGoal ? 'page' : undefined}
            aria-label={intl.formatMessage({ id: 'home.newGoal' })}
          >
            <LucideIcon name="plus" size={24} />
          </Link>
          <Link
            href={activity}
            className={styles.tab}
            aria-current={isActivity ? 'page' : undefined}
            data-active={isActivity}
          >
            <LucideIcon name="list" size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id="common.navHistory" />
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
