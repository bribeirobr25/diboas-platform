/**
 * Language Switcher Icons
 *
 * SVG icons used in the LanguageSwitcher component.
 * Flag icons are simplified, clean SVG representations for a professional look.
 */

import styles from './LanguageSwitcher.module.css';
import type { SupportedLocale } from '@diboas/i18n/server';

interface ChevronIconProps {
  isOpen: boolean;
}

export function ChevronIcon({ isOpen }: ChevronIconProps) {
  return (
    <svg
      className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckmarkIcon() {
  return (
    <svg
      className={styles.checkmark}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16.25 5L7.5 14.375L3.75 10.625"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================
   Country Flag SVG Icons
   ================================ */

interface FlagIconProps {
  size?: number;
}

/** US flag — simplified horizontal stripes + canton */
function USFlag({ size = 24 }: FlagIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <rect width="24" height="18" rx="2" fill="#fff" />
      <rect width="24" height="1.385" y="0" fill="#B22234" />
      <rect width="24" height="1.385" y="2.769" fill="#B22234" />
      <rect width="24" height="1.385" y="5.538" fill="#B22234" />
      <rect width="24" height="1.385" y="8.308" fill="#B22234" />
      <rect width="24" height="1.385" y="11.077" fill="#B22234" />
      <rect width="24" height="1.385" y="13.846" fill="#B22234" />
      <rect width="24" height="1.385" y="16.615" fill="#B22234" />
      <rect width="9.6" height="9.692" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="1.6" cy="1.2" r="0.5" /><circle cx="3.2" cy="1.2" r="0.5" /><circle cx="4.8" cy="1.2" r="0.5" /><circle cx="6.4" cy="1.2" r="0.5" /><circle cx="8" cy="1.2" r="0.5" />
        <circle cx="2.4" cy="2.4" r="0.5" /><circle cx="4" cy="2.4" r="0.5" /><circle cx="5.6" cy="2.4" r="0.5" /><circle cx="7.2" cy="2.4" r="0.5" />
        <circle cx="1.6" cy="3.6" r="0.5" /><circle cx="3.2" cy="3.6" r="0.5" /><circle cx="4.8" cy="3.6" r="0.5" /><circle cx="6.4" cy="3.6" r="0.5" /><circle cx="8" cy="3.6" r="0.5" />
        <circle cx="2.4" cy="4.8" r="0.5" /><circle cx="4" cy="4.8" r="0.5" /><circle cx="5.6" cy="4.8" r="0.5" /><circle cx="7.2" cy="4.8" r="0.5" />
        <circle cx="1.6" cy="6" r="0.5" /><circle cx="3.2" cy="6" r="0.5" /><circle cx="4.8" cy="6" r="0.5" /><circle cx="6.4" cy="6" r="0.5" /><circle cx="8" cy="6" r="0.5" />
        <circle cx="2.4" cy="7.2" r="0.5" /><circle cx="4" cy="7.2" r="0.5" /><circle cx="5.6" cy="7.2" r="0.5" /><circle cx="7.2" cy="7.2" r="0.5" />
        <circle cx="1.6" cy="8.4" r="0.5" /><circle cx="3.2" cy="8.4" r="0.5" /><circle cx="4.8" cy="8.4" r="0.5" /><circle cx="6.4" cy="8.4" r="0.5" /><circle cx="8" cy="8.4" r="0.5" />
      </g>
    </svg>
  );
}

/** Brazil flag — green field, yellow diamond, blue circle */
function BRFlag({ size = 24 }: FlagIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <rect width="24" height="18" rx="2" fill="#009739" />
      <polygon points="12,1.5 22.5,9 12,16.5 1.5,9" fill="#FEDD00" />
      <circle cx="12" cy="9" r="4.2" fill="#012169" />
      <path d="M7.8 9.6c0 0 2.8-2 8.4 0" stroke="#fff" strokeWidth="0.6" fill="none" />
    </svg>
  );
}

/** Spain flag — red-yellow-red horizontal bands */
function ESFlag({ size = 24 }: FlagIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <rect width="24" height="18" rx="2" fill="#AA151B" />
      <rect width="24" height="9" y="4.5" fill="#F1BF00" />
    </svg>
  );
}

/** Germany flag — black-red-gold horizontal bands */
function DEFlag({ size = 24 }: FlagIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <rect width="24" height="6" y="0" rx="2" ry="2" fill="#000" />
      <rect width="24" height="6" y="6" fill="#DD0000" />
      <rect width="24" height="6" y="12" rx="2" ry="2" fill="#FFCC00" />
    </svg>
  );
}

const FLAG_COMPONENTS: Record<SupportedLocale, React.ComponentType<FlagIconProps>> = {
  en: USFlag,
  'pt-BR': BRFlag,
  es: ESFlag,
  de: DEFlag,
};

/** Renders the correct SVG flag icon for a given locale */
export function FlagIcon({ locale, size = 24 }: { locale: SupportedLocale; size?: number }) {
  const Flag = FLAG_COMPONENTS[locale];
  return <Flag size={size} />;
}
