/**
 * Sandbox test setup (sandbox-specific — apps/web/src/test/setup.ts is
 * web-specific and deliberately not copied; see CLAUDE.md § Testing).
 *
 * Component tests annotate `// @vitest-environment happy-dom` per file;
 * cleanup only runs where a DOM exists.
 */
import { afterEach } from 'vitest';

afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
