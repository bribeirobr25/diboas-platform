/**
 * Unit tests never touch the network (5.942, fifteenth audit B-4).
 *
 * happy-dom's real `fetch` resolves a relative URL against `http://localhost:3000`, the local
 * diBoaS dev server's port, so a component whose data hook was left unmocked sent real requests
 * there (coinGeckoReplayAttribution: 18 connections per run) and its result depended on what was
 * listening. The setup installs this `fetch` before every test: it refuses the request, records
 * it, and the test then fails in `afterEach`. A test that needs `fetch` stubs it as before
 * (`vi.stubGlobal('fetch', …)`), which replaces this one for that test.
 */
const unmocked: string[] = [];

function urlOf(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (typeof input === 'object' && input !== null && 'url' in input) {
    return String((input as { url: unknown }).url);
  }
  return String(input);
}

export const refusingFetch = ((input: unknown) => {
  unmocked.push(urlOf(input));
  return Promise.reject(new TypeError(`unmocked network request in a unit test: ${urlOf(input)}`));
}) as typeof fetch;

export function installNetworkGuard(): void {
  unmocked.length = 0;
  globalThis.fetch = refusingFetch;
}

/** The requests refused since the last call, cleared. */
export function takeUnmockedRequests(): string[] {
  return unmocked.splice(0, unmocked.length);
}
