'use client';

import { useTranslation } from '@diboas/i18n/client';
import { usePreDream } from '../PreDreamProvider';
import { PRE_DREAM_INITIAL_AMOUNT_CONFIG, PRE_DREAM_MONTHLY_AMOUNT_CONFIG } from '@/lib/pre-dream';
import { useLocale } from '@/components/Providers';
import { getCurrencyForLocale, getCurrencySymbol, getIntlLocale } from '@/config/formats';
import styles from '../PreDream.module.css';

export function InputScreen() {
  const intl = useTranslation();
  const { state, setInitialAmount, setMonthlyContribution, goToTimeframe, goToScreen } =
    usePreDream();

  const { locale } = useLocale();
  const currencySymbol = getCurrencySymbol(getCurrencyForLocale(locale));
  const intlLocale = getIntlLocale(locale);

  const t = (key: string) => intl.formatMessage({ id: `preDream.input.${key}` });

  const handleInitialChange = (value: string) => {
    const num = Math.max(
      PRE_DREAM_INITIAL_AMOUNT_CONFIG.min,
      Math.min(PRE_DREAM_INITIAL_AMOUNT_CONFIG.max, parseInt(value) || 0)
    );
    setInitialAmount(num);
  };

  const handleMonthlyChange = (value: string) => {
    const num = Math.max(
      PRE_DREAM_MONTHLY_AMOUNT_CONFIG.min,
      Math.min(PRE_DREAM_MONTHLY_AMOUNT_CONFIG.max, parseInt(value) || 0)
    );
    setMonthlyContribution(num);
  };

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h1 className={styles.screenTitle}>{t('title')}</h1>
      </div>

      <div className={styles.inputGroup}>
        {/* Starting Amount */}
        <div className={styles.sliderCard}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>{t('startingAmount')}</span>
            <div className={styles.sliderValueInput}>
              <span className={styles.currencySymbol}>{currencySymbol}</span>
              <input
                type="number"
                value={state.initialAmount}
                onChange={(e) => handleInitialChange(e.target.value)}
                className={styles.sliderNumberInput}
              />
            </div>
          </div>
          <input
            type="range"
            min={PRE_DREAM_INITIAL_AMOUNT_CONFIG.min}
            max={PRE_DREAM_INITIAL_AMOUNT_CONFIG.max}
            step={PRE_DREAM_INITIAL_AMOUNT_CONFIG.step}
            value={state.initialAmount}
            onChange={(e) => setInitialAmount(parseInt(e.target.value))}
            className={styles.rangeSlider}
            aria-label={t('startingAmount')}
          />
          <div className={styles.sliderRange}>
            <span>
              {currencySymbol}
              {PRE_DREAM_INITIAL_AMOUNT_CONFIG.min.toLocaleString(intlLocale)}
            </span>
            <span>
              {currencySymbol}
              {PRE_DREAM_INITIAL_AMOUNT_CONFIG.max.toLocaleString(intlLocale)}
            </span>
          </div>
        </div>

        {/* Monthly Contribution */}
        <div className={styles.sliderCard}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>{t('monthlyContribution')}</span>
            <div className={styles.sliderValueInput}>
              <span className={styles.currencySymbol}>{currencySymbol}</span>
              <input
                type="number"
                value={state.monthlyContribution}
                onChange={(e) => handleMonthlyChange(e.target.value)}
                className={styles.sliderNumberInput}
              />
            </div>
          </div>
          <input
            type="range"
            min={PRE_DREAM_MONTHLY_AMOUNT_CONFIG.min}
            max={PRE_DREAM_MONTHLY_AMOUNT_CONFIG.max}
            step={PRE_DREAM_MONTHLY_AMOUNT_CONFIG.step}
            value={state.monthlyContribution}
            onChange={(e) => setMonthlyContribution(parseInt(e.target.value))}
            className={styles.rangeSlider}
            aria-label={t('monthlyContribution')}
          />
          <div className={styles.sliderRange}>
            <span>
              {currencySymbol}
              {PRE_DREAM_MONTHLY_AMOUNT_CONFIG.min.toLocaleString(intlLocale)}
            </span>
            <span>
              {currencySymbol}
              {PRE_DREAM_MONTHLY_AMOUNT_CONFIG.max.toLocaleString(intlLocale)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button onClick={() => goToScreen('pathSelect')} className={styles.secondaryButton}>
          {t('back')}
        </button>
        <button onClick={goToTimeframe} className={styles.primaryButton}>
          {t('nextButton')}
        </button>
      </div>
    </div>
  );
}
