'use client';

// Mobile UI only

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { NavigationConfig } from '@/types/navigation';
import { useEffect } from 'react';
import { NavigationToggle, ChevronRightIcon, ChevronLeftIcon } from '@/components/UI';
import { UI_CONSTANTS } from '@/config/ui-constants';
import { ASSET_PATHS } from '@/config/assets';
import { DESIGN_SYSTEM } from '@/config/design-system';
import { BRAND_CONFIG } from '@/config/brand';

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
  const activeMenuItem = config.mainMenu.find(item => item.id === activeSubmenu);

  // Scroll to top when submenu opens
  useEffect(() => {
    if (activeSubmenu) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Reset both window scroll and submenu container scroll
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
      <nav className="mobile-nav-bar">
        <div className="mobile-nav-content">
          <Link href="/" className="mobile-brand" aria-label={`${BRAND_CONFIG.NAME} Home`}>
            <Image
              src={ASSET_PATHS.LOGOS.ICON}
              alt={BRAND_CONFIG.NAME}
              width={56}
              height={56}
              style={{ width: 'auto', height: DESIGN_SYSTEM.LAYOUT.NAVIGATION.MOBILE_NAV_HEIGHT }}
              priority
            />
          </Link>

          <Link
            href={config.actions.primary.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackNavigationInteraction('get-started-mobile', 'click')}
            className="inline-block"
          >
            <Button
              variant="gradient"
              size="xs"
              className="mobile-get-started-button"
            >
              {config.actions.primary.label}
            </Button>
          </Link>

          <button
            onClick={toggleMenu}
            className="mobile-toggle-button"
            aria-label={UI_CONSTANTS.TEXT.TOGGLE_MENU}
          >
            <NavigationToggle isOpen={isOpen} />
          </button>
        </div>
      </nav>

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
            variant="gradient"
            size="lg"
            className="w-full rounded-none text-center py-4"
          >
            {config.actions.secondary.label}
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
            /* Main Mobile Menu */
            <div className="mobile-menu-section">
              {/* Highlights */}
              <div className="mobile-highlights-section">
                <h3 className="mobile-section-header">
                  Quick Actions
                </h3>
                <div className="mobile-quick-actions-grid">
                  {config.mobileHighlights.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href || '#'}
                      className="mobile-quick-action-item"
                      onClick={() => {
                        trackNavigationInteraction(item.id, 'click');
                        toggleMenu();
                      }}
                    >
                      <p className="mobile-quick-action-text">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Sections */}
              {config.mobileSections.map((section) => (
                <div key={section.title} className="mobile-menu-section-container">
                  <h3 className="mobile-section-header">
                    {section.title}
                  </h3>
                  <div className="mobile-menu-sections">
                    {section.items.map((item) => {
                      const menuItem = config.mainMenu.find(m => m.id === item.id);
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => {
                              openSubmenu(item.id);
                              trackNavigationInteraction(item.id, 'open');
                            }}
                            className="mobile-main-menu-button"
                            aria-label={`Open ${item.label} menu`}
                          >
                            <span className="mobile-main-menu-text">
                              {item.label}
                            </span>
                            <ChevronRightIcon className="mobile-main-menu-icon" aria-hidden="true" />
                          </button>
                          {config.mainMenu.find(m => m.id === item.id)?.description && (
                            <p className="mobile-menu-description-text">
                              {config.mainMenu.find(m => m.id === item.id)?.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Additional Menu Items */}
              <div className="border-t pt-6 space-y-2">
                {['security', 'about'].map(id => {
                  const item = config.mainMenu.find(m => m.id === id);
                  if (!item) return null;

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => {
                          openSubmenu(item.id);
                          trackNavigationInteraction(item.id, 'open');
                        }}
                        className="mobile-additional-menu-button"
                        aria-label={`Open ${item.label} menu`}
                      >
                        <span className="mobile-additional-menu-text">
                          {item.label}
                        </span>
                        <ChevronRightIcon className="mobile-main-menu-icon" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Submenu View */
            <div
              className="h-full flex flex-col bg-white overflow-y-auto animate-slide-from-right"
              data-submenu-scroll
            >
              {/* Sticky Header with Back and Close buttons */}
              <div className="mobile-submenu-header-container">
                <button
                  onClick={goBack}
                  className="mobile-back-button-content"
                >
                  <ChevronLeftIcon />
                  <span className="mobile-back-button-text">Back</span>
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
              {activeMenuItem && (
                <div className="sticky bg-teal-50 w-full z-30" style={{ top: `calc(${DESIGN_SYSTEM.LAYOUT.NAVIGATION.MOBILE_NAV_HEIGHT} + 9px)`, height: DESIGN_SYSTEM.LAYOUT.NAVIGATION.MOBILE_SUBMENU_HEIGHT }}>
                  <div className="mobile-banner-wrapper">
                    {activeMenuItem.banner && (
                      <div className="mobile-banner-image-wrapper">
                        <div className="mobile-banner-image-container-inner">
                          <Image
                            src={activeMenuItem.banner}
                            alt={activeMenuItem.label}
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
                        {activeMenuItem.label}
                      </h2>
                      {activeMenuItem.description && (
                        <p className="mobile-banner-description-text">
                          {activeMenuItem.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Scrollable Submenu Items */}
              <div className="mobile-submenu-content">
                {activeMenuItem?.subItems?.map((subItem) => (
                  <Link
                    key={subItem.id}
                    href={subItem.href}
                    className="mobile-submenu-link"
                    onClick={() => {
                      trackNavigationInteraction(subItem.id, 'click');
                      toggleMenu();
                    }}
                  >
                    <h4 className="mobile-submenu-link-title">{subItem.label}</h4>
                    {subItem.description && (
                      <p className="mobile-submenu-link-description">{subItem.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}