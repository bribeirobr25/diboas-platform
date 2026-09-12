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
              group: ['@/components/*'],
              message: 'VIEW-1: the dependency direction is components -> view, never back.',
            },
          ],
        },
      ],
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
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'decimal.js',
              message:
                'VIEW-2: components do not compute money. Derive it in `view/` and receive a display string.',
            },
            {
              name: '@/lib/ledgerClient',
              importNames: ['splitEntry', 'previewExit', 'previewGoalStop', 'previewPositionStop'],
              message:
                'VIEW-2: money helpers belong behind a selector, not in a component (splitEntry is called in a JSX prop today — the 5.230 shape). Actions and state reads remain fine.',
            },
            {
              name: '@diboas/investing',
              importNames: ['allocateByRule'],
              message:
                'VIEW-2: allocation arithmetic belongs in `view/`; the component renders the result.',
            },
          ],
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
    files: [
      'src/components/HomeScreen.tsx',
      'src/components/GoalRow.tsx',
      'src/components/GoalDetailScreen.tsx',
      'src/components/GoalCompletionScreen.tsx',
      'src/components/HistoryScreen.tsx',
      'src/components/WeeklyCycleScreen.tsx',
      'src/components/RecurringControl.tsx',
      'src/components/MoneyOut.tsx',
      'src/components/RulesBuilderScreen.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'decimal.js',
              message:
                'VIEW-2 (error): this surface is migrated. Derive money in `view/` and receive a display string.',
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
