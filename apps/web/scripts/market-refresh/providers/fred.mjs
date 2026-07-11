/**
 * FRED provider (P2 Stage 1) — public CSV endpoint, no key, https pinned.
 * Implements the SourceProvider contract: fetch() → { series, provenance }.
 */
import { withRetry } from '../lib/retry.mjs';

export async function fetchFredSeries(seriesId, startDate = '2023-01-01') {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startDate}`;
  const series = await withRetry(
    async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`FRED ${seriesId} returned ${res.status}`);
      const csv = await res.text();
      if (!csv.startsWith('observation_date')) {
        throw new Error(`FRED ${seriesId} returned non-CSV response`);
      }
      return csv
        .split('\n')
        .slice(1)
        .map((line) => line.split(','))
        .filter(([d, v]) => d && v && v !== '.')
        .map(([d, v]) => [new Date(`${d}T00:00:00Z`), Number.parseFloat(v)]);
    },
    { label: `FRED:${seriesId}` }
  );
  return {
    series,
    provenance: {
      source: `FRED:${seriesId}`,
      url,
      fetchedAt: new Date().toISOString(),
      licence: 'public-domain',
    },
  };
}
