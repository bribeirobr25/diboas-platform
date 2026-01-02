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
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Button } from '@diboas/ui';
import { useWaitingListModal } from '@/components/WaitingList';
import type { InteractiveDemoProps, DemoScreen, DemoState, DemoAnalyticsEvent } from './types';
import { useWaitlistStatus } from './hooks/useWaitlistStatus';
import { Screen5CTA } from './Screen5CTA';
import styles from './InteractiveDemo.module.css';

// Amount options (in EUR, will be converted for BRL)
const AMOUNT_OPTIONS = [5, 20, 50, 100];

// APY rate for calculations
const APY_RATE = 0.08;

// Initial balance for Screen 1
const INITIAL_BALANCE = 247.52;
const INITIAL_INTEREST = 1.24;

export function InteractiveDemo({
  locale = 'en',
  onComplete,
  onAnalyticsEvent,
  className = ''
}: InteractiveDemoProps) {
  const intl = useTranslation();
  const { openModal } = useWaitingListModal();

  // Check if user is on waitlist
  const { isOnWaitlist, saveStatus } = useWaitlistStatus();

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

  // Animation step for reward screen (0 = initial, 1-3 = progressive reveal)
  const [rewardStep, setRewardStep] = useState(0);

  // Animation timer ref
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Currency settings based on locale
  const isBrazil = locale === 'pt-BR';
  const isUS = locale === 'en';
  const currencySymbol = isBrazil ? 'R$' : isUS ? '$' : '€';
  const currencyMultiplier = isBrazil ? 6 : 1; // Approximate EUR to BRL (USD ~= EUR for demo)

  // Track analytics events
  const trackEvent = useCallback((event: DemoAnalyticsEvent, data?: Record<string, any>) => {
    onAnalyticsEvent?.(event, data);

    // Also track via gtag if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        event_category: 'interactive_demo',
        ...data
      });
    }
  }, [onAnalyticsEvent]);

  // Track demo start
  useEffect(() => {
    trackEvent('demo_start');
  }, [trackEvent]);

  // Navigate to next screen
  const goToScreen = useCallback((screen: DemoScreen) => {
    setState(prev => ({ ...prev, currentScreen: screen }));

    // Track screen transitions
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
    // Set final balance (no animation)
    setState(prev => ({ ...prev, animatedBalance: state.selectedAmount + 0.0012 }));
    goToScreen('reward');
  }, [state.selectedAmount, goToScreen, trackEvent]);

  // Reward screen animation - progressive reveal
  useEffect(() => {
    if (state.currentScreen === 'reward') {
      // Reset animation state
      setRewardStep(0);

      // Progressive reveal timing (ms)
      const timings = [800, 1600, 2400];
      const timeouts: NodeJS.Timeout[] = [];

      timings.forEach((delay, index) => {
        const timeout = setTimeout(() => {
          setRewardStep(index + 1);
        }, delay);
        timeouts.push(timeout);
      });

      // Cleanup timeouts on screen change or unmount
      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      // Reset when leaving reward screen
      setRewardStep(0);
    }
  }, [state.currentScreen]);

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
      // Call the actual waitlist API
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

        // Save to localStorage for persistent status
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
    } catch (error) {
      console.error('[InteractiveDemo] Signup error:', error);
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
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };

    if (platform === 'copy') {
      navigator.clipboard?.writeText(shareUrl);
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  }, [state.referralCode, trackEvent, intl]);

  // Format currency
  const formatCurrency = useCallback((value: number, decimals = 2) => {
    const adjustedValue = value * currencyMultiplier;
    return `${currencySymbol}${adjustedValue.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }, [currencySymbol, currencyMultiplier, locale]);

  // Calculate projected balance
  const projectedBalance = INITIAL_BALANCE * (1 + APY_RATE);
  const projectedInterest = INITIAL_BALANCE * APY_RATE;

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
        {/* Screen 1: Pain */}
        {state.currentScreen === 'pain' && (
          <div className={styles.screen}>
            <h2 className={styles.header}>
              {isBrazil
                ? intl.formatMessage({ id: 'landing-b2c.demo.pain.pixHeader' })
                : intl.formatMessage({ id: 'landing-b2c.demo.pain.header' })
              }
            </h2>
            <div className={styles.balanceDisplay}>
              {formatCurrency(INITIAL_BALANCE)}
            </div>
            <p className={styles.subtext}>
              {intl.formatMessage({ id: 'landing-b2c.demo.pain.subtext' }, { interest: formatCurrency(INITIAL_INTEREST) })}
            </p>
            <p className={styles.hook}>
              {intl.formatMessage({ id: 'landing-b2c.demo.pain.hook' })}
            </p>
            <Button
              variant="primary"
              size="lg"
              className={styles.ctaButton}
              onClick={() => goToScreen('hope')}
              aria-label={intl.formatMessage({ id: 'landing-b2c.demo.pain.cta' })}
            >
              {intl.formatMessage({ id: 'landing-b2c.demo.pain.cta' })}
            </Button>
          </div>
        )}

        {/* Screen 2: Hope */}
        {state.currentScreen === 'hope' && (
          <div className={styles.screen}>
            <h2 className={styles.header}>
              {intl.formatMessage({ id: 'landing-b2c.demo.hope.header' })}
            </h2>
            <div className={styles.comparisonContainer}>
              <div className={styles.startBalance}>
                {formatCurrency(INITIAL_BALANCE)}
              </div>
              <div className={styles.arrow}>↓</div>
              <p className={styles.projectionLabel}>
                {intl.formatMessage({ id: 'landing-b2c.demo.hope.projectionLabel' })}
              </p>
              <div className={styles.projectedBalance}>
                {formatCurrency(projectedBalance)}
              </div>
            </div>
            <p className={styles.comparison}>
              {intl.formatMessage({
                id: 'landing-b2c.demo.hope.comparison'
              }, {
                projected: formatCurrency(projectedInterest),
                current: formatCurrency(INITIAL_INTEREST)
              })}
            </p>
            <p className={styles.impact}>
              {intl.formatMessage({ id: 'landing-b2c.demo.hope.impact' })}
            </p>
            <Button
              variant="primary"
              size="lg"
              className={styles.ctaButton}
              onClick={() => goToScreen('action')}
            >
              {intl.formatMessage({ id: 'landing-b2c.demo.hope.cta' })}
            </Button>
          </div>
        )}

        {/* Screen 3: Action */}
        {state.currentScreen === 'action' && (
          <div className={styles.screen}>
            <h2 className={styles.header}>
              {intl.formatMessage({ id: 'landing-b2c.demo.action.header' })}
            </h2>
            <p className={styles.prompt}>
              {intl.formatMessage({ id: 'landing-b2c.demo.action.prompt' })}
            </p>
            <div className={styles.amountInput}>
              {formatCurrency(state.selectedAmount)}
            </div>
            <div className={styles.amountButtons} role="group" aria-label={intl.formatMessage({ id: 'common.accessibility.selectAmount' })}>
              {AMOUNT_OPTIONS.map(amount => (
                <button
                  key={amount}
                  type="button"
                  className={`${styles.amountButton} ${state.selectedAmount === amount ? styles.amountButtonSelected : ''}`}
                  onClick={() => selectAmount(amount)}
                  aria-pressed={state.selectedAmount === amount}
                >
                  {formatCurrency(amount, 0)}
                </button>
              ))}
            </div>
            <p className={styles.reassurance}>
              {intl.formatMessage({ id: 'landing-b2c.demo.action.reassurance1' })}
            </p>
            <p className={styles.reassurance}>
              {intl.formatMessage({ id: 'landing-b2c.demo.action.reassurance2' })}
            </p>
            <Button
              variant="primary"
              size="lg"
              className={styles.ctaButton}
              onClick={handleDeposit}
            >
              {intl.formatMessage({ id: 'landing-b2c.demo.action.cta' })}
            </Button>
          </div>
        )}

        {/* Screen 4: Reward */}
        {state.currentScreen === 'reward' && (
          <div className={styles.screen}>
            <h2 className={styles.header}>
              {intl.formatMessage({ id: 'landing-b2c.demo.reward.header' })}
            </h2>
            {/* Progressive balance reveal */}
            <div className={styles.balanceProgression}>
              {/* Initial balance - always visible */}
              <span className={styles.smallBalance}>{formatCurrency(state.selectedAmount, 2)}</span>

              {/* Step 1: First growth */}
              {rewardStep >= 1 && (
                <>
                  <span className={`${styles.smallArrow} ${styles.fadeIn}`}>↓</span>
                  <span className={`${styles.smallBalance} ${styles.fadeIn}`}>
                    {formatCurrency(state.selectedAmount + 0.0003, 4)}
                  </span>
                </>
              )}

              {/* Step 2: Second growth */}
              {rewardStep >= 2 && (
                <>
                  <span className={`${styles.smallArrow} ${styles.fadeIn}`}>↓</span>
                  <span className={`${styles.smallBalance} ${styles.fadeIn}`}>
                    {formatCurrency(state.selectedAmount + 0.0007, 4)}
                  </span>
                </>
              )}

              {/* Step 3: Final growth indicator */}
              {rewardStep >= 3 && (
                <span className={`${styles.smallArrow} ${styles.fadeIn}`}>↓</span>
              )}
            </div>

            {/* Final value - revealed at step 3 */}
            {rewardStep >= 3 && (
              <div className={`${styles.finalBalance} ${styles.fadeIn}`}>
                {formatCurrency(state.animatedBalance, 4)}
              </div>
            )}

            {/* Delight message - revealed at step 3 */}
            {rewardStep >= 3 && (
              <p className={`${styles.delight} ${styles.fadeIn}`}>
                {intl.formatMessage({
                  id: 'landing-b2c.demo.reward.delight'
                }, {
                  earned: formatCurrency(0.0012, 4)
                })}
              </p>
            )}

            <p className={styles.vision}>
              {intl.formatMessage({ id: 'landing-b2c.demo.reward.vision' })}
            </p>
            <Button
              variant="primary"
              size="lg"
              className={styles.ctaButton}
              onClick={() => {
                trackEvent('demo_reward_continue_click');
                openModal();
              }}
            >
              {intl.formatMessage({ id: 'landing-b2c.demo.reward.continueCta' })}
            </Button>
          </div>
        )}

        {/* Screen 5: Invitation */}
        {state.currentScreen === 'invitation' && (
          <div className={styles.screen}>
            <h2 className={styles.header}>
              {intl.formatMessage({ id: 'landing-b2c.demo.invitation.header' })}
            </h2>
            <p className={styles.subheader}>
              {intl.formatMessage({ id: 'landing-b2c.demo.invitation.subheader' })}
            </p>
            <p className={styles.callToAction}>
              {intl.formatMessage({ id: 'landing-b2c.demo.invitation.callToAction' })}
            </p>

            {/* Conditional CTA based on user waitlist status */}
            {isOnWaitlist ? (
              <Screen5CTA
                isOnWaitlist={true}
                onJoinWaitlist={() => {
                  trackEvent('demo_waitlist_click');
                  openModal();
                }}
                onTryDreamMode={() => {
                  trackEvent('demo_dream_mode_click');
                  // Navigate to Dream Mode
                  window.location.hash = 'dream-mode';
                }}
                onExplore={() => {
                  trackEvent('demo_explore_click');
                  // Navigate to features/learn section
                  const featuresSection = document.getElementById('features');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = `/${locale}/learn/overview`;
                  }
                }}
              />
            ) : (
              <>
                <form onSubmit={handleSubmit} className={styles.signupForm}>
                  <label htmlFor="demo-email" className="sr-only">
                    {intl.formatMessage({ id: 'landing-b2c.demo.invitation.emailPlaceholder' })}
                  </label>
                  <input
                    id="demo-email"
                    type="email"
                    className={styles.emailInput}
                    placeholder={intl.formatMessage({ id: 'landing-b2c.demo.invitation.emailPlaceholder' })}
                    value={state.email}
                    onChange={handleEmailChange}
                    onFocus={handleEmailFocus}
                    required
                    aria-required="true"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className={`${styles.ctaButton} ${styles.submitButton}`}
                    disabled={state.isSubmitting}
                    loading={state.isSubmitting}
                    aria-label={intl.formatMessage({ id: 'landing-b2c.demo.invitation.submitButton' })}
                    onClick={() => trackEvent('demo_waitlist_click')}
                  >
                    {intl.formatMessage({ id: 'landing-b2c.demo.invitation.submitButton' })}
                  </Button>
                </form>
                <ul className={styles.trustPoints}>
                  <li>{intl.formatMessage({ id: 'landing-b2c.demo.invitation.trustPoint1' })}</li>
                  <li>{intl.formatMessage({ id: 'landing-b2c.demo.invitation.trustPoint2' })}</li>
                  <li>{intl.formatMessage({ id: 'landing-b2c.demo.invitation.trustPoint3' })}</li>
                </ul>
              </>
            )}
          </div>
        )}

        {/* Screen 6: Success */}
        {state.currentScreen === 'success' && (
          <div className={styles.screen}>
            <h2 className={styles.header}>
              {intl.formatMessage({ id: 'landing-b2c.demo.success.header' })}
            </h2>
            <p className={styles.position}>
              {intl.formatMessage({
                id: 'landing-b2c.demo.success.positionLabel'
              }, {
                position: state.waitlistPosition
              })}
            </p>
            <div className={styles.referralSection}>
              <h3 className={styles.incentiveHeader}>
                {intl.formatMessage({ id: 'landing-b2c.demo.success.incentiveHeader' })}
              </h3>
              <p className={styles.incentiveMechanic}>
                {intl.formatMessage({ id: 'landing-b2c.demo.success.incentiveMechanic' })}
              </p>
              <div className={styles.linkBox}>
                <span className={styles.linkBoxLabel}>
                  {intl.formatMessage({ id: 'landing-b2c.demo.success.linkBoxLabel' })}
                </span>
                <code className={styles.referralLink}>
                  diboas.com/invite/{state.referralCode}
                </code>
              </div>
            </div>
            <p className={styles.shareLabel}>
              {intl.formatMessage({ id: 'landing-b2c.demo.success.shareLabel' })}
            </p>
            <div className={styles.shareButtons} role="group" aria-label={intl.formatMessage({ id: 'common.accessibility.shareOptions' })}>
              <button type="button" className={styles.socialButton} onClick={() => handleShare('twitter')} aria-label={intl.formatMessage({ id: 'common.accessibility.shareOnTwitter' })}>
                Twitter
              </button>
              <button type="button" className={styles.socialButton} onClick={() => handleShare('whatsapp')} aria-label={intl.formatMessage({ id: 'common.accessibility.shareOnWhatsapp' })}>
                WhatsApp
              </button>
              <button type="button" className={styles.socialButton} onClick={() => handleShare('linkedin')} aria-label={intl.formatMessage({ id: 'common.accessibility.shareOnLinkedin' })}>
                LinkedIn
              </button>
              <button type="button" className={styles.socialButton} onClick={() => handleShare('copy')} aria-label={intl.formatMessage({ id: 'common.accessibility.copyReferralLink' })}>
                {intl.formatMessage({ id: 'landing-b2c.demo.success.copyLink' })}
              </button>
            </div>

            {/* Dream Mode CTA - for users who completed waitlist signup */}
            <div className={styles.dreamModeSection}>
              <h3 className={styles.dreamModeHeader}>
                {intl.formatMessage({ id: 'landing-b2c.demo.success.dreamModeHeader' })}
              </h3>
              <Button
                variant="secondary"
                size="lg"
                className={styles.dreamModeButton}
                onClick={() => {
                  trackEvent('demo_dream_mode_click');
                  // Navigate to Dream Mode page
                  window.location.href = `/${locale}/dream-mode`;
                }}
              >
                {intl.formatMessage({ id: 'landing-b2c.demo.success.dreamModeCta' })}
              </Button>
            </div>

            {/* Calculator suggestion - EP3 */}
            <div className={styles.calculatorSuggestion}>
              <button
                type="button"
                className={styles.calculatorLink}
                onClick={() => {
                  trackEvent('demo_calculator_click');
                  // Scroll to calculator section
                  const calculatorSection = document.getElementById('calculator');
                  if (calculatorSection) {
                    calculatorSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {intl.formatMessage({ id: 'landing-b2c.demo.success.calculatorSuggestion' })}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InteractiveDemo;
