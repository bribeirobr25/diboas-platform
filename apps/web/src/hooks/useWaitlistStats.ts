/**
 * useWaitlistStats Hook
 *
 * Shared hook for waitlist stats consumed by SocialProofSection and WaitlistSection.
 * Single fetch with sessionStorage cache (5-min TTL) and real-time event updates.
 */

'use client';

import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { getWaitlistStatsFromEnv } from '@/config/waitlist-stats';
import {
  applicationEventBus,
  ApplicationEventType,
  type ApplicationEventPayload,
} from '@/lib/events/ApplicationEventBus';

interface WaitlistStats {
  count: number;
  countries: number;
  foundingMemberSpotsRemaining?: number;
}

interface UseWaitlistStatsOptions {
  /** Filter stats by waitlist source (e.g., 'landing_b2b' for B2B-specific counters) */
  source?: 'landing_b2c' | 'landing_b2b' | 'about' | 'security' | 'help';
}

interface UseWaitlistStatsReturn {
  stats: WaitlistStats;
  isLoading: boolean;
}

const CACHE_KEY_PREFIX = 'diboas-waitlist-stats';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useWaitlistStats(options?: UseWaitlistStatsOptions): UseWaitlistStatsReturn {
  const source = options?.source;
  const cacheKey = source ? `${CACHE_KEY_PREFIX}-${source}` : CACHE_KEY_PREFIX;
  const [stats, setStats] = useState<WaitlistStats>(getWaitlistStatsFromEnv);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats from API with sessionStorage cache
  useEffect(() => {
    const controller = new AbortController();
    const url = source ? `/api/waitlist/stats?source=${source}` : '/api/waitlist/stats';

    async function fetchStats() {
      // Check cache first
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setStats(data);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Cache read failed — continue to fetch
      }

      try {
        const response = await fetchWithRetry(url, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          const statsData: WaitlistStats = {
            count: data.count,
            countries: data.countries,
            foundingMemberSpotsRemaining: data.foundingMemberSpotsRemaining,
          };
          setStats(statsData);

          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ data: statsData, timestamp: Date.now() })
            );
          } catch {
            // sessionStorage full or unavailable
          }
        }
      } catch {
        // Keep fallback values on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
    return () => controller.abort();
  }, [cacheKey, source]);

  // Listen for real-time signup events
  useEffect(() => {
    const unsubscribe = applicationEventBus.on<ApplicationEventPayload>(
      ApplicationEventType.WAITLIST_SIGNUP_COMPLETED,
      (event) => {
        const position = (event.metadata as { position?: number } | undefined)?.position;
        if (typeof position === 'number') {
          setStats((prev) => ({ ...prev, count: position }));
        }

        try {
          sessionStorage.removeItem(cacheKey);
        } catch {
          // sessionStorage unavailable
        }

        // Re-fetch fresh data
        const freshUrl = source
          ? `/api/waitlist/stats?fresh=1&source=${source}`
          : '/api/waitlist/stats?fresh=1';
        fetch(freshUrl, { cache: 'no-store' })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              setStats({
                count: data.count,
                countries: data.countries,
                foundingMemberSpotsRemaining: data.foundingMemberSpotsRemaining,
              });
            }
          })
          .catch(() => {
            // Keep optimistic update
          });
      }
    );

    return unsubscribe;
  }, [cacheKey, source]);

  return { stats, isLoading };
}
