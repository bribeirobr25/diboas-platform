'use client';

import { useIntl } from 'react-intl';
import Link from 'next/link';
import { WaitlistSection } from '@/components/Sections/WaitlistSection';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';

/**
 * i18n namespace prefix for strategies page
 */
const I18N_PREFIX = 'marketing.pages.strategies';

/**
 * Strategy IDs matching the i18n keys in strategies.json
 */
const STRATEGY_IDS = [
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
] as const;

/**
 * Growth exposure percentages for each strategy (for visual styling)
 */
const GROWTH_EXPOSURE: Record<string, number> = {
  safeHarbor: 0,
  stableGrowth: 30,
  goalKeeper: 0,
  steadyProgress: 35,
  patientBuilder: 0,
  balancedBuilder: 40,
  steadyCompounder: 0,
  wealthAccelerator: 70,
  yieldMaximizer: 0,
  fullThrottle: 85,
};

/**
 * Matrix row configuration
 */
const MATRIX_ROWS = [
  { id: 'emergency', stableStrategy: 'safeHarbor', growthStrategy: 'stableGrowth' },
  { id: 'shortTerm', stableStrategy: 'goalKeeper', growthStrategy: 'steadyProgress' },
  { id: 'mediumTerm', stableStrategy: 'patientBuilder', growthStrategy: 'balancedBuilder' },
  { id: 'longTerm', stableStrategy: 'steadyCompounder', growthStrategy: 'wealthAccelerator' },
  { id: 'wealthBuilding', stableStrategy: 'yieldMaximizer', growthStrategy: 'fullThrottle' },
] as const;

/**
 * Risk level colors
 */
function getRiskLevelColor(strategyId: string): string {
  const growthExposure = GROWTH_EXPOSURE[strategyId] || 0;
  if (growthExposure === 0) return 'text-teal-600';
  if (growthExposure < 40) return 'text-amber-600';
  if (growthExposure < 70) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Border color based on growth exposure
 */
function getBorderColor(strategyId: string): string {
  const growthExposure = GROWTH_EXPOSURE[strategyId] || 0;
  if (growthExposure === 0) return 'border-teal-500';
  if (growthExposure < 50) return 'border-amber-500';
  return 'border-red-500';
}

/**
 * Strategies Page Content - Client Component
 * Uses i18n for all text content
 */
export function StrategiesPageContent() {
  const intl = useIntl();

  // Helper function to get prefixed i18n key
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <main className="main-page-wrapper">
      {/* Section 1: Hero */}
      <SectionErrorBoundary
        sectionId="hero-section-strategies"
        sectionType="HeroSection"
        enableReporting={true}
        context={{ page: 'strategies', variant: 'centered' }}
      >
        <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('hero.headline')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto">
              {t('hero.subheadline')}
            </p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t('hero.subheadline2')}
            </p>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 2: Strategy Matrix */}
      <SectionErrorBoundary
        sectionId="matrix-section-strategies"
        sectionType="StrategyMatrix"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-6">
              {t('matrix.header')}
            </h2>
            <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
              {t('matrix.instructions')}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full max-w-4xl mx-auto bg-slate-50 rounded-xl">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-slate-600 font-medium">
                      {t('matrix.columns.goal')}
                    </th>
                    <th className="px-6 py-4 text-center text-teal-700 font-medium">
                      {t('matrix.columns.stable')}
                    </th>
                    <th className="px-6 py-4 text-center text-amber-700 font-medium">
                      {t('matrix.columns.growth')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((row, index) => (
                    <tr
                      key={row.id}
                      className={index < MATRIX_ROWS.length - 1 ? 'border-b border-slate-200' : ''}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {t(`matrix.rows.${row.id}.goal`)}
                      </td>
                      <td className="px-6 py-4 text-center text-teal-600">
                        {t(`matrix.rows.${row.id}.stable`)}
                      </td>
                      <td className="px-6 py-4 text-center text-amber-600">
                        {t(`matrix.rows.${row.id}.growth`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-center text-slate-500 mt-8 text-sm">
              {t('matrix.note')}
            </p>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 3: Strategy Cards */}
      <SectionErrorBoundary
        sectionId="cards-section-strategies"
        sectionType="StrategyCards"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
              {t('allStrategiesHeader')}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {STRATEGY_IDS.map((strategyId) => {
                const growthExposure = GROWTH_EXPOSURE[strategyId];
                return (
                  <div
                    key={strategyId}
                    className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${getBorderColor(strategyId)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {t(`strategies.${strategyId}.name`)}
                      </h3>
                      {growthExposure > 0 && (
                        <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          {growthExposure}% {t('growthBadge')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                      {t(`strategies.${strategyId}.badge`)}
                    </p>
                    <p className="text-slate-700 font-medium mb-4">
                      {t(`strategies.${strategyId}.tagline`)}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          {t('statsLabels.lossChance')}:
                        </span>
                        <span className="font-medium text-slate-900">
                          {t(`strategies.${strategyId}.stats.lossChance`)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          {t('statsLabels.typicalReturn')}:
                        </span>
                        <span className="font-medium text-slate-900">
                          {t(`strategies.${strategyId}.stats.typicalReturn`)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          {t('statsLabels.bumpiness')}:
                        </span>
                        <span className="font-medium text-slate-900">
                          {t(`strategies.${strategyId}.stats.bumpiness`)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          {t('statsLabels.riskLevel')}:
                        </span>
                        <span className={`font-medium ${getRiskLevelColor(strategyId)}`}>
                          {t(`strategies.${strategyId}.riskLevel`)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 4: How to Choose */}
      <SectionErrorBoundary
        sectionId="how-to-choose-section"
        sectionType="HowToChoose"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
              {t('howToChoose.header')}
            </h2>

            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-4">
                  {t('howToChoose.question1.title')}
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li>
                    {t('howToChoose.question1.options.emergency')}
                  </li>
                  <li>
                    {t('howToChoose.question1.options.shortTerm')}
                  </li>
                  <li>
                    {t('howToChoose.question1.options.mediumTerm')}
                  </li>
                  <li>
                    {t('howToChoose.question1.options.longTerm')}
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-4">
                  {t('howToChoose.question2.title')}
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li>
                    {t('howToChoose.question2.options.none')}
                  </li>
                  <li>
                    {t('howToChoose.question2.options.understand')}
                  </li>
                  <li>
                    {t('howToChoose.question2.options.unsure')}
                  </li>
                </ul>
              </div>

              <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
                <p className="text-teal-800 font-medium text-center">
                  {t('howToChoose.goldenRule')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 5: Future You Connection */}
      <SectionErrorBoundary
        sectionId="future-you-connection-section"
        sectionType="FeatureShowcase"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              {t('futureYouConnection.header')}
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              {t('futureYouConnection.body')}
            </p>
            <Link
              href="/future-you"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {t('futureYouConnection.cta')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </SectionErrorBoundary>

      {/* Section 6: Final CTA / Waitlist */}
      <SectionErrorBoundary
        sectionId="waitlist-section-strategies"
        sectionType="WaitlistSection"
        enableReporting={true}
        context={{ page: 'strategies' }}
      >
        <div id="waitlist">
          <WaitlistSection enableAnalytics={true} />
        </div>
      </SectionErrorBoundary>

      {/* Footer Disclaimer */}
      <section className="py-8 bg-slate-100">
        <div className="container mx-auto px-4">
          <p className="text-xs text-slate-500 text-center max-w-4xl mx-auto">
            {t('footer.disclaimer')}
          </p>
        </div>
      </section>
    </main>
  );
}
