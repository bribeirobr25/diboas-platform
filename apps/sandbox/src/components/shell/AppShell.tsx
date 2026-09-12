'use client';

import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { FrameCaption } from '../FrameCaption';
import { LedgerReadyGate } from '../LedgerReadyGate';
import { ModeStamp } from '../ModeStamp';
import { AppHeader, type AppHeaderVariant } from './AppHeader';
import { BottomNavigation, type Destination } from './BottomNavigation';
import { SHELL_SURFACES, type ShellSurface } from '@/lib/shell/family';
import styles from './AppShell.module.css';

/**
 * `AppShell` — the one shell, composed from its L2 parts (I-1e).
 *
 * It replaces `AppChrome`, whose chrome decisions were re-derived from the URL
 * at each call site (`pathname === home`, `startsWith(move)`, an `isRoot`
 * boolean). Here the SURFACE is passed in, and everything else is read from the
 * declared registry: the header variant from the family, the navigation from
 * the surface's own `bottomNav`, the mode from its declared mode. Nothing in
 * this file parses a pathname.
 *
 * ## The family → header mapping (Minimum UI §10.1, Shell Spec §3–§6)
 *
 *   S1 → `top-level`   Profile · identity · Alerts
 *   S2 → `focused`     Back · identity
 *   S0 → `neutral`     identity only
 *   S3 → `system`      identity only, minimal
 *
 * ## R-4 stays where Legal put it
 *
 * The play-money disclosure rides UNDER every screen's content, not in the
 * header: `L-QA1` is explicit that a header mode marker *"does not, by itself,
 * discharge R-4"* — both labels ride. It regressed once already, when the bar
 * was reduced to the mark alone and the only remaining label was the
 * desktop-only, `aria-hidden` frame caption, leaving every phone screen but
 * Home with unlabelled balances. So it is real text in the flow, on every
 * surface inside the app, at every viewport.
 *
 * S0/S3 surfaces do not carry it: they show no balance or result (the registry
 * says so — their mode is `neutral`), and Claim states Practice truth in its
 * own approved copy.
 */
const HEADER_VARIANT: Record<string, AppHeaderVariant> = {
  S0: 'neutral',
  S1: 'top-level',
  S2: 'focused',
  S3: 'system',
};

export function AppShell({
  locale,
  surface,
  destinations,
  paletteEnabled,
  children,
}: {
  locale: string;
  /** The surface's declared id — the shell never derives it. */
  surface: ShellSurface;
  destinations: readonly Destination[];
  /** `can('modePalette')`, resolved server-side by the layout. */
  paletteEnabled: boolean;
  children: ReactNode;
}) {
  const spec = SHELL_SURFACES[surface];
  const variant = HEADER_VARIANT[spec.family];
  const inApp = spec.family === 'S1' || spec.family === 'S2';
  const home = `/${locale}`;

  return (
    <div className={styles.surround}>
      <ModeStamp mode={spec.mode} palette={paletteEnabled} />
      {/* The desktop gutter caption. Shell Q-5 — what it carries that a
          ModeMarker will not — is still open with Product, so it stays. */}
      <FrameCaption />
      <div className={styles.canvas}>
        {/* Home's coastal band, behind a transparent bar (mockup 02). Keyed off
            the declared surface, not a pathname comparison. */}
        {surface === '' ? <div className={styles.heroBackdrop} aria-hidden /> : null}
        <a href="#main" className={styles.skipLink}>
          <FormattedMessage id="common.skipToContent" />
        </a>

        <AppHeader
          variant={variant}
          homeHref={home}
          profileHref={`${home}/profile`}
          alertsHref={`${home}/notifications`}
          transparent={surface === ''}
        />

        <div className={styles.scroll}>
          <main id="main" className={styles.main}>
            {/* Holds ledger-reading content until hydration settles, with the
                chrome up around it — so a deep link can never render something
                false about the user's money. */}
            {inApp ? <LedgerReadyGate>{children}</LedgerReadyGate> : children}
          </main>
          {inApp ? (
            <p className={styles.disclaimer}>
              <FormattedMessage id="common.playDisclaimer" />
            </p>
          ) : null}
        </div>

        {spec.bottomNav === 'visible' ? (
          <BottomNavigation destinations={destinations} current={surface} />
        ) : null}
      </div>
    </div>
  );
}
