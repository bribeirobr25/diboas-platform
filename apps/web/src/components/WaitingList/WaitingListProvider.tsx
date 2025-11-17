'use client';

/**
 * Waiting List Provider
 *
 * Global context for waiting list modal state
 * Includes click interceptor for app.diboas.com links
 * Following React Context pattern
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ENV_CONFIG } from '@/config/environment';
import { WaitingListContextValue } from '@/lib/waitingList/types';
import { WaitingListModal } from './WaitingListModal';

const WaitingListContext = createContext<WaitingListContextValue | null>(null);

interface WaitingListProviderProps {
  children: ReactNode;
}

export function WaitingListProvider({ children }: WaitingListProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure portal is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Global click interceptor for app.diboas.com / localhost:3001 links
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if link points to app URL (either absolute or matching ENV_CONFIG)
      const appUrl = ENV_CONFIG.APP_URL;
      const isAppLink =
        href.startsWith(appUrl) ||
        href.includes('app.diboas.com') ||
        href.includes('localhost:3001');

      if (isAppLink) {
        event.preventDefault();
        event.stopPropagation();
        openModal();
      }
    };

    // Add listener on capture phase to intercept before other handlers
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [openModal]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const contextValue: WaitingListContextValue = {
    isOpen,
    openModal,
    closeModal,
  };

  return (
    <WaitingListContext.Provider value={contextValue}>
      {children}
      {mounted &&
        createPortal(
          <WaitingListModal isOpen={isOpen} onClose={closeModal} />,
          document.body
        )}
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
