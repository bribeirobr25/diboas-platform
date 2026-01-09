'use client';

/**
 * Mobile Menu Main View
 *
 * Main menu with highlights, sections, and additional items
 */

import { Button } from '@diboas/ui';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import { ChevronRightIcon, LocaleLink } from '@/components/UI';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import type { NavigationConfig } from '@/types/navigation';

interface MobileMenuMainProps {
  config: NavigationConfig;
  openSubmenu: (submenuId: string) => void;
  toggleMenu: () => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  t: (key: string) => string;
}

export function MobileMenuMain({
  config,
  openSubmenu,
  toggleMenu,
  trackNavigationInteraction,
  t,
}: MobileMenuMainProps) {
  return (
    <div className="mobile-menu-section">
      {/* Highlights */}
      <div className="mobile-highlights-section">
        <h3 className="mobile-section-header">
          {t('common.navigation.quickActions')}
        </h3>
        <div className="mobile-quick-actions-grid">
          {config.mobileHighlights.map((item) => (
            <LocaleLink
              key={item.id}
              href={item.href || '#'}
              className="mobile-quick-action-item"
              onClick={() => {
                trackNavigationInteraction(item.id, 'click');
                toggleMenu();
              }}
            >
              <p className="mobile-quick-action-text">{t(item.label)}</p>
            </LocaleLink>
          ))}
        </div>
      </div>

      {/* Language Switcher */}
      <div className="px-6 py-4 border-t border-white">
        <h3 className="mobile-section-header mb-3">
          {t('common.languageSwitcher.label')}
        </h3>
        <LanguageSwitcher variant="inline" size="sm" />
      </div>

      {/* Mobile Sections */}
      {config.mobileSections.map((section) => (
        <MobileMenuSection
          key={section.title}
          section={section}
          config={config}
          openSubmenu={openSubmenu}
          trackNavigationInteraction={trackNavigationInteraction}
          t={t}
        />
      ))}

      {/* Additional Menu Items */}
      <div className="border-t border-white pt-6 space-y-2">
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
                aria-label={`Open ${t(item.label)} menu`}
              >
                <span className="mobile-additional-menu-text">
                  {t(item.label)}
                </span>
                <ChevronRightIcon className="mobile-main-menu-icon" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MobileMenuSectionProps {
  section: { title: string; items: { id: string; label: string }[] };
  config: NavigationConfig;
  openSubmenu: (submenuId: string) => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  t: (key: string) => string;
}

function MobileMenuSection({
  section,
  config,
  openSubmenu,
  trackNavigationInteraction,
  t,
}: MobileMenuSectionProps) {
  return (
    <div className="mobile-menu-section-container">
      <h3 className="mobile-section-header">
        {t(section.title)}
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
                aria-label={`Open ${t(item.label)} menu`}
              >
                <span className="mobile-main-menu-text">
                  {t(item.label)}
                </span>
                <ChevronRightIcon className="mobile-main-menu-icon" aria-hidden="true" />
              </button>
              {menuItem?.description && (
                <p className="mobile-menu-description-text">
                  {t(menuItem.description)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
