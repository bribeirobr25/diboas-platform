'use client';

import Image from 'next/image';
import { FormattedMessage } from 'react-intl';
import { GoogleG } from './GoogleG';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { startOnboarding } from '@/app/[locale]/welcome/actions';
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
 */
export function AuthWelcome({ locale }: { locale: string }) {
  return (
    <section className={styles.wrap} aria-labelledby="authwelcome-title">
      {/* Full-bleed coastal hero with the branding overlaid and a fade to the
          content panel. */}
      <div className={styles.hero}>
        <Image
          className={styles.heroImg}
          src="/hero-welcome.png"
          alt=""
          fill
          sizes="480px"
          priority
        />
        <div className={styles.heroFade} aria-hidden />
        <div className={styles.brand}>
          <ModeChip />
          <Image
            className={styles.wordmark}
            src="/logo-wordmark.webp"
            alt="diBoaS"
            width={220}
            height={60}
            priority
          />
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
                // eslint-disable-next-line @next/next/no-html-link-for-pages -- external marketing legal page
                <a href="/legal/terms" className={styles.legalLink}>
                  {chunks}
                </a>
              ),
              privacy: (chunks) => (
                // eslint-disable-next-line @next/next/no-html-link-for-pages -- external marketing legal page
                <a href="/legal/privacy" className={styles.legalLink}>
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
