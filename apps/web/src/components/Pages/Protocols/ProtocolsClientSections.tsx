'use client';

/**
 * Protocols Page — Client Section Components
 *
 * Self-contained client components for the transition hooks
 * that require useTranslation().
 */

import { useTranslation } from '@diboas/i18n/client';
import styles from './ProtocolsPageContent.module.css';

const I18N_PREFIX = 'protocols';

// ─── Transition Hook ─────────────────────────────────────────

export function ProtocolsTransitionHook({ hookKey, variant = 'default' }: { hookKey: string; variant?: 'default' | 'pivotal' }) {
  const intl = useTranslation();
  const text = intl.formatMessage({ id: `${I18N_PREFIX}.${hookKey}` });

  const variantClass = variant === 'pivotal' ? styles.transitionPivotal : styles.transitionDefault;

  return <p className={`${styles.transitionHook} ${variantClass}`}>{text}</p>;
}

// NOTE: ProtocolsDisclaimersSection removed (dead code — never imported by any page)
