'use client';

/**
 * Mobile Navigation Component
 *
 * Full-screen mobile menu with header, main menu, and submenu views
 * Refactored: Sub-components extracted for maintainability
 */

import Link from 'next/link';
import { Button } from '@diboas/ui';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import { NavigationConfig } from '@/types/navigation';
import { useEffect, useCallback } from 'react';
import { DESIGN_SYSTEM } from '@/config/design-system';
import { UI_CONSTANTS } from '@/config/ui-constants';
import { useTranslation } from '@diboas/i18n/client';
import { MobileNavHeader, MobileMenuMain, MobileSubmenu } from './MobileNav/index';

interface MobileNavProps {
  isOpen: boolean;
  activeMenu: string | null;
  activeSubmenu: string | null;
  toggleMenu: () => void;
  openMenu: (menuId: string) => void;
  openSubmenu: (submenuId: string) => void;
  closeMenu: () => void;
  goBack: () => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  config: NavigationConfig;
  isMobile: boolean;
}

export default function MobileNav({
  isOpen,
  activeSubmenu,
  toggleMenu,
  openSubmenu,
  goBack,
  trackNavigationInteraction,
  config,
  isMobile
}: MobileNavProps) {
  const intl = useTranslation();
  const activeMenuItem = config.mainMenu.find(item => item.id === activeSubmenu);

  // Translation helper
  const t = useCallback((key: string) => {
    return intl.formatMessage({ id: key });
  }, [intl]);

  // Scroll to top when submenu opens
  useEffect(() => {
    if (activeSubmenu) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const submenuContainer = document.querySelector('[data-submenu-scroll]');
        if (submenuContainer) {
          submenuContainer.scrollTop = 0;
        }
      }, UI_CONSTANTS.ANIMATION.MOBILE_NAV_CLOSE_DELAY);
    }
  }, [activeSubmenu]);

  // Don't render on non-mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <MobileNavHeader
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        trackNavigationInteraction={trackNavigationInteraction}
        config={config}
        primaryLabel={t(config.actions.primary.label)}
      />

      {/* Business Login Button - Only show when not in submenu */}
      {isOpen && !activeSubmenu && (
        <Link
          href={config.actions.secondary.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNavigationInteraction('business-login-mobile', 'click')}
          className="mobile-actions"
        >
          <Button
            variant={DEFAULT_CTA_PROPS.variant}
            size={DEFAULT_CTA_PROPS.size}
            trackable={DEFAULT_CTA_PROPS.trackable}
            className="w-full rounded-none text-center py-4"
          >
            {t(config.actions.secondary.label)}
          </Button>
        </Link>
      )}

      {/* Mobile Menu */}
      <div
        className={`mobile-menu-overlay ${activeSubmenu ? 'z-50' : 'z-40'}`}
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
          transition: `transform ${DESIGN_SYSTEM.ANIMATION.DURATION.SLOW} ${DESIGN_SYSTEM.ANIMATION.EASING.EASE_OUT}`
        }}
      >
        <div className={`h-full overflow-y-auto ${!activeSubmenu ? 'pt-16 pb-20' : ''}`}>
          {!activeSubmenu ? (
            <MobileMenuMain
              config={config}
              openSubmenu={openSubmenu}
              toggleMenu={toggleMenu}
              trackNavigationInteraction={trackNavigationInteraction}
              t={t}
            />
          ) : (
            <MobileSubmenu
              activeMenuItem={activeMenuItem}
              goBack={goBack}
              toggleMenu={toggleMenu}
              trackNavigationInteraction={trackNavigationInteraction}
              t={t}
            />
          )}
        </div>
      </div>
    </>
  );
}
