'use client';

import { CountUp } from '@/components/UI/CountUp';
import { DivergenceChart } from '@/components/UI/DivergenceChart';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { Share2, Check, ArrowRight } from '@/components/UI/LucideIcon';
import type { ResultMomentProps } from '../../ResultMomentFactory';
import styles from '../../ResultMoment.module.css';

type ResultMomentDefaultProps = Omit<ResultMomentProps, 'variant'>;

const HERO_TONE_CLASS: Record<NonNullable<ResultMomentProps['headlineTone']>, string> = {
  positive: '',
  negative: styles.heroValueNegative ?? '',
  neutral: styles.heroValueNeutral ?? '',
};

export function ResultMomentDefault({
  eyebrow,
  headlineValue,
  headlineFormatter,
  headlineTone = 'positive',
  headlineOverride,
  headlineCaption,
  chart,
  supportingPoints,
  disclaimer,
  cta,
  share,
  className = '',
}: ResultMomentDefaultProps) {
  const heroClass = `u-numeric ${styles.heroValue} ${HERO_TONE_CLASS[headlineTone]}`;
  return (
    <section className={`${styles.moment} ${className}`}>
      <p className={`u-eyebrow ${styles.eyebrow}`}>{eyebrow}</p>

      <div className={styles.heroBlock}>
        {headlineOverride != null ? (
          <p className={heroClass}>{headlineOverride}</p>
        ) : (
          <CountUp as="p" end={headlineValue} formatter={headlineFormatter} className={heroClass} />
        )}
        {headlineCaption ? <p className={styles.heroCaption}>{headlineCaption}</p> : null}
      </div>

      {chart ? (
        <div className={styles.chartWrap}>
          <DivergenceChart
            series={chart.series}
            xCaptions={chart.xCaptions}
            formatValue={chart.formatValue}
            ariaLabel={chart.ariaLabel}
          />
        </div>
      ) : null}

      {supportingPoints && supportingPoints.length > 0 ? (
        <ul className={styles.points}>
          {supportingPoints.map((pt) => (
            <li
              key={pt.id}
              className={`${styles.point} ${pt.variant === 'primary' ? styles.pointPrimary : ''}`}
            >
              <span className={styles.pointLabel}>{pt.label}</span>
              <span className={`u-numeric ${styles.pointValue}`}>{pt.value}</span>
              {pt.note ? <span className={styles.pointNote}>{pt.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {disclaimer ? <p className={styles.disclaimer}>{disclaimer}</p> : null}

      <div className={styles.cta}>
        <div className={styles.ctaCopy}>
          <p className={styles.ctaHeadline}>{cta.headline}</p>
          {cta.body ? <p className={styles.ctaBody}>{cta.body}</p> : null}
        </div>
        <div className={styles.actions}>
          <LocaleLink href={cta.href} className={styles.ctaButton}>
            <span>{cta.label}</span>
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </LocaleLink>
          {share ? (
            <button type="button" onClick={() => void share.onShare()} className={styles.shareButton}>
              {share.copied ? (
                <Check size={18} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Share2 size={18} strokeWidth={2} aria-hidden="true" />
              )}
              <span aria-live="polite">{share.copied ? share.copiedLabel : share.label}</span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
