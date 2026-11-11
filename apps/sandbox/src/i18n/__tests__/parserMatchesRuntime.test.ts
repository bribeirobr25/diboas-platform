/**
 * The message test (`messages.test.ts`) parses every Practice string with
 * `@formatjs/icu-messageformat-parser`. It proves something only if that is the parser the app
 * RUNS: react-intl's own. So the devDependency is pinned to react-intl's version, and this
 * checks it (Dependabot's #886 offered 3.x, which would have parsed differently from runtime;
 * reviewed 2026-11-11). Moving react-intl moves the pin with it.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const version = (from: string, pkg: string): string =>
  (createRequire(from)(`${pkg}/package.json`) as { version: string }).version;

describe('the message test parses with the runtime parser', () => {
  it('should pin the exact parser react-intl resolves when the test imports it', () => {
    const PARSER = '@formatjs/icu-messageformat-parser';
    const runtime = version(require.resolve('react-intl/package.json'), PARSER);
    const test = version(__filename, PARSER);
    const declared = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf8'))
      .devDependencies[PARSER];
    expect(test).toBe(runtime);
    expect(declared).toBe(runtime);
  });
});
