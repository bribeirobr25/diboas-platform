'use client';

/**
 * PreDemo Component
 *
 * Main orchestrator for the interactive demo flow.
 * Wraps Provider + screen switch. When screen = 'dream-mode', renders <PreDream>.
 *
 * Timer sequences (login flow, transaction processing) are owned here via
 * useScreenTransitionSequence — this component persists across screen changes,
 * so timers survive child component unmounts.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { PreDemoProvider, usePreDemo } from './PreDemoProvider';
import {
  LoginScreen,
  LoadingScreen,
  HomeScreen,
  DepositScreen,
  SendScreen,
  BuyScreen,
  ConfirmationScreen,
  ProcessingScreen,
  WalletDetailsScreen,
} from './screens';
import dynamic from 'next/dynamic';

// Lazy-load PreDream — only rendered when user enters dream-mode (interaction-gated)
const PreDream = dynamic(
  () => import('@/components/PreDream').then(m => ({ default: m.PreDream })),
  { ssr: false, loading: () => null }
);
import { useTranslation } from '@diboas/i18n/client';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useScreenTransitionSequence } from './hooks';
import styles from './PreDemo.module.css';

interface PreDemoProps {
  onExit?: () => void;
}

function PreDemoContent({ onExit }: PreDemoProps) {
  const intl = useTranslation();
  const { state, setScreen } = usePreDemo();
  const containerRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => intl.formatMessage({ id: key });

  // Timer sequence hook — persists across screen changes
  const { runSequence } = useScreenTransitionSequence(setScreen);

  // WCAG 2.4.3: Trap focus within demo when active (not in dream-mode)
  const isActive = state.screen !== 'dream-mode';
  useFocusTrap(containerRef, isActive, { returnFocus: true });

  // Escape key to exit demo
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onExit) {
      onExit();
    }
  }, [onExit]);

  // Focus management on screen change — prefer [data-autofocus] elements
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const autoFocusEl = container.querySelector<HTMLElement>('[data-autofocus]');
    if (autoFocusEl) {
      autoFocusEl.focus();
      return;
    }

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [state.screen]);

  // Handle Dream Mode close -> exit demo entirely, back to landing page
  const handleDreamClose = useCallback(() => {
    onExit?.();
  }, [onExit]);

  const renderScreen = () => {
    switch (state.screen) {
      case 'login':
        return <LoginScreen onExit={onExit} runSequence={runSequence} />;

      case 'creating-account':
        return (
          <LoadingScreen
            title={t('preDemo.loading.creatingAccount')}
            subtitle={t('preDemo.loading.creatingAccountSubtitle')}
            checkmarks={[
              t('preDemo.loading.checkIdentity'),
              t('preDemo.loading.checkCompliance'),
            ]}
            showAvatar={false}
          />
        );

      case 'creating-wallet':
        return (
          <LoadingScreen
            title={t('preDemo.loading.creatingWallet')}
            subtitle={t('preDemo.loading.creatingWalletSubtitle')}
            checkmarks={[
              t('preDemo.loading.checkIdentity'),
              t('preDemo.loading.checkCompliance'),
              t('preDemo.loading.checkWallet'),
            ]}
            showAvatar={true}
          />
        );

      case 'home':
        return <HomeScreen />;

      case 'deposit':
        return <DepositScreen />;

      case 'deposit-confirm':
        return <ConfirmationScreen runSequence={runSequence} />;

      case 'deposit-processing':
        return (
          <ProcessingScreen
            variant="processing"
            title={t('preDemo.processing.depositProcessing')}
            subtitle={t('preDemo.processing.depositProcessingSub')}
          />
        );

      case 'deposit-approved':
        return (
          <ProcessingScreen
            variant="processing"
            title={t('preDemo.processing.depositApproved')}
            subtitle={t('preDemo.processing.depositApprovedSub')}
          />
        );

      case 'deposit-complete':
        return (
          <ProcessingScreen
            variant="success"
            title={t('preDemo.processing.depositComplete')}
            subtitle={t('preDemo.processing.depositCompleteSub')}
          />
        );

      case 'send':
        return <SendScreen />;

      case 'send-confirm':
        return <ConfirmationScreen runSequence={runSequence} />;

      case 'send-processing':
        return (
          <ProcessingScreen
            variant="processing"
            title={t('preDemo.processing.sendProcessing')}
            subtitle={t('preDemo.processing.sendProcessingSub')}
          />
        );

      case 'send-complete':
        return (
          <ProcessingScreen
            variant="success"
            title={t('preDemo.processing.sendComplete')}
            subtitle={t('preDemo.processing.sendCompleteSub')}
          />
        );

      case 'buy':
        return <BuyScreen />;

      case 'buy-confirm':
        return <ConfirmationScreen runSequence={runSequence} />;

      case 'buy-processing':
        return (
          <ProcessingScreen
            variant="processing"
            title={t('preDemo.processing.buyProcessing')}
            subtitle={t('preDemo.processing.buyProcessingSub')}
          />
        );

      case 'buy-complete':
        return (
          <ProcessingScreen
            variant="success"
            title={t('preDemo.processing.buyComplete')}
            subtitle={t('preDemo.processing.buyCompleteSub')}
          />
        );

      case 'wallet-details':
        return <WalletDetailsScreen />;

      case 'dream-mode':
        return (
          <PreDream
            onClose={handleDreamClose}
            onBackToHome={handleDreamClose}
          />
        );

      default:
        return <LoginScreen onExit={onExit} runSequence={runSequence} />;
    }
  };

  // For dream-mode, render without the demo container
  if (state.screen === 'dream-mode') {
    return renderScreen();
  }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="dialog"
      aria-modal="true"
      aria-label={t('preDemo.common.demoTitle')}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.screenContainer}>{renderScreen()}</div>
    </div>
  );
}

export function PreDemo({ onExit }: PreDemoProps) {
  return (
    <PreDemoProvider onExit={onExit}>
      <PreDemoContent onExit={onExit} />
    </PreDemoProvider>
  );
}
