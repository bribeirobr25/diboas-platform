import { describe, expect, it } from 'vitest';
import { scrubAnalyticsEvent } from '../scrubAnalyticsEvent';

describe('scrubAnalyticsEvent (PostHog before_send, 5.864)', () => {
  it('should strip tokens from every URL-valued property, person properties included', () => {
    const event = scrubAnalyticsEvent({
      properties: {
        $current_url: 'https://diboas.com/en/delete-confirm?token=abc',
        $pathname: '/en/delete-confirm',
        $referrer: 'https://diboas.com/pt-BR/email-preferences?t=x&utm_source=mail',
        plan: 'free',
        count: 3,
      },
      $set: { $current_url: '/en/email-preferences?t=x' },
      $set_once: { $initial_current_url: 'https://diboas.com/?ref=REFABCD12&token=1' },
    });
    expect(event.properties).toEqual({
      $current_url: 'https://diboas.com/en/delete-confirm',
      $pathname: '/en/delete-confirm',
      $referrer: 'https://diboas.com/pt-BR/email-preferences?utm_source=mail',
      plan: 'free',
      count: 3,
    });
    expect(event.$set).toEqual({ $current_url: '/en/email-preferences' });
    expect(event.$set_once).toEqual({ $initial_current_url: 'https://diboas.com/?ref=REFABCD12' });
  });

  it('should pass a null event and an event without properties through', () => {
    expect(scrubAnalyticsEvent(null)).toBeNull();
    expect(scrubAnalyticsEvent({})).toEqual({});
  });
});

describe('scrubAnalyticsEvent at depth (thirteenth audit)', () => {
  it('should scrub nested URLs and URL-valued keys (web vitals, heatmaps, exceptions)', () => {
    const event = scrubAnalyticsEvent({
      properties: {
        $web_vitals_LCP_event: { $current_url: 'https://diboas.com/en/delete-confirm?token=V' },
        $heatmap_data: { 'https://diboas.com/en/delete-confirm?token=H': [{ x: 1 }] },
        $exception_list: [{ stacktrace: { frames: [{ filename: '/en/email-preferences?t=E' }] } }],
        label: 'plain text?t=keep',
      },
    });
    const json = JSON.stringify(event);
    for (const secret of ['token=V', 'token=H', 't=E']) expect(json).not.toContain(secret);
    expect((event.properties as Record<string, unknown>).label).toBe('plain text?t=keep');
    expect(Object.keys((event.properties as { $heatmap_data: object }).$heatmap_data)).toEqual([
      'https://diboas.com/en/delete-confirm',
    ]);
  });
});

it('should stop descending past its depth limit rather than recurse without end', () => {
  let deep: Record<string, unknown> = { leaf: '/x?t=1' };
  for (let i = 0; i < 12; i += 1) deep = { d: deep };
  expect(() => scrubAnalyticsEvent({ properties: deep })).not.toThrow();
});
