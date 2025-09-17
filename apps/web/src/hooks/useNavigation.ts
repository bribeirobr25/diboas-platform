'use client';

import { useState, useEffect, useCallback } from 'react';
import { NavigationState } from '@/types/navigation';

export function useNavigation() {
  const [state, setState] = useState<NavigationState>({
    isOpen: false,
    activeMenu: null,
    activeSubmenu: null,
    isMobile: false
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setState(prev => ({ ...prev, isMobile: window.innerWidth < 768 }));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setState(prev => ({ ...prev, isOpen: false, activeMenu: null, activeSubmenu: null }));
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      activeMenu: null,
      activeSubmenu: null
    }));
  }, []);

  const openMenu = useCallback((menuId: string) => {
    setState(prev => ({
      ...prev,
      activeMenu: menuId,
      activeSubmenu: null
    }));
  }, []);

  const closeMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeMenu: null,
      activeSubmenu: null
    }));
  }, []);

  const openSubmenu = useCallback((submenuId: string) => {
    setState(prev => ({
      ...prev,
      activeSubmenu: submenuId
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeSubmenu: null
    }));
  }, []);

  return {
    ...state,
    toggleMenu,
    openMenu,
    closeMenu,
    openSubmenu,
    goBack
  };
}