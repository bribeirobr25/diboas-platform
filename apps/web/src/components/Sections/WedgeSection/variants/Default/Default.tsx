'use client';

import { useTranslation } from '@diboas/i18n/client';
import type { SupportedLocale } from '@diboas/i18n/config';
import { useLocale } from '@/components/Providers';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import { useMarketWedge } from '@/hooks/useMarketWedge';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { ArrowRight } from '@/components/UI/LucideIcon';
import { WEDGE_I18N } from '@/config/wedge';
import styles from '../../WedgeSection.module.css';

// `action` is the base case — `.wedge` already carries the teal top-border and
// the eyebrow defaults to the action accent — so it has no dedicated class.
const TONE_CLASS = {
  action: '',
  warm: styles.warm ?? '',
  neutral: styles.neutral ?? '',
} as const;

interface WedgeSectionDefaultProps {
  enableAnalytics?: boolean;
  className?: string;
}

export function WedgeSectionDefault({
  enableAnalytics = true,
  className = '',
}: WedgeSectionDefaultProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const localeKey = (locale ?? 'en') as SupportedLocale;
  const { expression, figure } = useMarketWedge(localeKey);

  const impressionRef = useImpressionTracking<HTMLDivElement>({
    eventName: 'wedge_shown',
    parameters: { locale: localeKey, metric: expression.metric },
    enabled: enableAnalytics,
  });

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: key }, values);

  // Honesty: never print a wedge with a missing/broken figure.
  if (!figure) return null;

  return (
    <section
      ref={impressionRef}
      className={`${styles.wedge} ${TONE_CLASS[expression.tone]} ${className}`}
    >
      <div className={styles.inner}>
        <p className={`u-eyebrow ${styles.eyebrow}`}>{t(WEDGE_I18N.eyebrow)}</p>
        <h2 className={styles.claim}>{t(WEDGE_I18N.claim, { value: figure })}</h2>
        <p className={styles.honest}>{t(WEDGE_I18N.honest)}</p>
        <LocaleLink href={expression.ctaHref} className={styles.cta}>
          <span>{t(WEDGE_I18N.cta)}</span>
          <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
        </LocaleLink>
      </div>
    </section>
  );
}
