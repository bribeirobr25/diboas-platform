/**
 * redactContext — PII redaction for logs, error reports and Sentry events.
 *
 * Pins the SECURE outcome: no email address, IPv4 address or value under a
 * sensitive key survives redaction, at any depth, inside arrays, or past the
 * depth limit — and the caller's object is never mutated.
 */

import { describe, it, expect } from 'vitest';
import { isSensitiveKey, redactContext, redactText } from '../redactContext';

describe('redactContext', () => {
  it('should return undefined when no context is given', () => {
    expect(redactContext()).toBeUndefined();
    expect(redactContext(undefined)).toBeUndefined();
  });

  it('should replace every email and IPv4 address inside string values when they appear in free text', () => {
    const out = redactContext({
      message:
        'user ana@example.com and bob.smith+x@mail.example.org from 203.0.113.7 and 10.0.0.1',
    });
    expect(out).toEqual({
      message: 'user [EMAIL_REDACTED] and [EMAIL_REDACTED] from [IP_REDACTED] and [IP_REDACTED]',
    });
    expect(JSON.stringify(out)).not.toMatch(/@|203\.0\.113\.7|10\.0\.0\.1/);
  });

  it('should redact the whole value when the key names a sensitive field, regardless of case or affix', () => {
    const out = redactContext({
      password: 'hunter2',
      API_KEY: 'fake-key',
      userEmail: 'ana@example.com',
      Authorization: 'Bearer test-token',
      clientSecret: { nested: 'value' },
      ip_address: '203.0.113.7',
      phoneNumber: 12345,
      displayName: 'Ana',
      count: 3,
    });
    expect(out).toEqual({
      password: '[REDACTED]',
      API_KEY: '[REDACTED]',
      userEmail: '[REDACTED]',
      Authorization: '[REDACTED]',
      clientSecret: '[REDACTED]',
      ip_address: '[REDACTED]',
      phoneNumber: '[REDACTED]',
      displayName: '[REDACTED]',
      count: 3,
    });
  });

  it('should redact PII inside arrays and nested objects when they sit below the top level', () => {
    const out = redactContext({
      items: ['ana@example.com', { route: '/x', from: '198.51.100.2' }, 42, null, true],
      meta: { inner: { note: 'reach me at bob@example.com', token: 'abc' } },
    });
    expect(out).toEqual({
      items: ['[EMAIL_REDACTED]', { route: '/x', from: '[IP_REDACTED]' }, 42, null, true],
      meta: { inner: { note: 'reach me at [EMAIL_REDACTED]', token: '[REDACTED]' } },
    });
  });

  it('should replace values past the depth limit with a marker when nesting is deeper than five levels', () => {
    const out = redactContext({
      a: { b: { c: { d: { e: { f: 'ana@example.com' } } } } },
    });
    expect(out).toEqual({ a: { b: { c: { d: { e: { f: '[DEPTH_LIMIT]' } } } } } });
  });

  it('should terminate without leaking when the context is circular', () => {
    const circular: Record<string, unknown> = { note: 'ana@example.com' };
    circular.self = circular;
    const out = redactContext(circular);
    const serialized = JSON.stringify(out);
    expect(serialized).toContain('[DEPTH_LIMIT]');
    expect(serialized).not.toContain('ana@example.com');
  });

  it('should leave the caller context unmodified when it redacts', () => {
    const input = { email: 'ana@example.com', text: 'from 203.0.113.7' };
    const snapshot = structuredClone(input);
    redactContext(input);
    expect(input).toEqual(snapshot);
  });
});

/**
 * Fourteenth audit: substring key matching redacted harmless diagnostics (`cpu_description`
 * contains "ip"), the email pattern was ASCII-only, IPv6 passed, and tokens written outside a URL
 * or inside a percent-encoded URL survived.
 */
describe('redactContext after the fourteenth audit', () => {
  it.each([
    ['ip_address', true],
    ['IPAddress', true],
    ['x_vercel_ip_city', true],
    ['API_KEY', true],
    ['publicKey', true],
    ['displayName', true],
    ['server.address', true],
    ['userEmail', true],
    ['Authorization', true],
    ['useremail', true],
    ['description', false],
    ['cpu_description', false],
    ['monkey', false],
    ['hostname', false],
    ['kernel_version', false],
  ])('should treat the key %s as sensitive: %s', (key, sensitive) => {
    expect(isSensitiveKey(key)).toBe(sensitive);
  });

  it('should redact Unicode emails and IPv6 addresses when they appear in free text', () => {
    expect(redactText('mail jöhn@exämple.de from 2001:db8::7 and fe80::1')).toBe(
      'mail [EMAIL_REDACTED] from [IP_REDACTED] and [IP_REDACTED]'
    );
    expect(redactText('full 2001:0db8:85a3:0000:0000:8a2e:0370:7334 end')).toBe(
      'full [IP_REDACTED] end'
    );
  });

  it('should leave clock times, ratios and C++-style names alone when they only look like IPv6', () => {
    const text = 'at 01:35:38 on 2026-11-11T01:35:38Z, ratio 3:2, std::vector, Foo::bar';
    expect(redactText(text)).toBe(text);
  });

  it('should mask bare token pairs when a token is written outside a URL', () => {
    expect(redactText('body {"token":"ABC123","t":"XYZ","n":1}')).toBe(
      'body {"token":"[REDACTED]","t":"[REDACTED]","n":1}'
    );
    expect(redactText('retry with token=ABC123&x=1')).toBe('retry with token=[REDACTED]&x=1');
  });

  it('should scrub plain and percent-encoded URLs when text embeds them', () => {
    expect(redactText('GET https://diboas.com/en/delete-confirm?token=ABC failed')).toBe(
      'GET https://diboas.com/en/delete-confirm failed'
    );
    expect(redactText('next=https%3A%2F%2Fdiboas.com%2Fen%2Fx%3Ftoken%3DABC done')).toBe(
      'next=https%3A%2F%2Fdiboas.com%2Fen%2Fx done'
    );
    // a malformed escape cannot be decoded, so the whole encoded URL goes
    expect(redactText('next=https%3A%2F%2Fdiboas.com%2Fx%3Ftoken%3D%E0%A4%A done')).toBe(
      'next=[URL_REDACTED] done'
    );
  });
});
