/**
 * Design System Configuration
 * 
 * Domain-Driven Design: Central design tokens for diBoaS platform
 * DRY Principles: Single source of truth from JSON configuration
 * Security & Audit Standards: Type-safe imports with validation
 * Service Agnostic Abstraction: JSON-based configuration platform-independent
 * No Hard Coded Values: All design values imported from JSON
 * Error Handling & System Recovery: Fallback values for missing tokens
 * Semantic Naming: Purpose-driven constant names following design domain
 * File Decoupling & Organization: Clear separation of data and logic
 */

// Import design tokens from centralized JSON configuration
import designTokensJson from '../../../../config/design-tokens.json';

// Type definitions for design tokens (auto-generated from JSON structure)
export type DesignTokens = typeof designTokensJson;

export type TypographyTokens = DesignTokens['typography'];
export type SpacingTokens = DesignTokens['spacing'];
export type LayoutTokens = DesignTokens['layout'];
export type AnimationTokens = DesignTokens['animation'];
export type ZIndexTokens = DesignTokens['zIndex'];
export type BreakpointTokens = DesignTokens['breakpoints'];

/**
 * Error Handling & System Recovery: Validate imported tokens
 * Security: Runtime validation to prevent malformed data
 */
function validateDesignTokens(tokens: any): tokens is DesignTokens {
  if (!tokens || typeof tokens !== 'object') {
    console.error('Design tokens: Invalid or missing configuration');
    return false;
  }

  const requiredSections = ['typography', 'spacing', 'layout', 'animation', 'zIndex', 'breakpoints'];
  const missingSections = requiredSections.filter(section => !tokens[section]);
  
  if (missingSections.length > 0) {
    console.error(`Design tokens: Missing required sections: ${missingSections.join(', ')}`);
    return false;
  }

  return true;
}

/**
 * Load design tokens with validation and fallback
 * Error Handling: Comprehensive fallback strategy
 * Monitoring & Observability: Detailed logging
 */
function loadDesignTokens(): DesignTokens {
  try {
    // Validate imported tokens
    if (!validateDesignTokens(designTokensJson)) {
      throw new Error('Invalid design tokens configuration');
    }

    // Log successful loading (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Design tokens loaded successfully (v${designTokensJson.version})`);
    }

    return designTokensJson;
    
  } catch (error) {
    console.error('❌ Failed to load design tokens:', error);
    console.warn('🔄 Using fallback configuration...');
    
    // Fallback configuration for error recovery
    return {
      version: 'fallback-1.0.0',
      metadata: {
        lastUpdated: new Date().toISOString(),
        author: 'System Fallback',
        description: 'Fallback design tokens for error recovery'
      },
      typography: {
        title: {
          hero: { desktop: 48, mobile: 34 },
          section: { desktop: 40, mobile: 30 }
        },
        body: {
          subtitle: 16,
          description: 16
        },
        ui: {
          link: 14,
          button: 12
        }
      },
      spacing: {
        section: {
          desktop: { y: 64, x: 120 },
          tablet: { y: 48, x: 64 },
          mobile: { y: 48, x: 24 }
        },
        container: { padding: '1rem' },
        card: { padding: '1.5rem' }
      },
      layout: {
        navigation: {
          desktopHeight: '80px',
          mobileNavHeight: '60px',
          dropdownHeight: '60vh',
          mobileSubmenuHeight: {
            mobile: '65vh',
            tablet: '42vh'
          }
        },
        spacing: {
          dropdownMarginLeft: '150px'
        }
      },
      animation: {
        duration: {
          fast: '0.15s',
          normal: '0.3s',
          slow: '0.6s'
        },
        easing: {
          easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }
      },
      zIndex: {
        dropdown: 40,
        mobileMenu: 50,
        modal: 60,
        toast: 70
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        xxl: '1536px'
      }
    } as DesignTokens;
  }
}

// Load and validate design tokens
const tokens = loadDesignTokens();

// Extract individual token categories for easier access
export const TYPOGRAPHY = tokens.typography;
export const SPACING = tokens.spacing;
export const LAYOUT = {
  NAVIGATION: {
    DESKTOP_HEIGHT: tokens.layout.navigation.desktopHeight,
    MOBILE_NAV_HEIGHT: tokens.layout.navigation.mobileNavHeight,
    DROPDOWN_HEIGHT: tokens.layout.navigation.dropdownHeight,
    MOBILE_SUBMENU_HEIGHT: typeof tokens.layout.navigation.mobileSubmenuHeight === 'string'
      ? tokens.layout.navigation.mobileSubmenuHeight
      : tokens.layout.navigation.mobileSubmenuHeight.mobile, // Default to mobile for backward compatibility
    MOBILE_SUBMENU_HEIGHT_MOBILE: typeof tokens.layout.navigation.mobileSubmenuHeight === 'string'
      ? tokens.layout.navigation.mobileSubmenuHeight
      : tokens.layout.navigation.mobileSubmenuHeight.mobile,
    MOBILE_SUBMENU_HEIGHT_TABLET: typeof tokens.layout.navigation.mobileSubmenuHeight === 'string'
      ? tokens.layout.navigation.mobileSubmenuHeight
      : tokens.layout.navigation.mobileSubmenuHeight.tablet
  },
  SPACING: {
    DROPDOWN_MARGIN_LEFT: tokens.layout.spacing.dropdownMarginLeft
  }
};
export const ANIMATION = {
  DURATION: {
    FAST: tokens.animation.duration.fast,
    NORMAL: tokens.animation.duration.normal,
    SLOW: tokens.animation.duration.slow
  },
  EASING: {
    EASE_OUT: tokens.animation.easing.easeOut,
    EASE_IN_OUT: tokens.animation.easing.easeInOut,
    BOUNCE: tokens.animation.easing.bounce
  }
};
export const Z_INDEX = tokens.zIndex;
export const BREAKPOINTS = tokens.breakpoints;

// Unified Design System Export - Single source of truth
export const DESIGN_SYSTEM = {
  TYPOGRAPHY,
  SPACING,
  LAYOUT,
  ANIMATION,
  Z_INDEX,
  BREAKPOINTS,
  // Metadata for monitoring and debugging
  metadata: {
    version: tokens.version,
    loadedAt: new Date().toISOString(),
    source: 'config/design-tokens.json'
  }
} as const;

// Legacy exports for backward compatibility (will be removed in future versions)
// @deprecated Use DESIGN_SYSTEM instead
export const COMPONENTS = {
  navigation: {
    desktop: { height: LAYOUT.NAVIGATION.DESKTOP_HEIGHT },
    mobile: { height: LAYOUT.NAVIGATION.MOBILE_NAV_HEIGHT }
  },
  dropdown: {
    height: LAYOUT.NAVIGATION.DROPDOWN_HEIGHT,
    marginLeft: LAYOUT.SPACING.DROPDOWN_MARGIN_LEFT
  },
  mobileSubmenu: {
    height: LAYOUT.NAVIGATION.MOBILE_SUBMENU_HEIGHT
  }
};

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Make design system available in browser console for debugging
  if (typeof window !== 'undefined') {
    (window as any).DESIGN_SYSTEM = DESIGN_SYSTEM;
  }
}

// Types are already exported above