/**
 * Unsubscribe links — the HMAC-signed token's mint and decode (COV-1 100% set; twelfth audit).
 *
 * The token is the only thing that authorises an unsubscribe: `id` is the email's blind index,
 * `token` is an HMAC of that index, and both ride in one base64url `t` param. The mint must
 * refuse without a key (never a link signed with nothing), and the decoder must answer `null`,
 * never throw, for anything that is not exactly `id:token`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hmacHash = vi.fn<(value: string) => string | null>();
vi.mock('@/lib/security/encryption', () => ({ hmacHash: (v: string) => hmacHash(v) }));
vi.mock('@/config/env', () => ({ APP_URL: 'https://diboas.com' }));

import { buildUnsubscribeUrls, decodeUnsubToken, encodeUnsubToken } from '../unsubscribeUrl';

describe('encodeUnsubToken / decodeUnsubToken', () => {
  it('should round-trip an id and token when both are present', () => {
    expect(decodeUnsubToken(encodeUnsubToken('abc123', 'def456'))).toEqual({
      id: 'abc123',
      token: 'def456',
    });
  });

  it('should decode the URL-safe alphabet (- and _) back to standard base64', () => {
    // '>>>' and '???' encode to base64 containing '+' and '/', so base64url carries '-' and '_'.
    const t = encodeUnsubToken('>>>', '???');
    expect(t).toMatch(/[-_]/);
    expect(decodeUnsubToken(t)).toEqual({ id: '>>>', token: '???' });
  });

  it('should keep a colon inside the token, splitting at the first one only', () => {
    expect(decodeUnsubToken(encodeUnsubToken('id', 'to:ken'))).toEqual({
      id: 'id',
      token: 'to:ken',
    });
  });

  it.each([
    ['there is no separator', Buffer.from('noseparator').toString('base64url')],
    ['the id is empty', Buffer.from(':token').toString('base64url')],
    ['the token is empty', Buffer.from('id:').toString('base64url')],
    ['the input is not base64', '%%%not-base64%%%'],
  ])('should return null, never throw, when %s', (_l, t) => {
    expect(decodeUnsubToken(t)).toBeNull();
  });
});

describe('buildUnsubscribeUrls', () => {
  beforeEach(() => {
    hmacHash.mockReset();
    hmacHash.mockImplementation((v) => `h(${v})`);
  });

  it('should sign the blind index and put one token in both URLs', () => {
    const urls = buildUnsubscribeUrls('ana@example.com', 'pt-BR');
    expect(hmacHash).toHaveBeenNthCalledWith(1, 'ana@example.com');
    expect(hmacHash).toHaveBeenNthCalledWith(2, 'h(ana@example.com)');
    const t = encodeUnsubToken('h(ana@example.com)', 'h(h(ana@example.com))');
    expect(urls).toEqual({
      pageUrl: `https://diboas.com/pt-BR/email-preferences?t=${t}`,
      apiUrl: `https://diboas.com/api/email/unsubscribe?t=${t}`,
    });
  });

  it('should default the page to English when no locale is given', () => {
    expect(buildUnsubscribeUrls('ana@example.com')?.pageUrl).toContain('/en/email-preferences?t=');
  });

  it('should mint no link when the blind index has no key', () => {
    hmacHash.mockReturnValueOnce(null);
    expect(buildUnsubscribeUrls('ana@example.com')).toBeUndefined();
  });

  it('should mint no link when the token has no key', () => {
    hmacHash.mockReturnValueOnce('h1').mockReturnValueOnce(null);
    expect(buildUnsubscribeUrls('ana@example.com')).toBeUndefined();
  });
});
