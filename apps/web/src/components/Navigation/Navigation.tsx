'use client';

import { useNavigation } from '@/hooks/useNavigation';
import { navigationConfig } from '@/config/navigation';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const navigationState = useNavigation();
  const pathname = usePathname();
  
  // Close navigation on route change
  useEffect(() => {
    navigationState.closeMenu();
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (navigationState.isOpen && navigationState.isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [navigationState.isOpen, navigationState.isMobile]);

  // Analytics tracking
  const trackNavigationInteraction = (menuId: string, action: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'navigation_interaction', {
        menu_id: menuId,
        action: action,
        path: pathname
      });
    }
  };

  const navigationProps = {
    ...navigationState,
    config: navigationConfig,
    trackNavigationInteraction
  };

  return (
    <>
      <DesktopNav {...navigationProps} />
      <MobileNav {...navigationProps} />
    </>
  );
}