'use client';

import { useTranslation } from '@diboas/i18n/client';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

/**
 * Protocol data structure
 */
interface Protocol {
  id: string;
  name: string;
  description: string;
  founded: string;
  tvl: string;
  blockchains: string;
  audits: string;
  regulatory: string;
  hasWarning?: boolean;
  hasSuccess?: boolean;
  website: string;
  twitter: string;
}

/**
 * Protocol category structure
 */
interface ProtocolCategory {
  id: string;
  protocols: Protocol[];
}

/**
 * All protocols organized by category
 */
const PROTOCOL_DATA: ProtocolCategory[] = [
  {
    id: 'lending',
    protocols: [
      {
        id: 'aave',
        name: 'Aave V3',
        description: 'The largest lending protocol in DeFi. You deposit assets, earn interest from borrowers, and can withdraw anytime.',
        founded: '2017 (V3: 2022)',
        tvl: '~$35 billion',
        blockchains: 'Ethereum, Arbitrum, Polygon, + 15 more',
        audits: '30+ audits',
        regulatory: 'SEC closed investigation without charges (Dec 2025)',
        website: 'https://aave.com',
        twitter: 'https://x.com/AaveAave',
      },
      {
        id: 'compound',
        name: 'Compound V3',
        description: 'Algorithmic money market where you earn interest by lending your crypto to borrowers.',
        founded: '2018 (V3: 2022)',
        tvl: '~$2 billion',
        blockchains: 'Ethereum, Arbitrum, Base, Polygon',
        audits: '4+ audits',
        regulatory: 'Decentralized protocol, no specific licenses required',
        website: 'https://compound.finance',
        twitter: 'https://x.com/compoundfinance',
      },
      {
        id: 'kamino',
        name: 'Kamino',
        description: "Solana's all-in-one DeFi platform combining lending, automated liquidity, and leverage.",
        founded: '2022',
        tvl: '~$2.5 billion',
        blockchains: 'Solana',
        audits: 'Multiple audits by OtterSec',
        regulatory: 'Decentralized protocol',
        website: 'https://kamino.finance',
        twitter: 'https://x.com/KaminoFinance',
      },
      {
        id: 'morpho',
        name: 'Morpho',
        description: 'Optimized lending that matches lenders directly with borrowers for better rates than traditional pools.',
        founded: '2022',
        tvl: '~$7 billion',
        blockchains: 'Ethereum, Base, Arbitrum',
        audits: '23+ audits',
        regulatory: 'First protocol used by Coinbase for bitcoin-backed loans',
        website: 'https://morpho.org',
        twitter: 'https://x.com/MorphoLabs',
      },
      {
        id: 'spark',
        name: 'Spark Protocol',
        description: "Lending protocol built on Aave's code, connected to Sky/MakerDAO's deep liquidity reserves.",
        founded: '2023',
        tvl: '~$4 billion',
        blockchains: 'Ethereum, Base, Arbitrum',
        audits: '7+ audits',
        regulatory: "Benefits from MakerDAO's 10+ year compliance history",
        website: 'https://spark.fi',
        twitter: 'https://x.com/sparkdotfi',
      },
      {
        id: 'fluid',
        name: 'Fluid',
        description: 'Next-generation lending combining features from Aave, Compound, and Uniswap with very low liquidation penalties.',
        founded: '2024',
        tvl: '~$2 billion',
        blockchains: 'Ethereum, Arbitrum, Base',
        audits: '3+ audits',
        regulatory: 'Built by Instadapp team (6+ years in DeFi)',
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
        description: 'Stake your ETH and receive stETH tokens you can use elsewhere while still earning staking rewards.',
        founded: '2020',
        tvl: '~$27 billion',
        blockchains: 'Ethereum, Polygon',
        audits: '20+ audits',
        regulatory: 'SEC clarified liquid staking is not a security (2025)',
        website: 'https://lido.fi',
        twitter: 'https://x.com/LidoFinance',
      },
      {
        id: 'rocketpool',
        name: 'Rocket Pool',
        description: 'Decentralized Ethereum staking that lets you stake with as little as 0.01 ETH.',
        founded: '2016 (mainnet 2021)',
        tvl: '~$2 billion',
        blockchains: 'Ethereum',
        audits: '5+ audits',
        regulatory: 'SEC confirmed rETH is not a security (Aug 2025)',
        website: 'https://rocketpool.net',
        twitter: 'https://x.com/Rocket_Pool',
      },
      {
        id: 'jito',
        name: 'Jito',
        description: 'Solana liquid staking that earns both staking rewards and MEV (trading) rewards.',
        founded: '2022',
        tvl: '~$2.8 billion',
        blockchains: 'Solana',
        audits: 'Multiple audits by Certora, OtterSec',
        regulatory: 'JitoSOL deemed non-security by SEC (March 2025)',
        website: 'https://jito.network',
        twitter: 'https://x.com/jikitonetwork',
      },
      {
        id: 'marinade',
        name: 'Marinade Finance',
        description: 'Non-custodial Solana staking across 100+ validators for better decentralization and rewards.',
        founded: '2021',
        tvl: '~$550 million',
        blockchains: 'Solana',
        audits: '5+ audits',
        regulatory: 'SOC 2 Type I & II certified — institutional-grade compliance',
        hasSuccess: true,
        website: 'https://marinade.finance',
        twitter: 'https://x.com/MarinadeFinance',
      },
      {
        id: 'sanctum',
        name: 'Sanctum',
        description: 'Unified liquidity layer for all Solana staking tokens, enabling instant swaps between different staked assets.',
        founded: '2021',
        tvl: '~$1.7 billion',
        blockchains: 'Solana',
        audits: 'Audited by Accretion',
        regulatory: 'Singapore-based, powering Binance and Bybit staking',
        website: 'https://sanctum.so',
        twitter: 'https://x.com/sanctumso',
      },
      {
        id: 'eigenlayer',
        name: 'EigenLayer',
        description: 'Restaking protocol that lets you use your staked ETH to secure additional applications and earn extra rewards.',
        founded: '2023',
        tvl: '~$12 billion',
        blockchains: 'Ethereum',
        audits: 'Multiple audits',
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
        description: 'The original DeFi protocol. Deposit crypto as collateral, mint USDS/DAI stablecoins, earn savings rate.',
        founded: '2014',
        tvl: '~$6 billion',
        blockchains: 'Ethereum',
        audits: '10+ audits',
        regulatory: '10+ years operating, survived every market crash since 2017',
        website: 'https://sky.money',
        twitter: 'https://x.com/SkyEcosystem',
      },
      {
        id: 'ethena',
        name: 'Ethena',
        description: 'Creates USDe synthetic dollar through hedged positions, offering higher yields than traditional stablecoins.',
        founded: '2023',
        tvl: '~$6.5 billion',
        blockchains: 'Ethereum + 23 chains',
        audits: '7+ audits',
        regulatory: 'Exited German market after BaFin review; operates via BVI',
        hasWarning: true,
        website: 'https://ethena.fi',
        twitter: 'https://x.com/ethena_labs',
      },
      {
        id: 'ondo',
        name: 'Ondo Finance',
        description: 'Brings real-world assets on-chain — US Treasuries, bonds, and stocks as crypto tokens.',
        founded: '2021',
        tvl: '~$1.7 billion',
        blockchains: 'Ethereum, Solana, Arbitrum',
        audits: '4+ audits',
        regulatory: 'SEC-registered broker-dealer license via Oasis Pro acquisition',
        hasSuccess: true,
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
        description: 'Separates yield from principal so you can trade, lock in, or speculate on future yields.',
        founded: '2021',
        tvl: '~$4.5 billion',
        blockchains: 'Ethereum, Arbitrum, BNB Chain',
        audits: '6+ audits',
        regulatory: '$250K bug bounty, Safe Harbor Agreement',
        website: 'https://pendle.finance',
        twitter: 'https://x.com/pendle_fi',
      },
      {
        id: 'yearn',
        name: 'Yearn Finance',
        description: 'Automated yield farming that moves your money between protocols to maximize returns.',
        founded: '2020',
        tvl: '~$500 million',
        blockchains: 'Ethereum, Arbitrum, Fantom',
        audits: '6+ audits',
        regulatory: 'Pioneer of yield aggregation, 5+ years operating',
        website: 'https://yearn.fi',
        twitter: 'https://x.com/yeaborfinance',
      },
      {
        id: 'curve',
        name: 'Curve Finance',
        description: 'Specialized exchange for stablecoins and similar assets with minimal slippage.',
        founded: '2020',
        tvl: '~$2.2 billion',
        blockchains: 'Ethereum + 20 chains',
        audits: '15+ audits',
        regulatory: "July 2023: $70M exploit (73% recovered) — Vyper compiler bug, not Curve's code",
        hasWarning: true,
        website: 'https://curve.finance',
        twitter: 'https://x.com/CurveFinance',
      },
      {
        id: 'convex',
        name: 'Convex Finance',
        description: 'Boosts your Curve rewards without needing to lock tokens for years.',
        founded: '2021',
        tvl: '~$1.5 billion',
        blockchains: 'Ethereum, Arbitrum',
        audits: '7 audits',
        regulatory: 'No exploits in 4 years; critical vulnerability found and patched in 2022 (no funds lost)',
        website: 'https://convexfinance.com',
        twitter: 'https://x.com/ConvexFinance',
      },
    ],
  },
  {
    id: 'perpetuals',
    protocols: [
      {
        id: 'gmx',
        name: 'GMX V2',
        description: 'Decentralized perpetual exchange. You provide liquidity, traders pay you fees.',
        founded: '2021',
        tvl: '~$400 million',
        blockchains: 'Arbitrum, Avalanche, Solana',
        audits: '10+ audits',
        regulatory: '$5M bug bounty on Immunefi',
        website: 'https://gmx.io',
        twitter: 'https://x.com/GMX_IO',
      },
      {
        id: 'jupiter',
        name: 'Jupiter JLP',
        description: "Solana's leading perpetual exchange. Provide liquidity, earn 70% of all trading fees.",
        founded: '2021 (perps 2023)',
        tvl: '~$1.6 billion',
        blockchains: 'Solana',
        audits: '6+ audits',
        regulatory: '$137M+ paid to liquidity providers since Jan 2024',
        website: 'https://jup.ag',
        twitter: 'https://x.com/JupiterExchange',
      },
      {
        id: 'drift',
        name: 'Drift Protocol',
        description: 'Full-featured trading platform on Solana with perpetuals, spot, and lending.',
        founded: '2021',
        tvl: '~$850 million',
        blockchains: 'Solana',
        audits: '3+ audits by Trail of Bits, OtterSec',
        regulatory: 'Open-source, real-time risk monitoring',
        website: 'https://drift.trade',
        twitter: 'https://x.com/DriftProtocol',
      },
    ],
  },
  {
    id: 'dex',
    protocols: [
      {
        id: 'raydium',
        name: 'Raydium',
        description: "Solana's main DEX with automated market making, concentrated liquidity, and token launches.",
        founded: '2021',
        tvl: '~$2 billion',
        blockchains: 'Solana',
        audits: '4+ audits',
        regulatory: 'Nov 2022: $4.4M exploit (admin key issue, users reimbursed)',
        hasWarning: true,
        website: 'https://raydium.io',
        twitter: 'https://x.com/RaydiumProtocol',
      },
      {
        id: 'orca',
        name: 'Orca',
        description: 'User-friendly Solana DEX known for clean design and efficient swaps.',
        founded: '2021',
        tvl: '~$400 million',
        blockchains: 'Solana',
        audits: '6+ audits',
        regulatory: 'No exploits in 4+ years; praised for code quality',
        website: 'https://orca.so',
        twitter: 'https://x.com/orca_so',
      },
      {
        id: 'balancer',
        name: 'Balancer',
        description: 'Programmable liquidity pools that can hold multiple tokens in custom ratios.',
        founded: '2020',
        tvl: '~$700 million',
        blockchains: 'Ethereum, Arbitrum, Polygon',
        audits: '11+ audits',
        regulatory: 'Nov 2025: $128M V2 exploit; V3 unaffected',
        hasWarning: true,
        website: 'https://balancer.fi',
        twitter: 'https://x.com/Balancer',
      },
    ],
  },
  {
    id: 'rwa',
    protocols: [
      {
        id: 'huma',
        name: 'Huma Finance',
        description: 'Instant cross-border payments and trade financing using crypto rails.',
        founded: '2022',
        tvl: '~$100 million',
        blockchains: 'Solana, Stellar, Polygon',
        audits: '6+ audits',
        regulatory: 'Partners with Circle, Stellar Development Foundation',
        website: 'https://huma.finance',
        twitter: 'https://x.com/humafinance',
      },
    ],
  },
];

/**
 * Protocol Card Component
 */
function ProtocolCard({ protocol, labels }: { protocol: Protocol; labels: Record<string, string> }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h4 className="text-xl font-bold text-slate-900 mb-2">{protocol.name}</h4>
      <p className="text-slate-600 mb-4">{protocol.description}</p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.founded}</span>
          <span className="font-medium text-slate-900">{protocol.founded}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.tvl}</span>
          <span className="font-medium text-slate-900">{protocol.tvl}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.blockchains}</span>
          <span className="font-medium text-slate-900 text-right max-w-[200px]">{protocol.blockchains}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.audits}</span>
          <span className="font-medium text-slate-900">{protocol.audits}</span>
        </div>
        <div className="flex justify-between items-start pt-1">
          <span className="text-slate-500">{labels.regulatory}</span>
          <span className={`font-medium text-right max-w-[250px] ${
            protocol.hasWarning ? 'text-amber-600' :
            protocol.hasSuccess ? 'text-teal-600' : 'text-slate-900'
          }`}>
            {protocol.hasWarning && '⚠️ '}
            {protocol.hasSuccess && '✅ '}
            {protocol.regulatory}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4">
        <a
          href={protocol.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          Website →
        </a>
        <a
          href={protocol.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-700 text-sm"
        >
          @Twitter
        </a>
      </div>
    </div>
  );
}

/**
 * Protocols Page Content - Client Component
 * Shows all 26 DeFi protocols with full transparency
 */
export function ProtocolsPageContent() {
  const intl = useTranslation();

  // Helper function to get i18n key from protocols namespace
  const t = (key: string) => intl.formatMessage({ id: `protocols.${key}` });

  // Get protocol labels for card rendering
  const protocolLabels = {
    founded: t('protocolLabels.founded'),
    tvl: t('protocolLabels.tvl'),
    blockchains: t('protocolLabels.blockchains'),
    audits: t('protocolLabels.audits'),
    regulatory: t('protocolLabels.regulatory'),
  };

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <SectionErrorBoundary
        sectionId="hero-section-protocols"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'protocols', variant: 'centered' }}
      >
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 2: Why This Page Exists */}
      <SectionErrorBoundary
        sectionId="intro-section-protocols"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'protocols' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
                {t('intro.header')}
              </h2>
              <div className="space-y-6 text-lg text-slate-700 leading-relaxed">
                <p>{t('intro.paragraph1')}</p>
                <p>{t('intro.paragraph2')}</p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="font-medium text-amber-800">
                    {t('intro.important')} {t('intro.disclaimer')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 3: Protocol Categories */}
      <SectionErrorBoundary
        sectionId="protocols-section"
        sectionType="ProtocolsGrid"
        enableReporting={true}
        context={{ page: 'protocols' }}
      >
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
                The 26 Protocols
              </h2>
              <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
                Organized by category for easy reference
              </p>

              {PROTOCOL_DATA.map((category) => (
                <div key={category.id} className="mb-16">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {t(`categories.${category.id}.title`)}
                  </h3>
                  <p className="text-slate-600 mb-8">
                    {t(`categories.${category.id}.description`)}
                  </p>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.protocols.map((protocol) => (
                      <ProtocolCard
                        key={protocol.id}
                        protocol={protocol}
                        labels={protocolLabels}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 4: Selection Process */}
      <SectionErrorBoundary
        sectionId="selection-section-protocols"
        sectionType="ContentSection"
        enableReporting={true}
        context={{ page: 'protocols' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
                {t('selectionProcess.header')}
              </h2>
              <p className="text-lg text-slate-700 mb-6">
                {t('selectionProcess.intro')}
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-teal-500 mt-1">✓</span>
                  <span className="text-slate-700">{t('selectionProcess.criteria.operation')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-500 mt-1">✓</span>
                  <span className="text-slate-700">{t('selectionProcess.criteria.audits')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-500 mt-1">✓</span>
                  <span className="text-slate-700">{t('selectionProcess.criteria.exploits')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-500 mt-1">✓</span>
                  <span className="text-slate-700">{t('selectionProcess.criteria.transparent')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-500 mt-1">✓</span>
                  <span className="text-slate-700">{t('selectionProcess.criteria.usage')}</span>
                </li>
              </ul>

              <p className="text-slate-600 italic">
                {t('selectionProcess.note')}
              </p>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 5: Total TVL */}
      <SectionErrorBoundary
        sectionId="tvl-section-protocols"
        sectionType="StatsSection"
        enableReporting={true}
        context={{ page: 'protocols' }}
      >
        <section className="py-16 md:py-24 bg-teal-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              {t('totalTvl.header')}
            </h2>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto mb-2">
              {t('totalTvl.paragraph1')}{' '}
              <span className="font-bold text-teal-700 text-3xl">{t('totalTvl.amount')}</span>{' '}
              {t('totalTvl.paragraph2')}
            </p>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {t('totalTvl.note')}
            </p>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 6: FAQ */}
      <SectionErrorBoundary
        sectionId="faq-section-protocols"
        sectionType="FAQSection"
        enableReporting={true}
        context={{ page: 'protocols' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">
                {t('faq.header')}
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {t('faq.q1.question')}
                  </h3>
                  <p className="text-slate-600">
                    {t('faq.q1.answer')}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {t('faq.q2.question')}
                  </h3>
                  <p className="text-slate-600">
                    {t('faq.q2.answer')}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    {t('faq.q3.question')}
                  </h3>
                  <p className="text-slate-600">
                    {t('faq.q3.answer')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 7: Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-protocols"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'protocols' }}
      >
        <div id="waitlist">
          <WaitlistSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>

      {/* Footer */}
      <section className="py-8 bg-slate-100">
        <div className="container mx-auto px-4">
          <p className="text-xs text-slate-500 text-center">
            {t('footer.lastUpdated')}
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            {t('footer.sources')}
          </p>
        </div>
      </section>
    </main>
  );
}
