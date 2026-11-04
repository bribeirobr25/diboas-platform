/**
 * parsers.mjs — turn one provider response body into rows (pure; no I/O).
 *
 * Every parser returns `{ rows, events? }` where a row is
 * `{ date: 'YYYY-MM-DD', close, open?, high?, low?, adjclose? }` and an event
 * is `{ date: 'YYYY-MM-DD', amount }` (a dividend or distribution by its
 * EX-date). Dates are the trading day in the market's own time zone, never a
 * UTC conversion of a timestamp: a US close stamped 13:30 UTC and a Bitcoin
 * close stamped 00:00 UTC both keep the day they belong to.
 *
 * A parser throws on a body it cannot read. It never returns a partial result
 * silently: a missing value is dropped by name (null close), a malformed body
 * is an error that names the source.
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const num = (v) => {
  if (v == null || v === '' || v === '.') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const fail = (label, why) => {
  throw new Error(`PARSE ${label}: ${why}`);
};

/** Day of week (0 = Sunday) of an ISO date, calendar arithmetic only. */
export function weekday(date) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/**
 * Yahoo chart API (`interval=1d&events=div`). `close` is split-adjusted but
 * NOT dividend-adjusted; `adjclose` is Yahoo's own dividend adjustment as of
 * the fetch, kept for comparison only (it changes whenever a dividend is paid,
 * which is why diBoaS computes total return itself — register 5.633).
 */
export function parseYahooChart(body, label) {
  const r = JSON.parse(body)?.chart?.result?.[0];
  if (!r || !Array.isArray(r.timestamp)) fail(label, 'no chart.result[0].timestamp');
  const offset = Number(r.meta?.gmtoffset ?? 0);
  const q = r.indicators?.quote?.[0];
  if (!q) fail(label, 'no indicators.quote[0]');
  const adj = r.indicators?.adjclose?.[0]?.adjclose ?? null;
  const localDate = (t) => new Date((t + offset) * 1000).toISOString().slice(0, 10);
  const rows = [];
  r.timestamp.forEach((t, i) => {
    const close = num(q.close[i]);
    if (close == null) return;
    rows.push({
      date: localDate(t),
      open: num(q.open[i]),
      high: num(q.high[i]),
      low: num(q.low[i]),
      close,
      ...(adj ? { adjclose: num(adj[i]) } : {}),
    });
  });
  const events = Object.values(r.events?.dividends ?? {})
    .map((d) => ({ date: localDate(Number(d.date)), amount: num(d.amount) }))
    .filter((e) => e.amount != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { rows: dedupeLast(rows, label), events };
}

/**
 * CNBC bars (`/harmony/app/bars/<sym>/1D/<from>/<to>/adjusted/EST5EDT.json`).
 * `tradeTime` is New York local time, so its first 8 digits are the trading
 * day. Weekend bars (a flat Saturday/Sunday row on 24-hour instruments such
 * as spot gold and FX) are dropped: no market closes on them.
 */
export function parseCnbcBars(body, label) {
  const bars = JSON.parse(body)?.barData?.priceBars;
  if (!Array.isArray(bars)) fail(label, 'no barData.priceBars');
  const rows = [];
  for (const b of bars) {
    const t = String(b.tradeTime ?? '');
    if (!/^\d{8}/.test(t)) fail(label, `bad tradeTime ${t}`);
    const date = iso(t.slice(0, 4), t.slice(4, 6), t.slice(6, 8));
    const wd = weekday(date);
    if (wd === 0 || wd === 6) continue;
    const close = num(b.close);
    if (close == null) continue;
    rows.push({ date, open: num(b.open), high: num(b.high), low: num(b.low), close });
  }
  return { rows: dedupeLast(rows, label) };
}

/** FRED/ALFRED graph CSV: `observation_date,<ID>[_<vintage>]`; '.' = no value. */
export function parseFredCsv(body, label) {
  const lines = String(body).trim().split(/\r?\n/);
  if (!/^observation_date,/i.test(lines[0] ?? '') && !/^DATE,/i.test(lines[0] ?? ''))
    fail(label, `unexpected header ${String(lines[0]).slice(0, 60)}`);
  const rows = [];
  for (const line of lines.slice(1)) {
    const [date, v] = line.split(',');
    if (!ISO.test(date)) fail(label, `bad date ${date}`);
    const close = num(v);
    if (close != null) rows.push({ date, close });
  }
  return { rows: dedupeLast(rows, label) };
}

/** Coin Metrics community API, `metrics=PriceUSD&frequency=1d` (one page). */
export function parseCoinMetrics(body, label) {
  const j = JSON.parse(body);
  if (!Array.isArray(j?.data)) fail(label, 'no data[]');
  const rows = j.data
    .map((d) => ({ date: String(d.time).slice(0, 10), close: num(d.PriceUSD) }))
    .filter((r) => r.close != null && ISO.test(r.date));
  return { rows, next: j.next_page_url ?? null };
}

/**
 * B3 index statistics (`GetPortfolioDay`, one calendar year): `results` holds
 * one entry per day of the month with `rateValue1..12` = that day's close in
 * January..December, written pt-BR style ("40.570,03").
 */
export function parseB3Year(body, year, label) {
  const j = JSON.parse(body);
  if (!Array.isArray(j?.results)) fail(label, 'no results[]');
  const ptBr = (s) => (s == null ? null : num(String(s).replace(/\./g, '').replace(',', '.')));
  const rows = [];
  for (const r of j.results) {
    for (let m = 1; m <= 12; m += 1) {
      const close = ptBr(r[`rateValue${m}`]);
      if (close == null) continue;
      rows.push({ date: iso(year, m, r.day), close });
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows };
}

/** Nasdaq `api/quote/<T>/dividends?assetclass=etf`: rows with MM/DD/YYYY ex-dates. */
export function parseNasdaqDividends(body, label) {
  const rows = JSON.parse(body)?.data?.dividends?.rows;
  if (rows == null) return { rows: [], events: [] }; // "not available for non-Nasdaq symbols"
  if (!Array.isArray(rows)) fail(label, 'dividends.rows is not an array');
  const events = rows
    .filter((r) => /cash/i.test(r.type ?? 'Cash'))
    .map((r) => {
      const [m, d, y] = String(r.exOrEffDate).split('/');
      return { date: iso(y, m, d), amount: num(r.amount) };
    })
    .filter((e) => e.amount != null && ISO.test(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { rows: [], events };
}

/** Nasdaq `api/quote/<T>/historical?assetclass=etf`: tradesTable rows, MM/DD/YYYY. */
export function parseNasdaqHistorical(body, label) {
  const rows = JSON.parse(body)?.data?.tradesTable?.rows;
  if (!Array.isArray(rows)) fail(label, 'no data.tradesTable.rows');
  const out = rows
    .map((r) => {
      const [m, d, y] = String(r.date).split('/');
      return { date: iso(y, m, d), close: num(r.close) };
    })
    .filter((r) => r.close != null && ISO.test(r.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { rows: out };
}

const MONTHS = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

/**
 * iShares distributions tab: the page embeds the table as parallel JSON arrays
 * named `exDate` ("Nov 02, 2026") and `totalDistribution` ("0.343177").
 */
export function parseIsharesDistributions(body, label) {
  const s = String(body);
  const column = (name) => {
    const at = s.indexOf(`"name":"${name}"`);
    if (at < 0) fail(label, `no ${name} column`);
    const m = /"formattedValue":\[([^\]]*)\]/.exec(s.slice(at, at + 400000));
    if (!m) fail(label, `no ${name} values`);
    return JSON.parse(`[${m[1]}]`);
  };
  const dates = column('exDate');
  const amounts = column('totalDistribution');
  if (dates.length !== amounts.length)
    fail(label, `${dates.length} dates vs ${amounts.length} amounts`);
  const events = dates
    .map((txt, i) => {
      const m = /^([A-Z][a-z]{2}) (\d{2}), (\d{4})$/.exec(String(txt));
      return m ? { date: iso(m[3], MONTHS[m[1]], m[2]), amount: num(amounts[i]) } : null;
    })
    .filter((e) => e && e.amount != null && e.amount > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { rows: [], events };
}

/** stockanalysis.com `api/symbol/e/<t>/dividend`: `data.history[] {dt, amt}`. */
export function parseStockAnalysisDividends(body, label) {
  const j = JSON.parse(body);
  const hist = j?.data?.history ?? j?.data?.data;
  if (!Array.isArray(hist)) fail(label, 'no data.history[]');
  const events = hist
    .map((h) => ({
      date: String(h.dt ?? h.date ?? '').slice(0, 10),
      amount: num(h.amt ?? h.amount),
    }))
    .filter((e) => e.amount != null && ISO.test(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { rows: [], events };
}

/**
 * World Gold Council price chart (`goldprice/v11/chart/price/usd/oz/<from>,<to>`):
 * `chartData.USD` = [[ms, price], ...]. It is the LBMA PM fix (15:00 London),
 * not a close, so it is a CHECK for spot gold with a tolerance that allows for
 * the hours between the fix and the New York close.
 */
export function parseWgcChart(body, label) {
  const j = JSON.parse(body);
  const pts = j?.chartData?.USD ?? j?.chartData?.usd;
  if (!Array.isArray(pts)) fail(label, 'no chartData.USD');
  const rows = pts
    .map(([ms, v]) => ({ date: new Date(Number(ms)).toISOString().slice(0, 10), close: num(v) }))
    .filter((r) => r.close != null);
  return { rows: dedupeLast(rows, label) };
}

/** Keep the last row per date (providers occasionally repeat a day). */
function dedupeLast(rows, label) {
  const by = new Map();
  for (const r of rows) {
    if (!ISO.test(r.date)) fail(label, `bad date ${r.date}`);
    by.set(r.date, r);
  }
  return [...by.values()].sort((a, b) => a.date.localeCompare(b.date));
}
