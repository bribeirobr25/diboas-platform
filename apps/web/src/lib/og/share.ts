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
export function getWaitlistOGUrlFull(
  params: WaitlistOGParams,
  baseUrl: string
): string {
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
export function getCalculatorOGUrlFull(
  params: CalculatorOGParams,
  baseUrl: string
): string {
  return `${baseUrl}${getCalculatorOGUrl(params)}`;
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
