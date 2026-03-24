'use client';

import { useTranslation } from '@diboas/i18n/client';
import { DemoFooter } from '../components/DemoFooter';
import styles from '../PreDemo.module.css';

interface ProcessingScreenProps {
  variant: 'processing' | 'success';
  title: string;
  subtitle: string;
}

export function ProcessingScreen({ variant, title, subtitle }: ProcessingScreenProps) {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: key });

  return (
    <div className={styles.screen}>
      <div className={`${styles.screenCenter} ${styles.screenCenterFlex}`}>
        <div className={styles.screenCard}>
          {variant === 'processing' ? (
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner} />
            </div>
          ) : (
            <div className={styles.successIcon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          )}

          <h1 className={styles.screenTitle}>{title}</h1>
          <p className={styles.screenSubtitle}>{subtitle}</p>
        </div>
      </div>

      <DemoFooter />
    </div>
  );
}
