/**
 * Storybook i18n message map (Phase 3A PR-3A, 2026-05-18).
 *
 * Synchronous import of the 11 calculator-relevant namespaces × 4 locales =
 * 44 imports. Each JSON is FLATTENED with its namespace prefix because
 * `react-intl` looks up messages by literal flat keys (e.g.
 * `tools-shared.landing.hero.headline`), while the source JSON files are
 * NESTED (e.g. `{ landing: { hero: { headline: "..." } } }`).
 *
 * **M10 (rev-4 mandatory):** without `flattenMessages(json, namespace)`,
 * every calculator story would render the raw `id` string instead of the
 * localized copy — locale switcher would do nothing for any locale-derived
 * content. Verified: `flattenMessages` exported from `@diboas/i18n` root via
 * `export * from './utils'` at packages/i18n/src/index.ts:11; consumed by
 * calculator components via `intl.formatMessage({ id: 'tools-X.key' })`.
 *
 * Scope: 11 calculator namespaces only (tools-shared + 10 tools-*). The 18
 * non-calculator namespaces (landing-b2c, dreamMode, preDemo, protocols,
 * etc.) are intentionally excluded — they're not used by any calculator
 * story. If a future non-calculator story needs i18n, expand this map and
 * the namespace below.
 */

import { flattenMessages } from '@diboas/i18n';

// ---- en ----
import enCommon from '../../../packages/i18n/translations/en/common.json';
import enToolsShared from '../../../packages/i18n/translations/en/tools-shared.json';
import enToolsCompoundInterest from '../../../packages/i18n/translations/en/tools-compound-interest.json';
import enToolsRetirement from '../../../packages/i18n/translations/en/tools-retirement.json';
import enToolsGoalSavings from '../../../packages/i18n/translations/en/tools-goal-savings.json';
import enToolsEmergencyFund from '../../../packages/i18n/translations/en/tools-emergency-fund.json';
import enToolsTimeToTarget from '../../../packages/i18n/translations/en/tools-time-to-target.json';
import enToolsInflationImpact from '../../../packages/i18n/translations/en/tools-inflation-impact.json';
import enToolsCurrencyDepreciation from '../../../packages/i18n/translations/en/tools-currency-depreciation.json';
import enToolsCardFees from '../../../packages/i18n/translations/en/tools-card-fees.json';
import enToolsIdleCash from '../../../packages/i18n/translations/en/tools-idle-cash.json';
import enToolsAssetHistory from '../../../packages/i18n/translations/en/tools-asset-history.json';
import enLearnCompoundInterest from '../../../packages/i18n/translations/en/learn-compound-interest.json';

// ---- pt-BR ----
import ptBRCommon from '../../../packages/i18n/translations/pt-BR/common.json';
import ptBRToolsShared from '../../../packages/i18n/translations/pt-BR/tools-shared.json';
import ptBRToolsCompoundInterest from '../../../packages/i18n/translations/pt-BR/tools-compound-interest.json';
import ptBRToolsRetirement from '../../../packages/i18n/translations/pt-BR/tools-retirement.json';
import ptBRToolsGoalSavings from '../../../packages/i18n/translations/pt-BR/tools-goal-savings.json';
import ptBRToolsEmergencyFund from '../../../packages/i18n/translations/pt-BR/tools-emergency-fund.json';
import ptBRToolsTimeToTarget from '../../../packages/i18n/translations/pt-BR/tools-time-to-target.json';
import ptBRToolsInflationImpact from '../../../packages/i18n/translations/pt-BR/tools-inflation-impact.json';
import ptBRToolsCurrencyDepreciation from '../../../packages/i18n/translations/pt-BR/tools-currency-depreciation.json';
import ptBRToolsCardFees from '../../../packages/i18n/translations/pt-BR/tools-card-fees.json';
import ptBRToolsIdleCash from '../../../packages/i18n/translations/pt-BR/tools-idle-cash.json';
import ptBRToolsAssetHistory from '../../../packages/i18n/translations/pt-BR/tools-asset-history.json';
import ptBRLearnCompoundInterest from '../../../packages/i18n/translations/pt-BR/learn-compound-interest.json';

// ---- es ----
import esCommon from '../../../packages/i18n/translations/es/common.json';
import esToolsShared from '../../../packages/i18n/translations/es/tools-shared.json';
import esToolsCompoundInterest from '../../../packages/i18n/translations/es/tools-compound-interest.json';
import esToolsRetirement from '../../../packages/i18n/translations/es/tools-retirement.json';
import esToolsGoalSavings from '../../../packages/i18n/translations/es/tools-goal-savings.json';
import esToolsEmergencyFund from '../../../packages/i18n/translations/es/tools-emergency-fund.json';
import esToolsTimeToTarget from '../../../packages/i18n/translations/es/tools-time-to-target.json';
import esToolsInflationImpact from '../../../packages/i18n/translations/es/tools-inflation-impact.json';
import esToolsCurrencyDepreciation from '../../../packages/i18n/translations/es/tools-currency-depreciation.json';
import esToolsCardFees from '../../../packages/i18n/translations/es/tools-card-fees.json';
import esToolsIdleCash from '../../../packages/i18n/translations/es/tools-idle-cash.json';
import esToolsAssetHistory from '../../../packages/i18n/translations/es/tools-asset-history.json';
import esLearnCompoundInterest from '../../../packages/i18n/translations/es/learn-compound-interest.json';

// ---- de ----
import deCommon from '../../../packages/i18n/translations/de/common.json';
import deToolsShared from '../../../packages/i18n/translations/de/tools-shared.json';
import deToolsCompoundInterest from '../../../packages/i18n/translations/de/tools-compound-interest.json';
import deToolsRetirement from '../../../packages/i18n/translations/de/tools-retirement.json';
import deToolsGoalSavings from '../../../packages/i18n/translations/de/tools-goal-savings.json';
import deToolsEmergencyFund from '../../../packages/i18n/translations/de/tools-emergency-fund.json';
import deToolsTimeToTarget from '../../../packages/i18n/translations/de/tools-time-to-target.json';
import deToolsInflationImpact from '../../../packages/i18n/translations/de/tools-inflation-impact.json';
import deToolsCurrencyDepreciation from '../../../packages/i18n/translations/de/tools-currency-depreciation.json';
import deToolsCardFees from '../../../packages/i18n/translations/de/tools-card-fees.json';
import deToolsIdleCash from '../../../packages/i18n/translations/de/tools-idle-cash.json';
import deToolsAssetHistory from '../../../packages/i18n/translations/de/tools-asset-history.json';
import deLearnCompoundInterest from '../../../packages/i18n/translations/de/learn-compound-interest.json';

import type { SupportedLocale } from '@diboas/i18n/config';

function buildLocale(
  common: Record<string, unknown>,
  toolsShared: Record<string, unknown>,
  toolsCompoundInterest: Record<string, unknown>,
  toolsRetirement: Record<string, unknown>,
  toolsGoalSavings: Record<string, unknown>,
  toolsEmergencyFund: Record<string, unknown>,
  toolsTimeToTarget: Record<string, unknown>,
  toolsInflationImpact: Record<string, unknown>,
  toolsCurrencyDepreciation: Record<string, unknown>,
  toolsCardFees: Record<string, unknown>,
  toolsIdleCash: Record<string, unknown>,
  toolsAssetHistory: Record<string, unknown>,
  learnCompoundInterest: Record<string, unknown>
): Record<string, string> {
  return {
    // `common` namespace surfaces shared disclaimers + button labels referenced
    // by every calculator (e.g. `common.disclaimers.educationalProjection`).
    ...flattenMessages(common, 'common'),
    ...flattenMessages(toolsShared, 'tools-shared'),
    ...flattenMessages(toolsCompoundInterest, 'tools-compound-interest'),
    ...flattenMessages(toolsRetirement, 'tools-retirement'),
    ...flattenMessages(toolsGoalSavings, 'tools-goal-savings'),
    ...flattenMessages(toolsEmergencyFund, 'tools-emergency-fund'),
    ...flattenMessages(toolsTimeToTarget, 'tools-time-to-target'),
    ...flattenMessages(toolsInflationImpact, 'tools-inflation-impact'),
    ...flattenMessages(toolsCurrencyDepreciation, 'tools-currency-depreciation'),
    ...flattenMessages(toolsCardFees, 'tools-card-fees'),
    ...flattenMessages(toolsIdleCash, 'tools-idle-cash'),
    ...flattenMessages(toolsAssetHistory, 'tools-asset-history'),
    ...flattenMessages(learnCompoundInterest, 'learn-compound-interest'),
  };
}

export const STORYBOOK_MESSAGES: Record<SupportedLocale, Record<string, string>> = {
  en: buildLocale(
    enCommon as Record<string, unknown>,
    enToolsShared as Record<string, unknown>,
    enToolsCompoundInterest as Record<string, unknown>,
    enToolsRetirement as Record<string, unknown>,
    enToolsGoalSavings as Record<string, unknown>,
    enToolsEmergencyFund as Record<string, unknown>,
    enToolsTimeToTarget as Record<string, unknown>,
    enToolsInflationImpact as Record<string, unknown>,
    enToolsCurrencyDepreciation as Record<string, unknown>,
    enToolsCardFees as Record<string, unknown>,
    enToolsIdleCash as Record<string, unknown>,
    enToolsAssetHistory as Record<string, unknown>,
    enLearnCompoundInterest as Record<string, unknown>
  ),
  'pt-BR': buildLocale(
    ptBRCommon as Record<string, unknown>,
    ptBRToolsShared as Record<string, unknown>,
    ptBRToolsCompoundInterest as Record<string, unknown>,
    ptBRToolsRetirement as Record<string, unknown>,
    ptBRToolsGoalSavings as Record<string, unknown>,
    ptBRToolsEmergencyFund as Record<string, unknown>,
    ptBRToolsTimeToTarget as Record<string, unknown>,
    ptBRToolsInflationImpact as Record<string, unknown>,
    ptBRToolsCurrencyDepreciation as Record<string, unknown>,
    ptBRToolsCardFees as Record<string, unknown>,
    ptBRToolsIdleCash as Record<string, unknown>,
    ptBRToolsAssetHistory as Record<string, unknown>,
    ptBRLearnCompoundInterest as Record<string, unknown>
  ),
  es: buildLocale(
    esCommon as Record<string, unknown>,
    esToolsShared as Record<string, unknown>,
    esToolsCompoundInterest as Record<string, unknown>,
    esToolsRetirement as Record<string, unknown>,
    esToolsGoalSavings as Record<string, unknown>,
    esToolsEmergencyFund as Record<string, unknown>,
    esToolsTimeToTarget as Record<string, unknown>,
    esToolsInflationImpact as Record<string, unknown>,
    esToolsCurrencyDepreciation as Record<string, unknown>,
    esToolsCardFees as Record<string, unknown>,
    esToolsIdleCash as Record<string, unknown>,
    esToolsAssetHistory as Record<string, unknown>,
    esLearnCompoundInterest as Record<string, unknown>
  ),
  de: buildLocale(
    deCommon as Record<string, unknown>,
    deToolsShared as Record<string, unknown>,
    deToolsCompoundInterest as Record<string, unknown>,
    deToolsRetirement as Record<string, unknown>,
    deToolsGoalSavings as Record<string, unknown>,
    deToolsEmergencyFund as Record<string, unknown>,
    deToolsTimeToTarget as Record<string, unknown>,
    deToolsInflationImpact as Record<string, unknown>,
    deToolsCurrencyDepreciation as Record<string, unknown>,
    deToolsCardFees as Record<string, unknown>,
    deToolsIdleCash as Record<string, unknown>,
    deToolsAssetHistory as Record<string, unknown>,
    deLearnCompoundInterest as Record<string, unknown>
  ),
};
