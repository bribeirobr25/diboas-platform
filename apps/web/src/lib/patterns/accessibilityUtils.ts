/**
 * Section Accessibility Utilities
 *
 * ARIA attributes and screen reader utilities
 */

import { Logger } from '@/lib/monitoring/Logger';

/**
 * Generate ARIA attributes for section accessibility
 */
export function generateAriaAttributes(config: {
  role?: string;
  label: string;
  description?: string;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  controls?: string;
  describedBy?: string;
}): Record<string, string> {
  const attributes: Record<string, string> = {
    'aria-label': config.label
  };

  if (config.role) {
    attributes.role = config.role;
  }

  if (config.description) {
    attributes['aria-description'] = config.description;
  }

  if (config.live) {
    attributes['aria-live'] = config.live;
  }

  if (config.atomic !== undefined) {
    attributes['aria-atomic'] = config.atomic.toString();
  }

  if (config.controls) {
    attributes['aria-controls'] = config.controls;
  }

  if (config.describedBy) {
    attributes['aria-describedby'] = config.describedBy;
  }

  return attributes;
}

/**
 * Create accessible announcement for screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Visually hidden
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);

  Logger.debug('Screen reader announcement', { message, priority });
}

/**
 * Validate URL for security (prevent XSS in hrefs)
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;

  try {
    // Allow relative URLs
    if (url.startsWith('/') || url.startsWith('#')) {
      return true;
    }

    // Validate absolute URLs
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    return allowedProtocols.includes(parsed.protocol);

  } catch {
    return false;
  }
}

/**
 * Generate unique ID for accessibility
 */
export function generateId(prefix: string = 'section'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
