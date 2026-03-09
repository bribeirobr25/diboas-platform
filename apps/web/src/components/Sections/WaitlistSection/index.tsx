/**
 * Waitlist Section (Version A/B)
 *
 * Slim parent that renders VersionA (founding spots available) or VersionB (spots full).
 * Stats provided by shared useWaitlistStats hook.
 */

'use client';

import { memo } from 'react';
import { useWaitlistStats } from '@/hooks/useWaitlistStats';
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
}

interface WaitlistSectionProps {
  config?: WaitlistSectionConfig;
  enableAnalytics?: boolean;
}

export const WaitlistSection = memo(function WaitlistSection({
  config,
  enableAnalytics = true,
}: WaitlistSectionProps) {
  const { stats, isLoading } = useWaitlistStats();

  const showVersionB = !isLoading &&
    stats.foundingMemberSpotsRemaining != null &&
    stats.foundingMemberSpotsRemaining <= 0;

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={config?.backgroundColor || 'var(--color-surface-elevated)'}
      ariaLabel="Waitlist signup"
      data-testid={config?.sectionId || 'waitlist-section'}
    >
      {showVersionB ? (
        <WaitlistVersionB config={config} enableAnalytics={enableAnalytics} />
      ) : (
        <WaitlistVersionA config={config} stats={stats} isLoading={isLoading} enableAnalytics={enableAnalytics} />
      )}
    </SectionContainer>
  );
});

WaitlistSection.displayName = 'WaitlistSection';
