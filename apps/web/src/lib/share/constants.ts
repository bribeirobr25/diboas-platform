/**
 * Share Library - Constants
 *
 * Configuration for card generation, platform sharing, and CLO compliance
 */

import type { CardConfig, PlatformConfig, RegionalDisclaimer, CardLocale } from './types';

/**
 * Default card dimensions (Instagram story format)
 */
export const CARD_DIMENSIONS = {
  /** Instagram story / full card */
  story: { width: 1080, height: 1920 },
  /** Instagram feed format (4:5 ratio) */
  feed: { width: 1080, height: 1350 },
  /** Square post format */
  square: { width: 1080, height: 1080 },
  /** Twitter/X optimized format */
  twitter: { width: 1200, height: 675 },
  /** Landscape format for OG/WhatsApp/LinkedIn */
  landscape: { width: 1200, height: 630 },
  /** Compact format for inline display */
  compact: { width: 600, height: 315 },
} as const;

/**
 * Card color schemes
 */
export const CARD_COLORS = {
  /** Dark theme (default) */
  dark: {
    background: 'linear-gradient(135deg, #0f172a 0%, #0d9488 100%)', // slate-900 to teal-600
    textColor: '#ffffff',
    accentColor: '#5eead4', // teal-300 per spec
    secondaryText: '#cbd5e1', // slate-300 per spec
    watermarkColor: 'rgba(245, 158, 11, 0.8)', // Amber #F59E0B per CLO spec
    dividerColor: '#334155', // slate-700 for divider lines
  },
  /** Light theme */
  light: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    textColor: '#0f172a',
    accentColor: '#0d9488', // teal-600
    secondaryText: '#64748b', // slate-500
    watermarkColor: 'rgba(13, 148, 136, 0.1)',
  },
  /** Teal gradient theme */
  teal: {
    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)',
    textColor: '#ffffff',
    accentColor: '#ffffff',
    secondaryText: 'rgba(255, 255, 255, 0.8)',
    watermarkColor: 'rgba(255, 255, 255, 0.15)',
  },
} as const;

/**
 * Font configurations for cards
 */
export const CARD_FONTS = {
  heading: {
    family: 'Inter, system-ui, sans-serif',
    weight: 700,
    sizes: {
      large: 72,
      medium: 56,
      small: 40,
    },
  },
  body: {
    family: 'Inter, system-ui, sans-serif',
    weight: 400,
    sizes: {
      large: 32,
      medium: 24,
      small: 18,
    },
  },
  display: {
    family: 'Inter, system-ui, sans-serif',
    weight: 700,
    sizes: {
      large: 120,
      medium: 96,
      small: 72,
    },
  },
  mono: {
    family: 'JetBrains Mono, monospace',
    weight: 500,
    sizes: {
      large: 28,
      medium: 20,
      small: 16,
    },
  },
} as const;

/**
 * Platform sharing configurations
 */
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  twitter: {
    name: 'twitter',
    supportsImage: true,
    supportsWebShare: false,
    urlTemplate: 'https://twitter.com/intent/tweet?text={text}&url={url}',
    maxTextLength: 280,
    imageDimensions: { width: 1200, height: 630 },
  },
  whatsapp: {
    name: 'whatsapp',
    supportsImage: false, // WhatsApp Web Share doesn't support images via URL
    supportsWebShare: true,
    urlTemplate: 'https://wa.me/?text={text}',
    maxTextLength: 65536,
  },
  instagram: {
    name: 'instagram',
    supportsImage: true,
    supportsWebShare: true, // Must use native share or download
    imageDimensions: { width: 1080, height: 1920 },
  },
  facebook: {
    name: 'facebook',
    supportsImage: true,
    supportsWebShare: false,
    urlTemplate: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={text}',
    imageDimensions: { width: 1200, height: 630 },
  },
  linkedin: {
    name: 'linkedin',
    supportsImage: true,
    supportsWebShare: false,
    urlTemplate: 'https://www.linkedin.com/sharing/share-offsite/?url={url}',
    imageDimensions: { width: 1200, height: 630 },
  },
  telegram: {
    name: 'telegram',
    supportsImage: false,
    supportsWebShare: true,
    urlTemplate: 'https://t.me/share/url?url={url}&text={text}',
    maxTextLength: 4096,
  },
  download: {
    name: 'download',
    supportsImage: true,
    supportsWebShare: false,
  },
  copy: {
    name: 'copy',
    supportsImage: false,
    supportsWebShare: false,
  },
} as const;

/**
 * CLO-compliant regional disclaimers
 */
export const REGIONAL_DISCLAIMERS: RegionalDisclaimer = {
  default:
    'This is a simulation based on historical data. Past performance does not guarantee future results. Investment involves risk.',
  brazil:
    'Simulacao baseada em dados historicos. Rentabilidade passada nao garante rentabilidade futura. Investimentos envolvem riscos.',
  germany:
    'Dies ist eine Simulation basierend auf historischen Daten. Die Wertentwicklung der Vergangenheit ist kein verlasslicher Indikator fur zukunftige Ergebnisse.',
  spain:
    'Simulacion basada en datos historicos. Rentabilidades pasadas no garantizan rentabilidades futuras. Las inversiones implican riesgos.',
};

/**
 * Disclaimer text by locale
 */
export const DISCLAIMERS_BY_LOCALE: Record<CardLocale, string> = {
  en: REGIONAL_DISCLAIMERS.default,
  de: REGIONAL_DISCLAIMERS.germany,
  'pt-BR': REGIONAL_DISCLAIMERS.brazil,
  es: REGIONAL_DISCLAIMERS.spain,
};

/**
 * Watermark text by locale (with warning emoji per CLO spec)
 */
export const WATERMARK_TEXT: Record<CardLocale, string> = {
  en: '⚠️ PROJECTION',
  de: '⚠️ PROJEKTION',
  'pt-BR': '⚠️ PROJEÇÃO',
  es: '⚠️ PROYECCIÓN',
};

/**
 * Dream card headlines by locale
 */
export const DREAM_CARD_HEADLINES: Record<CardLocale, string> = {
  en: 'IN DREAM MODE, I COULD GROW',
  de: 'IM TRAUMMODUS KONNTE ICH WACHSEN',
  'pt-BR': 'NO MODO SONHO, EU PODERIA CRESCER',
  es: 'EN MODO SUENO, PODRIA CRECER',
};

/**
 * Timeframe labels by locale
 */
export const TIMEFRAME_LABELS: Record<CardLocale, Record<string, string>> = {
  en: {
    '1week': '1 week',
    '1month': '1 month',
    '1year': '1 year',
    '5years': '5 years',
  },
  de: {
    '1week': '1 Woche',
    '1month': '1 Monat',
    '1year': '1 Jahr',
    '5years': '5 Jahre',
  },
  'pt-BR': {
    '1week': '1 semana',
    '1month': '1 mes',
    '1year': '1 ano',
    '5years': '5 anos',
  },
  es: {
    '1week': '1 semana',
    '1month': '1 mes',
    '1year': '1 ano',
    '5years': '5 anos',
  },
};

/**
 * Campaign hashtags
 */
export const CAMPAIGN_HASHTAGS = {
  primary: 'WhileISlept',
  secondary: ['diBoaS', 'PassiveIncome', 'FinancialFreedom'],
  localized: {
    en: ['WhileISlept', 'diBoaS', 'PassiveIncome'],
    de: ['WhileISlept', 'diBoaS', 'PassivesEinkommen'],
    'pt-BR': ['WhileISlept', 'diBoaS', 'RendaPassiva'],
    es: ['WhileISlept', 'diBoaS', 'IngresoPasivo'],
  },
} as const;

/**
 * Bank gap message for viral sharing (i18n)
 */
export const BANK_GAP_MESSAGES: Record<CardLocale, string> = {
  en: 'vs only {bankAmount} in a traditional bank',
  de: 'vs nur {bankAmount} bei einer Bank',
  'pt-BR': 'vs apenas {bankAmount} em banco tradicional',
  es: 'vs solo {bankAmount} en banco tradicional',
};

/**
 * Card CTA text for viral sharing (i18n)
 */
export const CARD_CTA_TEXTS: Record<CardLocale, string> = {
  en: 'Ready to stop dreaming?',
  de: 'Bereit, aufzuhoren zu traumen?',
  'pt-BR': 'Pronto para parar de sonhar?',
  es: 'Listo para dejar de sonar?',
};

/**
 * Waitlist viral message (bank gap emphasis)
 */
export const WAITLIST_VIRAL_MESSAGES: Record<CardLocale, string> = {
  en: 'Stop losing money to low bank rates',
  de: 'Hören Sie auf, Geld bei niedrigen Bankzinsen zu verlieren',
  'pt-BR': 'Pare de perder dinheiro com taxas bancárias baixas',
  es: 'Deja de perder dinero con tasas bancarias bajas',
};

/**
 * Waitlist bank gap messages (3-line viral hook per spec)
 */
export const WAITLIST_BANK_GAP: Record<CardLocale, { line1: string; line2: string; line3: string }> = {
  en: {
    line1: 'Banks earn 7% with our savings.',
    line2: 'They pay us 0.5%.',
    line3: "That gap? It's been there the whole time.",
  },
  de: {
    line1: 'Banken verdienen 7% mit unseren Ersparnissen.',
    line2: 'Sie zahlen uns 0,5%.',
    line3: 'Diese Lücke? Sie war schon immer da.',
  },
  'pt-BR': {
    line1: 'Os bancos ganham 7% com nossas economias.',
    line2: 'Nos pagam 0,5%.',
    line3: 'Essa diferença? Sempre esteve lá.',
  },
  es: {
    line1: 'Los bancos ganan 7% con nuestros ahorros.',
    line2: 'Nos pagan 0.5%.',
    line3: '¿Esa brecha? Siempre estuvo ahí.',
  },
};

/**
 * Dream Card bank comparison label
 */
export const DREAM_BANK_COMPARISON_LABEL: Record<CardLocale, string> = {
  en: 'My bank would have given me:',
  de: 'Meine Bank hätte mir gegeben:',
  'pt-BR': 'Meu banco teria me dado:',
  es: 'Mi banco me habría dado:',
};

/**
 * Card URL display
 */
export const CARD_URL = 'diboas.com';

/**
 * BCB disclaimer for PT-BR (regulatory compliance)
 */
export const BCB_DISCLAIMER: string = 'diBoaS não é uma instituição financeira autorizada pelo BCB.';

/**
 * Share events for analytics
 */
export const SHARE_EVENTS = {
  CARD_GENERATED: 'share_card_generated',
  SHARE_INITIATED: 'share_initiated',
  SHARE_COMPLETED: 'share_completed',
  SHARE_FAILED: 'share_failed',
  SHARE_CANCELLED: 'share_cancelled',
  LINK_COPIED: 'share_link_copied',
  IMAGE_DOWNLOADED: 'share_image_downloaded',
} as const;

/**
 * Market-specific platform priority
 * WhatsApp is prioritized for DE, PT-BR, ES markets (especially on mobile)
 * Twitter/X is prioritized for EN market
 */
export const PLATFORM_PRIORITY_BY_LOCALE: Record<CardLocale, string[]> = {
  en: ['twitter', 'whatsapp', 'instagram', 'linkedin', 'copy'],
  de: ['whatsapp', 'telegram', 'twitter', 'instagram', 'copy'],
  'pt-BR': ['whatsapp', 'instagram', 'twitter', 'telegram', 'copy'],
  es: ['whatsapp', 'instagram', 'twitter', 'telegram', 'copy'],
};

/**
 * Default card configuration
 */
export const DEFAULT_CARD_CONFIG: CardConfig = {
  width: CARD_DIMENSIONS.story.width,
  height: CARD_DIMENSIONS.story.height,
  background: CARD_COLORS.dark.background,
  textColor: CARD_COLORS.dark.textColor,
  accentColor: CARD_COLORS.dark.accentColor,
  locale: 'en',
};
