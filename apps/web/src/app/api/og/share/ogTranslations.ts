/**
 * OG Image Translations
 *
 * Locale-specific translations for OG images
 * Following i18n requirements from internationalization.md
 */

import type { SupportedLocale } from './ogTypes';

/**
 * Translation structure for OG images
 */
export interface OGTranslation {
  waitlist: {
    joinedMessage: (name: string) => string;
    position: string;
    cta: string;
  };
  calculator: {
    badge: string;
    growthMessage: (years: number) => string;
    startingWith: string;
    strategy: string;
    cta: string;
  };
  default: {
    tagline: string;
  };
}

/**
 * All translations for supported locales
 */
export const OG_TRANSLATIONS: Record<SupportedLocale, OGTranslation> = {
  en: {
    waitlist: {
      joinedMessage: (name) => `${name} just joined the waitlist!`,
      position: 'Position',
      cta: 'Join me on diBoaS - Financial Freedom Made Simple',
    },
    calculator: {
      badge: 'Dream Mode Calculator',
      growthMessage: (years) => `In ${years} years, my investment could grow to`,
      startingWith: 'Starting with',
      strategy: 'Strategy',
      cta: 'Calculate your future at diboas.com',
    },
    default: {
      tagline: 'Financial Freedom Made Simple',
    },
  },
  'pt-BR': {
    waitlist: {
      joinedMessage: (name) => `${name} entrou na lista de espera!`,
      position: 'Posicao',
      cta: 'Junte-se a mim no diBoaS - Liberdade Financeira Simplificada',
    },
    calculator: {
      badge: 'Calculadora Dream Mode',
      growthMessage: (years) => `Em ${years} anos, meu investimento poderia crescer para`,
      startingWith: 'Comecando com',
      strategy: 'Estrategia',
      cta: 'Calcule seu futuro em diboas.com',
    },
    default: {
      tagline: 'Liberdade Financeira Simplificada',
    },
  },
  es: {
    waitlist: {
      joinedMessage: (name) => `${name} se unio a la lista de espera!`,
      position: 'Posicion',
      cta: 'Unete a mi en diBoaS - Libertad Financiera Simplificada',
    },
    calculator: {
      badge: 'Calculadora Dream Mode',
      growthMessage: (years) => `En ${years} anos, mi inversion podria crecer a`,
      startingWith: 'Empezando con',
      strategy: 'Estrategia',
      cta: 'Calcula tu futuro en diboas.com',
    },
    default: {
      tagline: 'Libertad Financiera Simplificada',
    },
  },
  de: {
    waitlist: {
      joinedMessage: (name) => `${name} ist der Warteliste beigetreten!`,
      position: 'Position',
      cta: 'Komm zu mir auf diBoaS - Finanzielle Freiheit Einfach Gemacht',
    },
    calculator: {
      badge: 'Dream Mode Rechner',
      growthMessage: (years) => `In ${years} Jahren konnte meine Investition wachsen auf`,
      startingWith: 'Startbetrag',
      strategy: 'Strategie',
      cta: 'Berechne deine Zukunft auf diboas.com',
    },
    default: {
      tagline: 'Finanzielle Freiheit Einfach Gemacht',
    },
  },
};

/**
 * Supported locale list
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'pt-BR', 'es', 'de'];

/**
 * Get translations for a locale with fallback to English
 */
export function getTranslations(locale: string): OGTranslation {
  const supportedLocale = (
    SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'en'
  ) as SupportedLocale;
  return OG_TRANSLATIONS[supportedLocale];
}

/**
 * Get default name for a locale
 */
export function getDefaultName(locale: string): string {
  switch (locale) {
    case 'pt-BR':
      return 'Alguem';
    case 'es':
      return 'Alguien';
    case 'de':
      return 'Jemand';
    default:
      return 'Someone';
  }
}
