/**
 * Shared SVG Icon Components for PreDemo Screens
 *
 * Extracted from WalletDetailsScreen, LoginScreen, and ConfirmationScreen
 * to eliminate icon duplication across the PreDemo feature.
 */

import styles from '../PreDemo.module.css';

/* ================================
   Utility / UI Icons
   ================================ */

/** Heroicons-style copy icon */
export function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

/** Heroicons-style key icon */
export function KeyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}

/** Alert / info circle icon for warning boxes */
export function AlertIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={styles.alertIconInline}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/** External link icon */
export function ExternalLinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

/** Close / X icon */
export function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/** Back chevron icon */
export function BackIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/* ================================
   Brand / OAuth Icons
   ================================ */

/** Google brand icon (multi-color) */
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** X (formerly Twitter) brand icon */
export function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** MetaMask wallet brand icon */
export function MetaMaskIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path fill="#E17726" d="M20.5 2L12.5 8l1.5-3.5z" />
      <path
        fill="#E27625"
        d="M3.5 2l7.9 6.1L10 4.5zm14.1 14.5l-2.1 3.2 4.5 1.2 1.3-4.4zm-16.3 0l1.3 4.4 4.5-1.2-2.1-3.2z"
      />
      <path
        fill="#E27625"
        d="M7.3 10.5l-1.8 2.7 4.5.2-.2-4.8zm9.4 0l-2.6-2-0.1 4.9 4.5-.2zm-9.3 8.2l2.7-1.3-2.3-1.8zm5.5-1.3l2.7 1.3-.4-3.1z"
      />
      <path fill="#D5BFB2" d="M15.6 18.7l-2.7-1.3.2 1.7v.7zm-7.2 0l2.5 1.1v-.7l.2-1.7z" />
      <path fill="#233447" d="M10.9 14.8l-2.2-.7 1.6-.7zm2.2 0l.6-1.4 1.6.7z" />
      <path
        fill="#CC6228"
        d="M8.4 18.7l.4-3.2-2.5.1zm6.8-3.2l.4 3.2 2.1-3.1zm2.3-4.8l-4.5.2.4 2.1.6-1.4 1.6.7zm-10.8 1.6l1.6-.7.6 1.4.4-2.1-4.5-.2z"
      />
      <path
        fill="#E27525"
        d="M5.5 10.7l1.9 3.7-.1-1.8zm11.1 1.9l-.1 1.8 1.9-3.7zm-6.6-.3l-.4 2.1.5 2.6.1-3.5zm3 0l-.2 1.2.1 3.5.5-2.6z"
      />
      <path
        fill="#F5841F"
        d="M13.1 14.8l-.5 2.6.4.3 2.3-1.8.1-1.8zm-4.4-.7l.1 1.8 2.3 1.8.4-.3-.5-2.6z"
      />
      <path
        fill="#C0AC9D"
        d="M13.2 19.8v-.7l-.2-.2h-2l-.2.2v.7l-2.5-1.1.9.7 1.8 1.2h2.1l1.8-1.2.9-.7z"
      />
      <path fill="#161616" d="M12.9 17.4l-.4-.3h-1l-.4.3-.2 1.7.2-.2h2l.2.2z" />
      <path
        fill="#763E1A"
        d="M20.8 8.5l.7-3.3L20.5 2l-7.6 5.6 2.9 2.5 4.1 1.2.9-1.1-.4-.3.6-.6-.5-.4.6-.5zm-18.3-3.3l.7 3.3-.4.3.6.5-.5.4.6.6-.4.3.9 1.1 4.1-1.2L11.1 7.6 3.5 2z"
      />
      <path
        fill="#F5841F"
        d="M19.9 11.3l-4.1-1.2 1.2 1.9-1.9 3.7 2.6-.1h3.8zm-15.8-1.2l-4.1 1.2 1.5 4.4h3.8l2.6.1-1.9-3.7zm6.9 2.2l.3-4.7 1.2-3.3h-5.4l1.2 3.3.3 4.7.1 1.2v3.4h1l.1-3.4z"
      />
    </svg>
  );
}

/* ================================
   Transaction Type Icons
   ================================ */

/** Deposit / plus icon */
export function DepositIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/** Send / arrow-right icon */
export function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/** Invest / trend-up icon */
export function InvestIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
