'use client';

/**
 * CvmBanner
 *
 * PT-BR only: Renders 3 CVM mandatory warnings above the Hero.
 * Non-dismissable, always visible for Brazilian users.
 */

import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import styles from './StrategiesPageContent.module.css';

interface CvmBannerProps {
  namespace: string;
}

export function CvmBanner({ namespace }: CvmBannerProps) {
  const { locale } = useLocale();
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${namespace}.${key}` });

  if (locale !== 'pt-BR') return null;

  return (
    <div className={styles.cvmBanner} role="alert">
      <p>{t('cvmWarnings.warning1')}</p>
      <p>{t('cvmWarnings.warning2')}</p>
      <p>{t('cvmWarnings.warning3')}</p>
    </div>
  );
}
