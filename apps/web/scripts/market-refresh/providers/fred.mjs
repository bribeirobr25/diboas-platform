/**
 * FRED provider (P2 Stage 1) — public CSV endpoint, no key, https pinned.
 * Implements the SourceProvider contract: fetch() → { series, provenance }.
 */
import { fetchWithTimeout } from '../lib/fetch-timeout.mjs';
import { withRetry } from '../lib/retry.mjs';

export async function fetchFredSeries(seriesId, startDate = '2023-01-01') {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startDate}`;
  const series = await withRetry(
    async () => {
      const res = await fetchWithTimeout(url, { label: `FRED:${seriesId}` });
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
      // 5.307: NOT 'public-domain'. The 2026-08-19 research behind 5.101 found
      // FRED is not blanket public-domain — per-series status varies and the
      // API terms restrict caching and redistribution. NASDAQCOM in particular
      // is Nasdaq-sourced index data, unlike the Fed-produced DGS10/DTWEXBGS/
      // M2SL. `unverified` removes a confident claim the research disputes
      // without inventing a new one: a per-series determination is a licensing
      // judgement and belongs to 5.101's data-rights BOM, not to this file.
      licence: 'unverified',
    },
  };
}
