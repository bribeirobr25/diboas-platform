/**
 * WaitlistSection Factory
 *
 * Factory Pattern: A/B variant selection based on waitlist stats
 * Domain-Driven Design: Waitlist section orchestration
 * Service Agnostic Abstraction: Decoupled variant implementations
 *
 * Renders VersionA (founding spots available) or VersionB (spots full)
 * based on live waitlist stats.
 */

'use client';

import { memo, useEffect, useRef } from 'react';
import { useWaitlistStats } from '@/hooks/useWaitlistStats';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
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

  // Phase 3 L11 (audit/2026-05-08): impression event for waitlist-funnel
  // entry. Uses a wrapping <div> because SectionContainer doesn't forward
  // refs, and adding ref-forwarding there is out of scope for L11.
  const impressionRef = useImpressionTracking<HTMLDivElement>({
    eventName: 'waitlist_section_impression',
    parameters: { source: source || 'landing_b2c' },
    enabled: enableAnalytics,
  });

  return (
    <div ref={impressionRef}>
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
    </div>
  );
});

WaitlistSection.displayName = 'WaitlistSection';
