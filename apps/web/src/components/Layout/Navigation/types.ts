// Type definitions only - Type safety and documentation ensure type consistency

import { NavigationConfig } from '@/types/navigation';

// Shared base props
interface BaseNavProps {
  config: NavigationConfig;
  isMobile: boolean;
  trackNavigationInteraction: (menuId: string, action: string) => void;
}

// Desktop-specific props
export interface DesktopNavProps extends BaseNavProps {
  activeMenu: string | null;
  openMenu: (menuId: string) => void;
  closeMenu: () => void;
}

// Mobile-specific props
export interface MobileNavProps extends BaseNavProps {
  isOpen: boolean;
  activeSubmenu: string | null;
  toggleMenu: () => void;
  openSubmenu: (submenuId: string) => void;
  goBack: () => void;
}