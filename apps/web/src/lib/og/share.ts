/**
 * Share page URLs with dynamic OG metadata for social sharing.
 *
 * Only the Money Tools result card is produced today. The waitlist and calculator helpers,
 * and the deprecated `getShareUrl` that was their only caller, were deleted with Dream Mode
 * (plan P13 PR-2): nothing generated those links. The share page and the OG route still
 * render a `waitlist` link already shared; a `calculator` link falls back to the default card.
 */

interface ToolResultOGParams {
  /** Allowlisted tool key (must be in SHAREABLE_TOOL_KEYS server-side). */
  toolKey: string;
  /** Hero figure rendered on the card. */
  value: number;
  /** ISO 4217 currency code (the holder's locale currency). */
  currency: string;
  years?: number;
  /** Hero color semantics — a loss must not render as a green "win" on the card. */
  tone?: 'positive' | 'negative' | 'neutral';
}

/**
 * Build the tool-result OG image params. Shared by the image URL and the share
 * page URL so they never drift. Values are coerced to safe primitives here; the
 * route handler re-validates (allowlist + range) before rendering.
 */
function buildToolResultParams(params: ToolResultOGParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.set('type', 'tool-result');
  searchParams.set('tool', params.toolKey);
  searchParams.set('value', Math.round(params.value).toString());
  searchParams.set('currency', params.currency);
  if (params.years) {
    searchParams.set('years', Math.round(params.years).toString());
  }
  // Only emit a non-default tone to keep the common (positive) URL clean.
  if (params.tone && params.tone !== 'positive') {
    searchParams.set('tone', params.tone);
  }
  return searchParams;
}

/**
 * Generate the share page URL for a Money Tools result. This page carries the
 * dynamic OG metadata for social crawlers, then redirects humans to the locale
 * landing page.
 *
 * @example
 * getToolResultSharePageUrl({ toolKey: 'currency-depreciation', value: 1850, currency: 'BRL', years: 5 }, 'pt-BR', 'https://diboas.com')
 * // => 'https://diboas.com/pt-BR/share?type=tool-result&tool=currency-depreciation&value=1850&currency=BRL&years=5'
 */
export function getToolResultSharePageUrl(
  params: ToolResultOGParams,
  locale: string,
  baseUrl: string
): string {
  return `${baseUrl}/${locale}/share?${buildToolResultParams(params).toString()}`;
}
