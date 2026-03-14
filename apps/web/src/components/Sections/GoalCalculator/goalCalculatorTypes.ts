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

export interface GoalCalculatorConfig {
  readonly content: {
    readonly header: string;
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
