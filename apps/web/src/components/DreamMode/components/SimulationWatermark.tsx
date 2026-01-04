'use client';

/**
 * Simulation Watermark Component
 *
 * CLO-required watermark that appears on all Dream Mode screens
 * after the disclaimer is accepted
 *
 * Service Agnostic Abstraction: Uses centralized translation hook
 * Code Reusability & DRY: No inline translation helpers
 */

import React from 'react';
import { useDreamModeTranslation } from '../hooks';
import { AlertTriangleIcon } from '@/components/Icons';
import styles from './SimulationWatermark.module.css';

interface SimulationWatermarkProps {
  /** Custom class name */
  className?: string;
}

export function SimulationWatermark({ className = '' }: SimulationWatermarkProps) {
  const { tRoot } = useDreamModeTranslation();

  const watermarkText = tRoot('watermark');

  return (
    <div className={`${styles.watermark} ${className}`} aria-label="Simulation mode indicator">
      <AlertTriangleIcon size={16} className={styles.icon} />
      <span className={styles.text}>{watermarkText}</span>
    </div>
  );
}

export default SimulationWatermark;
