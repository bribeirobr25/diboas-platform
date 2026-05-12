'use client';

/**
 * B2BToolsCallout — small inline callout on /business page linking to the
 * 2 B2B Tier-3 calculators (6E.1 + 6E.2).
 *
 * Plan §6E done criteria: "B2B page (/business) gets internal links to
 * these tools where the narrative naturally connects."
 */

import { LocaleLink } from '@/components/UI/LocaleLink';
import { useTranslation } from '@diboas/i18n/client';
import { BarChart3, Award } from '@/components/UI/LucideIcon';
import styles from './B2BToolsCallout.module.css';

export function B2BToolsCallout() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `landing-b2b.toolsCallout.${key}` });

  return (
    <aside className={styles.callout} aria-label={t('label')}>
      <p className={styles.label}>{t('label')}</p>
      <div className={styles.links}>
        <LocaleLink href="/tools/card-fees" className={styles.link} prefetch={false}>
          <BarChart3 size={20} strokeWidth={2} />
          <span>{t('cardFeesLink')}</span>
        </LocaleLink>
        <LocaleLink href="/tools/idle-cash" className={styles.link} prefetch={false}>
          <Award size={20} strokeWidth={2} />
          <span>{t('idleCashLink')}</span>
        </LocaleLink>
      </div>
    </aside>
  );
}
