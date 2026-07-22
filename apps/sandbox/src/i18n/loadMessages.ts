/**
 * Message loading — static imports (four small files), flattened to the
 * dot-path ids react-intl consumes. No hardcoded user-facing strings exist
 * outside these files (SANDBOX_RULES R-3).
 */

import de from './messages/de.json';
import en from './messages/en.json';
import es from './messages/es.json';
import ptBR from './messages/pt-BR.json';
import type { SandboxLocale } from './config';

type NestedMessages = { [key: string]: string | NestedMessages };

export function flattenMessages(nested: NestedMessages, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(nested)) {
    const id = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[id] = value;
    else Object.assign(out, flattenMessages(value, id));
  }
  return out;
}

const RAW: Record<SandboxLocale, NestedMessages> = {
  en: en as NestedMessages,
  'pt-BR': ptBR as NestedMessages,
  es: es as NestedMessages,
  de: de as NestedMessages,
};

const FLATTENED = Object.fromEntries(
  Object.entries(RAW).map(([locale, messages]) => [locale, flattenMessages(messages)])
) as Record<SandboxLocale, Record<string, string>>;

export function getMessages(locale: SandboxLocale): Record<string, string> {
  return FLATTENED[locale];
}

export function getRawMessages(): Record<SandboxLocale, NestedMessages> {
  return RAW;
}
