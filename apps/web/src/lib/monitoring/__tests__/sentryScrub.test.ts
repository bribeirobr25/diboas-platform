import { describe, expect, it } from 'vitest';
import type { Event } from '@sentry/nextjs';
import { scrubSentryEvent } from '../sentryScrub';

/** One event carrying every kind of personal data and URL token the scrubber removes (5.862). */
const dirty = (): Event => ({
  message: 'failed for ana@example.com from 203.0.113.7',
  transaction: '/en/delete-confirm?token=abc',
  user: { id: 'u1', email: 'ana@example.com', username: 'ana', ip_address: '203.0.113.7' },
  request: {
    url: 'https://diboas.com/en/delete-confirm?token=abc&utm_source=mail',
    query_string: 'token=abc',
    cookies: { 'diboas-consent': 'x' },
    headers: {
      Cookie: 'a=b',
      Authorization: 'Bearer s',
      'X-Forwarded-For': '203.0.113.7',
      Referer: 'https://diboas.com/pt-BR/email-preferences?t=tok',
      'User-Agent': 'UA',
    },
    data: 'email=ana@example.com',
  },
  exception: { values: [{ type: 'Error', value: 'no row for ana@example.com' }, { type: 'E' }] },
  extra: { path: '/api/waitlist/delete?email=ana@example.com', method: 'POST', email: 'x' },
  breadcrumbs: [
    { category: 'navigation', data: { from: '/en', to: '/en/delete-confirm?token=abc' } },
    {
      category: 'fetch',
      message: 'POST for ana@example.com',
      data: { url: '/api/x?t=1', 'http.query': 't=1' },
    },
    { category: 'ui' },
  ],
  spans: [
    {
      span_id: 's',
      trace_id: 't',
      start_timestamp: 0,
      data: { 'http.url': 'https://diboas.com/x?token=1' },
    },
    { span_id: 's2', trace_id: 't', start_timestamp: 0 },
  ] as Event['spans'],
  tags: { correlationId: 'req-1' },
});

describe('scrubSentryEvent', () => {
  const event = scrubSentryEvent(dirty());

  it('should remove the user identity but keep the id', () => {
    expect(event.user).toEqual({ id: 'u1' });
  });

  it('should keep only allowlisted query parameters in every URL', () => {
    expect(event.request?.url).toBe('https://diboas.com/en/delete-confirm?utm_source=mail');
    expect(event.transaction).toBe('/en/delete-confirm');
    expect(event.extra?.path).toBe('/api/waitlist/delete');
    expect(event.breadcrumbs?.[0].data).toEqual({ from: '/en', to: '/en/delete-confirm' });
    expect(event.breadcrumbs?.[1].data).toEqual({ url: '/api/x' });
    expect(event.spans?.[0].data).toEqual({ 'http.url': 'https://diboas.com/x' });
    expect(event.request?.headers?.Referer).toBe('https://diboas.com/pt-BR/email-preferences');
  });

  it('should drop cookies, the raw query and the identifying headers', () => {
    expect(event.request?.query_string).toBeUndefined();
    expect(event.request?.cookies).toBeUndefined();
    expect(Object.keys(event.request?.headers ?? {}).sort()).toEqual(['Referer', 'User-Agent']);
  });

  it('should redact emails and IPs in text and sensitive keys in data', () => {
    expect(event.message).toBe('failed for [EMAIL_REDACTED] from [IP_REDACTED]');
    expect(event.exception?.values?.[0].value).toBe('no row for [EMAIL_REDACTED]');
    expect(event.breadcrumbs?.[1].message).toBe('POST for [EMAIL_REDACTED]');
    expect(event.request?.data).toBe('email=[EMAIL_REDACTED]');
    expect(event.extra?.email).toBe('[REDACTED]');
    expect(event.extra?.method).toBe('POST');
  });

  it('should leave tags, which carry the correlation id, as they are', () => {
    expect(event.tags).toEqual({ correlationId: 'req-1' });
  });

  it('should redact an object request body and pass a bare event through', () => {
    const withObject = scrubSentryEvent({ request: { data: { email: 'a@b.co', n: 1 } } } as Event);
    expect(withObject.request?.data).toEqual({ email: '[REDACTED]', n: 1 });
    expect(scrubSentryEvent({ message: undefined } as Event)).toEqual({ message: undefined });
    expect(scrubSentryEvent({ request: {} } as Event)).toEqual({ request: {} });
    // a URL-named key holding a non-string is kept as it is
    expect(scrubSentryEvent({ extra: { url: 42 } } as Event).extra).toEqual({ url: 42 });
  });
});
