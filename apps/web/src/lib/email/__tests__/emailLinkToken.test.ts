/**
 * The shared email-link token check (W-D1, spec §3.6; CONSENT-EVIDENCE-1). Held at 100% (COV-1).
 * It uses Node's `crypto`, so no client file may import it (a source check below).
 */
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { stripComments } from '@diboas/test-support';

const hmacHash = vi.fn();
vi.mock('@/lib/security/encryption', () => ({ hmacHash: (v: string) => hmacHash(v) }));

import { extractEmailLinkId, verifyEmailLinkToken } from '../emailLinkToken';

const ID = 'a'.repeat(64);
const TOKEN = createHmac('sha256', 'k').update(ID).digest('hex');
const t = (id: string, token: string) => Buffer.from(`${id}:${token}`).toString('base64url');

describe('verifyEmailLinkToken', () => {
  it('should accept the HMAC of the id and refuse anything else', () => {
    hmacHash.mockReturnValue(TOKEN);
    expect(verifyEmailLinkToken(ID, TOKEN)).toBe(true);
    expect(verifyEmailLinkToken(ID, TOKEN.slice(0, -1) + (TOKEN.endsWith('0') ? '1' : '0'))).toBe(
      false
    );
    expect(verifyEmailLinkToken(ID, TOKEN.slice(1))).toBe(false);
  });

  it('should refuse everything when the HMAC key is unavailable', () => {
    hmacHash.mockReturnValue(null);
    expect(verifyEmailLinkToken(ID, TOKEN)).toBe(false);
  });
});

describe('extractEmailLinkId', () => {
  const params = (q: string) => new URLSearchParams(q);
  it('should read the URL first: `t`, then the legacy id and token', () => {
    expect(extractEmailLinkId(params(`t=${t(ID, TOKEN)}`))).toEqual({ id: ID, token: TOKEN });
    expect(extractEmailLinkId(params(`id=${ID}&token=${TOKEN}`))).toEqual({ id: ID, token: TOKEN });
  });

  it('should fall back to the body: `t`, then the legacy id and token', () => {
    expect(extractEmailLinkId(params(''), { t: t(ID, TOKEN) })).toEqual({ id: ID, token: TOKEN });
    expect(extractEmailLinkId(params(''), { id: ID, token: TOKEN })).toEqual({
      id: ID,
      token: TOKEN,
    });
  });

  it('should skip an undecodable `t` and find nothing in a body of the wrong shape', () => {
    expect(extractEmailLinkId(params('t=%%%'), { t: '###', id: 7, token: TOKEN })).toBeNull();
    expect(extractEmailLinkId(params(''))).toBeNull();
    expect(extractEmailLinkId(params(''), { id: ID })).toBeNull();
  });
});

describe('emailLinkToken stays server-only', () => {
  it('should be imported by no client component', () => {
    const WEB = resolve(__dirname, '../../../..');
    const importers = execSync('git ls-files src', { cwd: WEB, encoding: 'utf8' })
      .split('\n')
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/__tests__\//.test(f))
      .filter((f) =>
        /from '@\/lib\/email\/emailLinkToken'/.test(readFileSync(join(WEB, f), 'utf8'))
      );
    expect(importers.sort()).toEqual([
      'src/app/api/email/unsubscribe/route.ts',
      'src/app/api/waitlist/note-removal/route.ts',
    ]);
    for (const f of importers)
      expect(stripComments(readFileSync(join(WEB, f), 'utf8'), f)).not.toMatch(
        /['"]use client['"]/
      );
  });
});
