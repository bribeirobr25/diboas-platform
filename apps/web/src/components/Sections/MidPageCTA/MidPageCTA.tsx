import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './MidPageCTA.module.css';

interface MidPageCTAProps {
  headingKey: string;
  ctaKey: string;
  href?: string;
  ariaLabel?: string;
}

export function MidPageCTA({
  headingKey,
  ctaKey,
  href = '#waitlist',
  ariaLabel,
}: MidPageCTAProps) {
  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-brand)"
      ariaLabel={ariaLabel ?? 'Call to action'}
    >
      <div className={styles.wrapper}>
        <p className={styles.heading}>{headingKey}</p>
        <a href={href} className={styles.cta}>
          {ctaKey}
        </a>
      </div>
    </SectionContainer>
  );
}
