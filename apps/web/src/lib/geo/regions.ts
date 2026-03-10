/**
 * Country-to-Region mapping utility.
 *
 * Derives regulatory/economic region from ISO 3166-1 alpha-2 country code.
 * Used by stats route, Founders Wall, and analytics segmentation.
 *
 * Region is computed, not stored — updating this map instantly affects all queries.
 */

const COUNTRY_TO_REGION: Record<string, string> = {
  // EU (MiCA jurisdiction)
  AT: 'EU', BE: 'EU', BG: 'EU', HR: 'EU', CY: 'EU',
  CZ: 'EU', DK: 'EU', EE: 'EU', FI: 'EU', FR: 'EU',
  DE: 'EU', GR: 'EU', HU: 'EU', IE: 'EU', IT: 'EU',
  LV: 'EU', LT: 'EU', LU: 'EU', MT: 'EU', NL: 'EU',
  PL: 'EU', PT: 'EU', RO: 'EU', SK: 'EU', SI: 'EU',
  ES: 'EU', SE: 'EU',
  // UK (FCA jurisdiction)
  GB: 'UK',
  // NA (SEC jurisdiction)
  US: 'NA', CA: 'NA',
  // LATAM (CVM / local regulators)
  BR: 'LATAM', AR: 'LATAM', MX: 'LATAM', CL: 'LATAM', CO: 'LATAM',
  PE: 'LATAM', UY: 'LATAM', EC: 'LATAM', PY: 'LATAM', BO: 'LATAM',
  VE: 'LATAM', CR: 'LATAM', PA: 'LATAM',
};

export function getRegionFromCountry(country: string | null): string | undefined {
  if (!country) return undefined;
  return COUNTRY_TO_REGION[country.toUpperCase()];
}
