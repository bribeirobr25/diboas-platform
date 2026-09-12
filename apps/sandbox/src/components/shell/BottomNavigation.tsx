import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import { LucideIcon, type IconName } from '../LucideIcon';
import type { ShellSurface } from '@/lib/shell/family';
import styles from './BottomNavigation.module.css';

/**
 * `BottomNavigation` — the five canonical destinations (Minimum UI §10.5,
 * Shell Spec §8/§9/§10).
 *
 *   Home · Goals · Move · Learn · Community
 *
 * §10 names them as five INTENTS — orient · plan · move · understand · belong —
 * which is why the set is closed and why Profile and Alerts are header
 * utilities instead (§11.1/§11.2), and why Weekly, History, Rules, Month,
 * Practice Record and the Time Machine are NOT here (§11.3/§11.4: retained
 * capabilities whose IA placement is a separate, unresolved question).
 *
 * ## The accessibility contract (§26), stated as code
 *
 * - **Labels are always visible** — "icon alone is insufficient".
 * - **The selected state survives without colour** (`SHELL-2`, P01 `A11Y-01`):
 *   `aria-current="page"` for assistive tech, plus a visible indicator bar and
 *   a heavier label in CSS. Colour is the third signal, never the only one.
 * - **Order is predictable** and fixed by the spec above.
 * - Touch targets come from `--sb-tap`.
 *
 * ## Unavailable destinations are truthful, not dead
 *
 * `Community` is *"visible from the start"* with a controlled unavailable
 * surface (§9.5/§23, `P-QA5`), so it navigates like any other destination — the
 * surface itself explains. `Learn` stays inert for now: F-04 wants it tappable
 * to an explainer, but no authority-approved explainer copy exists in the four
 * locales, and writing it here would be authoring Product copy. It renders as a
 * disabled item — visible, labelled and inert — which is the honest interim (an
 * affordance is a claim — `5.201`/`5.202`). It carries NO accessible
 * explanation today: the reason would be authored copy, so `unavailableLabel`
 * is left unset by `destinationsFor` and the accessible name is just the label.
 * Supplying that reason in four locales is the registered gap `5.288`.
 */
export interface Destination {
  readonly surface: ShellSurface;
  readonly href: string;
  readonly icon: IconName;
  readonly labelId: string;
  /**
   * Whether the destination can be entered at all.
   *
   * This is its OWN field, not "did the caller pass a label", because the two
   * questions are genuinely different and Spec §23 answers them differently:
   *
   * - `yes` — navigates. `Community` is `yes`: it is *"visible from the start"*
   *   and its surface carries the Legal-approved unavailable explanation
   *   (§9.5/§23, `P-QA5`), which §23 calls *"usually more informative than a
   *   dead icon"*.
   * - `no` — inert. `Learn` is `no` today: F-04 wants it tappable to an
   *   explainer, but no authority-approved explainer copy exists in the four
   *   locales, and a destination that navigates to nothing would be the
   *   affordance-as-false-claim of `5.201`/`5.202`. It renders as it does now —
   *   visible, labelled, inert — and the copy is a registered gap.
   */
  readonly available: 'yes' | 'no';
  /**
   * The accessible name for an inert destination, supplied by the caller.
   * Absent while no approved wording exists; Storybook carries the state.
   */
  readonly unavailableLabel?: string;
}

export function BottomNavigation({
  destinations,
  current,
}: {
  destinations: readonly Destination[];
  /** The surface the user is on, from the shell-family registry — never a URL match. */
  current: ShellSurface | null;
}) {
  const intl = useIntl();
  return (
    /* The nav's own accessible name stays `common.appName`, as it ships today:
       a better one is authored copy, and this file does not author copy. */
    <nav className={styles.tabbar} aria-label={intl.formatMessage({ id: 'common.appName' })}>
      {destinations.map((destination) => {
        const selected = destination.surface === current;
        if (destination.available === 'no') {
          return (
            <span
              key={destination.surface}
              className={styles.tab}
              data-disabled="true"
              aria-disabled="true"
              /* The reason is the accessible name when the caller has one. */
              aria-label={destination.unavailableLabel || undefined}
            >
              <LucideIcon name={destination.icon} size={22} />
              <span className={styles.tabLabel}>
                <FormattedMessage id={destination.labelId} />
              </span>
            </span>
          );
        }
        return (
          <Link
            key={destination.surface}
            href={destination.href}
            className={styles.tab}
            aria-current={selected ? 'page' : undefined}
            data-selected={selected ? 'true' : undefined}
          >
            {/* The non-colour selected signal: a visible bar above the item. */}
            <span className={styles.indicator} aria-hidden />
            <LucideIcon name={destination.icon} size={22} />
            <span className={styles.tabLabel}>
              <FormattedMessage id={destination.labelId} />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
