/**
 * Per-tool metadata helper.
 *
 * Each tool's page.tsx exports `generateMetadata = toolMetadata('compound-interest')`
 * keeping the route shell at ~30 LoC per the §6C.2 plan target.
 *
 * URLs go through `seoService.generateCanonicalUrl` (absolute) so Lighthouse
 * SEO audits for `canonical` and `hreflang` pass — relative paths fail those
 * audits even though they work in the browser.
 */

import { isValidLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';
import { loadPageNamespaces } from '@/lib/i18n/pageNamespaceLoader';
import { seoService } from '@/lib/seo';
import { TOOL_DESCRIPTORS } from './constants';
import type { ToolKey } from './types';
import type { Metadata } from 'next';
import type { LocalePageProps } from '@/types/page';

export function toolMetadata(toolKey: ToolKey) {
  const namespace = TOOL_DESCRIPTORS[toolKey].i18nNamespace;
  const slug = TOOL_DESCRIPTORS[toolKey].slug;
  const path = `/tools/${slug}`;

  return async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
    const { locale } = await params;
    const validLocale = (isValidLocale(locale) ? locale : 'en') as SupportedLocale;
    const messages = await loadPageNamespaces(validLocale, [namespace]);

    const languages = SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, lang) => {
      acc[lang] = seoService.generateCanonicalUrl(path, lang);
      return acc;
    }, {});

    return {
      title: messages[`${namespace}.seo.title`],
      description: messages[`${namespace}.seo.description`],
      alternates: {
        canonical: seoService.generateCanonicalUrl(path, validLocale),
        languages,
      },
    };
  };
}
