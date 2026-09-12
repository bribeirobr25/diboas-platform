import Link from 'next/link';
import { useIntl } from 'react-intl';
import { LucideIcon } from '../LucideIcon';
import styles from './ShellControls.module.css';

/**
 * `ProfileButton` — global account access (Minimum UI System §10.4).
 *
 * Placement is settled: top-LEFT of authenticated top-level surfaces (Shell
 * Spec §4.2), which is what keeps Profile out of the five bottom-nav
 * destinations (§11.1). On a focused task it is *"hidden/replaced by Back"*
 * (§10.4) — the header owns that swap, not this component.
 *
 * States §10.4 closes: `default` · `pressed` · `focus`. Hover is not in that
 * list but the app has always had one; it stays, because removing an existing
 * affordance is not what "structurally establish" means.
 *
 * **Not a mode switch** (§10.4, `SHELL-3`): it opens the account area and
 * nothing else.
 */
export function ProfileButton({ href }: { href: string }) {
  const intl = useIntl();
  return (
    <Link
      href={href}
      className={styles.control}
      aria-label={intl.formatMessage({ id: 'nav.profile' })}
    >
      <LucideIcon name="user" size={24} />
    </Link>
  );
}
