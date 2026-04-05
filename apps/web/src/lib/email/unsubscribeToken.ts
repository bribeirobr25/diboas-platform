/**
 * Unsubscribe Token Decoder
 *
 * Client-safe utility — no Node.js-only imports.
 * Used by the email-preferences page (client component) to decode the `t` URL param.
 *
 * Security note: base64 encoding is trivially reversible. The actual security boundary
 * is HMAC: `id` is a one-way hash, `token` requires the secret key to forge.
 */

/**
 * Decode a base64url `t` param back to id and token.
 * Works in both Node.js and browser environments.
 *
 * base64url uses `-` and `_`; atob() expects `+` and `/`.
 * The decoder converts base64url → standard base64 before calling atob().
 */
export function decodeUnsubToken(t: string): { id: string; token: string } | null {
  try {
    // base64url → standard base64: replace URL-safe chars with standard ones
    const base64 = t.replace(/-/g, '+').replace(/_/g, '/');
    // atob() works in both Node.js (≥16) and browsers — avoids Buffer polyfill issues
    const decoded = atob(base64);
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) return null;
    const id = decoded.substring(0, separatorIndex);
    const token = decoded.substring(separatorIndex + 1);
    if (!id || !token) return null;
    return { id, token };
  } catch {
    return null;
  }
}
