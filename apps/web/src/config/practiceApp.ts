/**
 * The Practice app's address (plan P13, D2; register `5.120`). Fixed, not configurable: the
 * address is public, and every link that opens Practice reads it.
 *
 * Not `APP_URL`: that is the website's own origin (`NEXT_PUBLIC_APP_URL`), and a Practice link
 * built from it sent the reader back to this site. The email package pins the same literal as
 * `BRAND.practiceUrl` (it cannot import this file); `practiceAppUrl.test.ts` keeps the two equal.
 *
 * A module of its own, with no imports and no side effects, because `middleware.ts` reads it on
 * every request: `config/env.ts` validates production secrets when it loads, which must never
 * run in middleware.
 */
export const PRACTICE_APP_URL = 'https://app.diboas.com';
