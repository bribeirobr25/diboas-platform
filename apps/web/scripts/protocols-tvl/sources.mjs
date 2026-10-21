/**
 * Where each /protocols TVL figure comes from (2026-10-21, founder decision on
 * TVL_FRESHNESS_PROPOSAL_2026-10-18: a real refresh, every figure dated and
 * sourced on the page, refreshed quarterly).
 *
 * The rule for a card: the DeFiLlama figure for WHAT THE CARD NAMES. A card
 * that names a protocol takes that protocol's total across its deployments
 * (DeFiLlama's parent entry); a card that names or describes one product takes
 * that product's entry. Each choice is written here so a reviewer can check it
 * against the card's text.
 *
 * `page` is the DeFiLlama page slug the card's "Verify on DeFiLlama" link must
 * point at (checked by a test), so the link shows the same figure.
 */

/** @typedef {{ parent: string } | { entries: string[] }} TvlSelector */
/** @typedef {TvlSelector & { page: string }} CardSource */

/** @type {Record<string, CardSource>} */
export const CARD_SOURCES = {
  aaveV3: { entries: ['aave-v3'], page: 'aave-v3' },
  compoundV3: { entries: ['compound-v3'], page: 'compound-v3' },
  kamino: { parent: 'parent#kamino-finance', page: 'kamino' },
  morpho: { parent: 'parent#morpho', page: 'morpho' },
  // The card describes the lending system ("built on Aave's code"), not the
  // Liquidity Layer, which deposits Sky's money into other listed protocols.
  sparkProtocol: { entries: ['sparklend'], page: 'sparklend' },
  fluid: { parent: 'parent#fluid', page: 'fluid' },
  lido: { entries: ['lido'], page: 'lido' },
  rocketPool: { entries: ['rocket-pool'], page: 'rocket-pool' },
  jito: { parent: 'parent#jito', page: 'jito' },
  marinade: { parent: 'parent#marinade-finance', page: 'marinade' },
  // The card names INF ("Sanctum (INF)", the multi-LST liquidity pool).
  sanctum: { entries: ['sanctum-infinity'], page: 'sanctum-infinity' },
  // EigenLayer's DeFiLlama entry is listed under its new name, EigenCloud.
  eigenLayer: { entries: ['eigencloud'], page: 'eigencloud' },
  sky: { parent: 'parent#maker', page: 'sky' },
  ethena: { parent: 'parent#ethena', page: 'ethena' },
  ondo: { parent: 'parent#ondo-finance', page: 'ondo-finance' },
  pendle: { parent: 'parent#pendle', page: 'pendle' },
  yearn: { parent: 'parent#yearn', page: 'yearn' },
  curve: { parent: 'parent#curve-finance', page: 'curve-finance' },
  convex: { entries: ['convex-finance'], page: 'convex-finance' },
  // GMX V2 on the card's three chains (Arbitrum, Avalanche, Solana); V1 excluded.
  gmxV2: { entries: ['gmx-evm', 'gmx-solana'], page: 'gmx' },
  // The card names the JLP pool, i.e. the perpetual exchange's liquidity.
  jupiterJlp: { entries: ['jupiter-perpetual-exchange'], page: 'jupiter-perpetual-exchange' },
  raydium: { parent: 'parent#raydium', page: 'raydium' },
  orca: { parent: 'parent#orca', page: 'orca' },
  balancer: { parent: 'parent#balancer', page: 'balancer' },
  huma: { entries: ['huma'], page: 'huma' },
};

/**
 * The headline ("over $25 billion"): the totals across all deployments of the
 * six protocols diBoaS strategies use. The page states the floor, never the
 * measured sum, and the refresh refuses to write data below the floor: a lower
 * total needs new wording (a founder copy decision), not a silent change.
 */
export const COMBINED_PARENTS = [
  'parent#aave',
  'parent#maker',
  'parent#jupiter',
  'parent#sanctum',
  'parent#compound-finance',
  'parent#jito',
];
export const COMBINED_FLOOR_USD = 25_000_000_000;

/** The figures are refreshed quarterly; past this age they are stale. */
export const TVL_MAX_AGE_DAYS = 92;

export const DEFILLAMA_PROTOCOLS_URL = 'https://api.llama.fi/protocols';
