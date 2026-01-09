/**
 * Section Design Token Utilities
 *
 * Design token patterns and conventions
 */

/**
 * Design token naming convention
 */
export interface DesignTokenConvention {
  /** Component prefix (e.g., 'fs', 'hs', 'pc') */
  prefix: string;

  /** Token categories */
  categories: {
    scaling: string;      // 'scale'
    colors: string;       // 'color'
    spacing: string;      // 'gap', 'padding', 'margin'
    typography: string;   // 'font'
    borders: string;      // 'border'
    depth: string;        // 'z-index', 'opacity'
    animations: string;   // 'transition', 'animation'
    effects: string;      // 'shadow', 'filter'
  };

  /** Variant suffixes */
  variants: {
    mobile: string;       // 'mobile'
    tablet: string;       // 'tablet'
    desktop: string;      // 'desktop'
  };
}

/**
 * Design token generator utility
 */
export class DesignTokenGenerator {
  constructor(private convention: DesignTokenConvention) {}

  /**
   * Generate a design token name
   */
  generateToken(
    category: string,
    property: string,
    variant?: string,
    modifier?: string
  ): string {
    const parts = [
      `--${this.convention.prefix}`,
      category,
      property
    ];

    if (variant) parts.push(variant);
    if (modifier) parts.push(modifier);

    return parts.join('-');
  }

  /**
   * Generate tokens for responsive variants
   */
  generateResponsiveTokens(
    category: string,
    property: string,
    modifier?: string
  ): {
    mobile: string;
    tablet: string;
    desktop: string;
  } {
    return {
      mobile: this.generateToken(category, property, this.convention.variants.mobile, modifier),
      tablet: this.generateToken(category, property, this.convention.variants.tablet, modifier),
      desktop: this.generateToken(category, property, this.convention.variants.desktop, modifier)
    };
  }
}

/**
 * Design token conventions for all sections
 */
export const DESIGN_TOKEN_CONVENTIONS: Record<string, DesignTokenConvention> = {
  featureShowcase: {
    prefix: 'fs',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  },
  heroSection: {
    prefix: 'hs',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  },
  productCarousel: {
    prefix: 'pc',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  },
  oneFeature: {
    prefix: 'of',
    categories: {
      scaling: 'scale',
      colors: 'color',
      spacing: 'gap',
      typography: 'font',
      borders: 'border',
      depth: 'z-index',
      animations: 'transition',
      effects: 'shadow'
    },
    variants: {
      mobile: 'mobile',
      tablet: 'tablet',
      desktop: 'desktop'
    }
  }
};
