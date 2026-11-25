'use client';

/**
 * UTM capture (market clean-up W-D1, spec §3.1). On the first client load it removes the two keys
 * earlier versions wrote (a one-off migration, deleted 90 days after the W-D1 production deploy)
 * and passes the URL's campaign values to the in-memory hold (`lib/analytics/utmAttribution.ts`),
 * which shapes them and keeps the first touch. Nothing is stored on the device.
 */
import { useEffect } from 'react';
import { captureUtmFromUrl, removeLegacyAttributionStorage } from '@/lib/analytics/utmAttribution';
import { scrubUrl } from '@/lib/utils/scrubUrl';

export function useUtmCapture(): void {
  useEffect(() => {
    removeLegacyAttributionStorage();
    // The address through the shaped scrubber first: nothing but shaped campaign values (by the
    // raw rule) and the two public switches can reach the hold (5.864's raw-read rule).
    captureUtmFromUrl(scrubUrl(window.location.href, { campaign: 'shaped' }));
  }, []);
}
