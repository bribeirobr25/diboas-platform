'use client';

import { useTranslation } from '@diboas/i18n/client';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './MidPageCTA.module.css';

interface MidPageCTAProps {
  translationPrefix: string;
  href?: string;
  ariaLabel?: string;
}

export function MidPageCTA({
  translationPrefix,
  href = '#waitlist',
  ariaLabel,
}: MidPageCTAProps) {
  const intl = useTranslation();

  const heading = intl.formatMessage({ id: `${translationPrefix}.heading` });
  const cta = intl.formatMessage({ id: `${translationPrefix}.cta` });

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-brand)"
      ariaLabel={ariaLabel ?? heading}
    >
      <div className={styles.wrapper}>
        <p className={styles.heading}>{heading}</p>
        <a href={href} className={styles.cta}>
          {cta}
        </a>
      </div>
    </SectionContainer>
  );
}
