'use client';

/**
 * Demo Page Content
 *
 * Client component that renders the PreDemo experience
 * Wrapped in SectionErrorBoundary for resilience
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PreDemo } from '@/components/PreDemo';
import { analyticsService } from '@/lib/analytics';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './DemoPage.module.css';

interface DemoPageContentProps {
  locale: string;
}

export function DemoPageContent({ locale }: DemoPageContentProps) {
  const router = useRouter();
  const [hasTrackedEntry, setHasTrackedEntry] = useState(false);

  // Lock body scroll while demo is active — prevents the underlying
  // layout from intercepting touch events on the fixed overlay (iOS)
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Track demo entry
  useEffect(() => {
    if (!hasTrackedEntry) {
      analyticsService.track({
        name: 'pre_demo_entry',
        parameters: {
          source: 'direct_url',
          locale,
        },
      });
      setHasTrackedEntry(true);
    }
  }, [hasTrackedEntry, locale]);

  const handleExit = useCallback(() => {
    router.push(`/${locale}#social-proof`);
  }, [router, locale]);

  return (
    <div className={styles.demoContainer}>
      <SectionErrorBoundary
        sectionId="pre-demo-experience"
        sectionType="PreDemo"
        enableReporting={true}
        context={{ page: 'demo', locale }}
      >
        <PreDemo onExit={handleExit} />
      </SectionErrorBoundary>
    </div>
  );
}

export default DemoPageContent;
