/**
 * Content Management Constants
 * Configuration Management: Centralized content settings
 */

import { ContentConfig } from './types';
import type { SupportedLocale } from '@diboas/i18n/server';

export const CONTENT_DEFAULTS: ContentConfig = {
  defaultLocale: 'en' as SupportedLocale,
  fallbackLocale: 'en' as SupportedLocale,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
  validateOnLoad: true
};

export const CONTENT_TYPES = {
  PAGE: 'page',
  SECTION: 'section',
  COMPONENT: 'component'
} as const;

export const FIELD_TYPES = {
  TEXT: 'text',
  RICHTEXT: 'richtext',
  IMAGE: 'image',
  URL: 'url',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array'
} as const;