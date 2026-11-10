/**
 * fetch-source.mjs — fetch one source over a date window, keep every response
 * body as evidence, and parse it (market data store).
 *
 * Reuses the pipeline's own helpers rather than a second copy: every attempt
 * goes through `fetchWithTimeout` (a request that cannot hang, 5.366) inside
 * `withRetry` (backoff, Principle 7). Parsing happens INSIDE the retried step,
 * so a 200 that carries the wrong body (FRED serves an HTML maintenance page
 * with status 200, HANDOFF pitfall) is retried and then falls back, instead of
 * being accepted.
 *
 * A host that times out or refuses the connection is marked down for the rest
 * of the run (a circuit breaker): its other series fail fast instead of each
 * spending the full retry budget, which once could exceed the job's time limit
 * and lose the run's evidence. A source with a `fallback` (FRED → ALFRED) then
 * uses it.
 *
 * Every attempt's body is saved, exactly as received (the bytes, not a
 * decoded-and-re-encoded string), with its HTTP status, before it is parsed.
 */

import { fetchWithTimeout } from '../market-refresh/lib/fetch-timeout.mjs';
import { withRetry } from '../market-refresh/lib/retry.mjs';
import * as P from './parsers.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

/** Per-attempt deadline. Full histories (CNBC since 2010, ~650 KB) need more than the weekly 20 s. */
export const SOURCE_TIMEOUT_MS = 45_000;
export const SOURCE_RETRIES = 2;
export const SOURCE_RETRY_BASE_MS = 5_000;

/** Parser by catalogue name; exported for the read-only range-pass report (5.776). */
export const PARSE = {
  yahoo: (b, l) => P.parseYahooChart(b, l),
  cnbc: (b, l) => P.parseCnbcBars(b, l),
  fred: (b, l) => P.parseFredCsv(b, l),
  coinmetrics: (b, l) => P.parseCoinMetrics(b, l),
  bitstamp: (b, l) => P.parseBitstampOhlc(b, l),
  coinbase: (b, l) => P.parseCoinbaseCandles(b, l),
  b3: (b, l, year) => P.parseB3Year(b, year, l),
  wgc: (b, l) => P.parseWgcChart(b, l),
  nasdaqHistorical: (b, l) => P.parseNasdaqHistorical(b, l),
  nasdaqDividends: (b, l) => P.parseNasdaqDividends(b, l),
  ishares: (b, l) => P.parseIsharesDistributions(b, l),
  stockanalysis: (b, l) => P.parseStockAnalysisDividends(b, l),
  sdmx: (b, l) => P.parseSdmxCsv(b, l),
  bls: (b, l, _y, o) => P.parseBlsV1(b, l, o),
  sidra: (b, l) => P.parseSidra(b, l),
  sgs: (b, l, _y, o) => P.parseSgs(b, l, o),
  eurostat: (b, l) => P.parseEurostat(b, l),
  bde: (b, l, _y, o) => P.parseBdeTable(b, l, o),
  treasury: (b, l, _y, o) => P.parseTreasuryCsv(b, l, o),
};
const EXT = {
  fred: 'csv',
  ishares: 'html',
  ecb: 'csv',
  bis: 'csv',
  bundesbank: 'csv',
  bde: 'csv',
  treasury: 'csv',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoOf = (unixSeconds) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Status codes worth another attempt; any other non-2xx is final. */
const RETRYABLE = (status) => status === 429 || status >= 500;

export class HostDown extends Error {}

/**
 * @param {{store: object, retryBaseMs?: number, fetchImpl?: Function}} opts
 *   `fetchImpl` replaces `fetchWithTimeout` in tests (same signature).
 * @returns a fetcher bound to one run (it owns the run's circuit breaker)
 */
export function createFetcher({ store, retryBaseMs = SOURCE_RETRY_BASE_MS, fetchImpl } = {}) {
  const down = new Map(); // host → reason
  const doFetch = fetchImpl ?? ((url, opts) => fetchWithTimeout(url, opts));

  /** GET + parse one URL, with retries; returns the parsed result. */
  async function getParsed(url, { provider, series, parse, headers, encoding, post }) {
    const host = new URL(url).host;
    if (down.has(host)) throw new HostDown(`${host} skipped: ${down.get(host)}`);
    const attempt = async () => {
      const fetchedAt = new Date().toISOString();
      let res;
      try {
        res = await doFetch(url, {
          headers: {
            'User-Agent': UA,
            Accept: 'application/json, text/csv, text/plain, */*',
            ...headers,
          },
          timeoutMs: SOURCE_TIMEOUT_MS,
          label: `${provider}:${series}`,
          // a POST source sends its query as a JSON body (BLS v1)
          ...(post ? { method: 'POST', body: post } : {}),
        });
      } catch (e) {
        store.saveRaw({
          provider,
          series,
          url,
          ...(post ? { method: 'POST', requestBody: post } : {}),
          status: null,
          bytes: String(e?.message ?? e),
          fetchedAt,
          ext: 'txt',
        });
        const err = new Error(`${provider} ${series}: ${e?.message ?? e}`);
        err.network = true;
        throw err;
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      store.saveRaw({
        provider,
        series,
        url,
        ...(post ? { method: 'POST', requestBody: post } : {}),
        status: res.status,
        bytes,
        fetchedAt,
        ext: EXT[provider] ?? 'json',
      });
      if (!res.ok) {
        const err = new Error(`${provider} ${series}: HTTP ${res.status}`);
        if (!RETRYABLE(res.status)) return { fatal: err };
        throw err;
      }
      // Banco de España serves Latin-1; everything else here is UTF-8.
      return { parsed: parse(new TextDecoder(encoding ?? 'utf-8').decode(bytes)) };
    };
    let out;
    try {
      out = await withRetry(attempt, {
        retries: SOURCE_RETRIES,
        baseDelayMs: retryBaseMs,
        label: `${provider}:${series}`,
      });
    } catch (e) {
      if (e.network) down.set(host, e.message);
      throw e;
    }
    if (out.fatal) throw out.fatal;
    return out.parsed;
  }

  /** Fetch one source over [from, to] (inclusive ISO dates) and parse it into { rows, events? }. */
  async function fetchSource(src, { from, to, series }) {
    const label = `${src.provider}:${series}`;
    const parser = PARSE[src.parser];
    if (!parser) throw new Error(`no parser ${src.parser}`);
    const ctx = { provider: src.provider, series, headers: src.headers, encoding: src.encoding };
    // a source that needs a POST builds its body from the same window as its URL
    const withPost = (a, b) => (src.body ? { post: src.body(a, b) } : {});
    const opts = src.parserOpts;
    const inWindow = (rows) => rows.filter((r) => r.date >= from && r.date <= to);

    if (src.perYear) {
      const rows = [];
      for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y += 1) {
        rows.push(
          ...(
            await getParsed(src.url(y), {
              ...ctx,
              ...withPost(`${y}-01-01`, `${y}-12-31`),
              parse: (b) => parser(b, label, y, opts),
            })
          ).rows
        );
        await sleep(300);
      }
      return { rows: inWindow(rows) };
    }
    if (src.chunkDays) {
      const rows = [];
      for (let a = from; a <= to; a = addDays(a, src.chunkDays + 1)) {
        const b = addDays(a, src.chunkDays) < to ? addDays(a, src.chunkDays) : to;
        rows.push(
          ...(
            await getParsed(src.url(a, b), {
              ...ctx,
              ...withPost(a, b),
              parse: (x) => parser(x, label, undefined, opts),
            })
          ).rows
        );
        await sleep(350);
      }
      return { rows: inWindow(dedupe(rows)) };
    }
    if (src.pagedByStart) {
      const rows = [];
      let start = from;
      for (;;) {
        const page = await getParsed(src.url(start), {
          ...ctx,
          ...withPost(start, to),
          parse: (x) => parser(x, label, undefined, opts),
        });
        rows.push(...page.rows);
        if (!page.count || page.count < 1000 || page.last == null || isoOf(page.last) >= to) break;
        start = isoOf(page.last + 86_400);
        await sleep(400);
      }
      return { rows: inWindow(dedupe(rows)) };
    }
    if (src.paged) {
      const rows = [];
      let url = src.url(from, to);
      while (url) {
        const page = await getParsed(url, {
          ...ctx,
          ...withPost(from, to),
          parse: (x) => parser(x, label, undefined, opts),
        });
        rows.push(...page.rows);
        url = page.next;
      }
      return { rows: inWindow(rows) };
    }
    try {
      const r = await getParsed(src.url(from, to), {
        ...ctx,
        ...withPost(from, to),
        parse: (x) => parser(x, label, undefined, opts),
      });
      return { ...r, rows: inWindow(r.rows ?? []) };
    } catch (e) {
      if (!src.fallback) throw e;
      const r = await getParsed(src.fallback(from, to), {
        ...ctx,
        ...withPost(from, to),
        parse: (x) => parser(x, label, undefined, opts),
      });
      return { ...r, rows: inWindow(r.rows ?? []), usedFallback: true };
    }
  }

  return { fetchSource, hostsDown: () => Object.fromEntries(down) };
}

const dedupe = (rows) =>
  [...new Map(rows.map((r) => [r.date, r])).values()].sort((a, b) => a.date.localeCompare(b.date));
