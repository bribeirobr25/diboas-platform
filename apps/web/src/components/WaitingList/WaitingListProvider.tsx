'use client';

/**
 * Waiting List Provider
 *
 * Global context for waiting list modal state
 * Following React Context pattern
 *
 * The click interceptor that turned every app.diboas.com link into this modal was removed with
 * the demo (plan P13, D1): links to Practice now open Practice.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { WaitingListContextValue } from '@/lib/waitingList/types';
import type { WaitlistSource } from '@/lib/waitingList/store/types';
import dynamic from 'next/dynamic';

// Lazy-load WaitingListModal — only shown after user clicks a waitlist CTA
const WaitingListModal = dynamic(
  () => import('./WaitingListModal').then((m) => ({ default: m.WaitingListModal })),
  { ssr: false, loading: () => null }
);
import { analyticsService } from '@/lib/analytics';

const WaitingListContext = createContext<WaitingListContextValue | null>(null);

interface WaitingListProviderProps {
  children: ReactNode;
}

export function WaitingListProvider({ children }: WaitingListProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  /* The path that opened the modal (`5.979`, plan P11 D1); null until the first open. */
  const [openedFrom, setOpenedFrom] = useState<WaitlistSource | null>(null);
  /* A modal signup was stored on this page (D5): in memory, never written to storage. */
  const [joined, setJoined] = useState(false);

  // One-time hydration gate for portal rendering. setState-in-effect is
  // the canonical React pattern for "render only after hydration"; the
  // lint rule is overly strict for this single-use case.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // The modal mounts only once an opener names its source; fetch its code after hydration
    // so the first open shows at once. A failed fetch is ignored here; the open itself
    // loads (and reports) it again.
    import('./WaitingListModal').catch(() => {});
  }, []);

  const openModal = useCallback((source: WaitlistSource) => {
    setOpenedFrom(source);
    setIsOpen(true);
    // The opened event carries the opener's path, the same value the signup sends
    // (plan P11 D1), so the funnel can be read per path.
    analyticsService.track({
      name: 'waiting_list_modal_opened',
      parameters: {
        source,
        timestamp: Date.now(),
      },
    });
  }, []);

  const markJoined = useCallback(() => setJoined(true), []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // P10: Track modal close event
    analyticsService.track({
      name: 'waiting_list_modal_closed',
      parameters: {
        timestamp: Date.now(),
      },
    });
  }, []);

  // Escape is handled by the modal's focus trap (its onEscape calls closeModal). A second,
  // document-level listener here closed it twice and sent two close events (fifteenth audit).
  // Prevent body scroll when modal is open.
  // Only capture/restore when transitioning to open — avoids resetting
  // overflow on initial mount (which conflicts with other components
  // that may lock body scroll).
  useEffect(() => {
    if (!isOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const contextValue = useMemo<WaitingListContextValue>(
    () => ({ isOpen, openModal, closeModal, joined }),
    [isOpen, openModal, closeModal, joined]
  );

  return (
    <WaitingListContext.Provider value={contextValue}>
      {children}
      {/* Mounted once an opener has named its source: the modal never posts without one. */}
      {mounted && openedFrom !== null
        ? createPortal(
            <WaitingListModal
              isOpen={isOpen}
              onClose={closeModal}
              source={openedFrom}
              onJoined={markJoined}
            />,
            document.body
          )
        : null}
    </WaitingListContext.Provider>
  );
}

export function useWaitingListModal(): WaitingListContextValue {
  const context = useContext(WaitingListContext);
  if (!context) {
    throw new Error('useWaitingListModal must be used within a WaitingListProvider');
  }
  return context;
}
