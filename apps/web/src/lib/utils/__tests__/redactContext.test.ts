/**
 * redactContext — PII redaction for logs, error reports and Sentry events.
 *
 * Pins the SECURE outcome: no email address, IPv4 address or value under a
 * sensitive key survives redaction, at any depth, inside arrays, or past the
 * depth limit — and the caller's object is never mutated.
 */

import { describe, it, expect } from 'vitest';
import { redactContext } from '../redactContext';

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
