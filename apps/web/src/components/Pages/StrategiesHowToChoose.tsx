'use client';

/**
 * StrategiesHowToChoose
 *
 * Neutral, Case-4-safe organization guide (ESMA35-43-3861): presents the
 * objective ways to narrow the strategy list (purpose/horizon, price-movement
 * tolerance) with NO suitability verdict, opinion, or default-steer — the user
 * matches and picks. Renders an intro, 3 framing prompts with options, the
 * honesty promise, and the "diBoaS never chooses for you" golden rule.
 */

import { useTranslation } from '@diboas/i18n/client';
import { ContentCard } from '@/components/UI';
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'strategies';

export function StrategiesHowToChoose() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  const intro = t('howToChoose.intro');
  return (
    <>
      <h2 className={styles.sectionTitle}>{t('howToChoose.header')}</h2>
      {intro ? <p className={styles.sectionSubtitle}>{intro}</p> : null}

      <div className={styles.questionsList}>
        <ContentCard variant="muted" title={t('howToChoose.question1.title')}>
          <ul className={styles.optionsList}>
            <li>{t('howToChoose.question1.options.emergency')}</li>
            <li>{t('howToChoose.question1.options.beatInflation')}</li>
            <li>{t('howToChoose.question1.options.shortTerm')}</li>
            <li>{t('howToChoose.question1.options.mediumTerm')}</li>
            <li>{t('howToChoose.question1.options.longTerm')}</li>
          </ul>
        </ContentCard>

        <ContentCard variant="muted" title={t('howToChoose.question2.title')}>
          <ul className={styles.optionsList}>
            <li>{t('howToChoose.question2.options.none')}</li>
            <li>{t('howToChoose.question2.options.understand')}</li>
            <li>{t('howToChoose.question2.options.unsure')}</li>
          </ul>
        </ContentCard>

        <ContentCard variant="muted" title={t('howToChoose.question3.title')}>
          <ul className={styles.optionsList}>
            <li>{t('howToChoose.question3.options.panic')}</li>
            <li>{t('howToChoose.question3.options.wait')}</li>
            <li>{t('howToChoose.question3.options.addMore')}</li>
          </ul>
        </ContentCard>

        <ContentCard variant="highlight">
          <p className={styles.brandPromise}>{t('howToChoose.brandPromise')}</p>
          <p className={styles.goldenRule}>{t('howToChoose.goldenRule')}</p>
        </ContentCard>
      </div>
    </>
  );
}
