'use client';

import { useSyncExternalStore } from 'react';
import {
  getProfile,
  getServerProfile,
  subscribeProfile,
  type SandboxProfile,
} from '@/lib/profileStore';

/** The user's illustrative profile (net monthly income), client-side only. */
export function useProfile(): SandboxProfile {
  return useSyncExternalStore(subscribeProfile, getProfile, getServerProfile);
}
