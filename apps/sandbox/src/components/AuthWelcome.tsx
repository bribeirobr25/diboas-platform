'use client';

import Image from 'next/image';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { startOnboarding } from '@/app/[locale]/welcome/actions';
import styles from './AuthWelcome.module.css';

type Method = 'google' | 'email' | 'wallet';

const METHODS: { id: Method; icon: string; labelId: string }[] = [
  { id: 'google', icon: 'chrome', labelId: 'authWelcome.google' },
  { id: 'email', icon: 'mail', labelId: 'authWelcome.email' },
  { id: 'wallet', icon: 'wallet', labelId: 'authWelcome.wallet' },
];

/**
 * AuthWelcome — the public front door (A2; mockup 01; W-17c). Matches the
 * approved mockup: the "diBoaS" brand wordmark (not "diBoaS Sandbox"), the real
 * coastal hero image (public/hero-welcome.png, not a faked gradient), the three
 * ruled R1 methods (Google · email · wallet — W-1/PL-1c) as white method cards.
 *
 * WIRED (not a preview): a method tap calls the startOnboarding server action —
 * establishes a session via the auth seam and NAVIGATES into the real flow
 * (-> consent -> claim -> home). Real sign-in (Auth.js) swaps in at the seam.
 * Copy applies the learnings: no "risk-free"; Terms/Privacy are a reviewable
 * NOTICE, never agreement-by-continuing (the actual consent is the W-3 screen).
 */
export function AuthWelcome({ locale }: { locale: string }) {
  return (
    <section className={styles.wrap} aria-labelledby="authwelcome-title">
      <header className={styles.top}>
        <ModeChip />
        {/* The diBoaS brand wordmark (the mockup's logo, not "diBoaS Sandbox"). */}
        <Image
          className={styles.wordmark}
          src="/logo-wordmark.webp"
          alt="diBoaS"
          width={132}
          height={36}
          priority
        />
        <p className={styles.tagline}>
          <FormattedMessage id="authWelcome.tagline" />
        </p>
      </header>

      {/* Real coastal hero (calm water + palm — ties to the brand mark). */}
      <div
        className={styles.hero}
        role="img"
        aria-label="A calm coastline"
        style={{ backgroundImage: "url('/hero-welcome.png')" }}
      />

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
              <LucideIcon name={m.icon} size={20} />
            </span>
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
               sandbox app — so a plain <a>, not next/link. Final URLs wire at
               the end with the marketing-domain base. */
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
    </section>
  );
}
