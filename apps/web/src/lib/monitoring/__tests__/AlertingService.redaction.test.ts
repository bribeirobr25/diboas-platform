/**
 * Error alerts leave for Slack and email with personal data and tokens redacted (fourteenth
 * audit: `sendErrorAlert` forwarded the raw message, stack and context).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const deliverAlert = vi.fn().mockResolvedValue(undefined);
vi.mock('../alertDelivery', () => ({ deliverAlert, sendResolutionNotification: vi.fn() }));

const { MonitoringAlertService, AlertSeverity } = await import('../AlertingService');

const LEAK_MARKER = 'FAKE_DELETION_TOKEN_VALUE';

describe('sendErrorAlert redaction', () => {
  const service = new MonitoringAlertService();
  afterEach(() => deliverAlert.mockClear());

  it('should deliver no email, IP, token or token URL when the error and context carry them', async () => {
    const error = new Error(
      `no row for ana@example.com from 203.0.113.7 at /en/delete-confirm?token=${LEAK_MARKER}`
    );
    error.stack = `Error: ${error.message}\n    at handler (https://diboas.com/api/x?t=${LEAK_MARKER})`;
    await service.sendErrorAlert(error, AlertSeverity.ERROR, {
      email: 'ana@example.com',
      path: `/en/email-preferences?t=${LEAK_MARKER}`,
      route: '/api/waitlist/delete',
    });
    expect(deliverAlert).toHaveBeenCalledTimes(1);
    const delivered = JSON.stringify(deliverAlert.mock.calls[0][0]);
    for (const secret of [LEAK_MARKER, 'ana@example.com', '203.0.113.7'])
      expect(delivered, secret).not.toContain(secret);
    expect(delivered).toContain('/api/waitlist/delete');
    expect(delivered).toContain('[EMAIL_REDACTED]');
  });

  it('should keep an error with no stack deliverable when the stack is missing', async () => {
    const error = new Error('plain failure');
    error.stack = undefined;
    await service.sendErrorAlert(error, AlertSeverity.ERROR);
    const alert = deliverAlert.mock.calls[0][0] as {
      message: string;
      metadata: { stack?: string };
    };
    expect(alert.message).toBe('plain failure');
    expect(alert.metadata.stack).toBeUndefined();
  });
});
