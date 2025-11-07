/**
 * Locale-Aware Link Component
 *
 * Domain-Driven Design: Localization-aware navigation component
 * Code Reusability: Reusable wrapper for Next.js Link
 * No Hardcoded Values: Uses current locale from context
 * Type Safety: Full TypeScript support
 * Service Agnostic Abstraction: Decoupled from specific i18n implementation
 */

'use client';

import Link, { LinkProps } from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';

interface LocaleLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  target?: string;
  rel?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

/**
 * LocaleLink Component
 *
 * Automatically prefixes internal links with current locale.
 * Drop-in replacement for Next.js Link component.
 *
 * @example
 * ```tsx
 * // Instead of:
 * <Link href="/benefits">Benefits</Link>
 *
 * // Use:
 * <LocaleLink href="/benefits">Benefits</LocaleLink>
 * // Renders: /en/benefits (if current locale is 'en')
 * ```
 *
 * Features:
 * - Automatic locale prefixing for internal links
 * - Skips prefixing for external URLs
 * - Prevents double-prefixing if locale already in path
 * - Full TypeScript support
 * - Compatible with all Next.js Link props
 */
export function LocaleLink({
  href,
  children,
  className,
  prefetch = true,
  target,
  rel,
  onClick,
  'aria-label': ariaLabel,
  ...props
}: LocaleLinkProps) {
  const { locale } = useLocale();

  /**
   * Add locale prefix to internal paths
   *
   * Rules:
   * 1. Skip external URLs (http://, https://)
   * 2. Skip if path already has locale prefix
   * 3. Add current locale prefix
   */
  const getLocalizedHref = (path: string): string => {
    // Rule 1: Skip external URLs
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Rule 2: Skip if already has locale prefix
    const segments = path.split('/').filter(Boolean);
    if (SUPPORTED_LOCALES.includes(segments[0] as SupportedLocale)) {
      return path;
    }

    // Rule 3: Add locale prefix
    return `/${locale}${path.startsWith('/') ? path : '/' + path}`;
  };

  return (
    <Link
      href={getLocalizedHref(href)}
      className={className}
      prefetch={prefetch}
      target={target}
      rel={rel}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Link>
  );
}
