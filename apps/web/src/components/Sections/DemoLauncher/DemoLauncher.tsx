'use client';

import { memo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { LocaleLink } from '@/components/UI';
import { ROUTES } from '@/config/routes';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { setCtaSource } from '@/lib/analytics/ctaAttribution';
import styles from './DemoLauncher.module.css';

const PreDream = dynamic(
  () => import('@/components/PreDream').then(m => ({ default: m.PreDream })),
  { ssr: false }
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
  enableAnalytics = true,
}: DemoLauncherProps) {
  const translated = useConfigTranslation(config);
  const [showPreDream, setShowPreDream] = useState(false);

  const handlePreDreamClose = useCallback(() => {
    setShowPreDream(false);
    scrollToWaitlist();
  }, []);

  const handleSecondaryClick = useCallback(() => {
    setShowPreDream(true);
  }, []);

  return (
    <>
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
          <h2 className={styles.title}>{translated.content.header}</h2>
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

      {showPreDream ? (
        <PreDream
          onClose={handlePreDreamClose}
          onBackToHome={handlePreDreamClose}
        />
      ) : null}
    </>
  );
});

DemoLauncher.displayName = 'DemoLauncher';
