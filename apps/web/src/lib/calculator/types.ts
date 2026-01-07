/**
 * Future You Calculator - Types
 *
 * Types for compound growth calculations and projections
 */

/**
 * Investment input parameters
 */
export interface InvestmentInput {
  /** Initial investment amount */
  readonly initialAmount: number;
  /** Monthly contribution */
  readonly monthlyContribution: number;
  /** Currency code (USD, EUR, BRL) */
  readonly currency: string;
}

/**
 * Short-term timeframes (for Dream Mode simulations)
 */
export type ShortTermTimeframe = '1week' | '1month' | '1year' | '5years';

/**
 * Long-term timeframes (for Future You Calculator)
 */
export type LongTermTimeframe = '5years' | '10years' | '20years';

/**
 * Timeframe for projections (combines short and long term)
 */
export type ProjectionTimeframe = ShortTermTimeframe | LongTermTimeframe;

/**
 * Rate scenario
 */
export interface RateScenario {
  /** Scenario identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Annual percentage yield (APY) */
  readonly apy: number;
  /** Description */
  readonly description?: string;
  /** Is this the bank/traditional scenario */
  readonly isBank?: boolean;
}

/**
 * Projection result for a single timeframe
 */
export interface ProjectionResult {
  /** Timeframe identifier */
  readonly timeframe: ProjectionTimeframe;
  /** Number of days in this timeframe */
  readonly days: number;
  /** Final balance */
  readonly finalBalance: number;
  /** Total contributed (initial + monthly deposits) */
  readonly totalContributed: number;
  /** Interest earned */
  readonly interestEarned: number;
  /** Growth percentage */
  readonly growthPercentage: number;
}

/**
 * Comparison between two scenarios
 */
export interface ScenarioComparison {
  /** Timeframe */
  readonly timeframe: ProjectionTimeframe;
  /** DeFi projection */
  readonly defi: ProjectionResult;
  /** Bank projection */
  readonly bank: ProjectionResult;
  /** Difference in final balance */
  readonly difference: number;
  /** Difference as percentage */
  readonly differencePercentage: number;
  /** "Lost" opportunity cost by staying with bank */
  readonly opportunityCost: number;
}

/**
 * Short-term projections (for Dream Mode)
 */
export interface ShortTermProjections {
  readonly '1week': ScenarioComparison;
  readonly '1month': ScenarioComparison;
  readonly '1year': ScenarioComparison;
  readonly '5years': ScenarioComparison;
}

/**
 * Long-term projections (for Future You Calculator)
 */
export interface LongTermProjections {
  readonly '5years': ScenarioComparison;
  readonly '10years': ScenarioComparison;
  readonly '20years': ScenarioComparison;
}

/**
 * Full calculator result
 */
export interface CalculatorResult {
  /** Input parameters used */
  readonly input: InvestmentInput;
  /** DeFi scenario details */
  readonly defiScenario: RateScenario;
  /** Bank scenario details */
  readonly bankScenario: RateScenario;
  /** Projections by timeframe (short-term for backwards compatibility) */
  readonly projections: ShortTermProjections;
  /** Long-term projections (for Future You Calculator) */
  readonly longTermProjections?: LongTermProjections;
  /** Selected/active timeframe */
  readonly selectedTimeframe: ProjectionTimeframe;
}

/**
 * Calculator configuration
 */
export interface CalculatorConfig {
  /** Default currency */
  readonly defaultCurrency: string;
  /** Default initial amount */
  readonly defaultInitialAmount: number;
  /** Default monthly contribution */
  readonly defaultMonthlyContribution: number;
  /** Minimum initial amount */
  readonly minInitialAmount: number;
  /** Maximum initial amount */
  readonly maxInitialAmount: number;
  /** Minimum monthly contribution */
  readonly minMonthlyContribution: number;
  /** Maximum monthly contribution */
  readonly maxMonthlyContribution: number;
  /** Monthly contribution slider step (per CMO v2 spec: €5) */
  readonly monthlyContributionStep: number;
  /** DeFi APY rate */
  readonly defiApy: number;
  /** Bank APY rate */
  readonly bankApy: number;
}
