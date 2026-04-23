/**
 * CookieConsent consentUtils — Additional Coverage Tests
 *
 * Targets: consent persistence to localStorage, consent withdrawal,
 * consent version checking, dispatchConsentEvent, getConsent,
 * syncConsentToApi, checkConsentFromApi, registerConsentWithdrawalHandler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/config/env', () => ({
  COOKIE_CONFIG: {
    consentLocalStorageKey: 'diboas-consent-test',
    consentVersion: '2.0',
  },
}));

vi.mock('@/lib/utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(),
}));

vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()), // returns unsubscribe
  },
  ApplicationEventType: {
    CONSENT_GIVEN: 'consent_given',
    CONSENT_WITHDRAWN: 'consent_withdrawn',
    APPLICATION_ERROR: 'application_error',
  },
}));

vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    clearLogs: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
});

// Stub window for typeof checks
if (typeof globalThis.window === 'undefined') {
  vi.stubGlobal('window', globalThis);
}

import {
  createConsentValue,
  saveConsentToStorage,
  getStoredConsent,
  getConsent,
  hasAnalyticsConsent,
  isConsentVersionCurrent,
  dispatchConsentEvent,
  syncConsentToApi,
  checkConsentFromApi,
  registerConsentWithdrawalHandler,
} from '../consentUtils';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { Logger } from '@/lib/monitoring/Logger';

describe('consentUtils — additional coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  describe('consent persistence to localStorage', () => {
    it('should persist analytics=true consent with version and timestamp', () => {
      const consent = createConsentValue(true);
      saveConsentToStorage(consent);

      const raw = store['diboas-consent-test'];
      expect(raw).toBeDefined();

      const parsed = JSON.parse(raw);
      expect(parsed.analytics).toBe(true);
      expect(parsed.version).toBe('2.0');
      expect(typeof parsed.timestamp).toBe('number');
    });

    it('should persist analytics=false consent', () => {
      const consent = createConsentValue(false);
      saveConsentToStorage(consent);

      const parsed = JSON.parse(store['diboas-consent-test']);
      expect(parsed.analytics).toBe(false);
    });

    it('should overwrite previous consent when saving new consent', () => {
      saveConsentToStorage(createConsentValue(true));
      saveConsentToStorage(createConsentValue(false));

      const parsed = JSON.parse(store['diboas-consent-test']);
      expect(parsed.analytics).toBe(false);
    });
  });

  describe('consent withdrawal', () => {
    it('should return false from hasAnalyticsConsent after saving decline', () => {
      saveConsentToStorage(createConsentValue(false));
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it('should return false when consent version is outdated', () => {
      // Store consent with wrong version
      store['diboas-consent-test'] = JSON.stringify({
        analytics: true,
        version: '0.1',
        timestamp: Date.now(),
      });

      expect(hasAnalyticsConsent()).toBe(false);
    });
  });

  describe('consent version checking', () => {
    it('should detect current version as valid', () => {
      const consent = createConsentValue(true);
      expect(isConsentVersionCurrent(consent)).toBe(true);
    });

    it('should detect mismatched version as invalid', () => {
      const consent = { analytics: true, version: '1.0', timestamp: Date.now() };
      expect(isConsentVersionCurrent(consent)).toBe(false);
    });
  });

  describe('getConsent', () => {
    it('should return null when no consent stored', () => {
      expect(getConsent()).toBeNull();
    });

    it('should return stored consent object', () => {
      saveConsentToStorage(createConsentValue(true));
      const consent = getConsent();
      expect(consent).not.toBeNull();
      expect(consent?.analytics).toBe(true);
    });

    it('should return null when localStorage contains invalid JSON', () => {
      store['diboas-consent-test'] = 'not-json';
      expect(getConsent()).toBeNull();
    });
  });

  describe('getStoredConsent', () => {
    it('should return null when localStorage has invalid JSON', () => {
      store['diboas-consent-test'] = '{broken';
      expect(getStoredConsent()).toBeNull();
    });
  });

  describe('dispatchConsentEvent', () => {
    it('should dispatch CustomEvent on window', () => {
      // Ensure dispatchEvent exists on window stub
      const mockDispatch = vi.fn();
      (window as unknown as Record<string, unknown>).dispatchEvent = mockDispatch;

      const consent = createConsentValue(true);
      dispatchConsentEvent(consent);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const event = mockDispatch.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('cookie-consent-changed');
      expect(event.detail).toEqual(consent);
    });
  });

  describe('syncConsentToApi', () => {
    it('should call fetchWithRetry with correct args and return true on success', async () => {
      vi.mocked(fetchWithRetry).mockResolvedValue({ ok: true } as Response);

      const result = await syncConsentToApi(true);

      expect(result).toBe(true);
      expect(fetchWithRetry).toHaveBeenCalledWith('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics: true }),
      });
    });

    it('should return false when response is not ok', async () => {
      vi.mocked(fetchWithRetry).mockResolvedValue({ ok: false } as Response);

      const result = await syncConsentToApi(false);

      expect(result).toBe(false);
    });

    it('should return false and emit error event on network failure', async () => {
      vi.mocked(fetchWithRetry).mockRejectedValue(new Error('Network error'));

      const result = await syncConsentToApi(true);

      expect(result).toBe(false);
      expect(applicationEventBus.emit).toHaveBeenCalledWith(
        ApplicationEventType.APPLICATION_ERROR,
        expect.objectContaining({
          source: 'consent',
          severity: 'medium',
        })
      );
    });

    it('should wrap non-Error thrown values in Error', async () => {
      vi.mocked(fetchWithRetry).mockRejectedValue('string error');

      const result = await syncConsentToApi(true);

      expect(result).toBe(false);
      expect(applicationEventBus.emit).toHaveBeenCalledWith(
        ApplicationEventType.APPLICATION_ERROR,
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });
  });

  describe('checkConsentFromApi', () => {
    it('should return consent data on successful response', async () => {
      vi.mocked(fetchWithRetry).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ consent: { analytics: true, version: '2.0' } }),
      } as unknown as Response);

      const result = await checkConsentFromApi();

      expect(result).toEqual({ analytics: true, version: '2.0' });
    });

    it('should return null on non-ok response', async () => {
      vi.mocked(fetchWithRetry).mockResolvedValue({ ok: false } as Response);

      const result = await checkConsentFromApi();

      expect(result).toBeNull();
    });

    it('should return null when response has no consent field', async () => {
      vi.mocked(fetchWithRetry).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as unknown as Response);

      const result = await checkConsentFromApi();

      expect(result).toBeNull();
    });

    it('should return null and emit error event on failure', async () => {
      vi.mocked(fetchWithRetry).mockRejectedValue(new Error('Fetch failed'));

      const result = await checkConsentFromApi();

      expect(result).toBeNull();
      expect(applicationEventBus.emit).toHaveBeenCalledWith(
        ApplicationEventType.APPLICATION_ERROR,
        expect.objectContaining({
          source: 'consent',
          severity: 'low',
        })
      );
    });
  });

  describe('registerConsentWithdrawalHandler', () => {
    it('should register a handler on CONSENT_WITHDRAWN event', () => {
      const unsubscribe = registerConsentWithdrawalHandler();

      expect(applicationEventBus.on).toHaveBeenCalledWith(
        ApplicationEventType.CONSENT_WITHDRAWN,
        expect.any(Function)
      );

      // Returns unsubscribe function
      expect(typeof unsubscribe).toBe('function');
    });

    it('should clear logs when consent is withdrawn', () => {
      // Get the handler that was registered
      let registeredHandler: (() => void) | undefined;
      vi.mocked(applicationEventBus.on).mockImplementation((_event, handler) => {
        registeredHandler = handler as () => void;
        return vi.fn();
      });

      registerConsentWithdrawalHandler();

      // Simulate consent withdrawal
      expect(registeredHandler).toBeDefined();
      registeredHandler!();

      expect(Logger.clearLogs).toHaveBeenCalled();
    });
  });
});
