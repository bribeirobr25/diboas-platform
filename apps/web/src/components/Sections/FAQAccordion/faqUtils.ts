/**
 * FAQ Accordion Utilities
 *
 * Helper functions for FAQ accordion functionality
 */

import type { FAQAccordionConfig } from '@/config/faqAccordion';

export interface ResolvedFAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * Intl interface for FAQ utilities
 */
interface FAQIntl {
  messages: Record<string, unknown>;
}

/**
 * Resolve FAQ items from either registry (new mode) or direct items (legacy mode)
 */
export function resolveFAQItems(
  config: FAQAccordionConfig,
  intl: FAQIntl
): ResolvedFAQItem[] {
  // Registry mode: questionIds references centralized FAQ registry
  if (config.content.questionIds) {
    const questionIdsKey = config.content.questionIds as unknown as string;

    // If it's a translation key string, we need to access the raw array value
    if (typeof questionIdsKey === 'string' && questionIdsKey.startsWith('marketing.')) {
      let questionIds: string[] = [];
      try {
        const messages = intl.messages;
        const baseKey = questionIdsKey;
        let index = 0;
        const reconstructedArray: string[] = [];

        while (true) {
          const indexedKey = `${baseKey}.${index}`;
          const value = messages[indexedKey];

          if (value === undefined) {
            break;
          }

          if (typeof value === 'string') {
            reconstructedArray.push(value);
          }
          index++;
        }

        questionIds = reconstructedArray;
      } catch {
        questionIds = [];
      }

      // Resolve each question ID from the registry
      return questionIds.map((qId: string) => ({
        id: qId,
        question: `marketing.faq.registry.${qId}.question`,
        answer: `marketing.faq.registry.${qId}.answer`,
        category: 'getting-started' as const
      }));
    }

    // Direct questionIds array
    return config.content.questionIds.map(qId => ({
      id: qId,
      question: `marketing.faq.registry.${qId}.question`,
      answer: `marketing.faq.registry.${qId}.answer`,
      category: 'getting-started' as const
    }));
  }

  // Legacy mode: direct items array
  return [...(config.content.items || [])];
}

/**
 * Track FAQ analytics event
 */
export function trackFAQExpand(
  expandedId: string,
  trackingPrefix: string
): void {
  const windowWithGtag = window as Window & {
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
  };

  if (typeof window !== 'undefined' && windowWithGtag.gtag) {
    windowWithGtag.gtag('event', 'faq_expand', {
      event_category: trackingPrefix,
      event_label: expandedId
    });
  }
}
