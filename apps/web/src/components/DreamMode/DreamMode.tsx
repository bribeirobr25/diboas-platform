'use client';

/**
 * Dream Mode Component
 *
 * Main component that orchestrates the dream simulation flow with CLO compliance
 * Flow: disclaimer → welcome → pathSelect → input → timeframe → simulation → results → share
 */

import React, { useEffect } from 'react';
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
  /** Callback when user wants to join waitlist */
  onJoinWaitlist?: () => void;
  /** Callback when user closes dream mode */
  onClose?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * Inner component that renders the current screen
 */
function DreamModeContent({ onJoinWaitlist, onClose }: { onJoinWaitlist?: () => void; onClose?: () => void }) {
  const { state } = useDreamMode();

  // Track screen views
  useEffect(() => {
    analyticsService.track({
      name: 'dream_mode_screen_view',
      parameters: { screen: state.screen },
    });
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
        return <ShareScreen onJoinWaitlist={onJoinWaitlist} />;
      default:
        return <DisclaimerScreen />;
    }
  };

  return (
    <div className={styles.container}>
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
  onJoinWaitlist,
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
        <DreamModeContent onJoinWaitlist={onJoinWaitlist} onClose={onClose} />
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
