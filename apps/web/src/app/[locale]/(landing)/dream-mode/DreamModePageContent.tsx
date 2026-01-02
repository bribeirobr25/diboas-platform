'use client';

/**
 * Dream Mode Page Content
 *
 * Client component that handles:
 * - User state detection (waitlist membership)
 * - Access enforcement (only waitlist members)
 * - Analytics tracking (dream_mode_entry)
 * - Dream Mode rendering
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@diboas/i18n/client';
import { Button } from '@diboas/ui';
import { DreamMode } from '@/components/DreamMode';
import { useWaitingListModal } from '@/components/WaitingList';
import { analyticsService } from '@/lib/analytics';
import { POSITION_STORAGE_KEYS } from '@/lib/waitingList/constants';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './DreamModePage.module.css';

interface DreamModePageContentProps {
  locale: string;
}

/**
 * Check if user is on waitlist
 */
function useWaitlistMembership() {
  const [isOnWaitlist, setIsOnWaitlist] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const email = localStorage.getItem(POSITION_STORAGE_KEYS.email);
      setIsOnWaitlist(!!email);
    } catch (error) {
      console.warn('[DreamModePage] Failed to check waitlist status:', error);
      setIsOnWaitlist(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isOnWaitlist, isLoading };
}

export function DreamModePageContent({ locale }: DreamModePageContentProps) {
  const intl = useTranslation();
  const router = useRouter();
  const { openModal } = useWaitingListModal();
  const { isOnWaitlist, isLoading } = useWaitlistMembership();
  const [hasTrackedEntry, setHasTrackedEntry] = useState(false);

  // Track dream_mode_entry when user accesses the page
  useEffect(() => {
    if (!isLoading && isOnWaitlist && !hasTrackedEntry) {
      analyticsService.track({
        name: 'dream_mode_entry',
        parameters: {
          source: 'direct_url',
          locale,
        },
      });
      setHasTrackedEntry(true);
    }
  }, [isLoading, isOnWaitlist, hasTrackedEntry, locale]);

  // Handle join waitlist from gate
  const handleJoinWaitlist = useCallback(() => {
    analyticsService.track({
      name: 'dream_mode_gate_join_click',
      parameters: { locale },
    });
    openModal();
  }, [openModal, locale]);

  // Handle complete - go back to landing
  const handleComplete = useCallback(() => {
    router.push(`/${locale}`);
  }, [router, locale]);

  // Handle close - go back to landing
  const handleClose = useCallback(() => {
    router.push(`/${locale}`);
  }, [router, locale]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  // Gate: User is not on waitlist
  if (!isOnWaitlist) {
    return (
      <div className={styles.gateContainer}>
        <div className={styles.gateCard}>
          <div className={styles.gateIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <h1 className={styles.gateTitle}>
            {intl.formatMessage({ id: 'dreamMode.gate.title' })}
          </h1>
          <p className={styles.gateDescription}>
            {intl.formatMessage({ id: 'dreamMode.gate.description' })}
          </p>
          <Button
            variant="primary"
            size="lg"
            className={styles.gateCta}
            onClick={handleJoinWaitlist}
          >
            {intl.formatMessage({ id: 'dreamMode.gate.cta' })}
          </Button>
          <button
            type="button"
            className={styles.gateBack}
            onClick={() => router.push(`/${locale}`)}
          >
            {intl.formatMessage({ id: 'dreamMode.gate.back' })}
          </button>
        </div>
      </div>
    );
  }

  // User is on waitlist - render Dream Mode
  return (
    <div className={styles.dreamModeContainer}>
      <SectionErrorBoundary
        sectionId="dream-mode-experience"
        sectionType="DreamMode"
        enableReporting={true}
        context={{ page: 'dream-mode', locale }}
      >
        <DreamMode
          onComplete={handleComplete}
          onJoinWaitlist={openModal}
          onClose={handleClose}
          className={styles.dreamMode}
        />
      </SectionErrorBoundary>
    </div>
  );
}

export default DreamModePageContent;
