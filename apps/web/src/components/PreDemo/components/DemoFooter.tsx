'use client';

import { useTranslation } from '@diboas/i18n/client';
import styles from '../PreDemo.module.css';

export function DemoFooter() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: key });

  return (
    <footer className={styles.demoFooter}>
      <p className={styles.demoFooterDisclaimer}>{t('preDemo.footer.disclaimer')}</p>
      <p className={styles.demoFooterCopyright}>{t('preDemo.footer.copyright')}</p>
    </footer>
  );
}
