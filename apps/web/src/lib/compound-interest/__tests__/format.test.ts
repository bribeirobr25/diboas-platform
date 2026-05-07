import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, getCurrencyCode } from '../format';

describe('formatCurrency', () => {
  it('should format USD with $ when locale is en', () => {
    expect(formatCurrency(1234, 'en')).toMatch(/\$1,234/);
  });

  it('should format BRL with R$ when locale is pt-BR', () => {
    const out = formatCurrency(1234, 'pt-BR');
    expect(out).toContain('R$');
    expect(out).toMatch(/1\.234/);
  });

  it('should format EUR with thousands-dot decimal-comma when locale is de', () => {
    const out = formatCurrency(1234, 'de');
    expect(out).toContain('€');
    expect(out).toMatch(/1\.234/);
  });

  it('should format EUR when locale is es', () => {
    const out = formatCurrency(1234, 'es');
    expect(out).toContain('€');
  });

  it('should round to whole units by default', () => {
    expect(formatCurrency(1234.567, 'en')).not.toMatch(/\.5/);
  });

  it('should respect explicit fraction-digit override', () => {
    expect(formatCurrency(1234.5, 'en', { maximumFractionDigits: 2 })).toMatch(/1,234\.5/);
  });

  it('should handle zero', () => {
    expect(formatCurrency(0, 'en')).toMatch(/\$0/);
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-1234, 'en')).toMatch(/-?.+1,234/);
  });
});

describe('formatPercent', () => {
  it('should format 7 as 7% when locale is en', () => {
    expect(formatPercent(7, 'en')).toMatch(/7\s?%/);
  });

  it('should preserve decimal precision up to two places', () => {
    expect(formatPercent(0.32, 'en')).toMatch(/0\.32\s?%/);
  });

  it('should localize separator when locale is de', () => {
    const out = formatPercent(0.5, 'de');
    expect(out).toContain('%');
  });
});

describe('getCurrencyCode', () => {
  it('should return USD for en', () => {
    expect(getCurrencyCode('en')).toBe('USD');
  });

  it('should return BRL for pt-BR', () => {
    expect(getCurrencyCode('pt-BR')).toBe('BRL');
  });

  it('should return EUR for es', () => {
    expect(getCurrencyCode('es')).toBe('EUR');
  });

  it('should return EUR for de', () => {
    expect(getCurrencyCode('de')).toBe('EUR');
  });
});
