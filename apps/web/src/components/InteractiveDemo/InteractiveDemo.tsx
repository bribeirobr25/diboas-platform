'use client';

/**
 * InteractiveDemo Component
 *
 * A 5-screen interactive demo that guides users through the emotional journey
 * of growing their money with diBoaS.
 *
 * Flow:
 * 1. Pain - Show current low interest
 * 2. Hope - Show potential growth
 * 3. Action - Select deposit amount
 * 4. Reward - Animated counter showing growth
 * 5. Invitation - Waitlist signup
 * 6. Success - Thank you with share options
 *
 * Refactored: Screens and hooks extracted for maintainability
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import type { InteractiveDemoProps, DemoScreen, DemoState, DemoAnalyticsEvent } from './types';
import { useWaitlistStatus, useDemoAnalytics, useCurrency, useRewardAnimation } from './hooks';
import { GROWTH_STEPS } from './constants';
import {
  PainScreen,
  HopeScreen,
  ActionScreen,
  RewardScreen,
  InvitationScreen,
  SuccessScreen,
} from './screens';
import styles from './InteractiveDemo.module.css';

export function InteractiveDemo({
  locale = 'en',
  onComplete,
  onAnalyticsEvent,
  className = ''
}: InteractiveDemoProps) {
  const intl = useTranslation();

  // Check if user is on waitlist
  const { isOnWaitlist, saveStatus } = useWaitlistStatus();

  // Analytics tracking
  const { trackEvent } = useDemoAnalytics({ onAnalyticsEvent });

  // Currency formatting
  const { isBrazil, formatCurrency } = useCurrency({ locale });

  // Demo state
  const [state, setState] = useState<DemoState>({
    currentScreen: 'pain',
    selectedAmount: 50,
    animatedBalance: 50,
    email: '',
    isSubmitting: false,
    waitlistPosition: null,
    referralCode: null
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
      invitation: 'demo_screen_5',
      success: null
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

  // Handle email change
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, email: e.target.value }));
  }, []);

  // Handle email focus
  const handleEmailFocus = useCallback(() => {
    trackEvent('demo_signup_start');
  }, [trackEvent]);

  // Handle form submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email || state.isSubmitting) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email,
          locale,
          gdprAccepted: true,
          source: 'interactive_demo',
        }),
      });

      const data = await response.json();

      if (data.success || data.errorCode === 'ALREADY_REGISTERED') {
        const position = data.position;
        const code = data.referralCode;

        setState(prev => ({
          ...prev,
          isSubmitting: false,
          waitlistPosition: position,
          referralCode: code
        }));

        saveStatus({
          email: state.email,
          position,
          referralCode: code,
        });

        trackEvent('demo_signup_complete', { position });
        goToScreen('success');
        onComplete?.();
      } else {
        throw new Error(data.error || 'Signup failed');
      }
    } catch {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state.email, state.isSubmitting, locale, goToScreen, trackEvent, onComplete, saveStatus]);

  // Handle share
  const handleShare = useCallback((platform: string) => {
    trackEvent('demo_share_click', { platform });

    const shareUrl = state.referralCode
      ? `https://diboas.com/invite/${state.referralCode}`
      : 'https://diboas.com';

    const shareText = intl.formatMessage({ id: 'landing-b2c.demo.success.prewrittenMessage' });

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };

    if (platform === 'copy') {
      navigator.clipboard?.writeText(shareUrl);
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  }, [state.referralCode, trackEvent, intl]);

  // Progress indicator
  const screens: DemoScreen[] = ['pain', 'hope', 'action', 'reward', 'invitation'];
  const currentIndex = screens.indexOf(state.currentScreen);
  const progress = state.currentScreen === 'success' ? 100 : ((currentIndex + 1) / screens.length) * 100;

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
            formatCurrency={formatCurrency}
            onContinue={() => goToScreen('action')}
            t={t}
          />
        )}

        {state.currentScreen === 'action' && (
          <ActionScreen
            selectedAmount={state.selectedAmount}
            formatCurrency={formatCurrency}
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
            formatCurrency={formatCurrency}
            onContinue={() => {
              trackEvent('demo_reward_continue_click');
              scrollToWaitlist();
            }}
            t={t}
          />
        )}

        {state.currentScreen === 'invitation' && (
          <InvitationScreen
            isOnWaitlist={isOnWaitlist}
            email={state.email}
            isSubmitting={state.isSubmitting}
            locale={locale}
            onEmailChange={handleEmailChange}
            onEmailFocus={handleEmailFocus}
            onSubmit={handleSubmit}
            onJoinWaitlist={() => {
              trackEvent('demo_waitlist_click');
              scrollToWaitlist();
            }}
            onTryDreamMode={() => {
              trackEvent('demo_dream_mode_click');
              window.location.hash = 'dream-mode';
            }}
            onExplore={() => {
              trackEvent('demo_explore_click');
              const featuresSection = document.getElementById('features');
              if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = `/${locale}/learn/overview`;
              }
            }}
            t={t}
          />
        )}

        {state.currentScreen === 'success' && (
          <SuccessScreen
            waitlistPosition={state.waitlistPosition}
            referralCode={state.referralCode}
            locale={locale}
            onShare={handleShare}
            onDreamModeClick={() => {
              trackEvent('demo_dream_mode_click');
              window.location.href = `/${locale}/dream-mode`;
            }}
            onCalculatorClick={() => {
              trackEvent('demo_calculator_click');
              const calculatorSection = document.getElementById('calculator');
              if (calculatorSection) {
                calculatorSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

export default InteractiveDemo;
