'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { analyticsService } from '@/lib/analytics';
import { LESSON_EVENTS, getSeriesLessons, type LessonMetadata } from '@/lib/learn';
import { LocaleLink } from '@/components/UI/LocaleLink';
import { LucideIcon, ArrowRight } from '@/components/UI/LucideIcon';
import styles from './TalkArcDefault.module.css';

interface TalkArcDefaultProps {
  enableAnalytics?: boolean;
}

/**
 * The 7-talk arc, rendered as an ordered list in series (spine) order.
 *
 * Live talks: the existing index-card treatment linking to /learn/<slug>
 * (`prefetch={false}`, W7: the talk page is a destination, not a transient
 * stop; pay for its CSS on click, not preemptively).
 *
 * Announced talks: non-interactive cards (no role, no tabIndex; Phase-0 B-2)
 * with the availability badge. The honest signal is an impression event
 * (>=50% visible, once per mount), keeping the `learn_roadmap_card_viewed`
 * wire name stable for dashboards.
 */
export function TalkArcDefault({ enableAnalytics = true }: TalkArcDefaultProps) {
  const intl = useTranslation();
  const talks = getSeriesLessons();

  const t = (key: string) => intl.formatMessage({ id: `learn.arc.${key}` });

  return (
    <ol className={styles.arc}>
      {talks.map((talk, index) => {
        const badge = intl.formatMessage({ id: 'learn.arc.badge' }, { n: index + 1 });
        const title = t(`${talk.id}.title`);
        const line = t(`${talk.id}.line`);

        return (
          <li key={talk.id} className={styles.arcItem}>
            {talk.status === 'live' ? (
              <LocaleLink href={`/learn/${talk.slug}`} className={styles.liveCard} prefetch={false}>
                <span className={styles.kicker}>
                  <span className={styles.kickerBadge}>{badge}</span>
                  <span className={styles.kickerMeta}>
                    {intl.formatMessage(
                      { id: 'learn.arc.readTime' },
                      { minutes: talk.readTimeMinutes }
                    )}
                  </span>
                </span>
                <span className={styles.liveTitle}>{title}</span>
                <span className={styles.line}>{line}</span>
                <span className={styles.liveCta}>
                  {intl.formatMessage({ id: 'learn.arc.cardCta' })}{' '}
                  <LucideIcon icon={ArrowRight} size="xs" />
                </span>
              </LocaleLink>
            ) : (
              <AnnouncedCard
                talk={talk}
                badge={badge}
                title={title}
                line={line}
                enableAnalytics={enableAnalytics}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface AnnouncedCardProps {
  talk: LessonMetadata;
  badge: string;
  title: string;
  line: string;
  enableAnalytics: boolean;
}

function AnnouncedCard({ talk, badge, title, line, enableAnalytics }: AnnouncedCardProps) {
  const intl = useTranslation();
  const cardRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);
  const locale = intl.locale;
  const lessonId = talk.id;

  useEffect(() => {
    if (!enableAnalytics) return;
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || viewedRef.current) continue;
          viewedRef.current = true;
          analyticsService.track({
            name: LESSON_EVENTS.ROADMAP_CARD_VIEWED,
            parameters: { lessonId, locale, timestamp: Date.now() },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enableAnalytics, lessonId, locale]);

  return (
    <article className={styles.announcedCard} data-status="announced" ref={cardRef}>
      <span className={styles.kicker}>
        <span className={styles.kickerBadge}>{badge}</span>
        <span className={styles.announcedBadge}>
          {intl.formatMessage({ id: 'learn.arc.comingSoon' })}
        </span>
      </span>
      <h3 className={styles.announcedTitle}>{title}</h3>
      <p className={styles.line}>{line}</p>
    </article>
  );
}
