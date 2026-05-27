/**
 * PreDream Domain - Public API
 */

export type {
  PreDreamPath,
  PreDreamTimeframe,
  PreDreamScreen,
  PreDreamPathConfig,
  PreDreamTimeframeConfig,
  PreDreamResult,
} from './types';

export {
  PRE_DREAM_PATHS,
  PRE_DREAM_TIMEFRAMES,
  PRE_DREAM_INITIAL_AMOUNT_CONFIG,
  PRE_DREAM_MONTHLY_AMOUNT_CONFIG,
  PRE_DREAM_SIMULATION_CONFIG,
} from './constants';

export {
  calculatePreDreamResult,
  resolveBankRate,
  resolveStrategyApy,
  type StrategyApyOverrides,
} from './calculations';

export { formatCurrency } from './format';
