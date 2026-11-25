/**
 * The email-link token check, shared by the unsubscribe and note-removal routes (market clean-up
 * W-D1, spec §3.6). Moved from the unsubscribe route; renamed so it never clashes with
 * `lib/security/authentication`'s `verifyToken`.
 *
 * SERVER ONLY: it uses Node's `crypto`. A source test fails if any client file imports it (the
 * `server-only` package is not installed and Vitest cannot resolve it); `unsubscribeToken.ts`
 * stays crypto-free because the email-preferences page imports it.
 */
import { timingSafeEqual } from 'crypto';
import { hmacHash } from '@/lib/security/encryption';
import { decodeUnsubToken } from '@/lib/email/unsubscribeUrl';

/**
 * Whether `token` is the HMAC of `emailHash`, in constant time. A length mismatch leaks only the
 * length, and HMAC outputs share one length, so any mismatch is a malformed input.
 */
export function verifyEmailLinkToken(emailHash: string, token: string): boolean {
  const expected = hmacHash(emailHash);
  if (!expected) return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(token, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The link's id (email hash) and token, from the URL or the body: the `t` parameter (new format)
 * or the legacy `id` + `token`, URL first.
 */
export function extractEmailLinkId(
  searchParams: URLSearchParams,
  body?: Record<string, unknown>
): { id: string; token: string } | null {
  const tParam = searchParams.get('t');
  if (tParam) {
    const decoded = decodeUnsubToken(tParam);
    if (decoded) return decoded;
  }
  const urlId = searchParams.get('id');
  const urlToken = searchParams.get('token');
  if (urlId && urlToken) return { id: urlId, token: urlToken };
  if (body?.t && typeof body.t === 'string') {
    const decoded = decodeUnsubToken(body.t);
    if (decoded) return decoded;
  }
  if (body?.id && body?.token && typeof body.id === 'string' && typeof body.token === 'string') {
    return { id: body.id, token: body.token };
  }
  return null;
}
