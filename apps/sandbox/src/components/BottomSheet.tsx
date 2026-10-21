'use client';

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './BottomSheet.module.css';

/**
 * The mobile bottom sheet — the native pattern the campaign's "Move Funds"
 * mockup uses (docs/sandbox-app/UI-UX-REDESIGN.md §4/§8). A11y contract:
 * role=dialog + aria-modal, focus trap + Escape + return-focus, background
 * scroll-lock, and a real close button (the drag handle is decorative — the
 * button is the keyboard/AT dismiss). Reduced-motion disables the slide.
 *
 * ⚑ RENDERED INTO THE APP FRAME (`5.566`, 2026-10-19). The overlay is `position:
 * absolute; inset: 0`, and it used to render where the sheet was declared — inside the
 * shell's scrolling content area. It therefore covered only that box: it scrolled away
 * with the content, the bottom tab bar stayed tappable behind a modal (even behind the
 * non-dismissible settlement), and the body scroll-lock locked an element that was not
 * the one scrolling. It now portals into the frame (`[data-sheet-root]`, the shell's
 * canvas: `position: relative; overflow: hidden`), so the overlay spans header, content
 * and tab bar, and no background control is reachable by pointer either. With no frame
 * (a screen rendered on its own) it renders inline, exactly as before.
 */
const SHEET_ROOT = '[data-sheet-root]';
const NO_SUBSCRIPTION = () => () => {};
const findSheetRoot = () => document.querySelector<HTMLElement>(SHEET_ROOT);
/* Server snapshot `null`: a sheet is never server-rendered open (every caller opens one
   from state), and during hydration React uses this value, so there is no mismatch. A
   sheet opened on the client resolves the frame in its FIRST render, so the focus trap
   below finds its content in the same commit. */
const NO_ROOT_ON_SERVER = () => null;

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
  const root = useSyncExternalStore(NO_SUBSCRIPTION, findSheetRoot, NO_ROOT_ON_SERVER);

  // Keep the latest onClose reachable without making it a trap dependency — a parent
  // re-render must never re-run the trap or re-grab focus. The ref is synced in its own
  // effect (writing a ref during render is disallowed).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  /* Mount ONCE: capture the true trigger before anything in the sheet takes focus, lock
     background scroll, and on unmount restore both. Split from the trap below because the
     trap may legitimately re-run once (final review 2026-10-19): when the frame did not
     exist at this sheet's first render — frame and sheet mounted in one commit — the sheet
     renders inline, then MOVES into the frame, which remounts its DOM and drops the focus
     the trap had placed. Return focus must survive that move and fire only on unmount. */
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      triggerRef.current?.focus();
    };
  }, []);

  // The trap: focus in, Tab contained, Escape closes. Re-runs if the frame appears (the
  // DOM it focused was replaced) or dismissibility changes — never on a parent re-render.
  useEffect(() => {
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
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dismissible, root]);

  const overlay = (
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
              <span className="srOnly">
                <FormattedMessage id="common.cancel" />
              </span>
            </button>
          ) : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
  return root ? createPortal(overlay, root) : overlay;
}
