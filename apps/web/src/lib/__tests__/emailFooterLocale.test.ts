/**
 * Every email's footer speaks the reader's language and links the legal pages in it (fifteenth
 * audit B-7): the footer linked /en/legal/privacy and /en/legal/terms with English labels in all
 * four locales, though the layout already knew the locale.
 */
import { renderWelcome } from '@diboas/email';
import { describe, expect, it } from 'vitest';

const EXPECTED = {
  en: ['Privacy Policy', 'Terms of Use', 'Unsubscribe', 'All rights reserved.'],
  'pt-BR': [
    'Política de Privacidade',
    'Termos de Uso',
    'Cancelar inscrição',
    'Todos os direitos reservados.',
  ],
  es: [
    'Política de Privacidad',
    'Términos de Uso',
    'Cancelar suscripción',
    'Todos los derechos reservados.',
  ],
  de: ['Datenschutzerklärung', 'Nutzungsbedingungen', 'Abmelden', 'Alle Rechte vorbehalten.'],
} as const;

const welcome = (locale: string) =>
  renderWelcome({
    position: 12,
    referralCode: 'ABC123',
    referralUrl: 'https://diboas.com/r/ABC123',
    locale,
    tier: 'standard',
    unsubscribeUrl: 'https://diboas.com/email-preferences',
  }).html;

describe('the email footer in the reader’s language (fifteenth audit B-7)', () => {
  it.each(Object.entries(EXPECTED))(
    'should link and label the %s legal pages',
    (locale, labels) => {
      const html = welcome(locale);
      expect(html).toContain(`/${locale}/legal/privacy"`);
      expect(html).toContain(`/${locale}/legal/terms"`);
      for (const label of labels) expect(html).toContain(label);
    }
  );

  it.each(['pt-BR', 'es', 'de'])('should carry no English footer label in %s', (locale) => {
    const html = welcome(locale);
    for (const english of [
      'Privacy Policy',
      'Terms of',
      '>Unsubscribe<',
      'All rights reserved',
      'This is a transactional email',
    ])
      expect(html).not.toContain(english);
    expect(html).not.toContain('/en/legal/');
  });

  it('should fall back to English for a locale the site does not have', () => {
    const html = welcome('fr');
    expect(html).toContain('/en/legal/privacy"');
    expect(html).toContain('Privacy Policy');
  });
});
