'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './BottomSheet.module.css';

/**
 * The mobile bottom sheet — the native pattern the campaign's "Move Funds"
 * mockup uses (docs/sandbox-app/UI-UX-REDESIGN.md §4/§8). A11y contract:
 * role=dialog + aria-modal, focus trap + Escape + return-focus, background
 * scroll-lock, and a real close button (the drag handle is decorative — the
 * button is the keyboard/AT dismiss). Reduced-motion disables the slide.
 */
export function BottomSheet({
  titleId,
  titleValues,
  onClose,
  children,
  tone = 'light',
  dismissible = true,
}: {
  titleId: string;
  titleValues?: Record<string, ReactNode>;
  onClose: () => void;
  children: ReactNode;
  /** 'ink' = the high-gravity path/manifest surface; 'light' = default. */
  tone?: 'light' | 'ink';
  /** false = in-progress state that must not be dismissed (no X, no Escape,
   *  no overlay-close) — e.g. the settlement confirmation (UX-14). */
  dismissible?: boolean;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Keep the latest onClose reachable without making it a trap dependency —
  // the trap must set up ONCE on mount so return-focus captures the true trigger
  // (a parent re-render must never re-run the trap or re-grab focus). The ref is
  // synced in its own effect (writing a ref during render is disallowed).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    // Focus the close button if present, else the sheet itself (non-dismissible).
    (closeRef.current ?? sheetRef.current)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (dismissible) {
          e.preventDefault();
          onCloseRef.current();
        }
        return;
      }
      if (e.key !== 'Tab') return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      // No focusables (e.g. the non-dismissible settlement sheet): keep focus
      // contained on the sheet so Tab can't reach background controls behind the
      // overlay and abort an in-progress move.
      if (focusables.length === 0) {
        e.preventDefault();
        sheet.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [dismissible]);

  return (
    <div className={styles.overlay} onClick={dismissible ? onClose : undefined}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        className={`${styles.sheet} ${tone === 'ink' ? styles.ink : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden />
        <div className={styles.head}>
          <h2 id="sheet-title" className={styles.title}>
            <FormattedMessage id={titleId} values={titleValues} />
          </h2>
          {dismissible ? (
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
              <LucideIcon name="x" size={18} />
              <span className={styles.srOnly}>
                <FormattedMessage id="common.cancel" />
              </span>
            </button>
          ) : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
