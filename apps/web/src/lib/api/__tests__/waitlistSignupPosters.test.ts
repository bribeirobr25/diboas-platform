import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

/**
 * ⛑ `5.979` · WAITLIST-SOURCE-1 guard 7: every client request to the signup route is built
 * with the one request shape (plan P11, D3).
 *
 * The modal's body was a `JSON.stringify` literal, which type-checks anything, so its
 * `source: 'modal'` compiled while the server refused it. Wherever client code names
 * `/api/waitlist/signup` (in any string or template, with any prefix or query), that mention
 * must sit inside a `fetch`/`fetchWithRetry` call whose own arguments build the body with
 * `satisfies WaitlistSignupBody` or `buildModalSignupBody` (typed to return that shape), and a
 * poster may not cast to `WaitlistSource`. A source outside the list is then a compile error
 * at the call that sends it.
 *
 * Scope: client files under `src/` (not `app/api/**`, the route itself). The BotID config in
 * `instrumentation-client.ts` names the path to protect it and posts nothing, so it is
 * excepted by name. A path assembled from fragments (`'/api/waitlist/' + 'signup'`) escapes
 * the scan (a stated limit).
 */
const SRC = join(__dirname, '..', '..', '..');
const SIGNUP_PATH = /\/api\/waitlist\/signup\b/g;
const SHAPED_BODY = /satisfies\s+WaitlistSignupBody\b|\bbuildModalSignupBody\(/;
const CAST_TO_SOURCE = /\bas\s+WaitlistSource\b/;
const REQUEST_CALL = /\b(?:fetchWithRetry|fetch)\s*\(/g;
/** The shared builder a poster may use instead of `satisfies`: it must return the shape. */
const BUILDER = join(SRC, 'lib', 'waitingList', 'modalSignupBody.ts');
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

/** The text of each request call (`fetch(...)`/`fetchWithRetry(...)`), parentheses balanced. */
function requestCalls(code: string): { start: number; end: number }[] {
  const calls: { start: number; end: number }[] = [];
  for (const match of code.matchAll(REQUEST_CALL)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    let depth = 0;
    for (let i = open; i < code.length; i += 1) {
      if (code[i] === '(') depth += 1;
      else if (code[i] === ')' && --depth === 0) {
        calls.push({ start: match.index ?? 0, end: i + 1 });
        break;
      }
    }
  }
  return calls;
}

/** Each client file that names the signup path, with what each mention sits in. */
function posters() {
  return clientFiles(SRC).flatMap((file) => {
    const rel = relative(SRC, file).split(sep).join('/');
    if (EXCEPTED.has(rel)) return [];
    const code = stripComments(readFileSync(file, 'utf8'), file);
    const mentions = [...code.matchAll(SIGNUP_PATH)].map((m) => m.index ?? 0);
    if (mentions.length === 0) return [];
    const calls = requestCalls(code);
    return [
      {
        file: rel,
        casts: CAST_TO_SOURCE.test(code),
        mentions: mentions.map((at) => {
          const call = calls.find((c) => c.start <= at && at < c.end);
          if (!call) return 'outside a request';
          return SHAPED_BODY.test(code.slice(call.start, call.end)) ? 'shaped' : 'unshaped';
        }),
      },
    ];
  });
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

  it('should keep the shared builder typed to the one shape', () => {
    const code = stripComments(readFileSync(BUILDER, 'utf8'), BUILDER);
    expect(code).toMatch(
      /export function buildModalSignupBody\([^)]*\)\s*:\s*WaitlistSignupBody\s*\{/
    );
  });

  it('should build each signup body with the one shape, inside the call that sends it', () => {
    const wrong = posters().filter((p) => p.mentions.some((m) => m !== 'shaped'));
    expect(
      wrong,
      'name the path only in a fetch call built with `satisfies WaitlistSignupBody` (5.979)'
    ).toEqual([]);
  });

  it('should not cast to WaitlistSource in a poster (a cast silences the shape check)', () => {
    expect(
      posters()
        .filter((p) => p.casts)
        .map((p) => p.file)
    ).toEqual([]);
  });
});
