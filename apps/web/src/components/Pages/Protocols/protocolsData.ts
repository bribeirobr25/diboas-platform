/**
 * Protocols Page - Static Data
 *
 * All 26 DeFi protocols organized by category
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
        name: 'Aave V3',
        description:
          'The largest lending system in decentralized finance. You deposit assets, earn interest from borrowers, and can withdraw anytime. Used by institutions and individuals across 18 blockchains.',
        founded: '2017 (V3: 2022)',
        tvl: '~$35 billion',
        blockchains: 'Ethereum, Arbitrum, Polygon, + 15 more',
        audits: '30+ independent audits',
        regulatory:
          'SEC closed its 4-year investigation without charges (December 2025). Source: SEC closure letter shared by Aave founder; reported by Yahoo Finance, CoinDesk, Unchained.',
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
        name: 'Compound V3',
        description:
          'One of the oldest lending systems in DeFi. You earn interest by providing assets that others borrow. Simple, battle-tested, and running since 2018.',
        founded: '2018 (V3: 2022)',
        tvl: '~$2 billion',
        blockchains: 'Ethereum, Arbitrum, Base, Polygon',
        audits: '4+ independent audits',
        regulatory: 'Fully decentralized. No specific licenses required.',
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
        name: 'Kamino',
        description:
          "Solana's all-in-one lending and liquidity platform. Combines lending, automated liquidity management, and leverage in a single system. You earn interest by lending assets to borrowers, similar to Aave and Compound.",
        founded: '2022',
        tvl: '~$2.5 billion',
        blockchains: 'Solana',
        audits: 'Multiple audits by OtterSec',
        regulatory: 'Decentralized protocol. No major incidents.',
        website: 'https://kamino.finance',
        twitter: 'https://x.com/KaminoFinance',
      },
      {
        id: 'morpho',
        name: 'Morpho',
        description:
          'Matches lenders directly with borrowers for better rates than traditional lending pools. Coinbase integrated Morpho on Base for bitcoin-backed USDC loans (January 2025), originating over $1.2 billion in loans by late 2025.',
        founded: '2022',
        tvl: '~$7 billion',
        blockchains: 'Ethereum, Base, Arbitrum',
        audits: '23+ independent audits',
        regulatory:
          'Integrated by Coinbase (Jan 2025) and Crypto.com (Oct 2025) for DeFi-backed lending. Source: Coinbase blog, morpho.org/stories/coinbase, DL News.',
        website: 'https://morpho.org',
        twitter: 'https://x.com/MorphoLabs',
      },
      {
        id: 'sparkProtocol',
        name: 'Spark Protocol',
        description:
          "Lending system built on Aave's proven code, connected to Sky/MakerDAO's deep liquidity. Benefits from the longest operating history in DeFi (since 2014).",
        founded: '2023',
        tvl: '~$4 billion',
        blockchains: 'Ethereum, Base, Arbitrum',
        audits: '7+ independent audits',
        regulatory: "Benefits from MakerDAO's 10+ year compliance track record",
        website: 'https://spark.fi',
        twitter: 'https://x.com/sparkdotfi',
      },
      {
        id: 'fluid',
        name: 'Fluid',
        description:
          'Next-generation lending that combines features from multiple established systems. Very low liquidation penalties for borrowers. You earn interest from borrowers, similar to other lending protocols.',
        founded: '2024',
        tvl: '~$2 billion',
        blockchains: 'Ethereum, Arbitrum, Base',
        audits: '3+ independent audits',
        regulatory: 'Built by the Instadapp team (6+ years building DeFi infrastructure)',
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
        name: 'Lido Finance',
        description:
          'Stake your ETH and receive a token (stETH) you can use elsewhere while still earning staking rewards. The largest staking service in crypto.',
        founded: '2020',
        tvl: '~$27 billion',
        blockchains: 'Ethereum, Polygon',
        audits: '20+ independent audits',
        regulatory:
          'SEC Division of Corporation Finance staff statement (August 5, 2025): liquid staking receipt tokens including stETH are not securities under the Securities Act of 1933 or Exchange Act of 1934. Part of SEC Chairman Atkins\' "Project Crypto" initiative. Source: SEC.gov staff statement; reported by CoinDesk, Decrypt, CCN.',
        website: 'https://lido.fi',
        twitter: 'https://x.com/LidoFinance',
      },
      {
        id: 'rocketPool',
        name: 'Rocket Pool',
        description:
          'Decentralized Ethereum staking. You can stake with as little as 0.01 ETH. No centralized operator controls the network.',
        founded: '2016 (mainnet 2021)',
        tvl: '~$2 billion',
        blockchains: 'Ethereum',
        audits: '5+ independent audits',
        regulatory:
          'SEC Division of Corporation Finance staff statement (August 5, 2025): liquid staking receipt tokens including rETH are not securities. Same guidance covering Lido stETH and Jito JitoSOL. Source: SEC.gov staff statement.',
        website: 'https://rocketpool.net',
        twitter: 'https://x.com/Rocket_Pool',
      },
      {
        id: 'jito',
        name: 'Jito',
        description:
          'Solana liquid staking that earns both standard staking rewards and additional MEV (trading arbitrage) rewards. Used in diBoaS growth strategies.',
        founded: '2022',
        tvl: '~$2.8 billion',
        blockchains: 'Solana',
        audits: 'Multiple audits by Certora, OtterSec',
        regulatory:
          'SEC Division of Corporation Finance staff statement (August 2025): liquid staking receipt tokens including JitoSOL are not securities. Source: SEC.gov staff statement; reported by CoinDesk, CCN, Blockchain Magazine.',
        usedInStrategies: ['fullThrottle'],
        website: 'https://jito.network',
        twitter: 'https://x.com/jikitonetwork',
        defiLlamaUrl: 'https://defillama.com/protocol/jito',
      },
      {
        id: 'marinade',
        name: 'Marinade Finance',
        description:
          'Solana staking spread across 100+ validators for better decentralization and rewards. One of the few DeFi protocols with institutional-grade compliance certification.',
        founded: '2021',
        tvl: '~$550 million',
        blockchains: 'Solana',
        audits: '5+ independent audits',
        regulatory: 'SOC 2 Type I and II certified. Institutional-grade compliance.',
        badge: 'success',
        website: 'https://marinade.finance',
        twitter: 'https://x.com/MarinadeFinance',
      },
      {
        id: 'sanctum',
        name: 'Sanctum',
        description:
          'Unified liquidity layer for all Solana staking tokens. Lets you swap instantly between different staked assets without waiting for unstaking periods.',
        founded: '2021',
        tvl: '~$1.7 billion',
        blockchains: 'Solana',
        audits: 'Audited by Accretion',
        regulatory: 'Singapore-based. Powers staking for Binance and Bybit.',
        usedInStrategies: [
          'stableGrowth',
          'steadyProgress',
          'balancedBuilder',
          'wealthAccelerator',
          'fullThrottle',
        ],
        website: 'https://sanctum.so',
        twitter: 'https://x.com/sanctumso',
        defiLlamaUrl: 'https://defillama.com/protocol/sanctum',
      },
      {
        id: 'eigenLayer',
        name: 'EigenLayer',
        description:
          'Restaking: use your already-staked ETH to support other services built on Ethereum and earn extra rewards on top of your base staking yield. You earn staking rewards plus bonus rewards from the services you help secure.',
        founded: '2023',
        tvl: '~$12 billion',
        blockchains: 'Ethereum',
        audits: 'Multiple independent audits',
        regulatory: '$2M bug bounty program on Immunefi',
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
        name: 'Sky Protocol (formerly MakerDAO)',
        description:
          'The original DeFi system. Running since 2014. Deposit crypto as collateral, generate stablecoins, earn the savings rate. Survived every major market crash since 2017.',
        founded: '2014',
        tvl: '~$6 billion',
        blockchains: 'Ethereum (diBoaS strategies use the Arbitrum deployment)',
        audits: '10+ independent audits',
        regulatory: '10+ years of continuous operation through multiple market cycles',
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
        name: 'Ethena',
        description:
          'Creates a synthetic dollar (USDe) through hedged positions. Offers higher yields than traditional stablecoins, but with a more complex mechanism and higher risk profile.',
        founded: '2023',
        tvl: '~$6.5 billion',
        blockchains: 'Ethereum + 23 chains',
        audits: '7+ independent audits',
        regulatory:
          'BaFin (Germany) rejected MiCA authorization application in March 2025, citing "significant deficiencies" in organizational structure and reserve compliance. BaFin ordered halt to USDe minting/redemption and froze reserve assets. Ethena GmbH agreed to wind down German operations (April 2025). All activity now operates via Ethena (BVI) Limited, a British Virgin Islands entity. BaFin also raised concerns that sUSDe may constitute an unregistered security under German law. Sources: BaFin official notice (March 21, 2025); Decrypt, The Block, CoinTelegraph, Ledger Insights.',
        badge: 'warning',
        website: 'https://ethena.fi',
        twitter: 'https://x.com/ethena_labs',
      },
      {
        id: 'ondo',
        name: 'Ondo Finance',
        description:
          'Brings traditional financial assets on-chain. US Treasuries, bonds, and stocks as digital tokens. Acquired SEC-registered broker-dealer and transfer agent licenses through its purchase of Oasis Pro (completed October 2025).',
        founded: '2021',
        tvl: '~$1.7 billion',
        blockchains: 'Ethereum, Solana, Arbitrum',
        audits: '4+ independent audits',
        regulatory:
          'SEC-registered broker-dealer, Alternative Trading System (ATS), and Transfer Agent licenses acquired via Oasis Pro (FINRA member since 2020). Acquisition completed October 2025. $1.6B+ in tokenized assets under management. Sources: Ondo Finance blog, Blockworks, CoinDesk, FINRA BrokerCheck (Oasis Pro Markets LLC).',
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
        name: 'Pendle Finance',
        description:
          'Separates yield from principal so you can trade, lock in, or speculate on future returns. Lets you secure a fixed rate or bet that rates will go higher.',
        founded: '2021',
        tvl: '~$4.5 billion',
        blockchains: 'Ethereum, Arbitrum, BNB Chain',
        audits: '6+ independent audits',
        regulatory: '$250K bug bounty. Safe Harbor Agreement in place.',
        website: 'https://pendle.finance',
        twitter: 'https://x.com/pendle_fi',
      },
      {
        id: 'yearn',
        name: 'Yearn Finance',
        description:
          'Automated yield farming. Moves your money between systems to chase the best available returns. A pioneer that has been running since 2020.',
        founded: '2020',
        tvl: '~$500 million',
        blockchains: 'Ethereum, Arbitrum, Fantom',
        audits: '6+ independent audits',
        regulatory: 'Pioneer of yield aggregation. 5+ years of continuous operation.',
        website: 'https://yearn.fi',
        twitter: 'https://x.com/yearnfinance',
      },
      {
        id: 'curve',
        name: 'Curve Finance',
        description:
          'Specialized exchange for stablecoins and similar assets. Designed for minimal price impact when swapping between assets of similar value.',
        founded: '2020',
        tvl: '~$2.2 billion',
        blockchains: 'Ethereum + 20 chains',
        audits: '15+ independent audits',
        regulatory:
          "July 2023: $70M exploit. 73% of funds recovered. Root cause was a compiler bug (Vyper), not Curve's own code.",
        badge: 'warning',
        website: 'https://curve.finance',
        twitter: 'https://x.com/CurveFinance',
      },
      {
        id: 'convex',
        name: 'Convex Finance',
        description:
          'Boosts your Curve rewards without requiring you to lock tokens for years. Simplifies Curve participation.',
        founded: '2021',
        tvl: '~$1.5 billion',
        blockchains: 'Ethereum, Arbitrum',
        audits: '7 independent audits',
        regulatory:
          'No exploits in 4 years. A critical vulnerability was found and patched in 2022 before any funds were lost.',
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
        name: 'GMX V2',
        description:
          'Decentralized perpetual exchange. You provide liquidity to a shared pool. Traders pay fees to the pool. You earn a share of every trade.',
        founded: '2021',
        tvl: '~$400 million',
        blockchains: 'Arbitrum, Avalanche, Solana',
        audits: '10+ independent audits',
        regulatory: '$5M bug bounty on Immunefi (one of the largest in DeFi)',
        website: 'https://gmx.io',
        twitter: 'https://x.com/GMX_IO',
      },
      {
        id: 'jupiterJlp',
        name: 'Jupiter JLP',
        description:
          "Solana's leading perpetual exchange. Provide liquidity, earn 70% of all trading fees. Used in several diBoaS growth strategies.",
        founded: '2021 (perpetuals: 2023)',
        tvl: '~$1.6 billion',
        blockchains: 'Solana',
        audits: '6+ independent audits',
        regulatory:
          'Over $137M paid to liquidity providers from January to October 2024, based on Dune Analytics fee data (75% of $183M total fees). Source: SolanaFloor / Dune Analytics (October 2024). Figure is likely significantly higher at time of publication.',
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
        name: 'Raydium',
        description:
          "Solana's main decentralized exchange. Automated market making, concentrated liquidity, and token launches.",
        founded: '2021',
        tvl: '~$2 billion',
        blockchains: 'Solana',
        audits: '4+ independent audits',
        regulatory:
          'November 2022: $4.4M exploit caused by compromised admin key. All affected users were reimbursed.',
        badge: 'warning',
        website: 'https://raydium.io',
        twitter: 'https://x.com/RaydiumProtocol',
      },
      {
        id: 'orca',
        name: 'Orca',
        description:
          'User-friendly Solana exchange known for clean design, efficient swaps, and one of the strongest security records in the ecosystem. You can provide liquidity and earn fees from trades on the platform.',
        founded: '2021',
        tvl: '~$400 million',
        blockchains: 'Solana',
        audits: '6+ independent audits',
        regulatory: 'No exploits in 4+ years. Praised for code quality by independent reviewers.',
        website: 'https://orca.so',
        twitter: 'https://x.com/orca_so',
      },
      {
        id: 'balancer',
        name: 'Balancer',
        description:
          'Programmable liquidity pools that can hold multiple tokens in custom ratios. More flexible than standard exchange pools. You provide tokens to the pool and earn a share of trading fees.',
        founded: '2020',
        tvl: '~$258 million (post-exploit; was ~$775M pre-November 2025)',
        blockchains: 'Ethereum, Arbitrum, Polygon',
        audits: '11+ independent audits',
        regulatory:
          'November 3, 2025: $128M exploit affecting V2 pools across Ethereum, Polygon, Base, Arbitrum, and other chains. Rounding error vulnerability in ComposableStablePool contracts. Approximately $28M recovered through whitehat operations and protocol interventions. Majority of funds (~$100M) remain unrecovered as of February 2026. Balancer DAO approved 10% recovery bounty (BIP-908, February 2026). V3 (current version) was NOT affected by this exploit. diBoaS strategies use V3 only. Sources: Check Point Research, CoinJournal, The Defiant, DL News, Halborn.',
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
        name: 'Huma Finance',
        description:
          'Instant cross-border payments and trade financing using crypto infrastructure. Partners with Circle and the Stellar Development Foundation. Returns come from fees charged on cross-border payment processing.',
        founded: '2022',
        tvl: '~$100 million',
        blockchains: 'Solana, Stellar, Polygon',
        audits: '6+ independent audits',
        regulatory: 'Strategic partnerships with Circle and Stellar Development Foundation',
        website: 'https://huma.finance',
        twitter: 'https://x.com/humafinance',
      },
    ],
  },
];
