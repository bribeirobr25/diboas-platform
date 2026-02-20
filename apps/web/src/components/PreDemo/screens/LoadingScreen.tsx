'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import styles from '../PreDemo.module.css';

/** Delay before the first checkmark appears (ms) */
const CHECKMARK_INITIAL_DELAY = 600;
/** Delay between each subsequent checkmark (ms) */
const CHECKMARK_STAGGER = 500;

interface LoadingScreenProps {
  title: string;
  subtitle: string;
  checkmarks?: string[];
  showAvatar?: boolean;
}

export function LoadingScreen({ title, subtitle, checkmarks, showAvatar = false }: LoadingScreenProps) {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: key });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!checkmarks || checkmarks.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    checkmarks.forEach((_, index) => {
      const delay = CHECKMARK_INITIAL_DELAY + index * CHECKMARK_STAGGER;
      timers.push(setTimeout(() => setVisibleCount(index + 1), delay));
    });

    return () => timers.forEach(clearTimeout);
  }, [checkmarks]);

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

          {/* Optional checkmarks with SVG icons — revealed progressively */}
          {checkmarks && checkmarks.length > 0 && (
            <div className={styles.checkmarkList}>
              {checkmarks.map((step, index) => (
                <div
                  key={step}
                  className={`${styles.checkmarkItem} ${index < visibleCount ? styles.checkmarkVisible : styles.checkmarkHidden}`}
                >
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
