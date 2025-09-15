/**
 * Color Utilities
 * 
 * DRY Principle: Centralized color mapping and theme utilities
 * Eliminates repeated conditional color class patterns across components
 */

export type ColorVariant = 'primary' | 'purple' | 'coral' | 'gray' | 'neutral';
export type ColorIntensity = '50' | '100' | '500' | '600' | '700' | '900';
export type ColorType = 'text' | 'bg' | 'border' | 'hover' | 'gradient';

/**
 * Color Class Mappings
 */
export const colorVariants = {
  primary: {
    text: {
      50: 'text-primary-50',
      100: 'text-primary-100',
      500: 'text-primary-500',
      600: 'text-primary-600',
      700: 'text-primary-700',
      900: 'text-primary-900'
    },
    bg: {
      50: 'bg-primary-50',
      100: 'bg-primary-100',
      500: 'bg-primary-500',
      600: 'bg-primary-600',
      700: 'bg-primary-700',
      900: 'bg-primary-900'
    },
    hover: {
      50: 'hover:bg-primary-50',
      100: 'hover:bg-primary-100',
      500: 'hover:bg-primary-500',
      600: 'hover:bg-primary-600',
      700: 'hover:bg-primary-700',
      900: 'hover:bg-primary-900'
    },
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600'
  },
  purple: {
    text: {
      50: 'text-secondary-purple-50',
      100: 'text-secondary-purple-100',
      500: 'text-secondary-purple-500',
      600: 'text-secondary-purple-600',
      700: 'text-secondary-purple-700',
      900: 'text-secondary-purple-900'
    },
    bg: {
      50: 'bg-secondary-purple-50',
      100: 'bg-secondary-purple-100',
      500: 'bg-secondary-purple-500',
      600: 'bg-secondary-purple-600',
      700: 'bg-secondary-purple-700',
      900: 'bg-secondary-purple-900'
    },
    hover: {
      50: 'hover:bg-secondary-purple-50',
      100: 'hover:bg-secondary-purple-100',
      500: 'hover:bg-secondary-purple-500',
      600: 'hover:bg-secondary-purple-600',
      700: 'hover:bg-secondary-purple-700',
      900: 'hover:bg-secondary-purple-900'
    },
    gradient: 'bg-gradient-to-br from-secondary-purple-500 to-secondary-purple-600'
  },
  coral: {
    text: {
      50: 'text-secondary-coral-50',
      100: 'text-secondary-coral-100',
      500: 'text-secondary-coral-500',
      600: 'text-secondary-coral-600',
      700: 'text-secondary-coral-700',
      900: 'text-secondary-coral-900'
    },
    bg: {
      50: 'bg-secondary-coral-50',
      100: 'bg-secondary-coral-100',
      500: 'bg-secondary-coral-500',
      600: 'bg-secondary-coral-600',
      700: 'bg-secondary-coral-700',
      900: 'bg-secondary-coral-900'
    },
    hover: {
      50: 'hover:bg-secondary-coral-50',
      100: 'hover:bg-secondary-coral-100',
      500: 'hover:bg-secondary-coral-500',
      600: 'hover:bg-secondary-coral-600',
      700: 'hover:bg-secondary-coral-700',
      900: 'hover:bg-secondary-coral-900'
    },
    gradient: 'bg-gradient-to-br from-secondary-coral-500 to-secondary-coral-600'
  },
  gray: {
    text: {
      50: 'text-gray-50',
      100: 'text-gray-100',
      500: 'text-gray-500',
      600: 'text-gray-600',
      700: 'text-gray-700',
      900: 'text-gray-900'
    },
    bg: {
      50: 'bg-gray-50',
      100: 'bg-gray-100',
      500: 'bg-gray-500',
      600: 'bg-gray-600',
      700: 'bg-gray-700',
      900: 'bg-gray-900'
    },
    hover: {
      50: 'hover:bg-gray-50',
      100: 'hover:bg-gray-100',
      500: 'hover:bg-gray-500',
      600: 'hover:bg-gray-600',
      700: 'hover:bg-gray-700',
      900: 'hover:bg-gray-900'
    },
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-600'
  },
  neutral: {
    text: {
      50: 'text-neutral-50',
      100: 'text-neutral-100',
      500: 'text-neutral-500',
      600: 'text-neutral-600',
      700: 'text-neutral-700',
      900: 'text-neutral-900'
    },
    bg: {
      50: 'bg-neutral-50',
      100: 'bg-neutral-100',
      500: 'bg-neutral-500',
      600: 'bg-neutral-600',
      700: 'bg-neutral-700',
      900: 'bg-neutral-900'
    },
    hover: {
      50: 'hover:bg-neutral-50',
      100: 'hover:bg-neutral-100',
      500: 'hover:bg-neutral-500',
      600: 'hover:bg-neutral-600',
      700: 'hover:bg-neutral-700',
      900: 'hover:bg-neutral-900'
    },
    gradient: 'bg-gradient-to-br from-neutral-500 to-neutral-600'
  }
} as const;

/**
 * Get color class for a specific variant, type, and intensity
 */
export function getColorClass(
  variant: ColorVariant,
  type: ColorType,
  intensity?: ColorIntensity
): string {
  const colorSet = colorVariants[variant];

  if (type === 'gradient') {
    return colorSet.gradient;
  }

  const typeSet = colorSet[type as keyof typeof colorSet];
  if (typeof typeSet === 'object' && intensity) {
    return (typeSet as any)[intensity] || '';
  }

  return '';
}

/**
 * Feature-specific color utilities
 */
export function getFeatureColors(featureColor: string) {
  const variant = featureColor as ColorVariant;

  return {
    text: getColorClass(variant, 'text', '600'),
    textLight: getColorClass(variant, 'text', '500'),
    bg: getColorClass(variant, 'bg', '100'),
    bgHover: getColorClass(variant, 'hover', '50'),
    gradient: getColorClass(variant, 'gradient'),
    buttonBg: getColorClass(variant, 'bg', '500'),
    buttonBgHover: getColorClass(variant, 'bg', '600')
  };
}

/**
 * Navigation-specific color utilities
 */
export function getNavigationColors(variant: ColorVariant) {
  return {
    iconContainer: getColorClass(variant, 'bg', '100'),
    icon: getColorClass(variant, 'text', '500'),
    hover: getColorClass(variant, 'hover', '50')
  };
}

/**
 * Brand color utilities (standardized naming)
 */
export const brandColors = {
  primary: getColorClass('primary', 'text', '600'),
  primaryLight: getColorClass('primary', 'text', '500'),
  primaryBg: getColorClass('primary', 'bg', '50'),

  text: {
    primary: getColorClass('neutral', 'text', '900'),
    secondary: getColorClass('neutral', 'text', '600'),
    muted: getColorClass('neutral', 'text', '500')
  },

  background: {
    primary: 'bg-white',
    secondary: getColorClass('neutral', 'bg', '50'),
    muted: getColorClass('neutral', 'bg', '100')
  }
};

/**
 * Utility function for conditional feature colors
 * Replaces repeated ternary patterns in components
 */
export function getConditionalFeatureColor(
  featureColor: string,
  type: 'text' | 'bg' | 'gradient' | 'hover' = 'text',
  intensity: ColorIntensity = '600'
): string {
  switch (featureColor) {
    case 'primary':
      return type === 'gradient' ? colorVariants.primary.gradient : getColorClass('primary', type, intensity);
    case 'purple':
      return type === 'gradient' ? colorVariants.purple.gradient : getColorClass('purple', type, intensity);
    case 'coral':
      return type === 'gradient' ? colorVariants.coral.gradient : getColorClass('coral', type, intensity);
    default:
      return type === 'gradient' ? colorVariants.primary.gradient : getColorClass('primary', type, intensity);
  }
}