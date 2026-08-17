'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import { LOCALE_CURRENCY, CURRENCY_SYMBOL, legalUrl, type SandboxLocale } from '@/i18n/config';
import { LocaleSwitcher } from './LocaleSwitcher';
import { LucideIcon } from './LucideIcon';
import { Toggle } from './Toggle';
import styles from './SettingsScreen.module.css';

/**
 * Settings — Privacy & Data (R4; mockup 32). Data-control consent toggles, the
 * Language (endonym switcher — its new home after the app-bar cleanup) + Currency
 * preferences, a notifications link, and the export/delete data controls. The
 * toggle STATE persists with the consent record (deferred, C-B7); export/delete
 * are account-model actions (deferred, D-2). Language IS wired (LocaleSwitcher).
 */
export function SettingsScreen({ locale }: { locale: SandboxLocale }) {
  const [analytics, setAnalytics] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const currency = LOCALE_CURRENCY[locale];

  return (
    <section className={styles.wrap} aria-labelledby="settings-title">
      <header className={styles.head}>
        <h1 id="settings-title" className={styles.title}>
          <FormattedMessage id="settings.title" />
        </h1>
        <p className={styles.subtitle}>
          <FormattedMessage id="settings.subtitle" />
        </p>
      </header>

      <Section label="settings.dataControls">
        <ToggleRow
          icon="bar-chart"
          title="settings.analytics"
          desc="settings.analyticsDesc"
          checked={analytics}
          onChange={setAnalytics}
          id="set-analytics"
        />
        <ToggleRow
          icon="megaphone"
          title="settings.personalization"
          desc="settings.personalizationDesc"
          checked={personalization}
          onChange={setPersonalization}
          id="set-personalization"
        />
        <ToggleRow
          icon="target"
          title="settings.marketing"
          desc="settings.marketingDesc"
          checked={marketing}
          onChange={setMarketing}
          id="set-marketing"
        />
      </Section>

      <Section label="settings.preferences">
        <div className={styles.row}>
          <span className={styles.rowIcon}>
            <LucideIcon name="globe" size={20} />
          </span>
          <span className={styles.rowTitle}>
            <FormattedMessage id="settings.language" />
          </span>
          <LocaleSwitcher locale={locale} variant="bare" />
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon}>
            <LucideIcon name="trending-up" size={20} />
          </span>
          <span className={styles.rowTitle}>
            <FormattedMessage id="settings.currency" />
          </span>
          <span className={styles.rowValue}>
            {currency} ({CURRENCY_SYMBOL[currency]})
          </span>
        </div>
      </Section>

      <Section label="settings.notificationsLabel">
        <Link href={`/${locale}/notifications`} className={styles.row}>
          <span className={styles.rowIcon}>
            <LucideIcon name="bell" size={20} />
          </span>
          <span className={styles.rowBody}>
            <span className={styles.rowTitle}>
              <FormattedMessage id="settings.notifPrefs" />
            </span>
            <span className={styles.rowSub}>
              <FormattedMessage id="settings.notifPrefsSub" />
            </span>
          </span>
          <LucideIcon name="chevron-right" size={18} className={styles.chevron} />
        </Link>
      </Section>

      <Section label="settings.yourData">
        {/* Export + Delete are not wired yet (account model, D-2) -> disabled. */}
        <button type="button" className={styles.row} disabled>
          <span className={styles.rowIcon}>
            <LucideIcon name="upload" size={20} />
          </span>
          <span className={styles.rowBody}>
            <span className={styles.rowTitle}>
              <FormattedMessage id="settings.export" />
            </span>
            <span className={styles.rowSub}>
              <FormattedMessage id="settings.exportSub" />
            </span>
          </span>
          <LucideIcon name="chevron-right" size={18} className={styles.chevron} />
        </button>
        <button type="button" className={styles.row} disabled>
          <span className={styles.rowIcon}>
            <LucideIcon name="user" size={20} />
          </span>
          <span className={styles.rowBody}>
            <span className={styles.rowTitle}>
              <FormattedMessage id="settings.delete" />
            </span>
            <span className={styles.rowSub}>
              <FormattedMessage id="settings.deleteSub" />
            </span>
          </span>
          <LucideIcon name="chevron-right" size={18} className={styles.chevron} />
        </button>
      </Section>

      <p className={styles.footer}>
        <FormattedMessage
          id="settings.footer"
          values={{
            terms: (chunks) => (
              <a
                key="t"
                href={legalUrl(locale, 'terms')}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {chunks}
              </a>
            ),
          }}
        />
      </p>
    </section>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>
        <FormattedMessage id={label} />
      </p>
      <div className={styles.card}>{children}</div>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  desc,
  checked,
  onChange,
  id,
}: {
  icon: string;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowIcon}>
        <LucideIcon name={icon} size={20} />
      </span>
      <span className={styles.rowBody}>
        <span id={id} className={styles.rowTitle}>
          <FormattedMessage id={title} />
        </span>
        <span className={styles.rowSub}>
          <FormattedMessage id={desc} />
        </span>
      </span>
      <Toggle checked={checked} onChange={onChange} labelledBy={id} />
    </div>
  );
}
