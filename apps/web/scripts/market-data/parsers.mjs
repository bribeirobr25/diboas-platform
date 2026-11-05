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
    const open = num(b.open);
    const high = num(b.high);
    const low = num(b.low);
    // A bar with open = high = low = close is not a traded day: CNBC prints
    // one on market holidays for 24-hour instruments (gold on Good Friday)
    // and, rarely, as a fault (EUR/USD 2020-01-02 at 1.1786 when the Fed and
    // the ECB both had about 1.12). It is dropped, never stored or compared.
    if (open === high && high === low && low === close) continue;
    rows.push({ date, open, high, low, close });
  }
  return { rows: dedupeLast(rows, label) };
}

/** Bitstamp `api/v2/ohlc/btcusd/?step=86400` (one page): UTC days. */
export function parseBitstampOhlc(body, label) {
  const d = JSON.parse(body)?.data?.ohlc;
  if (!Array.isArray(d)) fail(label, 'no data.ohlc');
  const rows = d
    .filter((r) => num(r.volume) > 0) // a zero-volume day carries the last trade forward
    .map((r) => ({
      date: new Date(Number(r.timestamp) * 1000).toISOString().slice(0, 10),
      open: num(r.open),
      high: num(r.high),
      low: num(r.low),
      close: num(r.close),
    }))
    .filter((r) => r.close != null);
  return {
    rows: dedupeLast(rows, label),
    last: d.length ? Number(d.at(-1).timestamp) : null,
    count: d.length,
  };
}

/** Coinbase Exchange `products/BTC-USD/candles?granularity=86400`: [time, low, high, open, close, volume], UTC days. */
export function parseCoinbaseCandles(body, label) {
  const d = JSON.parse(body);
  if (!Array.isArray(d)) fail(label, 'not an array of candles');
  const rows = d
    .filter((c) => Array.isArray(c) && c.length >= 5)
    .map(([t, low, high, open, close]) => ({
      date: new Date(Number(t) * 1000).toISOString().slice(0, 10),
      open: num(open),
      high: num(high),
      low: num(low),
      close: num(close),
    }))
    .filter((r) => r.close != null);
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
      const date = iso(year, m, r.day);
      // The table has a cell for every day 1..31 of every month: a value in an
      // impossible cell (30 February) is a fault, never a date to store.
      if (new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)
        fail(label, `a value on the impossible date ${date}`);
      rows.push({ date, close });
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

// ---- official statistics (inflation and interest rates; plan 5.760, 2026-11-05) ----

/**
 * A number from an official statistics source, read strictly: digits with an
 * optional sign, decimal point and exponent. A publisher's "no value" marker
 * (`MISSING`) is null. Anything else, including a DECIMAL COMMA, is refused:
 * the shared `num` treats a comma as a thousands separator, so "0,51" would
 * be stored as 51 (review of #820, 2026-11-05).
 */
const MISSING = new Set(['', '.', '-', '_', '...', 'NaN', 'NA', 'N/A', 'X']);
const strictNum = (v, label) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const t = String(v).trim();
  if (MISSING.has(t)) return null;
  if (!/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(t))
    fail(label, `unreadable number "${t.slice(0, 20)}"`);
  return Number(t);
};

/** Rows of ONE series: a date seen twice means two series were mixed, so it is refused. */
function uniqueRows(rows, label) {
  const seen = new Set();
  for (const r of rows) {
    if (!ISO.test(r.date)) fail(label, `bad date ${r.date}`);
    if (seen.has(r.date)) fail(label, `date ${r.date} appears twice (more than one series?)`);
    seen.add(r.date);
  }
  return [...rows].sort((x, y) => x.date.localeCompare(y.date));
}

const monthDate = (ym, label) => {
  if (!/^\d{4}-\d{2}$/.test(ym)) fail(label, `bad month ${ym}`);
  return `${ym}-01`;
};

/**
 * Split one CSV line, honouring double quotes (statistics agencies quote any
 * field that contains the separator: BIS and OECD titles carry commas).
 */
export function splitCsvLine(line, sep = ',') {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * SDMX CSV, as served by the ECB Data Portal (`format=csvdata`), BIS
 * (`format=csv`) and the Bundesbank
 * (`Accept: text/csv`, semicolon-separated, with a byte-order mark). Columns
 * are found by name (`TIME_PERIOD`, `OBS_VALUE`), never by position. A
 * monthly period (`2026-09`) is stored as its first day; a daily one as itself.
 */
export function parseSdmxCsv(body, label) {
  const lines = String(body)
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/);
  const sep = (lines[0] ?? '').includes(';') && !(lines[0] ?? '').includes(',') ? ';' : ',';
  const head = splitCsvLine(lines[0] ?? '', sep);
  const at = (name) => head.indexOf(name);
  const t = at('TIME_PERIOD');
  const v = at('OBS_VALUE');
  if (t < 0 || v < 0) fail(label, `no TIME_PERIOD/OBS_VALUE in ${String(lines[0]).slice(0, 80)}`);
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    // a quoted field holding a line break, or a cut-off row, is refused
    if ((line.match(/"/g) ?? []).length % 2) fail(label, 'a quoted field spans lines');
    const f = splitCsvLine(line, sep);
    if (f.length !== head.length) fail(label, `a row has ${f.length} of ${head.length} fields`);
    const period = f[t];
    const date = /^\d{4}-\d{2}$/.test(period) ? `${period}-01` : period;
    const close = strictNum(f[v], label);
    if (close != null) rows.push({ date, close });
  }
  return { rows: uniqueRows(rows, label) };
}

/**
 * BLS public API v1 (POST `/timeseries/data/`, at most ten years per call).
 *
 * @param {{seriesId?: string}} [opts] the requested series, checked against the reply
 */
export function parseBlsV1(body, label, { seriesId } = {}) {
  const j = JSON.parse(body);
  if (j?.status !== 'REQUEST_SUCCEEDED')
    fail(label, `status ${j?.status}: ${(j?.message ?? []).join(' ').slice(0, 120)}`);
  const series = j?.Results?.series?.[0];
  const data = series?.data;
  if (!Array.isArray(data)) fail(label, 'no Results.series[0].data');
  if (seriesId && series.seriesID !== seriesId)
    fail(label, `reply is for ${series.seriesID}, not ${seriesId}`);
  const rows = [];
  for (const d of data) {
    if (!/^M(0[1-9]|1[0-2])$/.test(d.period)) continue; // M13 is the annual average
    const close = strictNum(d.value, label);
    if (close != null) rows.push({ date: `${d.year}-${d.period.slice(1)}-01`, close });
  }
  return { rows: uniqueRows(rows, label) };
}

/** IBGE SIDRA API (`/values/t/<table>/.../p/<periods>`): the first element is the header row. */
export function parseSidra(body, label) {
  const j = JSON.parse(body);
  if (!Array.isArray(j) || j.length < 1) fail(label, 'not a SIDRA array');
  // the first element names the columns; without it the first month would be lost
  if (j[0]?.V !== 'Valor') fail(label, 'no SIDRA header row');
  const rows = [];
  for (const r of j.slice(1)) {
    const p = String(r.D3C ?? '');
    if (!/^\d{6}$/.test(p)) fail(label, `bad period ${p}`);
    const close = strictNum(r.V, label);
    if (close != null) rows.push({ date: `${p.slice(0, 4)}-${p.slice(4)}-01`, close });
  }
  return { rows: uniqueRows(rows, label) };
}

/**
 * Banco Central do Brasil SGS API (`bcdata.sgs.<code>/dados?formato=json`):
 * `[{data: "dd/mm/yyyy", valor: "0.16"}]`. A monthly series is dated on the
 * month's first day by the BCB itself.
 */
export function parseSgs(body, label, { fullMonthPeriods = false } = {}) {
  const j = JSON.parse(body);
  if (!Array.isArray(j)) fail(label, `not an SGS array: ${String(body).slice(0, 80)}`);
  const dmy = (v) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v));
    if (!m) fail(label, `bad date ${v}`);
    return iso(m[3], m[2], m[1]);
  };
  const rows = [];
  for (const r of j) {
    const date = dmy(r.data);
    // A period series (TR by start date, SGS 226) lists several periods that
    // begin on the same day after a short month (the periods that would start on
    // 29-31 February all start on 1 March). `fullMonthPeriods` keeps the period
    // that ends on the same day of the next month: the month's own TR.
    if (fullMonthPeriods) {
      if (r.dataFim == null) fail(label, 'a period series without dataFim');
      const end = new Date(`${date}T00:00:00Z`);
      end.setUTCMonth(end.getUTCMonth() + 1);
      if (dmy(r.dataFim) !== end.toISOString().slice(0, 10)) continue;
    }
    const close = strictNum(r.valor, label);
    if (close != null) rows.push({ date, close });
  }
  return { rows: uniqueRows(rows, label) };
}

/**
 * Eurostat dissemination API (JSON-stat 2.0) for ONE series: every dimension
 * but time must have a single category, so the flat value index is the time
 * index. More than one series in the response is refused, not guessed.
 */
export function parseEurostat(body, label) {
  const j = JSON.parse(body);
  const ids = j?.id;
  const size = j?.size;
  if (!Array.isArray(ids) || !Array.isArray(size)) fail(label, 'not JSON-stat (no id/size)');
  ids.forEach((d, i) => {
    if (d !== 'time' && size[i] !== 1) fail(label, `dimension ${d} has ${size[i]} categories`);
  });
  const index = j?.dimension?.time?.category?.index;
  if (!index) fail(label, 'no time dimension');
  const rows = [];
  // Eurostat flags a value it may still revise (`e` = estimated, `p` =
  // provisional); the flag is reported with the run, never dropped silently.
  const flagged = [];
  for (const [ym, k] of Object.entries(index)) {
    const close = strictNum(j.value?.[String(k)], label);
    if (close == null) continue;
    const date = monthDate(ym, label);
    rows.push({ date, close });
    const flag = j.status?.[String(k)];
    if (flag) flagged.push({ date, flag });
  }
  return { rows: uniqueRows(rows, label), flagged };
}

const BDE_MONTHS = {
  ENE: '01',
  FEB: '02',
  MAR: '03',
  ABR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AGO: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DIC: '12',
};

/**
 * Banco de España statistical tables (`be1907.csv`, `be2206.csv`): Latin-1,
 * one column per series, the series code in the row whose first cell is
 * "CÓDIGO DE LA SERIE", months written "SEP 2026", missing values "_".
 *
 * @param {{code: string}} opts the series code (column) to read
 */
export function parseBdeTable(body, label, { code }) {
  const lines = String(body)
    .trim()
    .split(/\r?\n/)
    .map((l) => splitCsvLine(l));
  // spelt exactly: a wrongly decoded Latin-1 "Ó" (U+FFFD) does not match
  const codes = lines.find((f) => f[0] === 'CÓDIGO DE LA SERIE');
  if (!codes) fail(label, 'no series-code row');
  const col = codes.indexOf(code);
  if (col < 0) fail(label, `series ${code} not in the table`);
  const rows = [];
  for (const f of lines) {
    const m = /^([A-Z]{3}) (\d{4})$/.exec(f[0] ?? '');
    if (!m) continue;
    const mm = BDE_MONTHS[m[1]];
    if (!mm) fail(label, `unknown month ${m[1]}`);
    const close = strictNum(f[col], label);
    if (close != null) rows.push({ date: `${m[2]}-${mm}-01`, close });
  }
  return { rows: uniqueRows(rows, label) };
}

/**
 * US Treasury daily par yield curve CSV (one calendar year per file): dates
 * "MM/DD/YYYY", one column per maturity.
 *
 * @param {{column: string}} opts the maturity column, e.g. "1 Yr"
 */
export function parseTreasuryCsv(body, label, { column }) {
  const lines = String(body).trim().split(/\r?\n/);
  const head = splitCsvLine(lines[0] ?? '');
  const col = head.indexOf(column);
  if (head[0] !== 'Date' || col < 0) fail(label, `no Date/${column} columns`);
  const rows = [];
  for (const line of lines.slice(1)) {
    const f = splitCsvLine(line);
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f[0] ?? '');
    if (!m) fail(label, `bad date ${f[0]}`);
    const close = strictNum(f[col], label);
    if (close != null) rows.push({ date: iso(m[3], m[1], m[2]), close });
  }
  return { rows: uniqueRows(rows, label) };
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
