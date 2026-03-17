/**
 * GoalCalculator TypeScript interfaces.
 */

export type GoalTab = 'christmas' | 'emergency' | 'vacation';
export type RiskTierIndex = 0 | 1 | 2;
export type EmergencyCoverage = 3 | 4 | 6;
export type EmergencyTimeline = 6 | 9 | 12 | 18;

export interface RiskTier {
  readonly label: string;
  readonly expectedAPY: number;
  readonly goodAPY: number;
  readonly badAPY: number;
}

export interface ScenarioResult {
  readonly good: number;
  readonly expected: number;
  readonly bad: number;
}

/* Wizard state machine types */

export type GoalCalculatorScreen =
  | 'goalSelection'
  | 'goalAmount'
  | 'timeline'
  | 'depositRisk'
  | 'simulation'
  | 'results';

export interface GoalCalculatorState {
  readonly screen: GoalCalculatorScreen;
  readonly activeGoal: GoalTab | null;

  // Inputs (raw strings for locale-aware editing)
  readonly field1Raw: string;
  readonly initialDepositRaw: string;
  readonly monthlyDepositRaw: string;
  readonly isMonthlyOverridden: boolean;
  readonly riskTierIndex: RiskTierIndex;

  // Goal-specific
  readonly emergencyCoverage: EmergencyCoverage;
  readonly emergencyTimeline: EmergencyTimeline;
  readonly vacationDate: Date | null;

  // Animation
  readonly isAnimating: boolean;

  // Result
  readonly result: ScenarioResult | null;
  readonly isStartSmaller: boolean;
}

export type GoalCalculatorAction =
  | { type: 'SELECT_GOAL'; goal: GoalTab }
  | { type: 'SET_FIELD1'; value: string }
  | { type: 'SET_INITIAL_DEPOSIT'; value: string }
  | { type: 'SET_MONTHLY_DEPOSIT'; value: string }
  | { type: 'SET_RISK_TIER'; index: RiskTierIndex }
  | { type: 'SET_COVERAGE'; coverage: EmergencyCoverage }
  | { type: 'SET_TIMELINE'; timeline: EmergencyTimeline }
  | { type: 'SET_VACATION_DATE'; date: Date }
  | { type: 'START_SIMULATION'; result: ScenarioResult }
  | { type: 'FINISH_SIMULATION' }
  | { type: 'TOGGLE_START_SMALLER' }
  | { type: 'GO_NEXT' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' };

export interface GoalCalculatorContextValue {
  readonly state: GoalCalculatorState;
  readonly dispatch: React.Dispatch<GoalCalculatorAction>;
  readonly selectGoal: (goal: GoalTab) => void;
  readonly goNext: () => void;
  readonly goBack: () => void;
  readonly startSimulation: (result: ScenarioResult) => void;
  readonly finishSimulation: () => void;
  readonly reset: () => void;
}

export interface GoalCalculatorConfig {
  readonly content: {
    readonly header: string;
    readonly subtitle: string;
    readonly stepIndicator: string;
    readonly goalDescriptions: {
      readonly christmas: string;
      readonly emergency: string;
      readonly vacation: string;
    };
    readonly suggested: string;
    readonly override: string;
    readonly startSmaller: string;
    readonly expectedReturn: string;
    readonly back: string;
    readonly tabs: {
      readonly christmas: string;
      readonly emergency: string;
      readonly vacation: string;
    };
    readonly fields: {
      readonly christmas: { readonly label: string; readonly helper: string };
      readonly emergency: { readonly label: string; readonly helper: string };
      readonly vacation: { readonly label: string; readonly helper: string };
      readonly initialDeposit: { readonly label: string; readonly helper: string };
      readonly monthlyDeposit: { readonly label: string; readonly helper: string };
      readonly riskTier: { readonly label: string };
    };
    readonly coverage: {
      readonly label: string;
      readonly months3: string;
      readonly months4: string;
      readonly months6: string;
    };
    readonly timeline: {
      readonly label: string;
      readonly months6: string;
      readonly months9: string;
      readonly months12: string;
      readonly months18: string;
    };
    readonly vacationDate: { readonly label: string };
    readonly tiers: {
      readonly careful: string;
      readonly moderate: string;
      readonly aggressive: string;
    };
    readonly cta: string;
    readonly result: {
      readonly christmasHeadline: string;
      readonly emergencyHeadline: string;
      readonly vacationHeadline: string;
      readonly planLine: string;
      readonly scenarioGood: string;
      readonly scenarioExpected: string;
      readonly scenarioBad: string;
      readonly badCaseLoss: string;
      readonly disclaimer: string;
      readonly startSmallerToggle: string;
      readonly startSmallerPrompt: string;
      readonly startSmallerPartial: string;
      readonly primaryCta: string;
      readonly secondaryHow: string;
      readonly secondaryRisks: string;
      readonly demoLink: string;
    };
    readonly helpers: {
      readonly bigCommitment: string;
      readonly oneMonthWarning: string;
      readonly christmasRollover: string;
      readonly vacationDateMinimum: string;
    };
    readonly microcopy: string;
  };
  readonly seo: {
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
