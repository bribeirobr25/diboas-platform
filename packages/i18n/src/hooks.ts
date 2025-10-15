/**
 * Internationalization Hooks
 *
 * Code Reusability: Reusable hooks for all translation needs
 * Type Safety: Full TypeScript support
 */

'use client';

import { useIntl } from 'react-intl';
import type { MessageDescriptor, IntlShape } from 'react-intl';

/**
 * Hook for accessing translation functions
 * Wrapper around react-intl's useIntl with our types
 */
export function useTranslation(): IntlShape {
  return useIntl();
}

/**
 * Hook for simple message translation
 */
export function useMessage(id: string, defaultMessage?: string): string {
  const intl = useIntl();
  return intl.formatMessage({ id, defaultMessage });
}

/**
 * Hook for message translation with values
 */
export function useMessageWithValues(
  id: string,
  values?: Record<string, any>,
  defaultMessage?: string
): string {
  const intl = useIntl();
  return intl.formatMessage({ id, defaultMessage }, values);
}

/**
 * Hook for plural message translation
 */
export function usePluralMessage(
  id: string,
  count: number,
  values?: Record<string, any>
): string {
  const intl = useIntl();
  return intl.formatMessage({ id }, { count, ...values });
}

/**
 * Hook for formatted date
 */
export function useDateFormat(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
  const intl = useIntl();
  return intl.formatDate(date, options);
}

/**
 * Hook for formatted number
 */
export function useNumberFormat(value: number, options?: Intl.NumberFormatOptions): string {
  const intl = useIntl();
  return intl.formatNumber(value, options);
}

/**
 * Hook for formatted currency
 */
export function useCurrencyFormat(value: number, currency: string): string {
  const intl = useIntl();
  return intl.formatNumber(value, {
    style: 'currency',
    currency,
  });
}
