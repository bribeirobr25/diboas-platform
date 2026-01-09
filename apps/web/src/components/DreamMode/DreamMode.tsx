'use client';

/**
 * Dream Mode Component
 *
 * Main component that orchestrates the dream simulation flow with CLO compliance
 * Flow: disclaimer → welcome → pathSelect → input → timeframe → simulation → results → share
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { DreamModeProvider, useDreamMode } from './DreamModeProvider';
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

  // Focus trap implementation for WCAG 2.2 compliance
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, [onClose]);

  // Focus first element on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [state.screen]);

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
      onKeyDown={handleKeyDown}
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
