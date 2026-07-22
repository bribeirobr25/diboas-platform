/**
 * Id generation with a non-secure-context fallback.
 *
 * `crypto.randomUUID` exists only in secure contexts (https / localhost);
 * testing over a LAN IP (the Docker MCP visual protocol) is plain http, where
 * it is undefined. `crypto.getRandomValues` IS available there, so the
 * fallback builds a spec-compliant UUIDv4 from it (found live 2026-07-18 by
 * the visual pass — the exact bug class the per-slice battery exists for).
 */

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
