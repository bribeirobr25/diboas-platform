import { describe, it, expect } from 'vitest';
import {
  BLOCKED_COUNTRIES,
  isCountryBlocked,
  shouldBlock,
  localeFromPathname,
} from '../geofence';

describe('geofence — BLOCKED_COUNTRIES (M1, CLO-ratified CN/RU/KP)', () => {
  it('should block exactly China, Russia, North Korea', () => {
    expect([...BLOCKED_COUNTRIES].sort()).toEqual(['CN', 'KP', 'RU']);
  });
});

describe('isCountryBlocked', () => {
  it.each(['CN', 'RU', 'KP'])('should block %s', (c) => {
    expect(isCountryBlocked(c)).toBe(true);
  });
  it.each(['US', 'BR', 'DE', 'ES', 'GB', 'FR'])('should NOT block %s', (c) => {
    expect(isCountryBlocked(c)).toBe(false);
  });
  it('should be case-insensitive', () => {
    expect(isCountryBlocked('cn')).toBe(true);
    expect(isCountryBlocked('Ru')).toBe(true);
  });
  it('should NOT block on unknown/null/undefined/empty (D3 allow-on-unknown)', () => {
    expect(isCountryBlocked(null)).toBe(false);
    expect(isCountryBlocked(undefined)).toBe(false);
    expect(isCountryBlocked('')).toBe(false);
  });
});

describe('shouldBlock — the kill-switch gate (D8)', () => {
  it('should block a denylisted country only when enabled', () => {
    expect(shouldBlock('CN', true)).toBe(true);
    expect(shouldBlock('CN', false)).toBe(false); // kill-switch off → never blocks
  });
  it('should never block an allowed country regardless of enabled', () => {
    expect(shouldBlock('US', true)).toBe(false);
    expect(shouldBlock('US', false)).toBe(false);
  });
  it('should never block on unknown country', () => {
    expect(shouldBlock(null, true)).toBe(false);
  });
});

describe('localeFromPathname (D10 — block page in the URL locale)', () => {
  it('should extract a supported locale from the first segment', () => {
    expect(localeFromPathname('/pt-BR/goals/new')).toBe('pt-BR');
    expect(localeFromPathname('/de/history')).toBe('de');
    expect(localeFromPathname('/es')).toBe('es');
    expect(localeFromPathname('/en/gate')).toBe('en');
  });
  it('should default to en for a missing/invalid locale', () => {
    expect(localeFromPathname('/')).toBe('en');
    expect(localeFromPathname('/api/market')).toBe('en');
    expect(localeFromPathname('/fr/whatever')).toBe('en');
  });
});
