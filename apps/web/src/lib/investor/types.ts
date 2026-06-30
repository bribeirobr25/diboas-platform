/**
 * Investor request domain types.
 */

/** Allowed investor types (the request-form select). */
const INVESTOR_TYPES = [
  'angel',
  'vc',
  'founder-operator',
  'strategic',
  'family-office',
  'other',
] as const;
export type InvestorType = (typeof INVESTOR_TYPES)[number];

export function isInvestorType(value: unknown): value is InvestorType {
  return typeof value === 'string' && (INVESTOR_TYPES as readonly string[]).includes(value);
}

/** Normalized, validated input handed to the service (HTTP layer pre-validates). */
export interface InvestorRequestInput {
  email: string;
  name?: string;
  company?: string;
  investorType?: InvestorType;
  ticketSize?: string;
  thesis?: string;
  message?: string;
  locale?: string;
  country?: string;
  correlationId?: string;
}

export type InvestorRequestResult =
  | { ok: true; duplicate: boolean }
  | {
      ok: false;
      code: 'EMAIL_REQUIRED' | 'ENCRYPTION_UNAVAILABLE' | 'SERVER_ERROR';
      cause?: unknown;
    };
