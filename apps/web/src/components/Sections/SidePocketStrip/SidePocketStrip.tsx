'use client';

import { memo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import styles from './SidePocketStrip.module.css';

interface SidePocketStripProps {
  enableAnalytics?: boolean;
  className?: string;
}

export const SidePocketStrip = memo(function SidePocketStrip({
  className = '',
}: SidePocketStripProps) {
  const intl = useTranslation();

  const text = intl.formatMessage({ id: 'landing-b2c.sidePocket.text' });
  const ariaLabel = intl.formatMessage({ id: 'landing-b2c.sections.sidePocket.ariaLabel' });

  return (
    <section
      className={`${styles.strip} ${className}`}
      aria-label={ariaLabel}
    >
      <p className={styles.text}>{text}</p>
    </section>
  );
});

SidePocketStrip.displayName = 'SidePocketStrip';
