/**
 * Compound Interest domain barrel.
 */

export { calculateCompoundProjection } from './calculator';
export { calculateCompoundProjectionHedged } from './calculatorHedged';
export { convertCadenceToMonthly, isOneTime } from './cadence';
export { SCENARIO_RATES, type ScenarioKey } from './scenarios';
export { formatCurrency, formatPercent, getCurrencyCode } from './format';
export {
  CALCULATOR_EVENTS,
  DEBOUNCE_MS,
  DEFAULT_INPUT_BY_LOCALE,
  INPUT_BOUNDS,
  type CalculatorEventName,
} from './constants';
export {
  InvalidCalculatorInputError,
  type Cadence,
  type CalculatorInput,
  type CalculatorOutput,
  type ScenarioSeries,
  type SeriesKey,
} from './types';
