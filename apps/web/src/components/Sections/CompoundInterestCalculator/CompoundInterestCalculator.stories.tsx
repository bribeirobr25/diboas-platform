/**
 * CompoundInterestCalculator Storybook Stories (Phase 3A PR-3A, 2026-05-18).
 *
 * Reference calculator stories — exercises the i18n decorator hardest because
 * one component covers 3 route surfaces (`/tools/compound-interest`,
 * `/tools/retirement`, `/tools/goal-savings`) and the `/learn/compound-interest`
 * lesson. The 3 routes differ only in `engine` + `initialInput` props from
 * `COMPOUND_TOOL_DEFAULTS`; per plan §4.5 + M7, they are NOT separate
 * components — `RetirementCalculator` / `GoalSavingsCalculator` directories
 * do not exist.
 *
 * 7 stories per plan §4.10 PR-3A breakdown:
 *   1. DefaultLesson — engine='lesson' (lesson page math, no hedge)
 *   2. DefaultTool — engine='tool' (tool-page math with currency hedge)
 *   3. Retirement — engine='tool' + retirement defaults
 *   4. GoalSavings — engine='tool' + goal-savings defaults
 *   5. GoalSavingsPathDependent — Phase D.3 opt-in path-dependent variant
 *   6. LumpSumMode — cadence='oneTime' branch (uses lumpSum math path)
 *   7. MaxContribution — exercise INPUT_BOUNDS.amount.max edge
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CompoundInterestCalculator } from './CompoundInterestCalculatorFactory';
import { COMPOUND_TOOL_DEFAULTS } from '@/lib/tools';
import type { CalculatorInput } from '@/lib/compound-interest';
import type { SupportedLocale } from '@diboas/i18n/config';

const meta: Meta<typeof CompoundInterestCalculator> = {
  title: 'Sections/CompoundInterestCalculator',
  component: CompoundInterestCalculator,
  parameters: {
    docs: {
      description: {
        component: `
# CompoundInterestCalculator

Section-level calculator that covers FOUR route surfaces:

- \`/learn/compound-interest\` — \`engine='lesson'\` (pedagogical math, no hedge)
- \`/tools/compound-interest\` — \`engine='tool'\`
- \`/tools/retirement\` — \`engine='tool'\` + retirement defaults
- \`/tools/goal-savings\` — \`engine='tool'\` + goal-savings defaults + optional \`enablePathDependent\`

Cadence selector is a 7-value union (\`oneTime\` / \`daily\` / \`weekly\` / \`monthly\`
/ \`quarterly\` / \`semiAnnual\` / \`yearly\`) per Phase 6A.2. Lump-sum branch
activates when cadence === 'oneTime'.

Stories below cover the lesson engine, the three tool routes, the path-dependent
opt-in, the lump-sum branch, and the max-contribution edge.
        `,
      },
    },
  },
  argTypes: {
    engine: {
      control: 'inline-radio',
      options: ['lesson', 'tool'],
    },
    enablePathDependent: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CompoundInterestCalculator>;

// Helpers building `CalculatorInput` from `COMPOUND_TOOL_DEFAULTS` per route key.
// `locale` is injected from Storybook globals at render time so the toolbar
// locale switcher drives BOTH the i18n decorator's text AND the calculator's
// currency formatting (otherwise `formatCurrency` throws on undefined locale).
function lessonInput(locale: SupportedLocale): CalculatorInput {
  return {
    amount: COMPOUND_TOOL_DEFAULTS['compound-interest'].amount[locale],
    cadence: COMPOUND_TOOL_DEFAULTS['compound-interest'].cadence,
    years: COMPOUND_TOOL_DEFAULTS['compound-interest'].years,
    initialAmount: COMPOUND_TOOL_DEFAULTS['compound-interest'].initialAmount,
    locale,
  };
}

function retirementInput(locale: SupportedLocale): CalculatorInput {
  return {
    amount: COMPOUND_TOOL_DEFAULTS.retirement.amount[locale],
    cadence: COMPOUND_TOOL_DEFAULTS.retirement.cadence,
    years: COMPOUND_TOOL_DEFAULTS.retirement.years,
    initialAmount: COMPOUND_TOOL_DEFAULTS.retirement.initialAmount,
    locale,
  };
}

function goalSavingsInput(locale: SupportedLocale): CalculatorInput {
  return {
    amount: COMPOUND_TOOL_DEFAULTS['goal-savings'].amount[locale],
    cadence: COMPOUND_TOOL_DEFAULTS['goal-savings'].cadence,
    years: COMPOUND_TOOL_DEFAULTS['goal-savings'].years,
    initialAmount: COMPOUND_TOOL_DEFAULTS['goal-savings'].initialAmount,
    locale,
  };
}

/**
 * Default — lesson engine, pedagogical math (no currency hedge applied).
 * Matches `/learn/compound-interest`'s LessonThreeBeat surface.
 */
export const DefaultLesson: Story = {
  render: (args, context) => {
    const locale = (context.globals.locale ?? 'en') as SupportedLocale;
    return <CompoundInterestCalculator {...args} initialInput={lessonInput(locale)} />;
  },
  args: { engine: 'lesson' },
};

/**
 * Tool engine — currency-hedge math for non-USD locales (try locale switcher).
 * Same defaults as DefaultLesson; differs only in scenario-rate computation.
 */
export const DefaultTool: Story = {
  render: (args, context) => {
    const locale = (context.globals.locale ?? 'en') as SupportedLocale;
    return <CompoundInterestCalculator {...args} initialInput={lessonInput(locale)} />;
  },
  args: { engine: 'tool' },
};

/**
 * Retirement route surface — tool engine + retirement defaults
 * ($500/mo en, 25 years, monthly cadence; per-locale amounts apply).
 */
export const Retirement: Story = {
  render: (args, context) => {
    const locale = (context.globals.locale ?? 'en') as SupportedLocale;
    return <CompoundInterestCalculator {...args} initialInput={retirementInput(locale)} />;
  },
  args: { engine: 'tool' },
};

/**
 * Goal-Savings route surface — tool engine + goal-savings defaults
 * ($200/mo en, 10 years, monthly cadence; per-locale amounts apply).
 */
export const GoalSavings: Story = {
  render: (args, context) => {
    const locale = (context.globals.locale ?? 'en') as SupportedLocale;
    return <CompoundInterestCalculator {...args} initialInput={goalSavingsInput(locale)} />;
  },
  args: { engine: 'tool' },
};

/**
 * Goal-Savings path-dependent variant — Phase D.3 opt-in toggle.
 * Surfaces a Forward / Retrospective tab toggle that activates the
 * path-dependent engine for non-USD locales (try pt-BR or de).
 */
export const GoalSavingsPathDependent: Story = {
  render: (args, context) => {
    const locale = (context.globals.locale ?? 'en') as SupportedLocale;
    return <CompoundInterestCalculator {...args} initialInput={goalSavingsInput(locale)} />;
  },
  args: { engine: 'tool', enablePathDependent: true },
};

/**
 * Lump-sum branch — cadence='oneTime' activates the calculator's lumpSum
 * code path. Useful for one-time-deposit scenarios.
 */
export const LumpSumMode: Story = {
  render: (args, context) => {
    const locale = (context.globals.locale ?? 'en') as SupportedLocale;
    return (
      <CompoundInterestCalculator
        {...args}
        initialInput={{ amount: 10000, cadence: 'oneTime', years: 20, initialAmount: 0, locale }}
      />
    );
  },
  args: { engine: 'tool' },
};

/**
 * Max contribution edge — exercises the upper bound of INPUT_BOUNDS.amount
 * (1,000,000 per Phase 6E). Confirms slider/input cap behavior at extreme
 * values; no formatting overflow.
 */
export const MaxContribution: Story = {
  render: (args, context) => {
    const locale = (context.globals.locale ?? 'en') as SupportedLocale;
    return (
      <CompoundInterestCalculator
        {...args}
        initialInput={{ amount: 1_000_000, cadence: 'monthly', years: 30, initialAmount: 0, locale }}
      />
    );
  },
  args: { engine: 'tool' },
};
