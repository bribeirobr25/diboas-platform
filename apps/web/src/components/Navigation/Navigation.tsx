'use client';

import { useNavigation } from '@/hooks/useNavigation';
import { navigationConfig } from '@/config/navigation';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const nav = useNavigation();
  const pathname = usePathname();
  
  // Close navigation on route change
  useEffect(() => {
    nav.closeMenu();
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (nav.isOpen && nav.isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [nav.isOpen, nav.isMobile]);

  // Analytics tracking
  const trackMenuClick = (menuId: string, action: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'navigation_interaction', {
        menu_id: menuId,
        action: action,
        path: pathname
      });
    }
  };

  const navigationProps = {
    ...nav,
    config: navigationConfig,
    trackMenuClick
  };

  return (
    <>
      <DesktopNav {...navigationProps} />
      <MobileNav {...navigationProps} />
    </>
  );
}