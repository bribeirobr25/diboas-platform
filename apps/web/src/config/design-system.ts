/**
 * Design System Configuration
 * Configuration Management: Centralized design constants
 * Code Reusability: Shared across components
 * Semantic Naming: Purpose-driven constant names
 */

// Semantic aliases for better readability
export const COMPONENT_DIMENSIONS = {
  NAVIGATION_BAR_HEIGHT: '80px',
  MOBILE_NAV_HEIGHT: '56px',
  DROPDOWN_MENU_HEIGHT: '60vh',
  MOBILE_SUBMENU_HEIGHT: '56vh'
} as const;

export const CONTENT_SPACING = {
  CONTAINER_PADDING: '1rem',
  SECTION_PADDING: '2rem', 
  CARD_PADDING: '1.5rem',
  DROPDOWN_OFFSET: '150px'
} as const;

export const UI_LAYER_HIERARCHY = {
  DROPDOWN_LEVEL: 40,
  MOBILE_MENU_LEVEL: 50,
  MODAL_LEVEL: 60,
  TOAST_LEVEL: 70
} as const;

export const ANIMATION_TIMING = {
  QUICK_TRANSITION: '0.15s',
  STANDARD_TRANSITION: '0.3s',
  SMOOTH_TRANSITION: '0.6s'
} as const;

export const MOTION_CURVES = {
  NATURAL_EASE_OUT: 'cubic-bezier(0.16, 1, 0.3, 1)',
  STANDARD_EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  PLAYFUL_BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const;

export const LAYOUT_CONSTANTS = {
  // Navigation
  NAVIGATION: {
    DESKTOP_HEIGHT: '80px',
    MOBILE_HEIGHT: '60px',
    DROPDOWN_HEIGHT: '60vh',
    MOBILE_SUBMENU_HEIGHT: '56vh',
    MOBILE_NAV_HEIGHT: '56px'
  },

  // Spacing
  SPACING: {
    CONTAINER_PADDING: '1rem',
    SECTION_PADDING: '2rem',
    CARD_PADDING: '1.5rem',
    DROPDOWN_MARGIN_LEFT: '150px'
  },

  // Z-Index Layers
  Z_INDEX: {
    DROPDOWN: 40,
    MOBILE_MENU: 50,
    MODAL: 60,
    TOAST: 70
  },

  // Breakpoints (matching Tailwind defaults)
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    XXL: '1536px'
  }
} as const;

export const ANIMATION_CONSTANTS = {
  // Duration
  DURATION: {
    FAST: '0.15s',
    NORMAL: '0.3s',
    SLOW: '0.6s'
  },

  // Easing
  EASING: {
    EASE_OUT: 'cubic-bezier(0.16, 1, 0.3, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
} as const;