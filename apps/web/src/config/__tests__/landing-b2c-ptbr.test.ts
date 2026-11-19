import { describe, expect, it } from 'vitest';
import * as ptbr from '../landing-b2c-ptbr';
import { PRACTICE_APP_URL } from '../practiceApp';

/**
 * P13 (D7, guard 8, the pt-BR twin of `landing-b2c-eu.test.ts`): the pt-BR landing keeps no demo
 * section, and its play-money CTA opens Practice.
 */
describe('pt-BR landing config after the demo', () => {
  it('should export no demo section config', () => {
    expect(Object.keys(ptbr).filter((name) => /DEMO/.test(name))).toEqual([]);
  });

  it('should send the play-money CTA to Practice and no CTA to /demo', () => {
    const ctas = ptbr.B2C_PTBR_IMAGINE_CONFIG.cta ?? [];
    const practice = ctas.find((c) => c.id === 'practice');
    expect(practice?.href).toBe(PRACTICE_APP_URL);
    expect(practice?.text).toBe('landing-b2c.toolCtas.practice');
    expect(ctas.some((c) => c.href.includes('/demo'))).toBe(false);
  });
});
