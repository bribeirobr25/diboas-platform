'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { LocaleLink } from '@/components/UI';
import { ROUTES } from '@/config/routes';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { setCtaSource } from '@/lib/analytics/ctaAttribution';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import styles from './DemoLauncher.module.css';

const PreDream = dynamic(
  () => import('@/components/PreDream').then(m => ({ default: m.PreDream })),
  { ssr: false, loading: () => null }
);

interface DemoLauncherConfig {
  content: {
    transitionHook?: string;
    header: string;
    subtext: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  seo: {
    headingLevel: 'h2';
    ariaLabel: string;
  };
  analytics: {
    sectionId: string;
    category: string;
  };
}

interface DemoLauncherProps {
  config: DemoLauncherConfig;
  enableAnalytics?: boolean;
}

function scrollToWaitlist() {
  setCtaSource('demo-launcher');
  const el = document.getElementById('waitlist');
  if (!el) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: prefersReduced ? 'instant' : 'smooth' });
}

export const DemoLauncher = memo(function DemoLauncher({
  config,
  enableAnalytics: _enableAnalytics = true,
}: DemoLauncherProps) {
  const translated = useConfigTranslation(config);
  const [showPreDream, setShowPreDream] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Portal target needs document.body (client-only); SSR renders portalContainer=null.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalContainer(document.body);
  }, []);

  const handlePreDreamClose = useCallback(() => {
    setShowPreDream(false);
    scrollToWaitlist();
  }, []);

  const handleSecondaryClick = useCallback(() => {
    setShowPreDream(true);
  }, []);

  // Phase 3 L11 (audit/2026-05-08): impression event for demo-funnel entry.
  // Wrapping <div> because SectionContainer doesn't forward refs.
  const impressionRef = useImpressionTracking<HTMLDivElement>({
    eventName: 'demo_launcher_impression',
  });

  return (
    <>
      <div ref={impressionRef}>
        <SectionContainer
          variant="narrow"
          padding="standard"
          backgroundColor="var(--section-bg-neutral)"
          ariaLabel={translated.seo.ariaLabel}
        >
          <div className={styles.wrapper}>
            {translated.content.transitionHook ? (
              <p className={styles.transitionHook}>{translated.content.transitionHook}</p>
            ) : null}
            <h3 className={styles.title}>{translated.content.header}</h3>
            <p className={styles.description}>{translated.content.subtext}</p>

            <div className={styles.ctaGroup}>
              <LocaleLink href={ROUTES.DEMO} className={styles.ctaPrimary}>
                {translated.content.ctaPrimary}
              </LocaleLink>
              <button
                type="button"
                className={styles.ctaSecondary}
                onClick={handleSecondaryClick}
              >
                {translated.content.ctaSecondary}
              </button>
            </div>
          </div>
        </SectionContainer>
      </div>

      {showPreDream && portalContainer ? createPortal(
        <PreDream
          onClose={handlePreDreamClose}
          onBackToHome={handlePreDreamClose}
        />,
        portalContainer
      ) : null}
    </>
  );
});

DemoLauncher.displayName = 'DemoLauncher';
