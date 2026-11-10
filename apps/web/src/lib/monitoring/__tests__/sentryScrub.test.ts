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

/**
 * Thirteenth audit: shapes the real SDKs produce (agents ran @sentry/browser and @sentry/node
 * 10.76 with a fake transport, and read next's base-server.js, which sets `http.target` to the
 * raw request URL). The first scrubber missed every one of these.
 */
describe('scrubSentryEvent on a Next-shaped transaction and error', () => {
  const S = 'SECRET_TOKEN_VALUE';
  const transaction = (): Event =>
    ({
      type: 'transaction',
      transaction: 'GET /[locale]/email-preferences',
      contexts: {
        trace: {
          trace_id: 't',
          span_id: 's',
          data: {
            'http.target': `/en/email-preferences?t=${S}`,
            'url.full': `https://diboas.com/en/email-preferences?t=${S}&utm_source=mail`,
            'http.url': `https://diboas.com/api/email/unsubscribe?t=${S}`,
            'http.query': `t=${S}`,
            'url.query': `t=${S}`,
            'http.fragment': `#t=${S}`,
            'http.request.header.referer': `https://diboas.com/en/delete-confirm?token=${S}`,
            'http.method': 'GET',
          },
        },
      },
      spans: [
        {
          span_id: 'a',
          trace_id: 't',
          start_timestamp: 0,
          description: `GET /en/delete-confirm?token=${S}`,
          data: { 'url.full': `https://diboas.com/x?token=${S}` },
        },
      ],
      breadcrumbs: [{ category: 'fetch', data: { 'url.full': `/api/x?t=${S}` } }],
      exception: {
        values: [
          {
            type: 'Error',
            value: `failed to load https://diboas.com/en/email-preferences?t=${S}`,
            stacktrace: {
              frames: [
                {
                  abs_path: `https://diboas.com/en/delete-confirm?token=${S}`,
                  filename: `https://diboas.com/en/delete-confirm?token=${S}`,
                },
                { function: 'f' },
              ],
            },
          },
        ],
      },
      logentry: { message: `visit /en/delete-confirm?token=${S}`, params: [`/x?t=${S}`, 3] },
      extra: { nested: { request: { url: `/en/email-preferences?t=${S}` } } },
    }) as unknown as Event;

  it('should leave the token nowhere in the event', () => {
    expect(JSON.stringify(scrubSentryEvent(transaction()))).not.toContain(S);
  });

  it('should keep the route, the method, allowlisted parameters and the stack', () => {
    const e = scrubSentryEvent(transaction());
    const data = (e.contexts?.trace?.data ?? {}) as Record<string, unknown>;
    expect(data['http.target']).toBe('/en/email-preferences');
    expect(data['url.full']).toBe('https://diboas.com/en/email-preferences?utm_source=mail');
    expect(data['http.method']).toBe('GET');
    expect(data).not.toHaveProperty('http.query');
    expect(data).not.toHaveProperty('url.query');
    expect(data).not.toHaveProperty('http.fragment');
    expect(e.spans?.[0].description).toBe('GET /en/delete-confirm');
    expect(e.exception?.values?.[0].stacktrace?.frames?.[0].filename).toBe(
      'https://diboas.com/en/delete-confirm'
    );
    expect(e.exception?.values?.[0].stacktrace?.frames?.[1]).toEqual({ function: 'f' });
    expect(e.logentry?.params).toEqual(['/x', 3]);
  });

  it('should scrub URLs inside arrays in a data bag', () => {
    const e = scrubSentryEvent({ extra: { urls: [`/x?t=${S}`, 4] } } as Event);
    expect(e.extra?.urls).toEqual(['/x', 4]);
  });

  it('should cut a data bag deeper than the limit', () => {
    let deep: Record<string, unknown> = { leaf: `/x?t=${S}` };
    for (let i = 0; i < 8; i += 1) deep = { d: deep };
    expect(JSON.stringify(scrubSentryEvent({ extra: deep } as Event))).not.toContain(S);
  });
});
