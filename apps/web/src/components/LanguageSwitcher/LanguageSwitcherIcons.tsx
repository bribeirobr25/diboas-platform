/**
 * Language Switcher Icons
 *
 * SVG icons used in the LanguageSwitcher component.
 * (Country flag icons were removed 2026-07-19, C-5/B-3: the selector now uses
 * endonym labels, never flags — English ≠ USA. See LanguageSwitcher.tsx.)
 */

import styles from './LanguageSwitcher.module.css';

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
