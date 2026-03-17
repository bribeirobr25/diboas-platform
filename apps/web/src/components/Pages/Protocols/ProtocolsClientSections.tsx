'use client';

/**
 * Protocols Page — Client Section Components
 *
 * Self-contained client components for the transition hooks and
 * footer disclaimers that require useTranslation().
 *
 * Phase 3D/3E migration: extracts inline sections from ProtocolsPageContent orchestrator.
 */

import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { SectionContainer } from '@/components/Sections';
import { getProtocolsDisclaimerKeys } from '@/config/landing-protocols';
import styles from './ProtocolsPageContent.module.css';

const I18N_PREFIX = 'protocols';

// ─── Transition Hook ─────────────────────────────────────────

export function ProtocolsTransitionHook({ hookKey, variant = 'default' }: { hookKey: string; variant?: 'default' | 'pivotal' }) {
  const intl = useTranslation();
  const text = intl.formatMessage({ id: `${I18N_PREFIX}.${hookKey}` });

  const variantClass = variant === 'pivotal' ? styles.transitionPivotal : styles.transitionDefault;

  return <p className={`${styles.transitionHook} ${variantClass}`}>{text}</p>;
}

// ─── Footer Disclaimers ──────────────────────────────────────

export function ProtocolsDisclaimersSection() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  const disclaimerKeys = getProtocolsDisclaimerKeys(locale);

  return (
    <SectionContainer
      variant="standard"
      padding="none"
      backgroundColor="var(--section-bg-neutral)"
      className={styles.disclaimer}
    >
      <div className={styles.disclaimersSection}>
        {disclaimerKeys.map((key) => {
          const text = t(key);
          return text ? (
            <p key={key} className={styles.disclaimerText}>
              {text}
            </p>
          ) : null;
        })}
      </div>
    </SectionContainer>
  );
}
