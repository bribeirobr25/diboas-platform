/**
 * Waitlist Section
 *
 * Landing page section with waitlist signup form
 * Shows form initially, then confirmation with position + referral link on success
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import { WaitlistForm } from '@/components/WaitingList/WaitlistForm';
import { WaitlistConfirmation } from '@/components/WaitingList/WaitlistConfirmation';
import { DreamMode } from '@/components/DreamMode';
import styles from './WaitlistSection.module.css';

interface WaitlistSectionConfig {
  sectionId?: string;
  backgroundColor?: string;
  headline?: string;
  subheadline?: string;
}

interface WaitlistSectionProps {
  config?: WaitlistSectionConfig;
  enableAnalytics?: boolean;
}

interface SignupData {
  position: number;
  referralCode: string;
  referralUrl: string;
}

export const WaitlistSection = memo(function WaitlistSection({
  config,
  enableAnalytics = true,
}: WaitlistSectionProps) {
  const intl = useIntl();
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [showDreamMode, setShowDreamMode] = useState(false);

  const handleSuccess = useCallback((data: SignupData) => {
    setSignupData(data);
  }, []);

  const handleTryDreamMode = useCallback(() => {
    setShowDreamMode(true);
  }, []);

  const handleCloseDreamMode = useCallback(() => {
    setShowDreamMode(false);
  }, []);

  // If Dream Mode is active, render it as fullscreen overlay
  if (showDreamMode) {
    return (
      <DreamMode
        onClose={handleCloseDreamMode}
        onComplete={handleCloseDreamMode}
      />
    );
  }

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={config?.backgroundColor || 'var(--color-surface-elevated)'}
      ariaLabel={intl.formatMessage({ id: 'waitlist.sectionTitle' })}
      data-testid={config?.sectionId || 'waitlist-section'}
    >
      <div className={styles.wrapper}>
        <div className={styles.content}>
          {!signupData ? (
            <>
              <div className={styles.header}>
                <h2 className={styles.headline}>
                  {config?.headline || intl.formatMessage({ id: 'waitlist.headline' })}
                </h2>
                <p className={styles.subheadline}>
                  {config?.subheadline || intl.formatMessage({ id: 'waitlist.subheadline' })}
                </p>
              </div>
              <WaitlistForm
                onSuccess={handleSuccess}
                className={styles.form}
              />
            </>
          ) : (
            <WaitlistConfirmation
              position={signupData.position}
              referralCode={signupData.referralCode}
              referralUrl={signupData.referralUrl}
              onDreamModeClick={handleTryDreamMode}
            />
          )}
        </div>
      </div>
    </SectionContainer>
  );
});

WaitlistSection.displayName = 'WaitlistSection';
