'use client';

// State management & orchestration - Central brain

import { useNavigation } from '@/hooks/useNavigation';
import { navigationConfig } from '@/config/navigation';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
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

  // Analytics tracking with comprehensive error handling
  const trackNavigationInteraction = async (menuId: string, action: string) => {
    await analyticsService.trackEvent('navigation_interaction', {
      menu_id: menuId,
      action: action,
      path: pathname,
      timestamp: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
  };

  const navigationProps = {
    ...navigationState,
    config: navigationConfig,
    trackNavigationInteraction
  };

  return (
    <>
      <DesktopNav key="desktop-nav" {...navigationProps} />
      <MobileNav key="mobile-nav" {...navigationProps} />
    </>
  );
}