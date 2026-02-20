'use client';

/**
 * Dream Mode Component
 *
 * Main component that orchestrates the dream simulation flow with CLO compliance
 * Flow: disclaimer → welcome → pathSelect → input → timeframe → simulation → results → share
 */

import React, { useEffect, useRef } from 'react';
import { DreamModeProvider, useDreamMode } from './DreamModeProvider';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  DisclaimerScreen,
  WelcomeScreen,
  PathSelectorScreen,
  InputScreen,
  TimeframeScreen,
  SimulationScreen,
  ResultsScreen,
  ShareScreen,
} from './screens';
import { SimulationWatermark } from './components';
import type { DreamInput } from './types';
import { analyticsService } from '@/lib/analytics';
import styles from './DreamMode.module.css';

interface DreamModeProps {
  /** Initial input values */
  initialInput?: Partial<DreamInput>;
  /** Callback when dream mode completes */
  onComplete?: () => void;
  /** Callback when user closes dream mode */
  onClose?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * Inner component that renders the current screen
 */
function DreamModeContent({ onClose }: { onClose?: () => void }) {
  const { state } = useDreamMode();
  const containerRef = useRef<HTMLDivElement>(null);

  // Track screen views
  useEffect(() => {
    analyticsService.track({
      name: 'dream_mode_screen_view',
      parameters: { screen: state.screen },
    });
  }, [state.screen]);

  // WCAG 2.4.3: Focus trap via shared hook (replaces inline implementation)
  useFocusTrap(containerRef, true, { returnFocus: true });

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const renderScreen = () => {
    switch (state.screen) {
      case 'disclaimer':
        return <DisclaimerScreen />;
      case 'welcome':
        return <WelcomeScreen />;
      case 'pathSelect':
        return <PathSelectorScreen />;
      case 'input':
        return <InputScreen />;
      case 'timeframe':
        return <TimeframeScreen />;
      case 'simulation':
        return <SimulationScreen />;
      case 'results':
        return <ResultsScreen />;
      case 'share':
        return <ShareScreen />;
      default:
        return <DisclaimerScreen />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="dialog"
      aria-modal="true"
      aria-label="Dream Mode Calculator"
    >
      {/* CLO-required simulation watermark - shows after disclaimer accepted */}
      {state.disclaimerAccepted && <SimulationWatermark />}

      {/* Close button */}
      {onClose && (
        <button onClick={onClose} className={styles.closeButton} aria-label="Close Dream Mode">
          <CloseIcon />
        </button>
      )}

      {/* Screen content */}
      <div className={styles.screenContainer}>{renderScreen()}</div>
    </div>
  );
}

/**
 * Dream Mode Component with Provider
 */
export function DreamMode({
  initialInput,
  onComplete,
  onClose,
  className = '',
}: DreamModeProps) {
  useEffect(() => {
    analyticsService.track({
      name: 'dream_mode_started',
      parameters: { source: 'component' },
    });
  }, []);

  return (
    <div className={className}>
      <DreamModeProvider initialInput={initialInput} onComplete={onComplete}>
        <DreamModeContent onClose={onClose} />
      </DreamModeProvider>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
