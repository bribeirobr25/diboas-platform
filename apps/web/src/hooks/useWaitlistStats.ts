/**
 * useWaitlistStats Hook
 *
 * Shared hook for waitlist stats consumed by SocialProofSection and WaitlistSection.
 * Single fetch with sessionStorage cache (5-min TTL) and real-time event updates.
 */

'use client';

import { useState, useEffect } from 'react';
import { getWaitlistStatsFromEnv } from '@/config/waitlist-stats';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import type { ApplicationEventPayload } from '@/lib/events/ApplicationEventBus';

interface WaitlistStats {
  count: number;
  countries: number;
  foundingMemberSpotsRemaining?: number;
}

interface UseWaitlistStatsReturn {
  stats: WaitlistStats;
  isLoading: boolean;
}

const CACHE_KEY = 'diboas-waitlist-stats';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useWaitlistStats(): UseWaitlistStatsReturn {
  const [stats, setStats] = useState<WaitlistStats>(getWaitlistStatsFromEnv);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats from API with sessionStorage cache
  useEffect(() => {
    const controller = new AbortController();

    async function fetchStats() {
      // Check cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
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
        const response = await fetch('/api/waitlist/stats', { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          const statsData: WaitlistStats = {
            count: data.count,
            countries: data.countries,
            foundingMemberSpotsRemaining: data.foundingMemberSpotsRemaining,
          };
          setStats(statsData);

          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: statsData, timestamp: Date.now() }));
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
  }, []);

  // Listen for real-time signup events
  useEffect(() => {
    const unsubscribe = applicationEventBus.on<ApplicationEventPayload>(
      ApplicationEventType.WAITLIST_SIGNUP_SUCCESS,
      (event) => {
        const position = (event.metadata as { position?: number } | undefined)?.position;
        if (typeof position === 'number') {
          setStats(prev => ({ ...prev, count: position }));
        }

        try {
          sessionStorage.removeItem(CACHE_KEY);
        } catch {
          // sessionStorage unavailable
        }

        // Re-fetch fresh data
        fetch('/api/waitlist/stats?fresh=1', { cache: 'no-store' })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
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
  }, []);

  return { stats, isLoading };
}
