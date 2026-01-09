'use client';

/**
 * Mobile Nav Header Component
 *
 * Top header bar with logo, CTA button, and hamburger toggle
 */

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import { NavigationToggle, LocaleLink } from '@/components/UI';
import { UI_CONSTANTS } from '@/config/ui-constants';
import { ASSET_PATHS } from '@/config/assets';
import { DESIGN_SYSTEM } from '@/config/design-system';
import { BRAND_CONFIG } from '@/config/brand';
import type { NavigationConfig } from '@/types/navigation';

interface MobileNavHeaderProps {
  isOpen: boolean;
  toggleMenu: () => void;
  trackNavigationInteraction: (menuId: string, action: string) => void;
  config: NavigationConfig;
  primaryLabel: string;
}

export function MobileNavHeader({
  isOpen,
  toggleMenu,
  trackNavigationInteraction,
  config,
  primaryLabel,
}: MobileNavHeaderProps) {
  return (
    <nav className="mobile-nav-bar">
      <div className="mobile-nav-content">
        <LocaleLink href="/" className="mobile-brand" aria-label={`${BRAND_CONFIG.NAME} Home`}>
          <Image
            src={ASSET_PATHS.LOGOS.ICON}
            alt={BRAND_CONFIG.NAME}
            width={56}
            height={56}
            style={{ width: 'auto', height: DESIGN_SYSTEM.LAYOUT.NAVIGATION.MOBILE_NAV_HEIGHT }}
            priority
          />
        </LocaleLink>

        <Link
          href={config.actions.primary.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackNavigationInteraction('get-started-mobile', 'click')}
          className="inline-block"
        >
          <Button
            variant={DEFAULT_CTA_PROPS.variant}
            size="xs"
            trackable={DEFAULT_CTA_PROPS.trackable}
            className="mobile-get-started-button"
          >
            {primaryLabel}
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
  );
}
