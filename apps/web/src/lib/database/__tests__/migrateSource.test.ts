/**
 * The website's migration runner reads its files from the private docs only (register
 * `5.709`, founder 2026-10-30) and stops before any database call when it finds none: a
 * runner that saw an empty folder used to report "all migrations already applied".
 */

import { describe, expect, it } from 'vitest';
import { resolveMigrationsDir } from '../migrate';

describe('web migration source (5.709)', () => {
  it('should refuse to run when there is no private docs checkout', () => {
    expect(() => resolveMigrationsDir({ DIBOAS_DOCS_DIR: 'none' })).toThrow(
      /^\[migrate\] cannot run: no private docs checkout \(diboas-docs\)/
    );
  });

  it('should refuse to run when DIBOAS_DOCS_DIR is not a private docs checkout', () => {
    expect(() => resolveMigrationsDir({ DIBOAS_DOCS_DIR: '/nonexistent-docs-root' })).toThrow(
      /^\[migrate\] cannot run: DIBOAS_DOCS_DIR \(.+\) does not exist$/
    );
  });
});
