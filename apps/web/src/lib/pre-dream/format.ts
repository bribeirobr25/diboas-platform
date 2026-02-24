/**
 * PreDream Format Utilities
 *
 * Re-exports the canonical locale-aware currency formatter from config/formats.
 */

import { formatLocaleCurrency } from '@/config/formats';

export const formatCurrency = formatLocaleCurrency;
