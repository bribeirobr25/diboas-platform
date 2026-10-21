/**
 * Pure helpers for the /protocols TVL refresh (2026-10-21): measure the figures
 * from a DeFiLlama `/protocols` response, and render the page's copy in the
 * four locales from the committed data. No network and no clock here, so the
 * copy can be re-rendered from the data and compared (`refresh.mjs --check`).
 */

import {
  CARD_SOURCES,
  COMBINED_FLOOR_USD,
  COMBINED_PARENTS,
  DEFILLAMA_PROTOCOLS_URL,
} from './sources.mjs';

export const LOCALES = /** @type {const} */ (['en', 'pt-BR', 'es', 'de']);
/** @typedef {(typeof LOCALES)[number]} Locale */

/**
 * @typedef {{ slug: string, tvl: number | null, parentProtocol?: string }} LlamaEntry
 * @typedef {{
 *   pulled_at: string,
 *   source: string,
 *   combined: { usd: number, floor_usd: number, parents: string[] },
 *   cards: Record<string, { usd: number | null, page: string }>,
 * }} TvlData
 */

/**
 * The USD total of the entries a selector names. Throws when the selector no
 * longer matches anything (a renamed or removed DeFiLlama entry is a config
 * change to review, never a silent zero). An entry that exists but reports no
 * TVL contributes 0.
 * @param {LlamaEntry[]} list
 * @param {{ parent: string } | { entries: string[] }} selector
 */
function totalFor(list, selector) {
  const matched =
    'parent' in selector
      ? list.filter((e) => e.parentProtocol === selector.parent)
      : selector.entries.map((slug) => {
          const e = list.find((x) => x.slug === slug);
          if (!e) throw new Error(`DeFiLlama has no entry "${slug}"; update sources.mjs`);
          return e;
        });
  if (matched.length === 0) {
    throw new Error(
      `DeFiLlama has no entries under ${JSON.stringify(selector)}; update sources.mjs`
    );
  }
  return matched.reduce((sum, e) => sum + (Number.isFinite(e.tvl) && e.tvl > 0 ? e.tvl : 0), 0);
}

/**
 * The data file's content from one DeFiLlama response. A card whose entries
 * report no TVL gets `usd: null` ("not reported"), never an old number.
 * @param {LlamaEntry[]} list
 * @param {string} pulledAt ISO instant of the pull
 * @returns {TvlData}
 */
export function measureTvl(list, pulledAt) {
  const cards = Object.fromEntries(
    Object.entries(CARD_SOURCES).map(([id, src]) => {
      const usd = totalFor(list, src);
      return [id, { usd: usd > 0 ? Math.round(usd) : null, page: src.page }];
    })
  );
  const combinedUsd = COMBINED_PARENTS.reduce((s, parent) => s + totalFor(list, { parent }), 0);
  return {
    pulled_at: pulledAt,
    source: DEFILLAMA_PROTOCOLS_URL,
    combined: {
      usd: Math.round(combinedUsd),
      floor_usd: COMBINED_FLOOR_USD,
      parents: [...COMBINED_PARENTS],
    },
    cards,
  };
}

const MONTHS = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  'pt-BR': [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
  es: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  de: [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ],
};

/**
 * "October 2026" in the locale's words (a fixed table, so the rendered copy is
 * the same on every machine), from the UTC month of the pull.
 * @param {Locale} locale
 * @param {string} iso
 */
export function monthLabel(locale, iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`unparseable pull date ${iso}`);
  const month = MONTHS[locale][d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return locale === 'en' || locale === 'de' ? `${month} ${year}` : `${month} de ${year}`;
}

/** @param {number} v @param {string} decimalSep */
const dec = (v, decimalSep) => String(v).replace('.', decimalSep);
/** Integer with the "." thousands separator (es). @param {number} v */
const thousands = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * A USD amount in the page's existing style per locale: "~$17 billion",
 * "~17 Milliarden USD", "~US$17 bilhões", "~17.000 millones USD".
 * Billions: whole above 10, one decimal below; millions: two significant
 * figures. `approx` adds the "~".
 * @param {Locale} locale
 * @param {number} usd
 * @param {boolean} [approx]
 */
export function formatUsd(locale, usd, approx = true) {
  if (!Number.isFinite(usd) || usd <= 0) throw new Error(`cannot format ${usd}`);
  const tilde = approx ? '~' : '';
  let millions = Number((usd / 1e6).toPrecision(2));
  if (usd >= 1e9 || millions >= 1000) {
    let b = usd / 1e9;
    b = b >= 9.95 ? Math.round(b) : Math.round(b * 10) / 10;
    if (locale === 'en') return `${tilde}$${b} billion`;
    if (locale === 'de')
      return `${tilde}${dec(b, ',')} ${b === 1 ? 'Milliarde' : 'Milliarden'} USD`;
    if (locale === 'pt-BR') return `${tilde}US$${dec(b, ',')} ${b < 2 ? 'bilhão' : 'bilhões'}`;
    return `${tilde}${thousands(Math.round(b * 1000))} millones USD`;
  }
  if (locale === 'en') return `${tilde}$${millions} million`;
  if (locale === 'de')
    return `${tilde}${dec(millions, ',')} ${millions === 1 ? 'Million' : 'Millionen'} USD`;
  if (locale === 'pt-BR')
    return `${tilde}US$${dec(millions, ',')} ${millions < 2 ? 'milhão' : 'milhões'}`;
  return `${tilde}${dec(millions, ',')} ${millions === 1 ? 'millón' : 'millones'} USD`;
}

/** The page's words around the figures (founder-approved approach 2026-10-21). */
export const TVL_COPY = {
  en: {
    source:
      'Combined TVL of six of these protocols (Aave, Sky, Jupiter, Sanctum, Compound and Jito) across all their deployments, from DeFiLlama as of {month}. Values fluctuate daily.',
    freshness:
      'All TVL figures are approximate, from DeFiLlama as of {month}, for the protocol or product each card names. Values fluctuate daily.',
    notReported: 'Not currently reported by DeFiLlama',
  },
  'pt-BR': {
    source:
      'TVL combinado de seis destes protocolos (Aave, Sky, Jupiter, Sanctum, Compound e Jito) em todas as redes onde operam, segundo o DeFiLlama, em {month}. Os valores variam diariamente.',
    freshness:
      'Todos os valores de TVL são aproximados, vindos do DeFiLlama, em {month}, para o protocolo ou produto que cada cartão indica. Os valores variam diariamente.',
    notReported: 'Não informado pelo DeFiLlama no momento',
  },
  es: {
    source:
      'TVL combinado de seis de estos protocolos (Aave, Sky, Jupiter, Sanctum, Compound y Jito) a través de todos sus despliegues, según DeFiLlama, a {month}. Los valores fluctúan diariamente.',
    freshness:
      'Todas las cifras de TVL son aproximadas, provienen de DeFiLlama, a {month}, para el protocolo o producto que nombra cada tarjeta. Los valores fluctúan diariamente.',
    notReported: 'DeFiLlama no lo informa actualmente',
  },
  de: {
    source:
      'Gesamt-TVL von sechs dieser Protokolle (Aave, Sky, Jupiter, Sanctum, Compound und Jito) über alle ihre Deployments, laut DeFiLlama, Stand {month}. Die Werte schwanken täglich.',
    freshness:
      'Alle TVL-Zahlen sind Näherungswerte von DeFiLlama, Stand {month}, jeweils für das Protokoll oder Produkt, das die Karte nennt. Die Werte schwanken täglich.',
    notReported: 'Derzeit nicht von DeFiLlama ausgewiesen',
  },
};

/**
 * The card's figure, keeping any note that follows it in parentheses (e.g.
 * Balancer's exploit note). A card with no reported TVL shows the
 * "not reported" line on its own.
 * @param {Locale} locale
 * @param {number | null} usd
 * @param {string} current the string committed today
 */
function cardFigure(locale, usd, current) {
  if (usd === null) return TVL_COPY[locale].notReported;
  const note = current.startsWith('~') ? (current.match(/ \(.*\)$/)?.[0] ?? '') : '';
  return `${formatUsd(locale, usd)}${note}`;
}

/**
 * A locale's `protocols.json` with every TVL string rendered from the data.
 * Only the TVL strings change; everything else is returned as it was.
 * @param {any} json the locale's parsed protocols.json
 * @param {TvlData} data
 * @param {Locale} locale
 */
export function renderLocale(json, data, locale) {
  const out = structuredClone(json);
  const month = monthLabel(locale, data.pulled_at);
  out.tvl.number = formatUsd(locale, data.combined.floor_usd, false);
  out.tvl.source = TVL_COPY[locale].source.replace('{month}', month);
  out.grid.tvlFreshness = TVL_COPY[locale].freshness.replace('{month}', month);
  for (const [id, card] of Object.entries(data.cards)) {
    if (!out.cards[id]) throw new Error(`${locale}: protocols.json has no card "${id}"`);
    out.cards[id].details.tvl = cardFigure(locale, card.usd, out.cards[id].details.tvl);
  }
  return out;
}
