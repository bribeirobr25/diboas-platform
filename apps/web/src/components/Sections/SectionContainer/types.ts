/**
 * SectionContainer Types
 *
 * Type definitions for the unified section container component
 */

import type { ReactNode, CSSProperties } from 'react';

/**
 * Container width variant (maps to semantic max-width tokens)
 */
export type ContainerVariant = 'standard' | 'wide' | 'narrow';

/**
 * Padding variant (maps to unified padding tokens)
 */
export type PaddingVariant = 'standard' | 'hero-nav' | 'none';

/**
 * Semantic HTML element for the section
 */
export type SectionElement = 'section' | 'div' | 'article' | 'main';

/**
 * Props for SectionContainer component
 */
export interface SectionContainerProps {
  /**
   * Content to render inside the container
   */
  children: ReactNode;

  /**
   * Container width variant
   * @default 'standard'
   */
  variant?: ContainerVariant;

  /**
   * Padding variant for responsive spacing
   * @default 'standard'
   */
  padding?: PaddingVariant;

  /**
   * Background color override (CSS color value)
   * If not provided, uses component-specific background from design tokens
   */
  backgroundColor?: string;

  /**
   * Additional CSS class names for the section element
   */
  className?: string;

  /**
   * Additional CSS class names for the inner container
   */
  containerClassName?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * ARIA labelledby for accessibility
   */
  ariaLabelledBy?: string;

  /**
   * ARIA role for accessibility
   */
  role?: string;

  /**
   * Semantic HTML element to use for the section wrapper
   * @default 'section'
   */
  as?: SectionElement;

  /**
   * Additional inline styles for the section element
   */
  style?: CSSProperties;

  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}
