import { describe, it, expect } from 'vitest';
import { roomContentLocale } from '../roomContentLocale';

describe('roomContentLocale', () => {
  it('should return en when the locale is en', () => {
    expect(roomContentLocale('en')).toBe('en');
  });

  it('should return pt-BR when the locale is pt-BR', () => {
    expect(roomContentLocale('pt-BR')).toBe('pt-BR');
  });

  it('should fall back to en when the locale is de', () => {
    expect(roomContentLocale('de')).toBe('en');
  });

  it('should fall back to en when the locale is es', () => {
    expect(roomContentLocale('es')).toBe('en');
  });
});
