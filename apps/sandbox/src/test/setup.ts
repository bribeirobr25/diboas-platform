/**
 * Sandbox test setup (sandbox-specific — apps/web/src/test/setup.ts is
 * web-specific and deliberately not copied; see CLAUDE.md § Testing).
 *
 * Component tests opt into the DOM via vitest's per-file happy-dom
 * environment pragma (see BottomSheet.test.tsx line 1 for the form — the
 * literal tag is not written here because knip parses leading doc comments
 * for it and would demand a vitest-environment-* package);
 * cleanup only runs where a DOM exists.
 */
import { afterEach, beforeEach } from 'vitest';
import { installNetworkGuard, takeUnmockedRequests } from './networkGuard';

/* No unit test reaches the network: an unmocked fetch is refused and fails its test (5.942). */
beforeEach(() => {
  installNetworkGuard();
});

afterEach(() => {
  const refused = takeUnmockedRequests();
  if (refused.length > 0) {
    throw new Error(
      `This test made ${refused.length} unmocked network request(s): ${refused.join(', ')}. ` +
        'Mock the hook that fetches, or stub fetch (vi.stubGlobal).'
    );
  }
});

afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
