export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  description?: string;
  banner?: string;
  subItems?: NavigationSubItem[];
}

export interface NavigationSubItem {
  id: string;
  label: string;
  href: string;
  description?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export interface NavigationConfig {
  mainMenu: NavigationItem[];
  mobileHighlights: NavigationItem[];
  mobileSections: NavigationSection[];
  actions: {
    primary: {
      label: string;
      href: string;
      variant: 'primary' | 'secondary';
    };
    secondary: {
      label: string;
      href: string;
      variant: 'primary' | 'secondary';
    };
  };
}

export interface NavigationState {
  isOpen: boolean;
  activeMenu: string | null;
  activeSubmenu: string | null;
  isMobile: boolean;
}