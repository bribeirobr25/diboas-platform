import { describe, expect, it } from 'vitest';
import { pageTitle } from '../pageTitle';

describe('pageTitle — the brand once (5.787)', () => {
  it('should pass a title that names the brand as absolute when it already contains it', () => {
    expect(pageTitle('About diBoaS | Built for the People Banks Forgot')).toEqual({
      absolute: 'About diBoaS | Built for the People Banks Forgot',
    });
  });

  it('should leave a title without the brand as a plain string when the layout adds the suffix', () => {
    expect(pageTitle('Strategies')).toBe('Strategies');
  });
});
