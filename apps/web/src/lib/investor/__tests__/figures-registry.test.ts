/**
 * Unit tests for the investor figures registry resolver
 * (scripts/lib/investor-figures.mjs — imported cross-boundary like the
 * validate:market-data fixtures precedent).
 */
import { describe, it, expect } from 'vitest';
import {
  resolveFigure,
  substituteTokens,
  validateRegistryShape,
  checkGeneratedArtifacts,
  TOKEN_RE,
} from '../../../../../../scripts/lib/investor-figures.mjs';

const FIGURES = {
  'fees.cap.rampB2B': {
    value: { en: 'no cap', 'pt-BR': 'sem limite' },
    source: 'DECISION_LOG#D-005',
    asOf: '2026-07-05',
    status: 'active',
  },
  'fees.rate.ramp': {
    value: { en: '0.48%', 'pt-BR': '0,48%' },
    source: 'FEES.md',
    asOf: '2026-07-05',
    status: 'active',
  },
  'raise.discount': { value: '20%', source: 'business-plan', asOf: '2026-07-03', status: 'active' },
  'pending.example': { value: 'x', source: 'business-plan', asOf: '2026-07-03', status: 'pending' },
};

describe('resolveFigure', () => {
  it('should return the locale value when the locale record has it', () => {
    expect(resolveFigure(FIGURES, 'fees.rate.ramp', 'pt-BR')).toBe('0,48%');
  });

  it('should fall back to en when the locale is missing from the record', () => {
    expect(resolveFigure(FIGURES, 'fees.rate.ramp', 'de')).toBe('0.48%');
  });

  it('should return plain string values for any locale', () => {
    expect(resolveFigure(FIGURES, 'raise.discount', 'es')).toBe('20%');
  });

  it('should throw when the figure id is unknown', () => {
    expect(() => resolveFigure(FIGURES, 'fees.nonexistent', 'en')).toThrow(/Unknown figure id/);
  });

  it('should throw when the figure status is pending', () => {
    expect(() => resolveFigure(FIGURES, 'pending.example', 'en')).toThrow(
      /pending figures must not render/
    );
  });
});

describe('substituteTokens', () => {
  it('should substitute multiple tokens in one line for the content locale', () => {
    const md = 'Add money: {{fig:fees.rate.ramp}}, business {{fig:fees.cap.rampB2B}}.';
    const result = substituteTokens(md, FIGURES, 'pt-BR');
    expect(result.text).toBe('Add money: 0,48%, business sem limite.');
    expect(result.resolved).toBe(2);
    expect(result.ids).toEqual(['fees.rate.ramp', 'fees.cap.rampB2B']);
  });

  it('should substitute tokens adjacent to markdown emphasis syntax', () => {
    const result = substituteTokens('**{{fig:raise.discount}}** discount', FIGURES, 'en');
    expect(result.text).toBe('**20%** discount');
  });

  it('should substitute tokens inside table cells without breaking pipes', () => {
    const result = substituteTokens('| Business add | {{fig:fees.cap.rampB2B}} |', FIGURES, 'en');
    expect(result.text).toBe('| Business add | no cap |');
  });

  it('should throw when a token references an unknown id', () => {
    expect(() => substituteTokens('cap: {{fig:fees.unknown}}', FIGURES, 'en')).toThrow(
      /Unknown figure id/
    );
  });

  it('should throw when a token references a pending figure', () => {
    expect(() => substituteTokens('x {{fig:pending.example}}', FIGURES, 'en')).toThrow(
      /must not render/
    );
  });

  it('should leave text without tokens untouched', () => {
    const md = 'No tokens here, just $250 and 0.48% literals.';
    const result = substituteTokens(md, FIGURES, 'en');
    expect(result.text).toBe(md);
    expect(result.resolved).toBe(0);
  });

  it('should match the documented token syntax only', () => {
    expect('{{fig:fees.cap.rampB2B}}').toMatch(TOKEN_RE);
    expect('{fig:fees.cap.rampB2B}').not.toMatch(TOKEN_RE);
    expect('{{figure:fees.cap.rampB2B}}').not.toMatch(TOKEN_RE);
  });
});

describe('validateRegistryShape', () => {
  it('should accept a well-formed registry', () => {
    expect(validateRegistryShape({ figures: FIGURES })).toEqual([]);
  });

  it('should reject a figure missing required fields', () => {
    const errors = validateRegistryShape({ figures: { 'bad.entry': { value: 'x' } } });
    expect(errors.join(' ')).toMatch(/missing required field/);
  });

  it('should reject a locale record without an en value', () => {
    const errors = validateRegistryShape({
      figures: {
        'bad.locale': {
          value: { 'pt-BR': 'x' },
          source: 'FEES.md',
          asOf: '2026-07-05',
          status: 'active',
        },
      },
    });
    expect(errors.join(' ')).toMatch(/must include a non-empty "en" value/);
  });

  it('should reject an invalid status', () => {
    const errors = validateRegistryShape({
      figures: {
        'bad.status': { value: 'x', source: 'FEES.md', asOf: '2026-07-05', status: 'retired' },
      },
    });
    expect(errors.join(' ')).toMatch(/invalid status/);
  });
});

describe('checkGeneratedArtifacts', () => {
  const registry = {
    figures: {
      'fees.cap.rampB2B': {
        value: { en: 'no cap' },
        source: 'DECISION_LOG#D-005',
        asOf: '2026-07-05',
        status: 'active',
        forbidLiterals: ['\\$2,500', 'US\\$2\\.500'],
      },
    },
    protected: [{ pattern: '2,500–5,000', locales: ['en'], minCount: 2, why: 'Y1 target' }],
  };

  it('should pass clean artifacts that keep protected literals', () => {
    const artifacts = { en: 'targets 2,500–5,000 users and again 2,500–5,000; business: no cap' };
    expect(checkGeneratedArtifacts(registry, artifacts)).toEqual([]);
  });

  it('should flag unresolved token residue', () => {
    const errors = checkGeneratedArtifacts(registry, {
      en: 'oops {{fig:fees.cap.rampB2B}} 2,500–5,000 2,500–5,000',
    });
    expect(errors.join(' ')).toMatch(/token residue/);
  });

  it('should flag a forbidden superseded literal when its figure is active', () => {
    const errors = checkGeneratedArtifacts(registry, {
      en: 'capped at $2,500 — 2,500–5,000 and 2,500–5,000',
    });
    expect(errors.join(' ')).toMatch(/forbidden literal/);
  });

  it('should not flag forbidden literals while the figure is pending', () => {
    const pendingRegistry = {
      figures: {
        'fees.cap.rampB2B': { ...registry.figures['fees.cap.rampB2B'], status: 'pending' },
      },
      protected: [],
    };
    expect(checkGeneratedArtifacts(pendingRegistry, { en: 'capped at $2,500' })).toEqual([]);
  });

  it('should flag a missing protected literal', () => {
    const errors = checkGeneratedArtifacts(registry, {
      en: 'business: no cap, only one 2,500–5,000',
    });
    expect(errors.join(' ')).toMatch(/protected literal/);
  });
});
