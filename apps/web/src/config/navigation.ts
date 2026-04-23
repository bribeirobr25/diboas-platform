/**
 * Navigation Configuration
 *
 * Full desktop/mobile navigation removed 2026-04-04 (marketing pages deleted).
 * Only MinimalNavigation remains, which does not use this config.
 * Kept as a stub for future Phase 2+ navigation needs.
 */

import { NavigationConfig } from '@/types/navigation';
import { ASSET_PATHS } from '@/config/assets';
import { BUSINESS_URL } from '@/config/env';
import { ROUTES } from '@/config/routes';

const createUrl = (path: string): string => path;

export const navigationConfig: NavigationConfig = {
  mainMenu: [
    {
      id: 'about',
      label: 'common.navigation.aboutMenu.label',
      banner: ASSET_PATHS.NAVIGATION.ABOUT_BANNER,
      description: 'common.navigation.aboutMenu.description',
      subItems: [
        { id: 'about-diboas', label: 'common.navigation.aboutMenu.subItems.about', href: createUrl(ROUTES.ABOUT) },
        { id: 'protocols', label: 'common.navigation.aboutMenu.subItems.protocols', href: createUrl(ROUTES.PROTOCOLS) },
      ]
    }
  ],

  mobileHighlights: [],

  mobileSections: [],

  actions: {
    primary: {
      label: 'common.navigation.actions.demo',
      href: ROUTES.DEMO,
      variant: 'primary'
    },
    secondary: {
      label: 'common.navigation.actions.secondary',
      href: BUSINESS_URL,
      variant: 'secondary'
    }
  }
};
