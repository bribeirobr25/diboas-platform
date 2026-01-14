'use client';

/**
 * InteractiveDemo Component
 *
 * A 4-screen interactive demo that guides users through the emotional journey
 * of growing their money with diBoaS.
 *
 * Flow:
 * 1. Pain - Show current low interest
 * 2. Hope - Show potential growth
 * 3. Action - Select deposit amount
 * 4. Reward - Animated counter showing growth (final screen, scrolls to waitlist)
 *
 * Refactored: Screens and hooks extracted for maintainability
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import type { InteractiveDemoProps, DemoScreen, DemoState, DemoAnalyticsEvent } from './types';
import { useDemoAnalytics, useCurrency, useRewardAnimation } from './hooks';
import { GROWTH_STEPS } from './constants';
import {
  PainScreen,
  HopeScreen,
  ActionScreen,
  RewardScreen,
} from './screens';
import styles from './InteractiveDemo.module.css';

export function InteractiveDemo({
  locale = 'en',
  onComplete,
  onAnalyticsEvent,
  className = ''
}: InteractiveDemoProps) {
  const intl = useTranslation();

  // Analytics tracking
  const { trackEvent } = useDemoAnalytics({ onAnalyticsEvent });

  // Currency formatting
  const { isBrazil, formatCurrency, formatCurrencyRaw } = useCurrency({ locale });

  // Demo state
  const [state, setState] = useState<DemoState>({
    currentScreen: 'pain',
    selectedAmount: 50,
    animatedBalance: 50,
  });

  // Reward animation
  const { rewardStep } = useRewardAnimation(state.currentScreen);

  // Helper for i18n
  const t = useCallback((id: string, values?: Record<string, string | number | null>) => {
    return intl.formatMessage({ id }, values);
  }, [intl]);

  // Scroll to waitlist section
  const scrollToWaitlist = useCallback(() => {
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Navigate to screen
  const goToScreen = useCallback((screen: DemoScreen) => {
    setState(prev => ({ ...prev, currentScreen: screen }));

    const screenEvents: Record<DemoScreen, DemoAnalyticsEvent | null> = {
      pain: null,
      hope: 'demo_screen_2',
      action: 'demo_screen_3',
      reward: 'demo_screen_4',
    };

    const event = screenEvents[screen];
    if (event) {
      trackEvent(event);
    }
  }, [trackEvent]);

  // Select amount
  const selectAmount = useCallback((amount: number) => {
    setState(prev => ({ ...prev, selectedAmount: amount, animatedBalance: amount }));
    trackEvent('demo_amount_select', { amount });
  }, [trackEvent]);

  // Handle deposit click
  const handleDeposit = useCallback(() => {
    trackEvent('demo_deposit_click', { amount: state.selectedAmount });
    setState(prev => ({ ...prev, animatedBalance: state.selectedAmount + GROWTH_STEPS[2] }));
    goToScreen('reward');
  }, [state.selectedAmount, goToScreen, trackEvent]);

  // Progress indicator
  const screens: DemoScreen[] = ['pain', 'hope', 'action', 'reward'];
  const currentIndex = screens.indexOf(state.currentScreen);
  const progress = ((currentIndex + 1) / screens.length) * 100;

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Screen content */}
      <div className={styles.screenContainer}>
        {state.currentScreen === 'pain' && (
          <PainScreen
            isBrazil={isBrazil}
            formatCurrency={formatCurrency}
            onContinue={() => goToScreen('hope')}
            t={t}
          />
        )}

        {state.currentScreen === 'hope' && (
          <HopeScreen
            isBrazil={isBrazil}
            formatCurrency={formatCurrency}
            onContinue={() => goToScreen('action')}
            t={t}
          />
        )}

        {state.currentScreen === 'action' && (
          <ActionScreen
            isBrazil={isBrazil}
            selectedAmount={state.selectedAmount}
            formatCurrencyRaw={formatCurrencyRaw}
            onSelectAmount={selectAmount}
            onDeposit={handleDeposit}
            t={t}
          />
        )}

        {state.currentScreen === 'reward' && (
          <RewardScreen
            selectedAmount={state.selectedAmount}
            animatedBalance={state.animatedBalance}
            rewardStep={rewardStep}
            formatCurrencyRaw={formatCurrencyRaw}
            onContinue={() => {
              trackEvent('demo_reward_continue_click');
              scrollToWaitlist();
              onComplete?.();
            }}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

export default InteractiveDemo;
