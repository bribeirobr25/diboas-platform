'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Read one-time secrets (a deletion or unsubscribe token) from the page address ONCE, keep them
 * in memory, and remove the query and fragment from the address bar (founder ruling 2026-11-10,
 * 5.864). Analytics, error reports and browser history after load then never see them; the
 * scrubbers cover what was recorded before this effect ran. Reloading the page afterwards loses
 * the secrets: the person opens the email link again.
 *
 * The secrets are captured in state on the first render because Next's `useSearchParams`
 * follows `history.replaceState`: read live, they would vanish with the address.
 */
export function useUrlSecrets<T>(read: (params: ReadonlyURLSearchParams) => T): T {
  const searchParams = useSearchParams();
  const [secrets] = useState(() => read(searchParams));
  useEffect(() => {
    if (window.location.search || window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
  }, []);
  return secrets;
}
