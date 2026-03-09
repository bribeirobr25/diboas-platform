/**
 * Waitlist Statistics Configuration
 *
 * Manual override for waitlist statistics when provider data is unavailable.
 * These values can be updated without redeploying by using environment variables.
 *
 * Priority Order:
 * 1. Environment variables (NEXT_PUBLIC_WAITLIST_*)
 * 2. Live data from waitlist store
 * 3. Fallback values defined here
 *
 * Usage:
 * - Set NEXT_PUBLIC_WAITLIST_COUNT=1500 in .env.local for manual override
 * - Set NEXT_PUBLIC_WAITLIST_COUNTRIES=25 in .env.local for manual override
 * - Or update the fallback values below for permanent changes
 */

/**
 * Fallback statistics when no other source is available
 * Update these values when you want to display different numbers
 */
export const WAITLIST_STATS_FALLBACK = {
  /** Total number of waitlist subscribers */
  count: 0,
  /** Number of countries represented */
  countries: 0,
  /** Founding member count */
  foundingMemberCount: 0,
  /** Founding member cap (overridable via NEXT_PUBLIC_FOUNDING_MEMBER_CAP env var) */
  foundingMemberCap: parseInt(process.env.NEXT_PUBLIC_FOUNDING_MEMBER_CAP || '1200', 10),
  /** Founding member spots remaining */
  foundingMemberSpotsRemaining: parseInt(process.env.NEXT_PUBLIC_FOUNDING_MEMBER_CAP || '1200', 10),
};

/**
 * Get waitlist stats from environment or fallback
 * This is used client-side when API is not available
 */
export function getWaitlistStatsFromEnv(): { count: number; countries: number } {
  const envCount = process.env.NEXT_PUBLIC_WAITLIST_COUNT;
  const envCountries = process.env.NEXT_PUBLIC_WAITLIST_COUNTRIES;

  return {
    count: envCount ? parseInt(envCount, 10) : WAITLIST_STATS_FALLBACK.count,
    countries: envCountries ? parseInt(envCountries, 10) : WAITLIST_STATS_FALLBACK.countries,
  };
}

/**
 * Server-side stats fetcher type
 */
export interface WaitlistStats {
  count: number;
  countries: number;
  source: 'provider' | 'store' | 'env' | 'fallback';
  lastUpdated: string;
  foundingMemberCount?: number;
  foundingMemberCap?: number;
  foundingMemberSpotsRemaining?: number;
}
