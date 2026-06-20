/**
 * Dynamic OG Image URL Generators
 *
 * Generate URLs for personalized OG images for social sharing
 */

const OG_BASE_PATH = '/api/og/share';

interface WaitlistOGParams {
  position: number;
  name?: string;
}

interface CalculatorOGParams {
  futureAmount: number;
  years: number;
  strategy?: string;
  initialInvestment?: number;
}

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
 * Generate OG image URL for waitlist position sharing
 *
 * @example
 * getWaitlistOGUrl({ position: 247, name: 'John' })
 * // => '/api/og/share?type=waitlist&position=247&name=John'
 */
export function getWaitlistOGUrl(params: WaitlistOGParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('type', 'waitlist');
  searchParams.set('position', params.position.toString());

  if (params.name) {
    searchParams.set('name', params.name);
  }

  return `${OG_BASE_PATH}?${searchParams.toString()}`;
}

/**
 * Generate full OG image URL for waitlist position (with domain)
 *
 * @example
 * getWaitlistOGUrlFull({ position: 247 }, 'https://diboas.com')
 * // => 'https://diboas.com/api/og/share?type=waitlist&position=247'
 */
export function getWaitlistOGUrlFull(params: WaitlistOGParams, baseUrl: string): string {
  return `${baseUrl}${getWaitlistOGUrl(params)}`;
}

/**
 * Generate OG image URL for calculator results sharing
 *
 * @example
 * getCalculatorOGUrl({ futureAmount: 125000, years: 10, strategy: 'balanced' })
 * // => '/api/og/share?type=calculator&amount=125000&years=10&strategy=balanced'
 */
export function getCalculatorOGUrl(params: CalculatorOGParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('type', 'calculator');
  searchParams.set('amount', Math.round(params.futureAmount).toString());
  searchParams.set('years', params.years.toString());

  if (params.strategy) {
    searchParams.set('strategy', params.strategy);
  }

  if (params.initialInvestment) {
    searchParams.set('initial', params.initialInvestment.toString());
  }

  return `${OG_BASE_PATH}?${searchParams.toString()}`;
}

/**
 * Generate full OG image URL for calculator results (with domain)
 *
 * @example
 * getCalculatorOGUrlFull({ futureAmount: 125000, years: 10 }, 'https://diboas.com')
 * // => 'https://diboas.com/api/og/share?type=calculator&amount=125000&years=10'
 */
export function getCalculatorOGUrlFull(params: CalculatorOGParams, baseUrl: string): string {
  return `${baseUrl}${getCalculatorOGUrl(params)}`;
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

/**
 * Generate share page URL for waitlist position
 * This URL has dynamic OG metadata for social sharing
 *
 * @example
 * getWaitlistSharePageUrl({ position: 247 }, 'en', 'https://diboas.com')
 * // => 'https://diboas.com/en/share?type=waitlist&position=247'
 */
export function getWaitlistSharePageUrl(
  params: WaitlistOGParams,
  locale: string,
  baseUrl: string
): string {
  const searchParams = new URLSearchParams();
  searchParams.set('type', 'waitlist');
  searchParams.set('position', params.position.toString());

  if (params.name) {
    searchParams.set('name', params.name);
  }

  return `${baseUrl}/${locale}/share?${searchParams.toString()}`;
}

/**
 * Generate share page URL for calculator results
 * This URL has dynamic OG metadata for social sharing
 *
 * @example
 * getCalculatorSharePageUrl({ futureAmount: 125000, years: 10 }, 'en', 'https://diboas.com')
 * // => 'https://diboas.com/en/share?type=calculator&amount=125000&years=10'
 */
export function getCalculatorSharePageUrl(
  params: CalculatorOGParams,
  locale: string,
  baseUrl: string
): string {
  const searchParams = new URLSearchParams();
  searchParams.set('type', 'calculator');
  searchParams.set('amount', Math.round(params.futureAmount).toString());
  searchParams.set('years', params.years.toString());

  if (params.strategy) {
    searchParams.set('strategy', params.strategy);
  }

  if (params.initialInvestment) {
    searchParams.set('initial', params.initialInvestment.toString());
  }

  return `${baseUrl}/${locale}/share?${searchParams.toString()}`;
}

/**
 * Generate social share URL with OG image
 * Creates a shareable link that will display the custom OG image
 *
 * @deprecated Use getWaitlistSharePageUrl or getCalculatorSharePageUrl instead
 */
export function getShareUrl(
  type: 'waitlist' | 'calculator',
  params: WaitlistOGParams | CalculatorOGParams,
  baseUrl: string,
  locale: string = 'en'
): { pageUrl: string; ogImageUrl: string } {
  if (type === 'waitlist') {
    const waitlistParams = params as WaitlistOGParams;
    return {
      pageUrl: getWaitlistSharePageUrl(waitlistParams, locale, baseUrl),
      ogImageUrl: getWaitlistOGUrlFull(waitlistParams, baseUrl),
    };
  }

  const calcParams = params as CalculatorOGParams;
  return {
    pageUrl: getCalculatorSharePageUrl(calcParams, locale, baseUrl),
    ogImageUrl: getCalculatorOGUrlFull(calcParams, baseUrl),
  };
}
