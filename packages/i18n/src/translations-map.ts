/**
 * Static Translation Imports Map
 *
 * This provides reliable translation loading that works across all bundlers.
 * Dynamic imports with template literals can fail in certain bundler configurations.
 */

// English translations
import en_common from '../translations/en/common.json';
import en_calculator from '../translations/en/calculator.json';
import en_dreamMode from '../translations/en/dreamMode.json';
import en_waitlist from '../translations/en/waitlist.json';
import en_share from '../translations/en/share.json';
import en_landingB2c from '../translations/en/landing-b2c.json';
import en_landingB2b from '../translations/en/landing-b2b.json';
import en_futureYou from '../translations/en/future-you.json';
import en_strategies from '../translations/en/strategies.json';
import en_faq from '../translations/en/faq.json';
import en_marketing from '../translations/en/marketing.json';
import en_home from '../translations/en/home.json';
import en_about from '../translations/en/about.json';
import en_protocols from '../translations/en/protocols.json';

// German translations
import de_common from '../translations/de/common.json';
import de_calculator from '../translations/de/calculator.json';
import de_dreamMode from '../translations/de/dreamMode.json';
import de_waitlist from '../translations/de/waitlist.json';
import de_share from '../translations/de/share.json';
import de_landingB2c from '../translations/de/landing-b2c.json';
import de_landingB2b from '../translations/de/landing-b2b.json';
import de_futureYou from '../translations/de/future-you.json';
import de_strategies from '../translations/de/strategies.json';
import de_faq from '../translations/de/faq.json';
import de_marketing from '../translations/de/marketing.json';
import de_home from '../translations/de/home.json';
import de_about from '../translations/de/about.json';
import de_protocols from '../translations/de/protocols.json';

// Spanish translations
import es_common from '../translations/es/common.json';
import es_calculator from '../translations/es/calculator.json';
import es_dreamMode from '../translations/es/dreamMode.json';
import es_waitlist from '../translations/es/waitlist.json';
import es_share from '../translations/es/share.json';
import es_landingB2c from '../translations/es/landing-b2c.json';
import es_landingB2b from '../translations/es/landing-b2b.json';
import es_futureYou from '../translations/es/future-you.json';
import es_strategies from '../translations/es/strategies.json';
import es_faq from '../translations/es/faq.json';
import es_marketing from '../translations/es/marketing.json';
import es_home from '../translations/es/home.json';
import es_about from '../translations/es/about.json';
import es_protocols from '../translations/es/protocols.json';

// Portuguese (Brazil) translations
import ptBR_common from '../translations/pt-BR/common.json';
import ptBR_calculator from '../translations/pt-BR/calculator.json';
import ptBR_dreamMode from '../translations/pt-BR/dreamMode.json';
import ptBR_waitlist from '../translations/pt-BR/waitlist.json';
import ptBR_share from '../translations/pt-BR/share.json';
import ptBR_landingB2c from '../translations/pt-BR/landing-b2c.json';
import ptBR_landingB2b from '../translations/pt-BR/landing-b2b.json';
import ptBR_futureYou from '../translations/pt-BR/future-you.json';
import ptBR_strategies from '../translations/pt-BR/strategies.json';
import ptBR_faq from '../translations/pt-BR/faq.json';
import ptBR_marketing from '../translations/pt-BR/marketing.json';
import ptBR_home from '../translations/pt-BR/home.json';
import ptBR_about from '../translations/pt-BR/about.json';
import ptBR_protocols from '../translations/pt-BR/protocols.json';

import type { SupportedLocale } from './config';

type TranslationMap = Record<string, Record<string, any>>;

/**
 * Static map of all translations by locale and namespace
 */
export const TRANSLATIONS_MAP: Record<SupportedLocale, TranslationMap> = {
  en: {
    common: en_common,
    calculator: en_calculator,
    dreamMode: en_dreamMode,
    waitlist: en_waitlist,
    share: en_share,
    'landing-b2c': en_landingB2c,
    'landing-b2b': en_landingB2b,
    'future-you': en_futureYou,
    strategies: en_strategies,
    faq: en_faq,
    marketing: en_marketing,
    home: en_home,
    about: en_about,
    protocols: en_protocols,
  },
  de: {
    common: de_common,
    calculator: de_calculator,
    dreamMode: de_dreamMode,
    waitlist: de_waitlist,
    share: de_share,
    'landing-b2c': de_landingB2c,
    'landing-b2b': de_landingB2b,
    'future-you': de_futureYou,
    strategies: de_strategies,
    faq: de_faq,
    marketing: de_marketing,
    home: de_home,
    about: de_about,
    protocols: de_protocols,
  },
  es: {
    common: es_common,
    calculator: es_calculator,
    dreamMode: es_dreamMode,
    waitlist: es_waitlist,
    share: es_share,
    'landing-b2c': es_landingB2c,
    'landing-b2b': es_landingB2b,
    'future-you': es_futureYou,
    strategies: es_strategies,
    faq: es_faq,
    marketing: es_marketing,
    home: es_home,
    about: es_about,
    protocols: es_protocols,
  },
  'pt-BR': {
    common: ptBR_common,
    calculator: ptBR_calculator,
    dreamMode: ptBR_dreamMode,
    waitlist: ptBR_waitlist,
    share: ptBR_share,
    'landing-b2c': ptBR_landingB2c,
    'landing-b2b': ptBR_landingB2b,
    'future-you': ptBR_futureYou,
    strategies: ptBR_strategies,
    faq: ptBR_faq,
    marketing: ptBR_marketing,
    home: ptBR_home,
    about: ptBR_about,
    protocols: ptBR_protocols,
  },
};

/**
 * Get translations for a specific locale and namespace using static imports
 * This is more reliable than dynamic imports across different bundlers
 */
export function getStaticTranslations(
  locale: SupportedLocale,
  namespace: string
): Record<string, any> {
  const localeTranslations = TRANSLATIONS_MAP[locale];
  if (!localeTranslations) {
    console.warn(`No translations found for locale: ${locale}`);
    return TRANSLATIONS_MAP.en[namespace] || {};
  }

  const namespaceTranslations = localeTranslations[namespace];
  if (!namespaceTranslations) {
    console.warn(`No translations found for namespace: ${namespace} in locale: ${locale}`);
    // Fallback to English
    return TRANSLATIONS_MAP.en[namespace] || {};
  }

  return namespaceTranslations;
}
