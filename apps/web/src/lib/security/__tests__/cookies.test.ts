import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('@/config/env', () => ({
  COOKIE_CONFIG: {
    consentCookieName: 'diboas-consent',
    consentVersion: '1.0',
    maxAge: 31536000,
  },
  IS_PRODUCTION: false,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/server', () => {
  class MockNextResponse {
    cookies = {
      set: vi.fn(),
      delete: vi.fn(),
    };
    static json = vi.fn();
  }
  return { NextResponse: MockNextResponse };
});

import {
  setConsentCookie,
  getConsentFromRequest,
  getConsentFromCookies,
  hasAnalyticsConsent,
  clearConsentCookie,
  type ConsentValue,
} from '../cookies';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

describe('cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  describe('setConsentCookie', () => {
    it('should set cookie with correct attributes', () => {
      const response = new NextResponse() as unknown as NextResponse;
      const result = setConsentCookie(response, { analytics: true });

      expect(result).toBe(response);
      expect(
        (response.cookies as unknown as { set: ReturnType<typeof vi.fn> }).set
      ).toHaveBeenCalledWith({
        name: 'diboas-consent',
        value: JSON.stringify({
          analytics: true,
          version: '1.0',
          timestamp: 1700000000000,
        }),
        httpOnly: true,
        secure: false, // IS_PRODUCTION is false in test
        sameSite: 'strict',
        maxAge: 31536000,
        path: '/',
      });
    });

    it('should set secure flag based on IS_PRODUCTION', () => {
      const response = new NextResponse() as unknown as NextResponse;
      setConsentCookie(response, { analytics: false });

      const call = (response.cookies as unknown as { set: ReturnType<typeof vi.fn> }).set.mock
        .calls[0][0];
      expect(call.secure).toBe(false);
    });
  });

  describe('getConsentFromRequest', () => {
    it('should return null when no cookie header exists', () => {
      const request = new Request('https://example.com');
      expect(getConsentFromRequest(request)).toBeNull();
    });

    it('should return null when consent cookie is missing', () => {
      const request = new Request('https://example.com', {
        headers: { cookie: 'other-cookie=value' },
      });
      expect(getConsentFromRequest(request)).toBeNull();
    });

    it('should parse valid consent cookie', () => {
      const consent: ConsentValue = {
        analytics: true,
        version: '1.0',
        timestamp: 1700000000000,
      };
      const request = new Request('https://example.com', {
        headers: {
          cookie: `diboas-consent=${encodeURIComponent(JSON.stringify(consent))}`,
        },
      });

      expect(getConsentFromRequest(request)).toEqual(consent);
    });

    it('should return null for malformed JSON', () => {
      const request = new Request('https://example.com', {
        headers: { cookie: 'diboas-consent=not-json' },
      });
      expect(getConsentFromRequest(request)).toBeNull();
    });

    /** 5.823: one malformed cookie (anyone's) must never break reading consent. */
    it('should still read a valid consent when another cookie has malformed percent-encoding', () => {
      const consent = { analytics: true, version: '1.0', timestamp: 1 };
      const request = new Request('https://example.com', {
        headers: {
          cookie: `other=%E0%A4%A; diboas-consent=${encodeURIComponent(JSON.stringify(consent))}`,
        },
      });
      expect(getConsentFromRequest(request)).toEqual(consent);
    });

    it('should read no consent, failing closed, when the consent cookie itself is malformed', () => {
      const request = new Request('https://example.com', {
        headers: { cookie: 'diboas-consent=%E0%A4%A' },
      });
      expect(getConsentFromRequest(request)).toBeNull();
    });

    /* twelfth audit: skipping a malformed copy let an EARLIER valid copy grant consent. */
    it('should read no consent when a malformed copy of the consent cookie follows a valid one', () => {
      const granted = encodeURIComponent(
        JSON.stringify({ analytics: true, version: '1.0', timestamp: 1 })
      );
      const request = new Request('https://example.com', {
        headers: { cookie: `diboas-consent=${granted}; diboas-consent=%E0%A4%A` },
      });
      expect(getConsentFromRequest(request)).toBeNull();
    });

    it('should read the last copy when a repeated consent cookie is well formed', () => {
      const first = { analytics: true, version: '1.0', timestamp: 1 };
      const last = { analytics: false, version: '1.0', timestamp: 2 };
      const enc = (v: object) => encodeURIComponent(JSON.stringify(v));
      const request = new Request('https://example.com', {
        headers: { cookie: `diboas-consent=${enc(first)}; diboas-consent=${enc(last)}` },
      });
      expect(getConsentFromRequest(request)).toEqual(last);
    });

    it.each([
      ['a JSON string', '"x"'],
      ['JSON null', 'null'],
      ['an array', '[true]'],
      ['a number', '1'],
    ])('should read no consent when the consent cookie holds %s', (_l, raw) => {
      const request = new Request('https://example.com', {
        headers: { cookie: `diboas-consent=${encodeURIComponent(raw)}` },
      });
      expect(getConsentFromRequest(request)).toBeNull();
    });

    it('should handle multiple cookies in header', () => {
      const consent: ConsentValue = {
        analytics: false,
        version: '1.0',
        timestamp: 1700000000000,
      };
      const request = new Request('https://example.com', {
        headers: {
          cookie: `session=abc123; diboas-consent=${encodeURIComponent(JSON.stringify(consent))}; theme=dark`,
        },
      });

      expect(getConsentFromRequest(request)).toEqual(consent);
    });

    it('should skip segments with no name or no value when the header holds malformed pairs', () => {
      const consent: ConsentValue = {
        analytics: true,
        version: '1.0',
        timestamp: 1700000000000,
      };
      const request = new Request('https://example.com', {
        headers: {
          cookie: `flagonly; =orphan-value; diboas-consent=${encodeURIComponent(JSON.stringify(consent))}`,
        },
      });

      expect(getConsentFromRequest(request)).toEqual(consent);
    });

    it('should keep the valid consent when a later bare consent name without a value follows it', () => {
      const consent: ConsentValue = {
        analytics: false,
        version: '1.0',
        timestamp: 1700000000000,
      };
      const request = new Request('https://example.com', {
        headers: {
          cookie: `diboas-consent=${encodeURIComponent(JSON.stringify(consent))}; diboas-consent`,
        },
      });

      expect(getConsentFromRequest(request)).toEqual(consent);
    });

    it('should return null when the consent name appears only without a value', () => {
      const request = new Request('https://example.com', {
        headers: { cookie: 'diboas-consent; theme=dark' },
      });

      expect(getConsentFromRequest(request)).toBeNull();
    });
  });

  describe('getConsentFromCookies', () => {
    it('should return parsed consent from cookie store', async () => {
      const consent: ConsentValue = {
        analytics: true,
        version: '1.0',
        timestamp: 1700000000000,
      };
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: JSON.stringify(consent) }),
      } as never);

      expect(await getConsentFromCookies()).toEqual(consent);
    });

    it('should return null when cookie is not found', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as never);

      expect(await getConsentFromCookies()).toBeNull();
    });

    it('should return null when the stored value is not a JSON object', async () => {
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: '"granted"' }),
      } as never);

      expect(await getConsentFromCookies()).toBeNull();
    });

    it('should return null when cookies() throws', async () => {
      vi.mocked(cookies).mockRejectedValue(new Error('Not in server context'));

      expect(await getConsentFromCookies()).toBeNull();
    });
  });

  describe('hasAnalyticsConsent', () => {
    it('should return false for null consent', () => {
      expect(hasAnalyticsConsent(null)).toBe(false);
    });

    it('should return false when version mismatches', () => {
      expect(
        hasAnalyticsConsent({
          analytics: true,
          version: '0.9',
          timestamp: 1700000000000,
        })
      ).toBe(false);
    });

    it('should return false when analytics is false', () => {
      expect(
        hasAnalyticsConsent({
          analytics: false,
          version: '1.0',
          timestamp: 1700000000000,
        })
      ).toBe(false);
    });

    it('should return true when analytics is true and version matches', () => {
      expect(
        hasAnalyticsConsent({
          analytics: true,
          version: '1.0',
          timestamp: 1700000000000,
        })
      ).toBe(true);
    });
  });

  describe('clearConsentCookie', () => {
    it('should delete the consent cookie', () => {
      const response = new NextResponse() as unknown as NextResponse;
      const result = clearConsentCookie(response);

      expect(result).toBe(response);
      expect(
        (response.cookies as unknown as { delete: ReturnType<typeof vi.fn> }).delete
      ).toHaveBeenCalledWith('diboas-consent');
    });
  });
});
