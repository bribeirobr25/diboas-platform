import nextConfig from 'eslint-config-next';

/**
 * diBoaS Sandbox — ESLint flat config (mirrors the apps/web approach:
 * eslint-config-next native flat config, no FlatCompat).
 */
export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  /**
   * Gate `VIEW-1` — the purity of the view-model seam (architecture plan §3.2
   * rule 3, §9.3 mechanism 1).
   *
   * WHY: the seam's whole value is that it is testable with no DOM and no
   * network. A selector that reaches for React, a route, a provider or a
   * formatter is no longer a pure function of its arguments, and the honesty
   * assertions that live in `view/` stop being cheap to write — which is how
   * they end up not being written, and how money arithmetic drifts back into
   * components.
   *
   * `useFormatters` is banned on purpose even though it is harmless-looking: a
   * selector that formats has decided how a value is PRESENTED, which is the
   * component's job. Selectors return display-ready values (fixed-2dp strings),
   * never formatted ones.
   *
   * Orchestration fetches; selectors receive data as arguments.
   */
  {
    files: ['src/view/**/*.ts', 'src/view/**/*.tsx'],
    ignores: ['src/view/**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'VIEW-1: selectors are pure — no React in view/.' },
            { name: 'react-dom', message: 'VIEW-1: selectors are pure — no React in view/.' },
            {
              name: 'react-intl',
              message: "VIEW-1: formatting is the component's job, not the selector's.",
            },
            {
              name: '@/hooks/useFormatters',
              message: 'VIEW-1: selectors return display-ready values, never formatted ones.',
            },
          ],
          patterns: [
            {
              group: ['next', 'next/*'],
              message: 'VIEW-1: no framework in view/ — a selector must not know it is in Next.',
            },
            {
              group: ['@/lib/market', '@/lib/market/*'],
              message: 'VIEW-1: no I/O in view/ — orchestration fetches, selectors receive.',
            },
            {
              group: ['@/lib/ledgerClient', '@/lib/ledger/*'],
              message: 'VIEW-1: no ledger writes from a selector — view/ derives, never mutates.',
            },
            {
              /**
               * ⚑ 2026-09-14 — BYPASS 7, found by probing the gate rather than
               * reading it. The alias form was banned; the RELATIVE form was
               * not, so `import … from '../components/ApyChart'` inside a
               * selector linted CLEAN (proven with a control: `react` in the
               * same file errored, this did not). The lib bans already carried
               * their relative twins; this one did not, which is precisely the
               * asymmetry an author never notices in their own config.
               */
              group: ['@/components/*', '../components/*', '**/components/*'],
              message: 'VIEW-1: the dependency direction is components -> view, never back.',
            },
            /**
             * ⚑ ADDED 2026-09-14 — the auditor's bypasses (AUD-D01), each
             * reproduced on our own ESLint instrument before being fixed. The
             * rule was an import-NAME allowlist, so every path below passed.
             * `@/`-aliased forms were banned while the RELATIVE form of the same
             * module was not.
             */
            {
              group: ['../lib/ledgerClient', '../../lib/ledgerClient', '**/lib/ledgerClient'],
              message:
                'VIEW-1: no ledger writes from a selector — and the RELATIVE path is the same module as `@/lib/ledgerClient` (AUD-D01 bypass 3).',
            },
            {
              group: ['../lib/ledger/*', '../../lib/ledger/*', '**/lib/ledger/*'],
              message: 'VIEW-1: no ledger writes from a selector (relative form).',
            },
            {
              group: ['../lib/market', '../lib/market/*', '**/lib/market', '**/lib/market/*'],
              message: 'VIEW-1: no I/O in view/ (relative form).',
            },
            {
              group: ['node:*', 'fs', 'fs/*', 'path', 'http', 'https', 'net', 'child_process'],
              message:
                'VIEW-1: a selector performs no I/O — no node builtins in view/ (AUD-D01 bypass 2).',
            },
          ],
        },
      ],
      /**
       * The contract VIEW-1 NAMES but could not enforce: no I/O, no clock, no
       * mutation, deterministic. `no-restricted-imports` cannot express any of
       * these, which is why six sabotages produced no diagnostic. Verified
       * before writing: `src/view` (non-test) contains ZERO uses of `fetch`,
       * `import()`, `Date`, `Number(` or a relative import, so none of these
       * bans touches working code. `.toNumber()` — Decimal's own method — is
       * deliberately NOT banned.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            'VIEW-1: no I/O in view/ — orchestration fetches, selectors receive (AUD-D01 bypass 1).',
        },
        {
          selector: 'ImportExpression',
          message:
            'VIEW-1: no dynamic import in view/ — it defeats the static import ban (AUD-D01 bypass 4).',
        },
        {
          selector: "MemberExpression[object.name='Date']",
          message:
            'VIEW-1: a selector is deterministic — no clock reads. Pass the date in (AUD-D01 bypass 5).',
        },
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'VIEW-1: a selector is deterministic — no clock reads.',
        },
        {
          selector: "CallExpression[callee.name='Number']",
          message:
            'VIEW-1/VIEW-2: money is parsed with Decimal inside a try/catch, never through Number() — a float parse discards precision the comparison then claims (5.340).',
        },
      ],
      /**
       * Input mutation: a selector that edits its argument is not a function of
       * it (AUD-D01 bypass 6 — `state.amount += 1` produced no diagnostic).
       */
      'no-param-reassign': ['error', { props: true }],
    },
  },

  /**
   * Gate `VIEW-2` — money arithmetic stays out of components (architecture plan
   * §9.3 mechanism 1, Consolidated Handoff §9.2).
   *
   * SEQUENCING, ruled and deliberate: this lands `warn`, the six
   * `VALID · PRESERVE` money surfaces migrate behind `view/`, and only then does
   * it flip to `error` — before I-2 may merge. A warn state is NOT enforcement;
   * the interval is bounded to the I-1f migration slice. Turning it to `error`
   * first would break preserved screens, which is why the plan sequenced it.
   *
   * SCOPE, narrowed from the plan's shorthand after reading what components
   * actually import. Banning `@diboas/banking` or `@/lib/ledgerClient` wholesale
   * would break eleven files for no honesty gain, because components rightly
   * import TYPES (`GoalState`, `LedgerState`, `LedgerEvent`), fee CONSTANTS
   * (`FEE_RATES`, `EXIT_FEE_FLOOR`) and ACTIONS (`setRecurring`, `pauseGoal`,
   * `exitPosition`…). What must not happen in a component is COMPUTING money.
   * So the ban is: `decimal.js` outright, and the money helpers by NAME.
   *
   * `splitEntry` is the worked example of why this gate exists: it is called
   * inside a JSX prop at `GoalDetailScreen:730`, deriving the invested amount
   * mid-render — the shape that produced `5.230` (a net amount beside a gross
   * CTA). `allocateByRule` is the same class in `RulesBuilderScreen`.
   *
   * State READS are untouched: `useLedger()` is a read-only hook and components
   * must keep using it. This gate is about arithmetic, not access.
   */
  {
    files: ['src/components/**/*.ts', 'src/components/**/*.tsx'],
    ignores: ['src/components/**/__tests__/**', 'src/components/**/*.stories.tsx'],
    rules: {
      /**
       * ⚑ INVERTED 2026-09-14 (AUD-D02). This was `warn` for ALL components with
       * `error` for nine NAMED files — so a brand-new component got only a
       * warning, which the auditor demonstrated. Severity is now `error` by
       * default and the three I-5 `REPLACE` surfaces are listed as `warn`
       * exceptions BELOW. Default-deny, named exceptions — not the reverse.
       */
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'decimal.js',
              message:
                'VIEW-2: components do not compute money. Derive it in `view/` and receive a display string.',
            },
            {
              /**
               * ⚑ NARROWED 2026-09-14 to `previewExit` ALONE. This listed all
               * four helpers, which was harmless at `warn` and became a build
               * error the moment severity was inverted — promoting a DELIBERATE
               * exception into a failure. `splitEntry`, `previewGoalStop` and
               * `previewPositionStop` are the PASS-IN helpers: components hand
               * them to `selectEntrySplit` / `selectExitPreview` so the domain
               * function keeps one owner while the arithmetic leaves the
               * component. `previewExit` stays banned outright because nothing
               * passes it anywhere. The exception is enforced by the now
               * ALIAS-AWARE `view/__tests__/passInPattern.test.ts`, not by trust.
               */
              name: '@/lib/ledgerClient',
              importNames: ['previewExit'],
              message:
                'VIEW-2: exit previews are money derivations — compose them in `view/`. The three pass-in helpers are permitted and guarded by passInPattern.test.ts.',
            },
            {
              name: '@diboas/investing',
              /**
               * ⚑ `allocateByRule` is deliberately ABSENT from this list. It is
               * one of the four PASS-IN helpers: `RulesBuilderScreen` hands it to
               * `selectRulesPreview` (`allocate: allocateByRule`) and never calls
               * it, so the domain function keeps one owner while the arithmetic
               * leaves the component. Banning it here contradicted the exception
               * the block below documents — my own over-ban, caught when the
               * inverted severity turned it into a build error. The exception is
               * enforced by `view/__tests__/passInPattern.test.ts`, which is now
               * ALIAS-AWARE (AUD-D02): `splitEntry as calc; calc(…)` fails it.
               */
              importNames: [
                'replayEarnings',
                'replayLegged',
                'dailyFactorFromApyPercent',
                'ratesForSpan',
                'priceFactorsForSpan',
                'apyFactorsForSpan',
                'blendDatedSeries',
                'financialFreedomTarget',
                'emergencyFundTarget',
                'suggestedMonthlyContribution',
                'yearsToTarget',
              ],
              message:
                'VIEW-2: allocation, accrual and goal arithmetic belong in `view/`; the component renders the result.',
            },
            {
              /**
               * ⚑ ADDED 2026-09-14 (AUD-D02 bypass 2). `computeExitFee` imported
               * from `@diboas/banking` produced NO diagnostic. Verified first:
               * components import only FEE_RATES, EXIT_FEE_FLOOR and TYPES from
               * this package today, so naming the three money FUNCTIONS costs
               * nothing and closes the hole.
               */
              name: '@diboas/banking',
              importNames: ['computeAddMoneyFee', 'computeExitFee', 'computeStrategyEntryFee'],
              message:
                'VIEW-2: fee arithmetic belongs behind a selector. Constants (FEE_RATES, EXIT_FEE_FLOOR) and types remain fine.',
            },
          ],
        },
      ],
      /**
       * ⚑ AUD-D02 bypass 1: `Number(principal) + Number(accrued)` in a component
       * produced no diagnostic — native float arithmetic on money, which is the
       * exact class VIEW-2 names. Banned as a SHAPE: a Number() call on either
       * side of an arithmetic operator.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator=/^[-+*/]$/] > CallExpression[callee.name='Number']",
          message:
            'VIEW-2: money is not derived with native float arithmetic in a component. Derive it in `view/` and receive a display string (AUD-D02).',
        },
      ],
    },
  },

  /**
   * Gate `VIEW-2` at `error` — the MIGRATED surfaces (Consolidated Handoff §9.2,
   * Strategy review §8: "then = ERROR").
   *
   * Why a second block rather than flipping the rule above: three surfaces are
   * deliberately NOT migrated. `GoalNewScreen`, `GoalsListScreen` and
   * `StrategyPicker` are classified `REPLACE` for I-5 (`GL-01`, `GL-02`, the
   * Money Job Workspace), so migrating their internals now would be work the
   * plan explicitly sequences later — and flipping them to `error` would either
   * block the build or force three `eslint-disable` comments, which is a gate
   * that lies. They stay at `warn`: honest, visible debt.
   *
   * Everything migrated in I-1f is held at `error` here, so a regression in a
   * finished surface FAILS rather than warns. That is what makes the flip real:
   * a warn state is not enforcement.
   *
   * ⚑ THE PASS-IN EXCEPTION, and why it is the only coherent answer.
   * `splitEntry`, `allocateByRule`, `previewGoalStop` and `previewPositionStop`
   * are imported solely to be HANDED to a selector (`selectEntrySplit`,
   * `selectRulesPreview`, `selectExitPreview`) so the DOMAIN function keeps one
   * owner while the arithmetic leaves the component. None is called in a
   * component body.
   *
   * The alternative — having the selector import them itself — is closed by
   * `VIEW-1`, which bans `@/lib/ledger*` inside `view/**` to keep selectors
   * pure and I/O-free. So the choice is: name these four narrowly here, or
   * weaken one of the two gates. They are named.
   *
   * ⚠️ An exception is only safe while it stays an exception. `view/__tests__/
   * passInPattern.test.ts` asserts that each of these four appears in a
   * component ONLY as a value passed to a `select*(...)` call — never invoked
   * directly. Without that, this list would be the escape hatch that hollows
   * out the rule it sits inside.
   *
   * `previewExit` stays banned outright: nothing passes it anywhere, so there
   * is no pattern to permit.
   */
  {
    /**
     * ⚑ INVERTED 2026-09-14. This used to be the nine MIGRATED surfaces held at
     * `error` while everything else warned. It is now the three surfaces
     * classified `REPLACE` for I-5 (`GL-01`, `GL-02`, the Money Job Workspace),
     * held at `warn` as honest, visible debt — while every other component,
     * including any new one, errors by default above.
     */
    files: [
      'src/components/GoalNewScreen.tsx',
      'src/components/GoalsListScreen.tsx',
      'src/components/StrategyPicker.tsx',
    ],
    rules: {
      /**
       * ⚑ The syntax rule must be `warn` here too. It is `error` by default in
       * the block above, and these three surfaces are I-5 `REPLACE` debt — so
       * leaving it at error broke the build on `GoalNewScreen` the moment it was
       * added, which is the same over-ban as the pass-in names. Honest, visible
       * debt: a warning that names the class, not a failure that blocks work the
       * plan sequences later.
       */
      'no-restricted-syntax': [
        'warn',
        {
          selector: "BinaryExpression[operator=/^[-+*/]$/] > CallExpression[callee.name='Number']",
          message:
            'VIEW-2 (I-5 REPLACE surface): native float arithmetic on money — registered debt, migrates with this surface.',
        },
      ],
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'decimal.js',
              message:
                'VIEW-2 (I-5 REPLACE surface): this surface computes money today. Registered debt — migrates with the surface.',
            },
            {
              name: '@/lib/ledgerClient',
              importNames: ['previewExit'],
              message:
                'VIEW-2 (error): exit previews are money derivations — compose them in `view/`.',
            },
          ],
        },
      ],
    },
  },
];
