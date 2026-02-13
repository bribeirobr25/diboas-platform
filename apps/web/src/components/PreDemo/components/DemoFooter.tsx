'use client';

import { useTranslation } from '@diboas/i18n/client';
import styles from '../PreDemo.module.css';

export function DemoFooter() {
  const intl = useTranslation();

  return (
    <footer className={styles.demoFooter}>
      <p className={styles.demoFooterDisclaimer}>
        {intl.formatMessage({
          id: 'preDemo.footer.disclaimer',
          defaultMessage: 'This is a demo environment. No real money or data is used. All features shown might be available in the full product.',
        })}
      </p>
      <p className={styles.demoFooterCopyright}>
        {intl.formatMessage({
          id: 'preDemo.footer.copyright',
          defaultMessage: '© 2026 diBoaS · Your money, your control',
        })}
      </p>
    </footer>
  );
}
