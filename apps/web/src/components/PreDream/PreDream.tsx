'use client';

/**
 * PreDream Component
 *
 * Main orchestrator for the Dream Mode within the Demo flow
 * Wraps Provider + screen switch + close handler
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { PreDreamProvider, usePreDream } from './PreDreamProvider';
import {
  DisclaimerScreen,
  WelcomeScreen,
  PathSelectorScreen,
  InputScreen,
  TimeframeScreen,
  SimulationScreen,
  ResultsScreen,
} from './screens';
import { analyticsService } from '@/lib/analytics';
import styles from './PreDream.module.css';

interface PreDreamProps {
  onClose?: () => void;
  onBackToHome?: () => void;
}

function PreDreamContent({ onClose, onBackToHome }: PreDreamProps) {
  const intl = useTranslation();
  const { state } = usePreDream();
  const containerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while dream mode is active — prevents underlying
  // page from intercepting touch events on the fixed overlay (iOS)
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // WCAG 2.4.3: Trap focus within dream mode overlay
  useFocusTrap(containerRef, true, { returnFocus: true });

  // Track screen views
  useEffect(() => {
    analyticsService.track({
      name: 'pre_dream_screen_view',
      parameters: { screen: state.screen },
    });
  }, [state.screen]);

  // Escape key to close
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  // Focus first element on screen change
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
        return <ResultsScreen onBackToHome={onBackToHome} />;
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
      aria-label={intl.formatMessage({ id: 'common.accessibility.dreamMode' })}
      onKeyDown={handleKeyDown}
    >
      {/* Close button */}
      {onClose && (
        <button onClick={onClose} className={styles.closeButton} aria-label={intl.formatMessage({ id: 'common.accessibility.closeDreamMode' })}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <div className={styles.screenContainer}>{renderScreen()}</div>
    </div>
  );
}

export function PreDream({ onClose, onBackToHome }: PreDreamProps) {
  return (
    <PreDreamProvider>
      <PreDreamContent onClose={onClose} onBackToHome={onBackToHome} />
    </PreDreamProvider>
  );
}
