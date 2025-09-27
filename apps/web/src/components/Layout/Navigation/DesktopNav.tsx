'use client';

// Desktop UI only

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { NavigationConfig } from '@/types/navigation';
import { Container, FlexBetween, SparklesIcon, ChevronRightIcon } from '@/components/UI';
import { ASSET_PATHS } from '@/config/assets';
import { DESIGN_SYSTEM } from '@/config/design-system';
import { BRAND_CONFIG } from '@/config/brand';

interface DesktopNavProps {
  activeMenu: string | null;
  openMenu: (menuId: string) => void;
  closeMenu: () => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  config: NavigationConfig;
  isMobile: boolean;
}

export default function DesktopNav({
  activeMenu,
  openMenu,
  closeMenu,
  trackNavigationInteraction,
  config,
  isMobile
}: DesktopNavProps) {
  if (isMobile) return null;

  const activeMenuItem = config.mainMenu.find(item => item.id === activeMenu);

  return (
    <nav className="navigation-bar" onMouseLeave={closeMenu}>
      <Container>
        <FlexBetween className="navigation-content">
          {/* Logo */}
          <Link href="/" className="brand-logo" aria-label={`${BRAND_CONFIG.NAME} Home`}>
            <Image
              src={ASSET_PATHS.LOGOS.ICON}
              alt={BRAND_CONFIG.NAME}
              width={76}
              height={76}
              style={{ width: 'auto', height: 'auto', maxHeight: '76px' }}
              priority
            />
          </Link>

          {/* Main Menu */}
          <div className="menu-items">
            {config.mainMenu.map((item) => (
              <button
                key={item.id}
                className="menu-link group"
                aria-label={`${item.label} menu`}
                aria-expanded={activeMenu === item.id}
                aria-haspopup="true"
                onMouseEnter={() => {
                  openMenu(item.id);
                  trackNavigationInteraction(item.id, 'hover');
                }}
              >
                {item.icon && <SparklesIcon />}
                <span className="menu-link-text">{item.label}</span>
                <ChevronRightIcon size="xs" className="menu-link-icon" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons-container">
            <Link
              href={config.actions.secondary.href}
              className="action-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNavigationInteraction('business-login', 'click')}
            >
              {config.actions.secondary.label}
            </Link>
            <Link
              href={config.actions.primary.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackNavigationInteraction('get-started', 'click')}
              className="action-button-wrapper"
            >
              <Button
                variant="gradient"
                size="sm"
                className="desktop-get-started-button"
              >
                {config.actions.primary.label}
              </Button>
            </Link>
          </div>
        </FlexBetween>
      </Container>

      {/* Mega Menu */}
      {activeMenu && activeMenuItem && (
        <div
          className="dropdown-overlay"
          style={{
            top: DESIGN_SYSTEM.LAYOUT.NAVIGATION.DESKTOP_HEIGHT,
          }}
        >
          <div className="dropdown-menu" style={{ height: DESIGN_SYSTEM.LAYOUT.NAVIGATION.DROPDOWN_HEIGHT }}>
            <Container className="dropdown-content h-full" style={{ marginLeft: DESIGN_SYSTEM.LAYOUT.SPACING.DROPDOWN_MARGIN_LEFT }}>
              <div className="dropdown-section grid-cols-12 gap-8 h-full">
                {/* Left: Banner */}
                <div className="dropdown-banner-container">
                  <div className="dropdown-banner-image">
                    <Image
                      src={activeMenuItem.banner || ''}
                      alt={activeMenuItem.label}
                      fill
                      className="dropdown-banner-image-content"
                      sizes="(max-width: 768px) 100vw, 384px"
                      priority
                    />
                  </div>
                  <h3 className="dropdown-title">
                    {activeMenuItem.label}
                  </h3>
                  <p className="dropdown-item-description">
                    {activeMenuItem.description}
                  </p>
                </div>

                {/* Right: Sub-menu items in columns */}
                <div className="dropdown-items-container">
                  <div className="dropdown-items-grid">
                    {activeMenuItem.subItems?.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.href}
                        className="dropdown-item-content group"
                        onClick={() => trackNavigationInteraction(subItem.id, 'click')}
                      >
                        <div>
                          <h4 className="dropdown-item-title">
                            {subItem.label}
                          </h4>
                          {subItem.description && (
                            <p className="dropdown-item-description-text">
                              {subItem.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </Container>
          </div>
        </div>
      )}
    </nav>
  );
}