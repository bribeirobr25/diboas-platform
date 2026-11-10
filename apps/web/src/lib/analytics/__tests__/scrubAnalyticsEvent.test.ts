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
