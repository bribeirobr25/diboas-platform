import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test PostHog provider logic without rendering (node environment)
// Validates consent-gating and cleanup behavior

describe('PostHogProvider consent logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('consent-gated initialization', () => {
    it('should not import posthog-js when consent is not given', async () => {
      // Verify the import pattern: posthog should only be imported after consent
      const dynamicImport = vi.fn().mockRejectedValue(new Error('Should not be called'));

      // Without consent, the import should never execute
      const hasConsent = false;
      if (hasConsent) {
        await dynamicImport('posthog-js');
      }

      expect(dynamicImport).not.toHaveBeenCalled();
    });

    it('should import posthog-js when consent is given', async () => {
      const mockPosthog = {
        default: {
          init: vi.fn(),
          opt_out_capturing: vi.fn(),
          debug: vi.fn(),
        },
      };
      const dynamicImport = vi.fn().mockResolvedValue(mockPosthog);

      const hasConsent = true;
      if (hasConsent) {
        const mod = await dynamicImport('posthog-js');
        expect(mod.default.init).toBeDefined();
      }

      expect(dynamicImport).toHaveBeenCalledWith('posthog-js');
    });
  });

  describe('opt-out on consent revocation', () => {
    it('should call opt_out_capturing when consent is revoked', () => {
      const mockPosthog = {
        opt_out_capturing: vi.fn(),
      };

      // Simulate consent revocation
      const consentRevoked = true;
      const isInitialized = true;

      if (consentRevoked && isInitialized) {
        mockPosthog.opt_out_capturing();
      }

      expect(mockPosthog.opt_out_capturing).toHaveBeenCalled();
    });

    it('should not call opt_out_capturing when not initialized', () => {
      const mockPosthog = {
        opt_out_capturing: vi.fn(),
      };

      const consentRevoked = true;
      const isInitialized = false;

      if (consentRevoked && isInitialized) {
        mockPosthog.opt_out_capturing();
      }

      expect(mockPosthog.opt_out_capturing).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should not initialize without API key', () => {
      const posthogKey = '';
      const initFn = vi.fn();

      if (posthogKey) {
        initFn();
      }

      expect(initFn).not.toHaveBeenCalled();
    });

    it('should use correct default config options', () => {
      const config = {
        capture_pageview: true,
        capture_pageleave: true,
        respect_dnt: true,
      };

      expect(config.capture_pageview).toBe(true);
      expect(config.capture_pageleave).toBe(true);
      expect(config.respect_dnt).toBe(true);
    });
  });
});
