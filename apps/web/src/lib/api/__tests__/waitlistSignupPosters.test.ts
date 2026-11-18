import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

/**
 * ⛑ `5.979` · WAITLIST-SOURCE-1 guard 7: every client request to the signup route is built
 * with the one request shape (plan P11, D3).
 *
 * The modal's body was a `JSON.stringify` literal, which type-checks anything, so its
 * `source: 'modal'` compiled while the server refused it. Each client call to
 * `/api/waitlist/signup` must now build its body with `satisfies WaitlistSignupBody`, which
 * makes a source outside the list a compile error at the line that sends it.
 *
 * Scope: client files under `src/` (not `app/api/**`, the route itself). The BotID config in
 * `instrumentation-client.ts` names the path but posts nothing, so it is excepted by name. A
 * poster that builds the URL from a constant is outside this scan's reach (a stated limit).
 */
const SRC = join(__dirname, '..', '..', '..');
const PATH_LITERAL = /['"`]\/api\/waitlist\/signup['"`]/g;
const SHAPED_BODY = /satisfies\s+WaitlistSignupBody\b/g;
const EXCEPTED = new Set(['instrumentation-client.ts']);

function clientFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    const rel = relative(SRC, full).split(sep).join('/');
    if (entry.isDirectory()) {
      return entry.name === '__tests__' || rel === 'app/api' ? [] : clientFiles(full);
    }
    return /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec|stories)\.tsx?$/.test(entry.name)
      ? [full]
      : [];
  });
}

/** Each client file that names the signup path, with its path and shaped-body counts. */
function posters() {
  return clientFiles(SRC)
    .map((file) => {
      const code = stripComments(readFileSync(file, 'utf8'), file);
      return {
        file: relative(SRC, file).split(sep).join('/'),
        calls: (code.match(PATH_LITERAL) ?? []).length,
        shaped: (code.match(SHAPED_BODY) ?? []).length,
      };
    })
    .filter((p) => p.calls > 0 && !EXCEPTED.has(p.file));
}

describe('5.979 · every client signup request is built with the one shape', () => {
  it('should find the two client posters (the scan is not vacuous)', () => {
    expect(
      posters()
        .map((p) => p.file)
        .sort()
    ).toEqual([
      'components/WaitingList/hooks/useWaitlistForm.ts',
      'components/WaitingList/hooks/useWaitlistModalForm.ts',
    ]);
  });

  it('should build each signup body with satisfies WaitlistSignupBody', () => {
    const unshaped = posters().filter((p) => p.shaped < p.calls);
    expect(unshaped, 'build the body with `satisfies WaitlistSignupBody` (5.979)').toEqual([]);
  });
});
