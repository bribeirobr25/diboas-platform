/**
 * Waitlist Section (Version A/B)
 *
 * Slim parent that renders VersionA (founding spots available) or VersionB (spots full).
 * Stats provided by shared useWaitlistStats hook.
 */

'use client';

import { memo, useEffect, useRef } from 'react';
import { useWaitlistStats } from '@/hooks/useWaitlistStats';
import { analyticsService } from '@/lib/analytics';
import { WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
import { SectionContainer } from '../SectionContainer/SectionContainer';
import { WaitlistVersionA } from './WaitlistVersionA';
import { WaitlistVersionB } from './WaitlistVersionB';

interface WaitlistSectionConfig {
  sectionId?: string;
  backgroundColor?: string;
  headline?: string;
  subheadline?: string;
  belowCta?: string;
  belowCheckbox?: string;
  hideBenefits?: boolean;
  hideNoSpam?: boolean;
  namespace?: string;
  confirmationNamespace?: string;
  /** Waitlist source for audience-specific counters and signup tagging */
  source?: 'landing_b2c' | 'landing_b2b' | 'about' | 'security' | 'help';
}

interface WaitlistSectionProps {
  config?: WaitlistSectionConfig;
  enableAnalytics?: boolean;
}

export const WaitlistSection = memo(function WaitlistSection({
  config,
  enableAnalytics = true,
}: WaitlistSectionProps) {
  const source = config?.source;
  const { stats, isLoading } = useWaitlistStats(source ? { source } : undefined);

  const showVersionB = !isLoading &&
    stats.foundingMemberSpotsRemaining != null &&
    stats.foundingMemberSpotsRemaining <= 0;

  // Track which A/B version is shown (fires once after loading resolves)
  const hasTrackedVersion = useRef(false);
  useEffect(() => {
    if (isLoading || hasTrackedVersion.current) return;
    hasTrackedVersion.current = true;
    if (enableAnalytics) {
      analyticsService.track({
        name: WAITING_LIST_EVENTS.VERSION_SHOWN,
        parameters: {
          version: showVersionB ? 'B' : 'A',
          source: source || 'landing_b2c',
          timestamp: Date.now(),
        },
      });
    }
  }, [isLoading, showVersionB, enableAnalytics, source]);

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={config?.backgroundColor || 'var(--color-surface-elevated)'}
      ariaLabel="Waitlist signup"
      data-testid={config?.sectionId || 'waitlist-section'}
    >
      {showVersionB ? (
        <WaitlistVersionB config={config} source={source} enableAnalytics={enableAnalytics} />
      ) : (
        <WaitlistVersionA config={config} source={source} stats={stats} isLoading={isLoading} enableAnalytics={enableAnalytics} />
      )}
    </SectionContainer>
  );
});

WaitlistSection.displayName = 'WaitlistSection';
