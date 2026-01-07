'use client';

/**
 * CTAButtonLink - Reusable CTA Button with Link wrapper
 *
 * DRY Principle: Consolidates the repeated pattern of conditional
 * Link vs anchor wrapping for CTA buttons across the application.
 *
 * Used by: HeroSection, FeatureShowcase, AppFeaturesCarousel, ProductCarousel
 */

import React from 'react';
import Link from 'next/link';
import { Button, type ButtonProps } from '@diboas/ui';

export interface CTAButtonLinkProps {
  /** The URL to link to */
  href: string;
  /** Button text content */
  children: React.ReactNode;
  /** Open in new tab (uses anchor with rel="noopener noreferrer") */
  target?: '_blank' | '_self';
  /** Click handler for analytics tracking */
  onClick?: () => void;
  /** Button variant from design system */
  variant?: ButtonProps['variant'];
  /** Button size from design system */
  size?: ButtonProps['size'];
  /** Enable analytics tracking */
  trackable?: boolean;
  /** Additional CSS class for the button */
  className?: string;
  /** Aria label for accessibility */
  'aria-label'?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * CTA Button that automatically handles Link vs anchor element
 * based on target prop. Wraps the design system Button component.
 */
export function CTAButtonLink({
  href,
  children,
  target = '_self',
  onClick,
  variant = 'primary',
  size = 'lg',
  trackable = true,
  className,
  'aria-label': ariaLabel,
  disabled = false,
}: CTAButtonLinkProps) {
  const buttonElement = (
    <Button
      variant={variant}
      size={size}
      trackable={trackable}
      className={className}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </Button>
  );

  // External links use anchor with security attributes
  if (target === '_blank') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {buttonElement}
      </a>
    );
  }

  // Internal links use Next.js Link for client-side navigation
  return (
    <Link href={href} onClick={onClick}>
      {buttonElement}
    </Link>
  );
}

/**
 * Default CTA props for consistent styling across sections
 * Use these defaults when creating CTAs in section components
 */
export const DEFAULT_CTA_PROPS = {
  variant: 'primary' as const,
  size: 'lg' as const,
  trackable: true,
} as const;
