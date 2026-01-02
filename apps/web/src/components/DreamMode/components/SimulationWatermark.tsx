'use client';

/**
 * Simulation Watermark Component
 *
 * CLO-required watermark that appears on all Dream Mode screens
 * after the disclaimer is accepted
 */

import React from 'react';
import { useIntl } from 'react-intl';
import { AlertTriangleIcon } from '@/components/Icons';
import styles from './SimulationWatermark.module.css';

interface SimulationWatermarkProps {
  /** Custom class name */
  className?: string;
}

export function SimulationWatermark({ className = '' }: SimulationWatermarkProps) {
  const intl = useIntl();

  const watermarkText = intl.formatMessage({ id: 'dreamMode.watermark' });

  return (
    <div className={`${styles.watermark} ${className}`} aria-label="Simulation mode indicator">
      <AlertTriangleIcon size={16} className={styles.icon} />
      <span className={styles.text}>{watermarkText}</span>
    </div>
  );
}

export default SimulationWatermark;
