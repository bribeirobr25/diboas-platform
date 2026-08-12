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
import { afterEach } from 'vitest';

afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
