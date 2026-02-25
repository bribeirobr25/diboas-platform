/**
 * Waitlist Section
 *
 * Landing page section with waitlist signup form
 * Shows form initially, then confirmation with position + referral link on success
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import { WaitlistForm } from '@/components/WaitingList/WaitlistForm';
import { WaitlistConfirmation } from '@/components/WaitingList/WaitlistConfirmation';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
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
  tier?: string;
}

export const WaitlistSection = memo(function WaitlistSection({
  config,
  enableAnalytics = true,
}: WaitlistSectionProps) {
  const intl = useTranslation();
  const [signupData, setSignupData] = useState<SignupData | null>(null);

  const handleSuccess = useCallback((data: SignupData) => {
    setSignupData(data);
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_SUCCESS, {
      source: 'waitlist',
      timestamp: Date.now(),
      metadata: { position: data.position },
    });
  }, []);

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
                  {intl.formatMessage({ id: config?.headline || 'waitlist.header' })}
                </h2>
                <p className={styles.subheadline}>
                  {intl.formatMessage({ id: config?.subheadline || 'waitlist.subheader' })}
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
              tier={signupData.tier}
            />
          )}
        </div>
      </div>
    </SectionContainer>
  );
});

WaitlistSection.displayName = 'WaitlistSection';
