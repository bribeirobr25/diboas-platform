import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing the service
vi.mock('@/lib/events/SectionEventBus', () => ({
  sectionEventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  SectionEventType: { SECTION_ERROR: 'section:error' },
}));

vi.mock('@/lib/monitoring/AlertingService', () => ({
  alertingService: { sendErrorAlert: vi.fn() },
  AlertSeverity: { CRITICAL: 'critical', ERROR: 'error', WARNING: 'warning', INFO: 'info' },
}));

vi.mock('../errorInference', () => ({
  mapSeverity: vi.fn((s: string) => s),
  inferSeverity: vi.fn(() => 'medium'),
  inferCategory: vi.fn(() => 'javascript'),
  inferRecoverability: vi.fn(() => true),
  generateFingerprint: vi.fn(() => 'test-fingerprint'),
  sanitizeContext: vi.fn((ctx: unknown) => ctx),
  buildTags: vi.fn(() => ['test']),
  generateErrorId: vi.fn(() => 'err-test-001'),
  generateSessionId: vi.fn(() => 'session-test-001'),
}));

vi.mock('../breadcrumbManager', () => ({
  BreadcrumbManager: class MockBreadcrumbManager {
    initialize = vi.fn();
    add = vi.fn();
    getAll = vi.fn(() => []);
    clear = vi.fn();
    destroy = vi.fn();
  },
}));

vi.mock('../errorConfig', () => ({
  DEFAULT_ERROR_CONFIG: {
    enableReporting: false,
    sampleRate: 1,
    environment: 'test',
    maxBreadcrumbs: 50,
    enableUserTracking: false,
  },
}));

import { ErrorReportingService } from '../ErrorReportingService';

describe('ErrorReportingService', () => {
  let service: ErrorReportingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ErrorReportingService({ enableReporting: false, sampleRate: 1 });
  });

  describe('reportError', () => {
    it('should generate a unique error ID for each report', () => {
      const error = new Error('Test error');
      const errorId = service.reportError(error);

      expect(errorId).toBe('err-test-001');
    });

    it('should accept severity and category options', () => {
      const error = new Error('Critical failure');
      const errorId = service.reportError(error, {
        severity: 'critical' as never,
        category: 'network' as never,
      });

      expect(errorId).toBeTruthy();
    });

    it('should handle errors during reporting gracefully', async () => {
      const errorInference = await import('../errorInference');
      vi.mocked(errorInference.generateFingerprint).mockImplementationOnce(() => {
        throw new Error('Fingerprint generation failed');
      });

      const error = new Error('Test error');
      const errorId = service.reportError(error);

      expect(errorId).toBe('error-reporting-failed');
    });
  });

  describe('error deduplication', () => {
    it('should track occurrence count for repeated errors', () => {
      const error = new Error('Repeated error');

      service.reportError(error);
      service.reportError(error);
      service.reportError(error);

      const stats = service.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.uniqueErrors).toBe(1);
    });
  });

  describe('handleError (delegation)', () => {
    it('should report error when called via delegation', () => {
      const error = new Error('Delegated error');
      const errorId = service.handleError(error);

      expect(errorId).toBeTruthy();
    });

    it('should accept optional context', () => {
      const error = new Error('Contextual error');
      const errorId = service.handleError(error, {
        sectionId: 'test-section',
      });

      expect(errorId).toBeTruthy();
    });
  });

  describe('clearErrors', () => {
    it('should reset all error tracking data', () => {
      service.reportError(new Error('Error 1'));
      service.reportError(new Error('Error 2'));

      service.clearErrors();

      const stats = service.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.uniqueErrors).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should clear all state and mark as uninitialized', () => {
      service.reportError(new Error('Before destroy'));
      service.destroy();

      const stats = service.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.uniqueErrors).toBe(0);
    });
  });

  describe('getErrorStats', () => {
    it('should return zero counts when no errors reported', () => {
      const stats = service.getErrorStats();

      expect(stats.totalErrors).toBe(0);
      expect(stats.uniqueErrors).toBe(0);
    });
  });
});
