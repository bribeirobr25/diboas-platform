'use client';

import { FormattedMessage } from 'react-intl';
import { GoogleG } from './GoogleG';
import { LocaleSwitcher } from './LocaleSwitcher';
import { LucideIcon } from './LucideIcon';
import { ThemeToggle } from './ThemeToggle';
import { Wordmark } from './Wordmark';
import { startOnboarding } from '@/app/[locale]/welcome/actions';
import { legalUrl } from '@/i18n/config';
import styles from './AuthWelcome.module.css';

type Method = 'google' | 'email' | 'wallet';

const METHODS: { id: Method; labelId: string }[] = [
  { id: 'google', labelId: 'authWelcome.google' },
  { id: 'email', labelId: 'authWelcome.email' },
  { id: 'wallet', labelId: 'authWelcome.wallet' },
];

function MethodIcon({ id }: { id: Method }) {
  if (id === 'google') return <GoogleG size={22} />;
  return <LucideIcon name={id === 'email' ? 'mail' : 'wallet'} size={22} />;
}

/**
 * AuthWelcome — the public front door (A2; mockup 01; W-17c). Matches the
 * mockup: a FULL-BLEED coastal hero fills the top half with the "Sandbox · play
 * money" chip, the "diBoaS" brand wordmark, and the tagline OVERLAID on it,
 * fading into the light content panel below (headline, subtext, the three
 * white method cards, the legal notice).
 *
 * WIRED (not a preview): a method tap calls the startOnboarding server action —
 * establishes a session via the auth seam and NAVIGATES into the real flow
 * (-> consent -> claim -> home). Real sign-in (Auth.js) swaps in at the seam.
 * Copy learnings held: no "risk-free"; Terms/Privacy are a reviewable NOTICE,
 * never agreement-by-continuing (the actual consent is the W-3 screen).
 *
 * Two designs (founder 2026-08-14): a light and a dark language. The hero image
 * and wordmark are theme-aware CSS backgrounds (swapped in the stylesheet, so no
 * hydration flash); the ThemeToggle over the hero lets the user pick either.
 */
export function AuthWelcome({ locale }: { locale: string }) {
  return (
    <section className={styles.wrap} aria-labelledby="authwelcome-title">
      {/* Full-bleed coastal hero with the branding overlaid and a fade to the
          content panel. */}
      <div className={styles.hero}>
        <div className={styles.heroImg} aria-hidden />
        <div className={styles.heroFade} aria-hidden />
        <div className={styles.topControls}>
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </div>
        {/* No mode chip / play-money reference here: the Welcome is the clean
            front door; the "Sandbox · play money" framing lives on the internal
            pages only (founder 2026-08-14). */}
        <div className={styles.brand}>
          <Wordmark className={styles.wordmark} size="3.25rem" />
          <p className={styles.tagline}>
            <FormattedMessage id="authWelcome.tagline" />
          </p>
        </div>
      </div>

      <div className={styles.panel}>
        <h1 id="authwelcome-title" className={styles.title}>
          <FormattedMessage id="authWelcome.title" />
        </h1>
        <p className={styles.body}>
          <FormattedMessage id="authWelcome.body" />
        </p>

        <div className={styles.methods}>
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={styles.method}
              onClick={() => startOnboarding(m.id, locale)}
            >
              <span className={styles.methodIcon}>
                <MethodIcon id={m.id} />
              </span>
              <span className={styles.methodDivider} aria-hidden />
              <span className={styles.methodLabel}>
                <FormattedMessage id={m.labelId} />
              </span>
              <LucideIcon name="chevron-right" size={18} />
            </button>
          ))}
        </div>

        <p className={styles.legal}>
          <FormattedMessage
            id="authWelcome.legal"
            values={{
              /* Legal pages live on the marketing site (external), not in the
                 sandbox app — a plain <a>, not next/link; final URLs wire at end. */
              terms: (chunks) => (
                <a
                  key="terms"
                  href={legalUrl(locale, 'terms')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.legalLink}
                >
                  {chunks}
                </a>
              ),
              privacy: (chunks) => (
                <a
                  key="privacy"
                  href={legalUrl(locale, 'privacy')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.legalLink}
                >
                  {chunks}
                </a>
              ),
            }}
          />
        </p>
      </div>
    </section>
  );
}
