'use client';

/**
 * StrategyDisclaimers
 *
 * Renders 7 footer disclaimer blocks with locale-conditional logic.
 * Pattern follows MinimalFooter's getDisclosureKeysForLocale().
 */

import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'marketing.pages.strategies';

/**
 * Returns the ordered list of footer disclaimer keys for the current locale.
 *
 * - disclaimer: all locales
 * - micaArticle68: EN, DE, ES only (NOT PT-BR)
 * - micaArticle7: EN, DE, ES only (NOT PT-BR)
 * - aiDisclosure: all locales
 * - usDisclosure: EN only
 * - fictionalResults: all locales
 * - professionalAdvice: all locales
 */
function getDisclaimerKeysForLocale(locale: string): string[] {
  const keys: string[] = ['footer.disclaimer'];

  if (['en', 'de', 'es'].includes(locale)) {
    keys.push('footer.micaArticle68');
    keys.push('footer.micaArticle7');
  }

  keys.push('footer.aiDisclosure');

  if (locale === 'en') {
    keys.push('footer.usDisclosure');
  }

  keys.push('footer.fictionalResults');
  keys.push('footer.professionalAdvice');

  return keys;
}

export function StrategyDisclaimers() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  const { locale } = useLocale();
  const disclaimerKeys = getDisclaimerKeysForLocale(locale);

  return (
    <div className={styles.disclaimersSection}>
      {disclaimerKeys.map((key) => (
        <p key={key} className={styles.disclaimerText}>
          {t(key)}
        </p>
      ))}
    </div>
  );
}
