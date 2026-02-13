'use client';

import { useTranslation } from '@diboas/i18n/client';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import styles from '../PreDemo.module.css';

interface LoadingScreenProps {
  title: string;
  subtitle: string;
  checkmarks?: string[];
  showAvatar?: boolean;
}

export function LoadingScreen({ title, subtitle, checkmarks, showAvatar = false }: LoadingScreenProps) {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: key });

  return (
    <div className={styles.screen}>
      <DemoHeader showAvatar={showAvatar} />

      <div className={styles.screenCenter} style={{ flex: 1 }}>
        <div className={styles.screenCard}>
          {/* Spinner */}
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner} />
          </div>

          {/* Title */}
          <h1 className={styles.screenTitle}>{title}</h1>
          <p className={styles.screenSubtitle}>{subtitle}</p>

          {/* Optional checkmarks with SVG icons */}
          {checkmarks && checkmarks.length > 0 && (
            <div className={styles.checkmarkList}>
              {checkmarks.map((step, index) => (
                <div key={index} className={styles.checkmarkItem}>
                  <span className={styles.checkmarkIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DemoFooter />
    </div>
  );
}
