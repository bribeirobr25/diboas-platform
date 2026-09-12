'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIntl } from 'react-intl';
import { BrandMark } from '../BrandMark';
import { LucideIcon } from '../LucideIcon';
import { AlertButton } from './AlertButton';
import { ProfileButton } from './ProfileButton';
import controls from './ShellControls.module.css';
import styles from './AppHeader.module.css';

/**
 * `AppHeader` — global Product orientation (Minimum UI System §10.1).
 *
 * §10.1 closes four variants, and they map onto the shell families:
 *
 *   `top-level`  S1 — `[ Profile ] [ diBoaS ] [ Alerts ]`  (Spec §4.1)
 *   `focused`    S2 — `[ Back ]    [ diBoaS ] [ optional contextual action ]` (§5.1)
 *   `neutral`    S0 — identity only; no Profile, no Alerts (§3.2)
 *   `system`     S3 — minimal; navigation may be restricted (§6)
 *
 * The variant is passed IN, from the surface's declared shell family. Today's
 * header decides the same thing with `pathname === home` / `startsWith(move)` /
 * an `isRoot` boolean — three different derivations of one fact, which is what
 * the plan means by *"never inferred from `pathname`"*.
 *
 * ## What is NOT here
 *
 * The `ModeMarker` slot (§10.1 puts it under the identity) stays empty until
 * its label is approved in all four locales — the component exists and is
 * proven in Storybook, but a header that renders an English-only Legal-adjacent
 * label to a German user is not an improvement. The `scrolled` and
 * `offline/system-context` states from §10.1 are a declared spec gap (plan
 * §7.7) and are not invented here.
 *
 * R-4's play-money disclosure is NOT in the header: it rides under every
 * screen's content, where `L-QA1` requires it (*"the header marker does not, by
 * itself, discharge R-4"* — both labels ride). `AppShell` owns that line.
 */
export type AppHeaderVariant = 'top-level' | 'focused' | 'neutral' | 'system';

export function AppHeader({
  variant,
  homeHref,
  profileHref,
  alertsHref,
  unreadCount = 0,
  transparent = false,
}: {
  variant: AppHeaderVariant;
  homeHref: string;
  profileHref: string;
  alertsHref: string;
  unreadCount?: number;
  /** Home's coastal band shows through the bar (mockup 02); structure, not state. */
  transparent?: boolean;
}) {
  const intl = useIntl();
  const router = useRouter();

  return (
    <header
      className={styles.appbar}
      data-variant={variant}
      data-hero={transparent ? 'true' : undefined}
    >
      <span className={styles.slot}>
        {variant === 'top-level' ? <ProfileButton href={profileHref} /> : null}
        {variant === 'focused' ? (
          <button
            type="button"
            className={controls.control}
            onClick={() => router.back()}
            aria-label={intl.formatMessage({ id: 'common.back' })}
          >
            <LucideIcon name="arrow-left" size={24} />
          </button>
        ) : null}
      </span>

      <span className={styles.identity}>
        <Link href={homeHref} aria-label={intl.formatMessage({ id: 'nav.home' })}>
          <BrandMark />
        </Link>
        {/* ModeMarker slot — see the note above. */}
      </span>

      <span className={styles.slot} data-align="end">
        {variant === 'top-level' ? (
          <AlertButton href={alertsHref} unreadCount={unreadCount} />
        ) : null}
      </span>
    </header>
  );
}
