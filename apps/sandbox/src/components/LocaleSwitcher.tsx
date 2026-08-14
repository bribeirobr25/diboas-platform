'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useIntl } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import {
  isSandboxLocale,
  LOCALE_COOKIE,
  LOCALE_ENDONYM,
  SANDBOX_LOCALES,
  type SandboxLocale,
} from '@/i18n/config';
import styles from './LocaleSwitcher.module.css';

/**
 * Language chooser — the third leg of the sandbox i18n story (with browser
 * detection at the `/` entry and the persisted NEXT_LOCALE cookie). A globe
 * opens a menu of endonyms (never flags: English is not the USA, the C-5/B-3
 * ruling); choosing one saves the cookie and swaps the locale segment of the
 * current path, so the same screen reloads in the new language. Mirrors the
 * marketing-site LanguageSwitcher (dropdown, Escape + click-outside, aria).
 */
export function LocaleSwitcher({
  locale,
  className,
  variant = 'chip',
}: {
  locale: string;
  className?: string;
  /** `chip` = translucent round chip (over the hero, beside ThemeToggle);
   *  `bare` = no fill/border (inside the app bar, where space is tight). */
  variant?: 'chip' | 'bare';
}) {
  const intl = useIntl();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current: SandboxLocale = isSandboxLocale(locale) ? locale : 'en';

  // Close on outside click / Escape (Escape returns focus to the trigger).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector<HTMLElement>('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = useCallback(
    (next: SandboxLocale) => {
      setOpen(false);
      if (next === current) return;
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax${secure}`;
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length && isSandboxLocale(segments[0])) segments.shift();
      router.push(`/${next}${segments.length ? '/' + segments.join('/') : ''}`);
    },
    [current, pathname, router]
  );

  return (
    <div ref={ref} className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={variant === 'bare' ? `${styles.trigger} ${styles.triggerBare}` : styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={intl.formatMessage(
          { id: 'locale.switch' },
          { current: LOCALE_ENDONYM[current] }
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <LucideIcon name="globe" size={20} />
      </button>
      {open ? (
        <ul
          className={styles.menu}
          role="listbox"
          aria-label={intl.formatMessage({ id: 'locale.label' })}
        >
          {SANDBOX_LOCALES.map((l) => (
            <li key={l} role="option" aria-selected={l === current}>
              <button
                type="button"
                className={styles.option}
                aria-current={l === current ? 'true' : undefined}
                onClick={() => choose(l)}
              >
                <span>{LOCALE_ENDONYM[l]}</span>
                {l === current ? <LucideIcon name="check" size={16} /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
