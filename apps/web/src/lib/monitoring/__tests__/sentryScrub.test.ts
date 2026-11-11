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
    // request bodies are dropped, never redacted in place (fourteenth audit)
    expect(event.request?.data).toBeUndefined();
    expect(event.extra?.email).toBe('[REDACTED]');
    expect(event.extra?.method).toBe('POST');
  });

  it('should leave tags, which carry the correlation id, as they are', () => {
    expect(event.tags).toEqual({ correlationId: 'req-1' });
  });

  it('should drop an object request body and pass a bare event through', () => {
    const withObject = scrubSentryEvent({ request: { data: { email: 'a@b.co', n: 1 } } } as Event);
    expect(withObject.request?.data).toBeUndefined();
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

/**
 * Fourteenth audit: what the installed @sentry/nextjs 10.76 server pipeline really attached to an
 * error and a sampled transaction on a token page (an agent ran the SDK with a recording transport).
 * Every value below survived the thirteenth-audit scrubber.
 */
describe('scrubSentryEvent on the server shapes the fourteenth audit captured', () => {
  const LEAK_MARKER = 'FAKE_DELETION_TOKEN_VALUE';
  const STATE_TREE = `%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%3F%7B%5C%22token%5C%22%3A%5C%22${LEAK_MARKER}%5C%22%7D%22%5D%7D%5D`;
  const headers = () => ({
    host: 'diboas.com',
    'user-agent': 'Mozilla/5.0',
    referer: `https://diboas.com/en/delete-confirm?token=${LEAK_MARKER}`,
    'next-router-state-tree': STATE_TREE,
    'next-url': '/en/delete-confirm',
    'x-vercel-proxied-for': '2001:db8::7',
    'x-vercel-ip-city': 'M%C3%BCnchen',
    'x-vercel-ip-latitude': '48.137',
    'x-vercel-ip-postal-code': '80331',
    'x-vercel-oidc-token': 'eyJhbGciOiJSUzI1NiJ9.SECRETJWT.sig',
    'x-vercel-sc-headers': '{"Authorization":"Bearer SC_SECRET"}',
  });
  const event = (): Event =>
    ({
      request: {
        method: 'POST',
        url: 'https://diboas.com/api/email/unsubscribe',
        headers: headers(),
        data: `{"token":"${LEAK_MARKER}","t":"VU5TVUJUT0tFTg"}`,
      },
      contexts: {
        trace: {
          span_id: 'a1b2c3d4e5f60718',
          trace_id: '0123456789abcdef0123456789abcdef',
          data: {
            'http.target': '/en/delete-confirm',
            'http.request.header.user_agent': 'Mozilla/5.0',
            'http.request.header.referer': `https://diboas.com/en/delete-confirm?token=${LEAK_MARKER}`,
            'http.request.header.next_router_state_tree': STATE_TREE,
            'next.rsc.state_tree': STATE_TREE,
            'http.request.header.cookie.ph_phc_x_posthog': '%7B%22distinct_id%22%3A%22abc%22%7D',
            'http.request.header.x_vercel_proxied_for': '2001:db8::7',
            'http.request.header.x_vercel_sc_headers': '{"Authorization":"Bearer SC_SECRET"}',
            'http.request.body.data': `{"token":"${LEAK_MARKER}"}`,
            'http.request.body.size': 42,
          },
        },
        runtime: { name: 'node', version: 'v24.11.0' },
        os: { name: 'Linux', kernel_version: '6.1' },
        device: { name: 'my-laptop', cpu_description: 'Apple M2' },
      },
      exception: {
        values: [
          {
            value:
              'upstream said: user jöhn@exämple.de ip 2001:db8::7 at 01:35:38 ' +
              `next=https%3A%2F%2Fdiboas.com%2Fen%2Fdelete-confirm%3Ftoken%3D${LEAK_MARKER} ` +
              `seg=/en/delete-confirm/__PAGE__"token":"${LEAK_MARKER}"}`,
          },
        ],
      },
    }) as Event;

  it('should keep only allowlisted request headers when the server attaches every header', () => {
    const out = scrubSentryEvent(event());
    expect(out.request?.headers).toEqual({
      host: 'diboas.com',
      'user-agent': 'Mozilla/5.0',
      referer: 'https://diboas.com/en/delete-confirm',
    });
  });

  it('should drop every non-allowlisted header attribute, the router state and the body from trace data', () => {
    const data = scrubSentryEvent(event()).contexts?.trace?.data as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual(
      [
        'http.request.body.size',
        'http.request.header.referer',
        'http.request.header.user_agent',
        'http.target',
      ].sort()
    );
    expect(data['http.request.header.referer']).toBe('https://diboas.com/en/delete-confirm');
  });

  it('should drop the request body when it is a string carrying tokens', () => {
    expect(scrubSentryEvent(event()).request?.data).toBeUndefined();
  });

  it('should redact Unicode emails, IPv6, encoded URLs and bare token pairs but keep clock times', () => {
    const value = scrubSentryEvent(event()).exception?.values?.[0].value ?? '';
    expect(value).not.toContain(LEAK_MARKER);
    expect(value).not.toContain('jöhn');
    expect(value).not.toContain('2001:db8::7');
    expect(value).toContain('01:35:38');
    expect(value).toContain('[EMAIL_REDACTED]');
    expect(value).toContain('[IP_REDACTED]');
    expect(value).toContain('next=https%3A%2F%2Fdiboas.com%2Fen%2Fdelete-confirm ');
  });

  it("should keep the SDK's machine descriptions but still redact a device name", () => {
    const contexts = scrubSentryEvent(event()).contexts as Record<string, Record<string, unknown>>;
    expect(contexts.runtime).toEqual({ name: 'node', version: 'v24.11.0' });
    expect(contexts.os).toEqual({ name: 'Linux', kernel_version: '6.1' });
    expect(contexts.device).toEqual({ name: '[REDACTED]', cpu_description: 'Apple M2' });
  });

  it('should leave no token, IP, credential or geolocation anywhere in the event', () => {
    const json = JSON.stringify(scrubSentryEvent(event()));
    for (const secret of [
      LEAK_MARKER,
      'VU5TVUJUT0tFTg',
      'SECRETJWT',
      'SC_SECRET',
      '2001:db8',
      '80331',
      '48.137',
      'distinct_id',
    ])
      expect(json, secret).not.toContain(secret);
  });
});
