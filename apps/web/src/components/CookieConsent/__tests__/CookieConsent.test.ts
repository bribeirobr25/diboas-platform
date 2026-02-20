import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: { emit: vi.fn() },
  ApplicationEventType: { CONSENT_GIVEN: 'consent_given', CONSENT_WITHDRAWN: 'consent_withdrawn' },
}));

// Mock localStorage and window for node environment
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
});

// Stub window to satisfy `typeof window !== 'undefined'` checks
if (typeof globalThis.window === 'undefined') {
  vi.stubGlobal('window', globalThis);
}

import {
  createConsentValue,
  isConsentVersionCurrent,
  hasAnalyticsConsent,
  getStoredConsent,
  saveConsentToStorage,
} from '../consentUtils';

describe('Cookie Consent Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  describe('createConsentValue', () => {
    it('should create consent value with analytics true', () => {
      const consent = createConsentValue(true);

      expect(consent.analytics).toBe(true);
      expect(consent.version).toBeDefined();
      expect(consent.timestamp).toBeDefined();
      expect(typeof consent.timestamp).toBe('number');
    });

    it('should create consent value with analytics false', () => {
      const consent = createConsentValue(false);

      expect(consent.analytics).toBe(false);
      expect(consent.version).toBeDefined();
    });
  });

  describe('isConsentVersionCurrent', () => {
    it('should return true for current version', () => {
      const consent = createConsentValue(true);

      expect(isConsentVersionCurrent(consent)).toBe(true);
    });

    it('should return false for outdated version', () => {
      const outdated = { analytics: true, version: '0.0', timestamp: Date.now() };

      expect(isConsentVersionCurrent(outdated)).toBe(false);
    });
  });

  describe('storage operations', () => {
    it('should return null when no consent is stored', () => {
      const consent = getStoredConsent();

      expect(consent).toBeNull();
    });

    it('should save and retrieve consent from storage', () => {
      const consent = createConsentValue(true);
      saveConsentToStorage(consent);

      const retrieved = getStoredConsent();

      expect(retrieved).toBeDefined();
      expect(retrieved?.analytics).toBe(true);
    });
  });

  describe('hasAnalyticsConsent', () => {
    it('should return false when no consent exists', () => {
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it('should return true when analytics consent was given', () => {
      const consent = createConsentValue(true);
      saveConsentToStorage(consent);

      expect(hasAnalyticsConsent()).toBe(true);
    });

    it('should return false when analytics was declined', () => {
      const consent = createConsentValue(false);
      saveConsentToStorage(consent);

      expect(hasAnalyticsConsent()).toBe(false);
    });
  });
});
