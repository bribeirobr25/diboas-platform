/**
 * Protocols Page - Static Data
 *
 * All 25 DeFi protocols organized by category (ids, badges, strategy use and links).
 * Every displayed TEXT (name, description, founded, chains, audits, regulatory) lives in the
 * `protocols` catalogue (`cards.<id>.*`, ×4 locales); the English copies that sat here were
 * never rendered and were deleted (register 5.755).
 * Data is static and extracted for maintainability
 *
 * Slug naming: matches i18n keys in protocols.json cards.{slug}
 * Badge: 'warning' (amber) for exploit/regulatory risk, 'success' (green) for exceptional compliance
 * usedInStrategies: i18n key suffixes — resolved to localized names in the component
 */

import type { ProtocolCategory } from './types';

/**
 * All protocols organized by category
 */
export const PROTOCOL_DATA: ProtocolCategory[] = [
  {
    id: 'lending',
    protocols: [
      {
        id: 'aaveV3',
        usedInStrategies: [
          'safeHarbor',
          'goalKeeper',
          'patientBuilder',
          'steadyCompounder',
          'yieldMaximizer',
        ],
        website: 'https://aave.com',
        twitter: 'https://x.com/AaveAave',
        defiLlamaUrl: 'https://defillama.com/protocol/aave-v3',
      },
      {
        id: 'compoundV3',
        usedInStrategies: [
          'safeHarbor',
          'goalKeeper',
          'patientBuilder',
          'steadyCompounder',
          'yieldMaximizer',
        ],
        website: 'https://compound.finance',
        twitter: 'https://x.com/compoundfinance',
        defiLlamaUrl: 'https://defillama.com/protocol/compound-v3',
      },
      {
        id: 'kamino',
        website: 'https://kamino.finance',
        twitter: 'https://x.com/KaminoFinance',
      },
      {
        id: 'morpho',
        website: 'https://morpho.org',
        twitter: 'https://x.com/MorphoLabs',
      },
      {
        id: 'sparkProtocol',
        website: 'https://spark.fi',
        twitter: 'https://x.com/sparkdotfi',
      },
      {
        id: 'fluid',
        hasExceptionNote: true,
        website: 'https://fluid.io',
        twitter: 'https://x.com/0xFluid',
      },
    ],
  },
  {
    id: 'staking',
    protocols: [
      {
        id: 'lido',
        website: 'https://lido.fi',
        twitter: 'https://x.com/LidoFinance',
      },
      {
        id: 'rocketPool',
        website: 'https://rocketpool.net',
        twitter: 'https://x.com/Rocket_Pool',
      },
      {
        id: 'jito',
        usedInStrategies: ['fullThrottle'],
        website: 'https://jito.network',
        twitter: 'https://x.com/jikitonetwork',
        defiLlamaUrl: 'https://defillama.com/protocol/jito',
      },
      {
        id: 'marinade',
        badge: 'success',
        website: 'https://marinade.finance',
        twitter: 'https://x.com/MarinadeFinance',
      },
      {
        id: 'sanctum',
        usedInStrategies: [
          'stableGrowth',
          'steadyProgress',
          'balancedBuilder',
          'wealthAccelerator',
          'fullThrottle',
        ],
        website: 'https://sanctum.so',
        twitter: 'https://x.com/sanctumso',
        defiLlamaUrl: 'https://defillama.com/protocol/sanctum-infinity',
      },
      {
        id: 'eigenLayer',
        website: 'https://eigenlayer.xyz',
        twitter: 'https://x.com/eigenlayer',
      },
    ],
  },
  {
    id: 'stablecoins',
    protocols: [
      {
        id: 'sky',
        usedInStrategies: [
          'safeHarbor',
          'stableGrowth',
          'goalKeeper',
          'steadyProgress',
          'patientBuilder',
          'balancedBuilder',
          'steadyCompounder',
          'wealthAccelerator',
          'yieldMaximizer',
          'fullThrottle',
        ],
        website: 'https://sky.money',
        twitter: 'https://x.com/SkyEcosystem',
        defiLlamaUrl: 'https://defillama.com/protocol/sky',
      },
      {
        id: 'ethena',
        badge: 'warning',
        website: 'https://ethena.fi',
        twitter: 'https://x.com/ethena_labs',
      },
      {
        id: 'ondo',
        badge: 'success',
        website: 'https://ondo.finance',
        twitter: 'https://x.com/ondofinance',
      },
    ],
  },
  {
    id: 'yield',
    protocols: [
      {
        id: 'pendle',
        website: 'https://pendle.finance',
        twitter: 'https://x.com/pendle_fi',
      },
      {
        id: 'yearn',
        website: 'https://yearn.fi',
        twitter: 'https://x.com/yearnfinance',
      },
      {
        id: 'curve',
        badge: 'warning',
        website: 'https://curve.finance',
        twitter: 'https://x.com/CurveFinance',
      },
      {
        id: 'convex',
        website: 'https://convexfinance.com',
        twitter: 'https://x.com/ConvexFinance',
      },
    ],
  },
  {
    id: 'perpetuals',
    protocols: [
      {
        id: 'gmxV2',
        website: 'https://gmx.io',
        twitter: 'https://x.com/GMX_IO',
      },
      {
        id: 'jupiterJlp',
        usedInStrategies: ['balancedBuilder', 'wealthAccelerator', 'fullThrottle'],
        website: 'https://jup.ag',
        twitter: 'https://x.com/JupiterExchange',
        defiLlamaUrl: 'https://defillama.com/protocol/jupiter-perpetual-exchange',
      },
    ],
  },
  {
    id: 'dex',
    protocols: [
      {
        id: 'raydium',
        badge: 'warning',
        website: 'https://raydium.io',
        twitter: 'https://x.com/RaydiumProtocol',
      },
      {
        id: 'orca',
        website: 'https://orca.so',
        twitter: 'https://x.com/orca_so',
      },
      {
        id: 'balancer',
        badge: 'warning',
        website: 'https://balancer.fi',
        twitter: 'https://x.com/Balancer',
      },
    ],
  },
  {
    id: 'payments',
    protocols: [
      {
        id: 'huma',
        website: 'https://huma.finance',
        twitter: 'https://x.com/humafinance',
      },
    ],
  },
];
