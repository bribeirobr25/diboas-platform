'use client';

/**
 * Waiting List Provider
 *
 * Global context for waiting list modal state
 * Includes click interceptor for app.diboas.com links
 * Following React Context pattern
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
import { APP_URL } from '@/config/env';
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
  }, []);

  const openModal = useCallback((source: WaitlistSource) => {
    setOpenedFrom(source);
    setIsOpen(true);
    // The opened event carries the opener's path. Before P11 every open was tagged
    // `app_link_intercept`, Dream Mode's included (a recorded rename, plan P11 D1).
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

  // Global click interceptor for app.diboas.com / localhost:3001 links
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if link points to app URL
      const appUrl = APP_URL;
      const isAppLink =
        href.startsWith(appUrl) ||
        href.includes('app.diboas.com') ||
        href.includes('localhost:3001');

      if (isAppLink) {
        event.preventDefault();
        event.stopPropagation();
        openModal('app_link');
      }
    };

    // Add listener on capture phase to intercept before other handlers
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [openModal]);

  // Escape is handled by the modal's focus trap (its onEscape calls closeModal). A second,
  // document-level listener here closed it twice and sent two close events (fifteenth audit).
  // Prevent body scroll when modal is open.
  // Only capture/restore when transitioning to open — avoids resetting
  // overflow on initial mount (which conflicts with other components
  // that may lock body scroll, e.g. DemoPageContent).
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
