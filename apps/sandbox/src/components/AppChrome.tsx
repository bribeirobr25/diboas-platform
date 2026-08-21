'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FrameCaption } from './FrameCaption';
import { LucideIcon } from './LucideIcon';
import { LedgerReadyGate } from './LedgerReadyGate';
import { BrandMark } from './BrandMark';
import styles from './AppChrome.module.css';

/**
 * The mobile-app shell (docs/sandbox-app/UI-UX-REDESIGN.md §4): a constrained
 * canvas centered on a calm surround (reads as a phone on desktop, full-width
 * on mobile), a minimal top app bar, a scrolling content area, and a bottom
 * tab bar in the thumb zone (UX-57). The sandbox framing is carried by the
 * FRAME CAPTION above the canvas on desktop (founder 2026-08-21) rather than by
 * a chip in the bar, and by the disclaimer line under every screen's content —
 * which is what actually satisfies R-4 on a phone, where the caption is hidden.
 *
 * The bar's LEFT slot is contextual, as mockups 12 and 32 show it: the profile
 * door on a tab root, a Back control on any deeper screen. Without it, screens
 * reached from a non-tab parent (Settings and Practice record open from
 * Profile) had no in-app way back at all — the bottom tabs could only throw
 * you to a different section.
 */
export function AppChrome({ locale, children }: { locale: string; children: ReactNode }) {
  const intl = useIntl();
  const pathname = usePathname();
  const router = useRouter();
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
  /* A tab ROOT keeps the profile door; anything deeper gets Back instead. */
  const isRoot = isHome || isMove || pathname === goals || pathname === `${goals}/`;

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
          {isRoot ? (
            <Link
              href={profile}
              className={styles.appbarIcon}
              aria-label={intl.formatMessage({ id: 'nav.profile' })}
            >
              <LucideIcon name="user" size={24} />
            </Link>
          ) : (
            <button
              type="button"
              className={styles.appbarIcon}
              onClick={() => router.back()}
              aria-label={intl.formatMessage({ id: 'common.back' })}
            >
              <LucideIcon name="arrow-left" size={24} />
            </button>
          )}
          {/* No chip, no wordmark (founder 2026-08-21): the sandbox framing is
              carried ONCE by the frame caption above the canvas — the bar was
              stating the same thing three ways — and mockup 02 shows the short
              mark alone. The asset is the app-icon cut on an opaque tile;
              founder-approved as the interim ("use the other diBoaS logo for
              now") rather than fabricating a transparent crop. */}
          <div className={styles.appbarCenter}>
            <Link href={home} aria-label={intl.formatMessage({ id: 'nav.home' })}>
              <BrandMark />
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
                (app bar, tab bar, disclaimer) stays up around it (§7). */}
            <LedgerReadyGate>{children}</LedgerReadyGate>
          </main>
          {/* EVERY screen, not just Home. R-4 requires play money to be
              "labeled as play money on every screen where a balance or result
              renders — no exceptions, no screens that could screenshot as
              real". The app-bar chip used to carry that; once the bar was
              reduced to the mark alone (founder 2026-08-21) the only remaining
              label was the frame caption, which is desktop-only AND
              aria-hidden — so on a phone every screen but Home rendered
              balances with nothing marking them as play. This line is the
              per-screen label now, and it is real text in the flow rather than
              chrome, so it holds at every viewport and for a screen reader. */}
          <p className={styles.disclaimer}>
            <FormattedMessage id="common.playDisclaimer" />
          </p>
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
