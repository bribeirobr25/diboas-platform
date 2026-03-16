# Goal Calculator — Wizard Redesign Plan

**Date:** 2026-03-15
**Updated:** 2026-03-15 (CMO + CTO board feedback incorporated)
**Status:** Implemented — all verification passed (type-check, lint, test, build)
**Motivation:** The current GoalCalculator uses a tab-based layout with all inputs visible at once. The CTO board identified that the PreDream wizard pattern delivers a better UX — progressive disclosure, one decision per screen, animated transitions, and a focused user journey. This plan adapts the PreDream wizard approach to the GoalCalculator while preserving all existing math, analytics, and accessibility.

---

## Evaluation: PreDream Wizard vs Current GoalCalculator

### Current GoalCalculator UX Problems

1. **Cognitive overload** — All 4+ inputs (goal amount, initial deposit, monthly deposit, risk tier) plus segmented controls appear simultaneously. First-time users see a dense form.
2. **No content transition** — Switching tabs (Christmas/Emergency/Vacation) causes instant layout jumps with no animation. Emergency has 3x more fields than Christmas, causing abrupt card height changes.
3. **Result card disconnected** — The result appears below the input card, requiring a scroll. On mobile, it sticks to the bottom with no dismiss — obscuring content underneath.
4. **No progress indication** — Users have no sense of how far along they are or how many steps remain.
5. **Tab switching resets result but not inputs** — Confusing: a user's Christmas budget value persists when switching to Vacation, but the result disappears.
6. **No "wow moment"** — Unlike PreDream's simulation animation, the GoalCalculator reveal is a simple fade-in of a card with numbers.

### PreDream Wizard Strengths to Adopt

| Pattern | PreDream Implementation | Benefit |
|---------|------------------------|---------|
| **One decision per screen** | 7 screens, each with a single purpose | Reduces cognitive load |
| **Screen-to-screen transitions** | 300ms fadeIn (opacity + translateY) on every screen change | Smooth, polished feel |
| **Progress indication** | Linear flow with Back/Next navigation | Users know where they are |
| **Slider inputs** | Range sliders with editable number inputs for amounts | More tactile, mobile-friendly |
| **Path selection cards** | Tappable cards with color-coded visual identity | Goal selection becomes engaging |
| **Simulation animation** | 3s rAF counter + progress ring + floating particles | "Wow moment" builds anticipation |
| **Centered narrow column** | Max-width 448px, vertically centered | Focused, app-like feel |
| **useReducer state machine** | Centralized state with typed actions | Predictable flow control |

### Key Differences to Preserve

| GoalCalculator Requirement | PreDream Equivalent | Adaptation Needed |
|---------------------------|---------------------|-------------------|
| **Inline section** (not modal) | Full-screen fixed overlay | Embed wizard inside section container, not fixed overlay |
| **3 goal types** | 3 investment paths | Goal selection screen replaces path selection |
| **Tab-specific fields** | Same inputs for all paths | Conditional fields per goal (Christmas = salary, Emergency = expenses + coverage + timeline, Vacation = budget + date) |
| **Auto-calculated monthly** | Manual slider input | Keep auto-calculation but show it on a dedicated screen with override option |
| **3-scenario result** | 2-card comparison (diBoaS vs bank) | Keep 3-scenario table in a results screen |
| **Risk tier selection** | No equivalent | Add as its own step |
| **Config-driven i18n** | react-intl direct | Keep `useConfigTranslation(config)` pattern |

---

## Proposed Wizard Flow

The wizard uses **adaptive step counts** per goal type (CMO Concern 1). Christmas Bonus — the default and most common path — is the fastest at 5 steps. Emergency and Vacation keep 6 steps because they require additional user input.

```
                        Christmas (5 steps)              Emergency / Vacation (6 steps)
                        ──────────────────               ────────────────────────────────
Step 1:                 Goal Selection                   Goal Selection
Step 2:                 Salary + Timeline (combined)     Goal Amount
Step 3:                 —                                Timeline & Details
Step 3/4:               Deposit & Risk                   Deposit & Risk
Step 4/5:               Simulation                       Simulation
Step 5/6:               Results                          Results
```

### Screen Details

**Step 1 — Goal Selection** (analogous to PreDream PathSelectorScreen)
- Headline: "What are you building?" + subtitle: "Pick a goal. We'll show you a path." (from canonical copy doc)
- 3 tappable cards: Christmas Bonus, Emergency Fund, Vacation Money
- Each card: icon + title + one-line description + teal accent
- Color coding: teal intensity variations using the brand palette (see CSS Token Strategy)
  - Christmas: `--color-teal-50` bg / `--color-teal-200` border (lightest — default, most brand-aligned)
  - Emergency: `--color-teal-100` bg / `--color-teal-300` border (medium)
  - Vacation: `--color-teal-50` bg with warm tint / `--color-teal-400` border (darkest)
- Tapping a card advances to Step 2 (selection = navigation, like PreDream)
- Layout: `screenContent` pattern (centered column, max-width 448px)

**Step 2 — Goal Amount** (analogous to PreDream InputScreen, but goal-specific)
- Christmas: **Combined with timeline** (see Step 2+3 below)
- Emergency: "What are your monthly expenses?" — slider + editable input
- Vacation: "How much do you want to save?" — slider + editable input
- Slider config: min/max/step per goal type (e.g., expenses: $500–$15,000, vacation: $500–$20,000)
- Back button → Step 1, Next button → Step 3

**Step 2+3 (Christmas only) — Salary & Timeline** (combined per CMO Concern 1)
- "What's your annual salary?" — slider + editable input (salary: $12,000–$240,000)
- Below the slider: computed target and timeline displayed as an info card with a subtle CSS `fadeIn`:
  - "Your target: {salary/12}. {months} months until December {year}."
  - If rolled over to next year, show rollover notice inline
- One screen, one input, computed values shown as confirmation — not a separate step
- Back → Step 1, Next → Step 4 (Deposit & Risk)

**Step 3 — Timeline & Details** (Emergency and Vacation only)
- Emergency: Coverage selector (3/4/6 months segmented control) + Timeline selector (6/9/12/18 months segmented control). Two decisions on one screen (acceptable — they're tightly coupled).
- Vacation: Month/year picker + computed months display. Show warning if <3 months away.
- Back → Step 2, Next → Step 4

**Step 4 — Deposit & Risk** (combines PreDream InputScreen sliders + new risk selector)
- Initial deposit: slider + editable input (same PreDream pattern)
- Monthly deposit: auto-calculated value displayed prominently with "Suggested: {amount}/month" label. Editable input below for override. Visual lock/unlock state (lock icon when auto, unlocked when overridden).
- **Start-smaller escape hatch** (CMO Concern 2): when the auto-calculated monthly exceeds the locale-specific smaller amount, show an inline link below the monthly deposit: "More than you expected? [Start with {smallerAmount}/month]". Tapping it sets the monthly to the smaller amount and visually unlocks the input. This catches intimidation at the moment it happens, before the user commits through the simulation.
- Risk tier: 3 tappable cards using teal intensity variations (matching goal cards):
  - Careful (7% expected): shield icon, lightest teal accent
  - Moderate (10% expected): chart icon, medium teal accent
  - Aggressive (15% expected): lightning icon, darkest teal accent
- One-month edge case: if months=1, auto-select Careful, disable others, show info notice
- Big commitment warning (Christmas): show inline if monthly > 50% of salary/12
- Back → Step 3 (or Step 2+3 for Christmas), Next → Step 5

**Step 5 — Simulation** (adapted from PreDream SimulationScreen)
- Simplified version: 2-second animation (not 3s — GoalCalculator is less dramatic than DreamMode)
- Counter animates from initial deposit to expected scenario value
- Progress ring shows completion
- Label: "Calculating your {goal} plan..."
- No floating particles (keep it cleaner for an inline section vs a full-screen modal)
- Auto-advances to Step 6 after animation completes
- Background: subtle gradient (section-bg-neutral → white), not the full teal gradient

**Step 6 — Results** (adapted from current GoalCalculatorResultCard + PreDream ResultsScreen)
- Headline: per-goal template (e.g., "Your Christmas Bonus plan")
- Plan line: "Deposit {monthly}/month for {months} months"
- 3-scenario table: Good / Expected / Bad (keep current styling with gradient rows)
- Bad-case loss warning (amber) if applicable
- Start-smaller toggle (kept from current implementation — also available on Step 4 per CMO Concern 2)
- Primary CTA: "Start this goal" → scrolls to waitlist
- Secondary links: "How it works" | "Risks" → scroll to FAQ
- "Try a different goal" → reset to Step 1 (Phase 2 enhancement: save result + compare, see below)
- Disclaimer: "We're showing you a range, not a promise." — exact copy from spec

---

## Architecture

### Component Structure

```
GoalCalculator/
  GoalCalculator.tsx                    # Root: section wrapper + WizardProvider + WizardContent
  GoalCalculatorWizard.tsx              # Screen switch + transitions + focus management
  GoalCalculatorProvider.tsx            # Context + useReducer state machine
  goalCalculatorReducer.ts              # Pure reducer (typed actions, adaptive screen flow)
  screens/
    GoalSelectionScreen.tsx             # Step 1: goal cards
    GoalAmountScreen.tsx                # Step 2: goal-specific slider (Christmas: combined with timeline)
    TimelineScreen.tsx                  # Step 3: goal-specific timeline/details (Emergency + Vacation only)
    DepositRiskScreen.tsx               # Step 4: deposits + risk tier + start-smaller
    SimulationScreen.tsx                # Step 5: animation
    ResultsScreen.tsx                   # Step 6: scenarios + CTAs
  GoalCalculator.module.css            # Single CSS module (PreDream pattern)
  goalCalculatorFormulas.ts            # UNCHANGED — pure math
  goalCalculatorConstants.ts           # UNCHANGED — risk tiers, locale amounts, events
  goalCalculatorTypes.ts               # Updated with wizard state types
  useGoalCalculatorState.ts            # REMOVED — replaced by Provider + reducer
  GoalCalculatorInputs.tsx             # REMOVED — replaced by per-screen components
  GoalCalculatorSharedFields.tsx       # REMOVED — replaced by DepositRiskScreen
  GoalCalculatorResultCard.tsx         # REMOVED — replaced by ResultsScreen
  index.ts                             # Barrel export (unchanged API)
```

### State Machine (reducer pattern from PreDream)

```typescript
type GoalCalculatorScreen =
  | 'goalSelection'
  | 'goalAmount'       // Emergency + Vacation: amount only. Christmas: amount + timeline combined.
  | 'timeline'         // Emergency + Vacation only. Christmas skips this screen.
  | 'depositRisk'
  | 'simulation'
  | 'results';

interface GoalCalculatorState {
  screen: GoalCalculatorScreen;
  activeGoal: GoalTab | null;          // 'christmas' | 'emergency' | 'vacation'

  // Inputs (raw strings for locale-aware editing)
  field1Raw: string;
  initialDepositRaw: string;
  monthlyDepositRaw: string;
  isMonthlyOverridden: boolean;
  riskTierIndex: RiskTierIndex;

  // Goal-specific
  emergencyCoverage: EmergencyCoverage;
  emergencyTimeline: EmergencyTimeline;
  vacationDate: Date;

  // Animation
  isAnimating: boolean;

  // Result
  result: ScenarioSet | null;
  isStartSmaller: boolean;
}

type GoalCalculatorAction =
  | { type: 'SELECT_GOAL'; goal: GoalTab }
  | { type: 'SET_FIELD1'; value: string }
  | { type: 'SET_INITIAL_DEPOSIT'; value: string }
  | { type: 'SET_MONTHLY_DEPOSIT'; value: string }
  | { type: 'SET_RISK_TIER'; index: RiskTierIndex }
  | { type: 'SET_COVERAGE'; coverage: EmergencyCoverage }
  | { type: 'SET_TIMELINE'; timeline: EmergencyTimeline }
  | { type: 'SET_VACATION_DATE'; date: Date }
  | { type: 'START_SIMULATION'; result: ScenarioSet }
  | { type: 'FINISH_SIMULATION' }
  | { type: 'TOGGLE_START_SMALLER' }
  | { type: 'GO_TO_SCREEN'; screen: GoalCalculatorScreen }
  | { type: 'GO_NEXT' }               // Adaptive: advances based on activeGoal
  | { type: 'GO_BACK' }               // Adaptive: retreats based on activeGoal
  | { type: 'RESET' };
```

**Adaptive flow logic in reducer:**

```typescript
// GO_NEXT handler
case 'GO_NEXT': {
  const nextScreen = getNextScreen(state.screen, state.activeGoal);
  return { ...state, screen: nextScreen };
}

function getNextScreen(current: GoalCalculatorScreen, goal: GoalTab | null): GoalCalculatorScreen {
  switch (current) {
    case 'goalSelection': return 'goalAmount';
    case 'goalAmount':
      // Christmas combines amount + timeline → skip to depositRisk
      return goal === 'christmas' ? 'depositRisk' : 'timeline';
    case 'timeline':     return 'depositRisk';
    case 'depositRisk':  return 'simulation';
    case 'simulation':   return 'results';
    default:             return current;
  }
}
```

### Transition & Animation (adopted from PreDream)

Reuse PreDream's `fadeIn` keyframe pattern:

```css
.screenContainer > div {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .screenContainer > div {
    animation: none;
  }
}
```

Every screen change triggers a fresh mount → automatic fade-in. No explicit transition management needed.

### Focus Management — Inline Section, NOT Modal (CTO Item 2)

PreDream uses `role="dialog" aria-modal="true"` with focus-to-first-element on screen change. The GoalCalculator wizard is an **inline section**, not a modal — using modal ARIA attributes would be a WCAG violation (screen readers would announce a dialog context that doesn't exist, and focus trapping would break page navigation).

**Correct implementation for the inline wizard:**

```tsx
// In GoalCalculatorWizard.tsx
const containerRef = useRef<HTMLDivElement>(null);

// Focus first focusable element on screen change (same useEffect as PreDream lines 55-65)
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length > 0) focusable[0].focus();
}, [screen]);

// Container markup — NO role="dialog", NO aria-modal
<div ref={containerRef}>
  <div aria-live="polite">  {/* Announces content changes to screen readers */}
    {renderScreen()}
  </div>
</div>
```

**Key differences from PreDream:**
- `aria-live="polite"` on screen container (announces changes without trapping focus)
- NO `role="dialog"` — this is not a dialog
- NO `aria-modal="true"` — focus must not be trapped within the section
- NO `onKeyDown` Escape handler — there's nothing to close
- Same `querySelectorAll` + `focus()` pattern for progressive focus management

### Critical Difference: Inline Section vs Full-Screen Modal

PreDream uses `position: fixed; inset: 0` (full-screen overlay). The GoalCalculator must remain an **inline section** on the B2C landing page. This changes the container approach:

```css
/* GoalCalculator — inline section, NOT a modal */
.section {
  width: 100%;
  padding: var(--padding-section-mobile-y) var(--padding-section-mobile-x);
  background-color: var(--section-bg-neutral);
}

.wizardContainer {
  max-width: 448px;         /* Same as PreDream */
  margin: 0 auto;
  min-height: 520px;        /* Prevents layout shift — calibrate after visual QA */
  position: relative;
  display: flex;
  align-items: center;      /* Vertically center shorter screens within min-height */
}
```

The `min-height` is critical — it prevents the page from jumping as different screens have different content heights. This is a departure from PreDream where the full-screen overlay absorbs height changes. Shorter screens (GoalSelection, Simulation) are vertically centered within the container via `align-items: center`.

**CTO Item 1: min-height must be measured, not assumed.** The 520px starting value is a conservative estimate. DepositRiskScreen (3 sliders + risk cards + start-smaller link) is likely the tallest screen and may exceed 520px on iPhone SE (375px width). Implementation must:
1. Build all 6 screens first
2. Measure the tallest one at 375px viewport width
3. Set `min-height` to that value plus section padding
4. Verify no layout shift on screen transitions at all breakpoints

### Side-Pocket Strip Visual Continuity (CMO Concern 5)

The Side-Pocket Strip (Section 2) sits directly above the GoalCalculator (Section 3) in the page flow. Both sections should share `--section-bg-neutral` as their background color with no visible separator (no border, no shadow, no color change). The strip's message — "This isn't about your whole financial life. It's about the part that could be doing more." — flows naturally into the wizard's "What are you building?" headline. They should read as one continuous thought.

Implementation: ensure no `margin-top` or `border-top` on `.section`. The section padding provides the only visual gap. If needed, the strip's bottom padding can be reduced to tighten the transition.

### Mobile Sticky Navigation (CMO Concern 6)

On mobile, wizard navigation buttons (Back / Next) must be sticky at the bottom of the viewport, always visible without scrolling. This is standard mobile wizard UX and prevents the "Next button below the fold" problem.

```css
.wizardNavigation {
  display: flex;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-md) 0;
}

@media (max-width: 767px) {
  .wizardNavigation {
    position: sticky;
    bottom: 0;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-lg);
    background: linear-gradient(transparent, var(--section-bg-neutral) 24%);
    z-index: var(--z-dropdown, 40);
  }
}
```

The gradient background (`transparent → section-bg-neutral`) prevents a hard visual edge while ensuring button readability over scrolled content behind it. On tablet/desktop (≥768px), buttons are inline in the flow — no sticky behavior needed.

### Slider Input Pattern (adopted from PreDream InputScreen)

Replace the current text-input-only pattern with PreDream's slider+input combo:

```css
.sliderCard {
  width: 100%;
  padding: var(--spacing-xl);
  background: var(--section-bg-white);
  border: 1px solid var(--color-slate-200, #e2e8f0);
  border-radius: var(--radius-2xl);
}

.rangeSlider {
  width: 100%;
  height: 12px;
  -webkit-appearance: none;
  background: var(--color-slate-200, #e2e8f0);
  border-radius: 6px;
  outline: none;
}

.rangeSlider::-webkit-slider-thumb {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--cta-bg-primary);
  cursor: pointer;
  -webkit-appearance: none;
}
```

This gives users a tactile, mobile-friendly way to explore values while still allowing precise number entry.

**Keyboard accessibility for sliders:** Native `<input type="range">` handles arrow keys (value adjustment), Home/End (min/max), and Tab (focus movement) automatically. The editable number input sits in the natural Tab order after the slider. Each element gets a distinct `aria-label` for screen readers (e.g., "Annual salary slider" and "Annual salary amount") even though they update the same state value.

### Goal Selection Cards (adapted from PreDream PathSelectorScreen)

```css
.goalCard {
  width: 100%;
  padding: var(--spacing-xl);
  border: 2px solid transparent;
  border-radius: var(--radius-2xl);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.goalCard:hover {
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08));
}

/* Goal-specific color coding — teal intensity variations (CMO Concern 4) */
.goalChristmas { background: var(--color-teal-50,  #f0fdfa); border-color: var(--color-teal-200, #99f6e4); }
.goalEmergency { background: var(--color-teal-100, #ccfbf1); border-color: var(--color-teal-300, #5eead4); }
.goalVacation  { background: var(--color-teal-50,  #f0fdfa); border-color: var(--color-teal-400, #2dd4bf); }
```

All three cards use the diBoaS teal palette — no off-brand colors introduced. Visual differentiation comes from teal intensity (lighter → darker borders), distinct icons, and copy.

---

## CSS Token Strategy

The current GoalCalculator CSS uses proper design tokens (good). The PreDream CSS hard-codes many values (bad). The redesigned wizard should:

1. **Use design tokens everywhere** — follow GoalCalculator's existing token discipline, not PreDream's hard-coded values
2. **Adopt PreDream's layout primitives** — `screenContent`, `screenCard`, `screenHeader` patterns but defined via tokens
3. **Keep the 448px max-width** — matches PreDream's focused column width
4. **Keep the teal brand palette** — via `--cta-bg-primary`, `--cta-bg-hover`, `--color-teal-*`, not hard-coded hex
5. **Fix the `--font-size-xxs` bug** — use `--font-size-xs` (12px) for fine print, which actually exists in the token system
6. **Goal cards use teal intensity** — `--color-teal-50` through `--color-teal-400` for differentiation within brand
7. **Shared primitives over per-screen variants (CTO Item 3)** — PreDream achieves 7 screens in ~300 lines of CSS by defining shared classes (`.screenContent`, `.screenCard`, `.sliderCard`, `.buttonRow`, `.primaryButton`, `.secondaryButton`) and composing them per screen. The GoalCalculator wizard must follow the same pattern. Target: **400-500 lines**, not 750. Define ~15 shared primitives:

```
/* Layout */        .screenContent, .screenCard, .screenHeader, .screenTitle, .screenSubtitle
/* Inputs */        .sliderCard, .sliderHeader, .sliderLabel, .rangeSlider, .sliderRange, .sliderValueInput
/* Navigation */    .wizardNavigation, .primaryButton, .secondaryButton, .backButton
/* Cards */         .goalCard, .tierCard, .infoNotice, .warningNotice
/* Scenarios */     .scenarioTable, .scenarioRow, .scenarioRowHighlight
```

Screens compose these — e.g., GoalSelectionScreen uses `.screenContent` + `.screenHeader` + `.goalCard`. No screen should need more than 2-3 screen-specific classes. If a screen needs many custom classes, the primitives need refactoring.

---

## i18n Changes

New keys under `landing-b2c.goalCalculator.*`:

```
goalCalculator.wizard.goalSelection.title          "What are you building?"
goalCalculator.wizard.goalSelection.subtitle       "Pick a goal. We'll show you a path."
goalCalculator.wizard.goals.christmas.title
goalCalculator.wizard.goals.christmas.description
goalCalculator.wizard.goals.emergency.title
goalCalculator.wizard.goals.emergency.description
goalCalculator.wizard.goals.vacation.title
goalCalculator.wizard.goals.vacation.description
goalCalculator.wizard.goalAmount.title.christmas
goalCalculator.wizard.goalAmount.title.emergency
goalCalculator.wizard.goalAmount.title.vacation
goalCalculator.wizard.goalAmount.christmasInfo      "Your target: {target}. {months} months until December {year}."
goalCalculator.wizard.timeline.title.emergency
goalCalculator.wizard.timeline.title.vacation
goalCalculator.wizard.depositRisk.title
goalCalculator.wizard.depositRisk.suggestedMonthly  "Suggested: {amount}/month"
goalCalculator.wizard.depositRisk.startSmaller      "More than you expected? Start with {amount}/month"
goalCalculator.wizard.simulation.label              "Calculating your {goal} plan..."
goalCalculator.wizard.results.tryDifferent          "Try a different goal"
goalCalculator.wizard.results.disclaimer            "We're showing you a range, not a promise."
goalCalculator.wizard.navigation.back
goalCalculator.wizard.navigation.next
goalCalculator.wizard.navigation.simulate
```

Existing keys (`goalCalculator.content.*`, `goalCalculator.tiers.*`, `goalCalculator.helpers.*`) are retained and reused.

**Locale coverage:** New keys are added to `en/landing-b2c.json` first. DE/ES/PT-BR translations must be added before launch — cross-reference the existing `docs/post-launch/GOAL_CALCULATOR_LOCALIZED_COPY_DE_ES_PTBR.md` for any existing wizard translations and extend it with the new keys. The `pnpm validate:translations` script will flag missing keys. Vacation date display (`vacationDate` formatting) must use `Intl.DateTimeFormat` with the active locale for month/year rendering (e.g., "Dezember 2026" in DE, "dezembro de 2026" in pt-BR).

---

## Error Handling (Principle #7)

The original plan was silent on error handling. This section specifies the required patterns.

### Formula Error Recovery

The `START_SIMULATION` action dispatcher calls `computeScenarios()` from `goalCalculatorFormulas.ts`. While the formulas are well-tested, edge cases (e.g., division by zero if `months = 0` slips past validation) must not crash the wizard:

```typescript
// In GoalCalculatorProvider.tsx — startSimulation dispatcher
const startSimulation = useCallback(() => {
  if (state.isAnimating || !state.activeGoal) return;
  try {
    const scenarios = computeScenarios(initialDeposit, effectiveMonthly, months, tierIndex);
    dispatch({ type: 'START_SIMULATION', result: scenarios });
  } catch (error) {
    // Log to Sentry, reset to goal selection
    import('@/lib/errors/ErrorReportingService').then(({ errorReportingService }) => {
      errorReportingService.reportError(error instanceof Error ? error : new Error('Scenario computation failed'), {
        context: 'GoalCalculator.startSimulation',
        metadata: { goal: state.activeGoal, months, tierIndex },
      });
    }).catch(() => {});
    dispatch({ type: 'RESET' });
  }
}, [state, months, tierIndex, initialDeposit, effectiveMonthly]);
```

### Reducer Error State

The reducer's `default` case returns current state unchanged (no crash). If an unexpected action is dispatched, the wizard remains functional.

### Error Boundary

The GoalCalculator already sits inside a `SectionErrorBoundary` in `page.tsx` (verified: `sectionId="goal-calculator-section-b2c"`). This catches catastrophic render failures and shows a fallback UI. No additional inner error boundary is needed — the per-section boundary is the right granularity for a marketing section.

### Sentry Breadcrumbs

Each screen transition should add a Sentry breadcrumb for debugging production issues:

```typescript
// In GoalCalculatorProvider.tsx — goToScreen/goNext/goBack dispatchers
import('@/lib/errors/ErrorReportingService').then(({ errorReportingService }) => {
  errorReportingService.addBreadcrumb({
    category: 'goal-calculator',
    message: `Screen: ${screen}`,
    level: 'info',
  });
}).catch(() => {});
```

---

## Input Validation & Security (Principle #8)

All editable number inputs (salary, expenses, vacation budget, initial deposit, monthly deposit) must be validated and sanitized. The existing `useGoalCalculatorState.ts` applied `e.target.value.replace(/[^0-9.,]/g, '')` — this regex sanitization must be carried into the reducer or the dispatch handlers.

### Validation Rules

| Input | Min | Max | Sanitization |
|-------|-----|-----|-------------|
| Salary (Christmas) | 12,000 | 1,200,000 | Strip non-numeric except `.` and `,` |
| Monthly expenses (Emergency) | 500 | 50,000 | Strip non-numeric except `.` and `,` |
| Vacation budget | 500 | 100,000 | Strip non-numeric except `.` and `,` |
| Initial deposit | 0 | 1,000,000 | Strip non-numeric except `.` and `,` |
| Monthly deposit | 0 | 50,000 | Strip non-numeric except `.` and `,` |

### Editable Number Input Bounds

Sliders enforce min/max via `<input type="range" min={...} max={...}>`. The paired editable `<input type="number">` must also enforce bounds:

```tsx
<input
  type="number"
  min={config.min}
  max={config.max}
  value={value}
  onChange={(e) => {
    const clamped = Math.max(config.min, Math.min(config.max, parseInt(e.target.value) || 0));
    dispatch({ type: 'SET_FIELD1', value: String(clamped) });
  }}
/>
```

### Vacation Date Validation

`SET_VACATION_DATE` must validate:
- Date is parseable (year and month are valid numbers)
- Date is not in the past
- Date is within 10 years from today

---

## SSR Safety

The reducer initial state includes `vacationDate`. A `new Date()` call produces different values on server vs client, causing a React hydration mismatch.

**Fix:** Initialize `vacationDate` to `null` in the initial state. Compute the "6 months from today" default on the client only, using the `useReducer` lazy initializer:

```typescript
const initialState: GoalCalculatorState = {
  screen: 'goalSelection',
  activeGoal: null,
  vacationDate: null,   // Computed client-side to avoid SSR mismatch
  // ... other fields with static defaults
};

// In GoalCalculatorProvider.tsx
const [state, dispatch] = useReducer(
  goalCalculatorReducer,
  initialState,
  (init) => ({
    ...init,
    vacationDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
  })
);
```

The lazy initializer runs once on mount (client-side only during hydration), avoiding the server/client date divergence.

**Note:** The `initialState` constant must be hoisted to module scope (not defined inline in the component) per React Performance Guidelines.

---

## SimulationScreen — Reduced Motion & rAF Cleanup (Principles #9, #11)

### Reduced Motion Handling

When `prefers-reduced-motion: reduce` is active, the CSS `fadeIn` animation is disabled. But the SimulationScreen's `rAF` counter animation and auto-advance are JavaScript-driven. The screen must detect reduced motion and skip the animation entirely:

```typescript
// In SimulationScreen.tsx
useEffect(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Skip animation, advance immediately
    dispatch({ type: 'FINISH_SIMULATION' });
    return;
  }

  // Normal animation: rAF loop
  const startTime = performance.now();
  const duration = 2000;
  let rafId: number;

  const animate = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    setDisplayValue(lerp(startValue, endValue, easeOutCubic(progress)));

    if (progress < 1) {
      rafId = requestAnimationFrame(animate);
    } else {
      dispatch({ type: 'FINISH_SIMULATION' });
    }
  };

  rafId = requestAnimationFrame(animate);

  // Cleanup: cancel rAF on unmount (Principle #11)
  return () => cancelAnimationFrame(rafId);
}, []);
```

### rAF Cleanup

The `rAF` loop stores its animation frame ID in a local variable and cancels it in the `useEffect` cleanup. This prevents state updates on unmounted components if the user navigates away mid-animation (e.g., via browser back button or a future escape mechanism). The `displayValue` uses `useState` (not a ref) since it drives the UI counter display.

---

## Accessibility — Additional Requirements (WCAG 2.1 AA)

### Goal Cards Must Be Native `<button>` Elements

Per CLAUDE.md: "All interactive elements: native `<button>` or `<a>` (never `div role='button'`)." Goal selection cards, risk tier cards, and all tappable cards must be rendered as `<button>` elements:

```tsx
<button
  type="button"
  className={`${styles.goalCard} ${styles.goalChristmas}`}
  onClick={() => dispatch({ type: 'SELECT_GOAL', goal: 'christmas' })}
>
  {/* icon + title + description */}
</button>
```

### Form Groups: `<fieldset>` + `<legend>`

Per CLAUDE.md and WCAG 1.3.1 (Info and Relationships), grouped radio-like controls must use `<fieldset>` + `<legend>`:

- **Risk tier selector** (3 cards): wrap in `<fieldset>` with `<legend>Risk level</legend>`
- **Emergency coverage selector** (3/4/6 months): wrap in `<fieldset>` with `<legend>Coverage period</legend>`
- **Emergency timeline selector** (6/9/12/18 months): wrap in `<fieldset>` with `<legend>Target timeline</legend>`

Each option within uses `aria-pressed` (for button-based toggles) or `role="radio"` + `aria-checked` (for radio-like behavior).

### Step Progress Announcement

Without a visible progress bar, screen reader users have no context for which step they're on. The `aria-live="polite"` region should include step context:

```tsx
<div aria-live="polite" aria-atomic="true">
  <span className="sr-only">
    Step {currentStepNumber} of {totalSteps}:
  </span>
  {renderScreen()}
</div>
```

Where `currentStepNumber` and `totalSteps` are computed from the adaptive flow (Christmas: 5 steps, Emergency/Vacation: 6 steps).

---

## Testing Requirements

The original plan specified no new tests. This section corrects that.

### Reducer Unit Tests (`__tests__/goalCalculatorReducer.test.ts`)

Required coverage (target: 100% — this is business logic):

```
should advance Christmas from goalAmount directly to depositRisk (skip timeline)
should advance Emergency from goalAmount to timeline
should advance Vacation from goalAmount to timeline
should go back from depositRisk to goalAmount for Christmas (skip timeline)
should go back from depositRisk to timeline for Emergency
should go back from depositRisk to timeline for Vacation
should reset all state on RESET action
should set isStartSmaller on TOGGLE_START_SMALLER
should set isAnimating on START_SIMULATION
should clear isAnimating and advance to results on FINISH_SIMULATION
should sanitize field1 input (strip non-numeric characters)
should clamp values within bounds on SET_INITIAL_DEPOSIT
should set isMonthlyOverridden on SET_MONTHLY_DEPOSIT
should auto-select Careful tier when months is 1
```

### SimulationScreen Timer Tests

Test that the rAF animation calls `FINISH_SIMULATION` after the expected duration and that cleanup cancels the animation frame. Use `vi.useFakeTimers()` and `vi.spyOn(window, 'requestAnimationFrame')`.

### Migration Verification

Confirm that no existing test files target the 4 removed files (`useGoalCalculatorState.ts`, `GoalCalculatorInputs.tsx`, `GoalCalculatorSharedFields.tsx`, `GoalCalculatorResultCard.tsx`). If any exist, port the test assertions to the new reducer/screen tests.

### Existing Formula Tests

`goalCalculatorFormulas.test.ts` remains unchanged — all existing tests pass without modification.

---

## Component Pattern Note

The GoalCalculator intentionally does not follow the Factory pattern with `variants/` directories. The Factory pattern is designed for display components with swappable visual variants (e.g., `HeroDefault` vs `HeroFullBackground`). The GoalCalculator is a complex stateful wizard with a single visual implementation — a Factory wrapper would add indirection with no benefit. This is consistent with PreDream, which also uses a flat structure without a Factory.

**Storybook:** A `GoalCalculator.stories.tsx` file should be created showing each wizard screen in isolation. Each screen can be rendered inside a mock `GoalCalculatorProvider` with preset state values. This enables design QA and regression testing without navigating through the full wizard flow.

---

## Analytics Events

Existing events from `goalCalculatorConstants.ts` are preserved. New event constants must be added to `goalCalculatorConstants.ts` under `GOAL_CALCULATOR_EVENTS` (never hardcode event names in components):

| Constant | Event Name | Trigger | Payload |
|----------|-----------|---------|---------|
| `SCREEN_VIEW` | `goal_calculator_screen_view` | Each screen mount | `{ screen, goal, locale, timestamp }` |
| `GOAL_SELECTED` | `goal_calculator_goal_selected` | Goal card tapped (Step 1) | `{ goal, locale, timestamp }` |
| `SIMULATION_STARTED` | `goal_calculator_simulation_started` | Step 5 begins | `{ goal, tier, initialDeposit, monthlyDeposit, months, locale, timestamp }` |
| `START_SMALLER_EARLY` | `goal_calculator_start_smaller_early` | "Start smaller" tapped on Step 4 | `{ goal, previousMonthly, newMonthly, locale, timestamp }` |
| `BACK_NAVIGATED` | `goal_calculator_back_navigated` | Back button pressed | `{ fromScreen, toScreen, goal, locale, timestamp }` |
| `COMPLETED` | `goal_calculator_completed` | Results screen mounted | `{ goal, tier, expectedValue, months, locale, timestamp }` |

**All payloads include `locale` and `timestamp`** per analytics integration guide Best Practices. Back-navigation events track which screen causes hesitation. The `COMPLETED` event marks funnel completion (analogous to PreDream's `dream_simulation_completed`).

These follow the same PostHog lazy-loading pattern (consent-gated, behind `enableAnalytics` prop).

---

## Migration Strategy

### Public API Unchanged

The external interface stays identical:

```tsx
<GoalCalculator config={B2C_GOAL_CALCULATOR_CONFIG} enableAnalytics={true} />
```

No changes needed in `page.tsx`, `landing-b2c.ts`, or `Sections/index.ts`.

### Files to Create

| File | Lines (est.) | Source Pattern |
|------|-------------|----------------|
| `GoalCalculatorProvider.tsx` | ~100 | PreDreamProvider.tsx |
| `goalCalculatorReducer.ts` | ~90 | preDreamReducer.ts (with adaptive flow logic) |
| `GoalCalculatorWizard.tsx` | ~80 | PreDream.tsx (inner content) |
| `screens/GoalSelectionScreen.tsx` | ~80 | PathSelectorScreen.tsx |
| `screens/GoalAmountScreen.tsx` | ~110 | InputScreen.tsx (Christmas: combined with timeline info card) |
| `screens/TimelineScreen.tsx` | ~100 | (new — Emergency/Vacation only) |
| `screens/DepositRiskScreen.tsx` | ~140 | InputScreen.tsx + GoalCalculatorSharedFields.tsx + start-smaller |
| `screens/SimulationScreen.tsx` | ~70 | SimulationScreen.tsx (simplified) |
| `screens/ResultsScreen.tsx` | ~130 | GoalCalculatorResultCard.tsx |
| `screens/index.ts` | ~10 | PreDream screens/index.ts |

### Files to Modify

| File | Change |
|------|--------|
| `GoalCalculator.tsx` | Rewrite: section wrapper + Provider + WizardContent (~40 lines, down from 256) |
| `GoalCalculator.module.css` | Rewrite: wizard layout primitives + mobile sticky nav (~450 lines, see CTO Item 3) |
| `goalCalculatorTypes.ts` | Add wizard state types, screen type, action type |

### Files to Remove

| File | Reason |
|------|--------|
| `useGoalCalculatorState.ts` | Replaced by Provider + reducer |
| `GoalCalculatorInputs.tsx` | Replaced by GoalAmountScreen + TimelineScreen |
| `GoalCalculatorSharedFields.tsx` | Replaced by DepositRiskScreen |
| `GoalCalculatorResultCard.tsx` | Replaced by ResultsScreen |

### Files Unchanged

| File | Reason |
|------|--------|
| `goalCalculatorFormulas.ts` | Pure math — no UI coupling |
| `goalCalculatorConstants.ts` | Risk tiers, events — still needed |
| `index.ts` | Barrel export — same public API |

---

## Implementation Sequence

1. **goalCalculatorTypes.ts** — Add wizard state, screen, and action types
2. **goalCalculatorReducer.ts** — Pure reducer with adaptive screen flow logic (Christmas skips timeline)
3. **GoalCalculatorProvider.tsx** — Context + useReducer + action dispatchers
4. **GoalCalculator.module.css** — Full rewrite with wizard layout primitives, mobile sticky nav, teal palette cards
5. **screens/** — Build all 6 screens:
   - GoalSelectionScreen (Step 1)
   - GoalAmountScreen (Step 2 — Christmas: combined salary + timeline info card)
   - TimelineScreen (Step 3 — Emergency/Vacation only)
   - DepositRiskScreen (Step 4 — includes start-smaller escape hatch)
   - SimulationScreen (Step 5)
   - ResultsScreen (Step 6)
6. **GoalCalculatorWizard.tsx** — Screen switch + fadeIn transitions + focus management
7. **GoalCalculator.tsx** — Rewrite as thin wrapper (section + Provider + Wizard)
8. **Remove old files** — useGoalCalculatorState.ts, GoalCalculatorInputs.tsx, GoalCalculatorSharedFields.tsx, GoalCalculatorResultCard.tsx
9. **i18n keys** — Add new wizard keys to `en/landing-b2c.json`
10. **Verify** — type-check, lint, test, build, visual QA

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Wizard feels too long for a landing page section | Low (was Medium) | Christmas is 5 steps (CMO fix). Emergency/Vacation are 6 but each step is one decision. Total time: ~25-35 seconds. |
| min-height causes empty space on short screens | Low | Set min-height to tallest screen. Use `align-items: center` to vertically center shorter screens. |
| Losing tab-switching flexibility (can't quickly compare goals) | Low | "Try a different goal" on results screen. Phase 2: save + compare pattern (see below). |
| Simulation animation feels forced for a calculator | Medium | Keep it brief (2s vs PreDream's 3s). Make it feel purposeful: "Calculating your plan..." Skip entirely if `prefers-reduced-motion: reduce`. |
| Formula tests break | None | `goalCalculatorFormulas.ts` is unchanged. All existing tests pass without modification. |
| Page layout shift when wizard height changes | Low | `min-height` on container + CSS-animated transitions. |
| Monthly amount intimidates user before simulation | Low (was Medium) | Start-smaller escape hatch on Step 4 catches intimidation at the moment it happens (CMO fix). |
| Goal card colors clash with page palette | None (was Low) | Teal intensity variations stay fully on-brand (CMO fix). |
| Mobile Next button below the fold | None (was unaddressed) | Sticky bottom navigation on mobile (CMO fix). |

---

## Phase 2 Enhancements (flagged, not in scope)

### Save + Compare Goals (CMO Concern 3)

When a user completes one goal and taps "Try a different goal," their result is saved in state. After completing a second goal, both results are shown side by side:

> "Your Christmas Bonus: $2,960 by December.
> Your Emergency Fund: $4,500 in 12 months."

**Why Phase 2:** Requires a `savedResults: GoalResult[]` array, a new comparison view component, and mobile layout decisions for displaying 2-3 result cards. Adds ~3 hours of work and needs its own design review. The Phase 1 wizard is fully functional without this — "Try a different goal" simply resets to Step 1.

**State machine addition for Phase 2:**
```typescript
| { type: 'SAVE_AND_TRY_ANOTHER' }  // saves current result, resets to goalSelection
```

### Auto-Calculation Visual Feedback (CMO Addition 2)

When the user enters their salary on Step 2 (Christmas), the computed target (`salary/12`) could counter-animate from 0 to the target value for a brief "my number" moment. Current plan uses a simple CSS `fadeIn` on the info card — sufficient for Phase 1 but a counter animation adds polish.

---

## Effort Estimate

| Phase | Effort |
|-------|--------|
| Types + reducer + provider (with adaptive flow) | 1.5 hours |
| CSS rewrite (shared primitives, mobile sticky nav, teal cards) | 2 hours |
| 6 screen components (GoalAmount handles combined Christmas view) | 3 hours |
| Wizard orchestrator + GoalCalculator rewrite | 1 hour |
| i18n keys | 30 min |
| Cleanup old files | 15 min |
| Verification + visual QA | 1 hour |
| **Total** | **~9.5 hours** |

---

## Principles Alignment

| Principle | How This Plan Aligns |
|-----------|---------------------|
| #1 Domain-Driven Design | Goal selection as first-class screen; each goal's unique fields on dedicated screens; adaptive flow per goal type |
| #2 Event-Driven Architecture | Analytics events fire in action dispatchers (event handlers, not effects) |
| #3 Service Agnostic Abstraction | Config-driven via `GoalCalculatorConfig`; formulas pure and UI-agnostic |
| #4 Code Reusability & DRY | Slider card, goal card, and button row patterns reused across screens |
| #6 File Decoupling | Each screen ≤140 lines; Provider ≤100; Wizard ≤80. No file exceeds 150. |
| #8 Security & Audit | Input sanitization via regex (existing pattern); no new user-facing API surfaces |
| #9 Performance & SEO | No new dependencies; animation uses rAF (not setInterval); CSS-only transitions; reduced-motion respected |
| #10 Product KPIs & Analytics | New `screen_view`, `goal_selected`, and `start_smaller_early` events add funnel visibility |
| Accessibility (WCAG 2.1 AA) | Focus management on screen change (PreDream pattern); `aria-live` on results; keyboard navigation (Back/Next, slider arrows/Home/End); Tab order between slider and number input; reduced motion; WCAG contrast maintained |

---

## Board Feedback — Resolution Tracker

### CTO Board

| # | Item | Resolution | Status |
|---|------|-----------|--------|
| 1 | min-height needs measurement, not assumption | Changed to 520px starting point; added post-build calibration step at 375px width | Incorporated |
| 2 | Focus management: inline section ≠ modal | Detailed implementation added: `aria-live="polite"`, NO `role="dialog"`, NO `aria-modal`, NO focus trap. Same `querySelectorAll` + `focus()` pattern as PreDream but without modal ARIA. | Incorporated |
| 3 | CSS ~750 lines is too large | Reduced target to 400-500 lines. Added shared primitives strategy (~15 composable classes). PreDream achieves 7 screens in ~300 lines — 6 simpler screens should not exceed 500. | Incorporated |

### CMO Board

| # | Concern | Resolution | Status |
|---|---------|-----------|--------|
| 1 | Six steps too long for Christmas | Christmas combines Steps 2+3 into one screen (5-step flow) | Incorporated |
| 2 | Start-smaller placement | Added to Step 4 (DepositRiskScreen) in addition to Step 6 | Incorporated |
| 3 | Try-different-goal loses results | Flagged as Phase 2 "Save + Compare" enhancement | Deferred |
| 4 | Goal card colors clash | Changed to teal intensity variations using brand palette | Incorporated |
| 5 | Side-Pocket Strip interaction | Shared `--section-bg-neutral` background, no separator | Incorporated |
| 6 | Mobile sticky CTA | Sticky bottom navigation with gradient fade on mobile | Incorporated |
| A1 | Empty state / first impression | Headline + subtitle added to GoalSelectionScreen from canonical copy | Incorporated |
| A2 | Loading state for auto-calculations | CSS `fadeIn` for Phase 1; counter animation flagged for Phase 2 | Incorporated (Phase 1) |
| A3 | Keyboard accessibility on sliders | Noted: native `<input type="range">` handles arrow/Home/End; Tab order specified | Incorporated |
| A4 | Disclaimer copy | Exact copy from spec added to ResultsScreen and i18n keys | Incorporated |
