import { afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { generateId } from '../ids';

/**
 * `generateId` and its non-secure-context fallback (register 5.70: a security utility, so
 * every branch is owed a test).
 *
 * `crypto.randomUUID` exists only in secure contexts; over plain-http LAN access (the visual
 * protocol) it is undefined while `crypto.getRandomValues` is still there. The fallback must
 * then build a spec-compliant RFC 4122 version-4 UUID — the version nibble is 4 and the
 * variant bits are `10` — whatever bytes the generator returns. Every expectation below is
 * derived from that spec, not from running the code.
 */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** A `crypto` without `randomUUID` — the shape a non-secure context exposes. */
function insecureCrypto(fill?: number) {
  return {
    getRandomValues: (bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> =>
      fill === undefined ? webcrypto.getRandomValues(bytes) : bytes.fill(fill),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateId · secure context', () => {
  it('should delegate to crypto.randomUUID when the context provides it', () => {
    const randomUUID = vi.fn(() => '11111111-2222-4333-8444-555555555555');
    vi.stubGlobal('crypto', { randomUUID, ...insecureCrypto() });
    expect(generateId()).toBe('11111111-2222-4333-8444-555555555555');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });
});

describe('generateId · non-secure-context fallback', () => {
  it('should build a version-4 UUID from getRandomValues when randomUUID is absent', () => {
    vi.stubGlobal('crypto', insecureCrypto());
    const ids = Array.from({ length: 64 }, () => generateId());
    for (const id of ids) expect(id).toMatch(UUID_V4);
    // Random bytes, not a constant: 64 draws never collide.
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should force the version and variant bits when every random byte is 0xff', () => {
    vi.stubGlobal('crypto', insecureCrypto(0xff));
    // byte 6: 0xff & 0x0f | 0x40 = 0x4f; byte 8: 0xff & 0x3f | 0x80 = 0xbf.
    expect(generateId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });

  it('should force the version and variant bits when every random byte is 0x00', () => {
    vi.stubGlobal('crypto', insecureCrypto(0x00));
    // byte 6: 0x00 | 0x40 = 0x40; byte 8: 0x00 | 0x80 = 0x80 — hex is zero-padded.
    expect(generateId()).toBe('00000000-0000-4000-8000-000000000000');
  });
});
