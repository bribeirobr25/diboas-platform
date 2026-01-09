'use client';

/**
 * Mobile Submenu View
 *
 * Full-screen submenu with header, banner, and items
 */

import Image from 'next/image';
import { NavigationToggle, ChevronLeftIcon, LocaleLink } from '@/components/UI';
import { UI_CONSTANTS } from '@/config/ui-constants';
import { DESIGN_SYSTEM } from '@/config/design-system';
import type { NavigationItem } from '@/types/navigation';

interface MobileSubmenuProps {
  activeMenuItem: NavigationItem | undefined;
  goBack: () => void;
  toggleMenu: () => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  t: (key: string) => string;
}

export function MobileSubmenu({
  activeMenuItem,
  goBack,
  toggleMenu,
  trackNavigationInteraction,
  t,
}: MobileSubmenuProps) {
  if (!activeMenuItem) return null;

  return (
    <div className="mobile-submenu-container" data-submenu-scroll>
      {/* Sticky Header with Back and Close buttons */}
      <div className="mobile-submenu-header-container">
        <button onClick={goBack} className="mobile-back-button-content">
          <ChevronLeftIcon />
          <span className="mobile-back-button-text">
            {t('common.navigation.back')}
          </span>
        </button>
        <button
          onClick={toggleMenu}
          className="mobile-close-button"
          aria-label={UI_CONSTANTS.TEXT.CLOSE_MENU}
        >
          <NavigationToggle isOpen={true} />
        </button>
      </div>

      {/* Sticky Banner */}
      <div
        className="mobile-submenu-banner-container sticky bg-primary-100 w-full z-30"
        style={{ top: `calc(${DESIGN_SYSTEM.LAYOUT.NAVIGATION.MOBILE_NAV_HEIGHT} + 9px)` }}
      >
        <div className="mobile-banner-wrapper">
          {activeMenuItem.banner && (
            <div className="mobile-banner-image-wrapper">
              <div className="mobile-banner-image-container-inner">
                <Image
                  src={activeMenuItem.banner}
                  alt={t(activeMenuItem.label)}
                  fill
                  className="mobile-banner-image-content"
                  sizes="(max-width: 768px) 384px, 384px"
                  priority
                />
              </div>
            </div>
          )}
          <div className="mobile-banner-text-container">
            <h2 className="mobile-banner-title-text">
              {t(activeMenuItem.label)}
            </h2>
            {activeMenuItem.description && (
              <p className="mobile-banner-description-text">
                {t(activeMenuItem.description)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Submenu Items */}
      <div className="mobile-submenu-content">
        {activeMenuItem.subItems?.map((subItem) => (
          <LocaleLink
            key={subItem.id}
            href={subItem.href}
            className="mobile-submenu-link"
            onClick={() => {
              trackNavigationInteraction(subItem.id, 'click');
              toggleMenu();
            }}
          >
            <h4 className="mobile-submenu-link-title">{t(subItem.label)}</h4>
            {subItem.description && (
              <p className="mobile-submenu-link-description">{t(subItem.description)}</p>
            )}
          </LocaleLink>
        ))}
      </div>
    </div>
  );
}
