/**
 * CSP frame-src guard (Phase 3 Slice B, RV-3).
 *
 * The middleware's CSP is a hand-built directive list; this guard asserts
 * the frame-src directive exists for EXACTLY the learn facade's origin and
 * nothing else. Source-level assertion (the middleware runs on the edge
 * runtime and builds the header per request; the directive list is static
 * in source, so reading the source is the honest, hermetic check).
 *
 * Register rule: frame-src exists ONLY for the learn YouTube facade
 * (D-1); widening it is a security review, not a copy change.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const middlewareSource = readFileSync(join(__dirname, '../../../../middleware.ts'), 'utf-8');

describe('CSP frame-src (learn video facade)', () => {
  it('should declare frame-src for exactly the youtube-nocookie origin', () => {
    const frameSrcLines = middlewareSource
      .split('\n')
      .filter((l) => l.includes('frame-src') && !l.trim().startsWith('//'));
    expect(frameSrcLines).toHaveLength(1);
    expect(frameSrcLines[0]).toContain('`frame-src https://www.youtube-nocookie.com`');
  });

  it('should keep frame-ancestors locked to none (unrelated to the facade)', () => {
    expect(middlewareSource).toContain("`frame-ancestors 'none'`");
  });
});
