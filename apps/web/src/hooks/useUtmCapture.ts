'use client';

/**
 * UTM Capture Hook
 *
 * Captures UTM parameters from the URL on page load and persists them
 * in sessionStorage. Components (e.g., WaitlistForm) read the stored
 * UTM data to attribute signups to marketing campaigns.
 *
 * Storage key: 'diboas-utm-params'
 */

import { useEffect } from 'react';

const UTM_STORAGE_KEY = 'diboas-utm-params';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type UtmData = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/**
 * Capture UTM params from current URL into sessionStorage.
 * Only writes if at least one UTM param is present.
 * Does not overwrite existing params (first touch wins).
 */
export function useUtmCapture(): void {
  useEffect(() => {
    try {
      // Don't overwrite — first touch attribution
      if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;

      const params = new URLSearchParams(window.location.search);
      const utm: UtmData = {};
      let hasAny = false;

      for (const key of UTM_KEYS) {
        const value = params.get(key);
        if (value) {
          utm[key] = value;
          hasAny = true;
        }
      }

      if (hasAny) {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);
}

/**
 * Read stored UTM params (called from form hooks, not a React hook).
 */
export function getStoredUtmParams(): UtmData {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Convert UTM data to tags array for waitlist entry storage.
 * Format: ['utm_source:google', 'utm_medium:cpc', ...]
 */
export function utmToTags(utm: UtmData): string[] {
  return Object.entries(utm)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}:${v}`);
}
