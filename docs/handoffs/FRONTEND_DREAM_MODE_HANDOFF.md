# diBoaS Frontend — Dream Mode & Future You Calculator Handoff

**Document Purpose:** Complete specification for Claude Code to implement Dream Mode and Future You Calculator in the diboas-platform Next.js application
**Created:** December 30, 2025
**Created By:** CTO Board (Claude Web Interface)
**For:** Claude Code Implementation (Separate Session from Analytics)

---

## IMPORTANT: Pre-Implementation Checklist

Before implementing any features, Claude Code must confirm understanding of the existing project. Use this prompt:

```
Can you confirm you have a full understanding of my project and that you already understood each of the below points:

1. You should already be aware of what this project does, what technologies it uses, where the main entry point is, and how the folder structure is organized.

2. You have read all documentation at docs/*.md entirely, even if long or numerous, and you understood all the guidance and compliance requirements.

3. You have already checked the current implementation file by file: code, configuration, styles, README files, assets - everything, regardless of length or quantity.

4. You have already examined all sections: ProductCarousel, FeatureShowcase, AppFeaturesCarousel, OneFeature, FAQAccordion implementations, and all code inside apps/web/src/ including the design token system, and you understood how everything is working.

5. You have checked deeply the Navigation & Footer components, the complete lib/ directory, and all UI components as well as the implementation of the internationalization features.

6. You have checked deeply the SEO module, testing setup, deployment/infrastructure, API routes (if any), and database layer (if any).

7. You have checked and understood how the entire code is taking care of security measures according to the project documentation.

8. You have checked and fully understood how the project is implementing all the 12 principles below:
   8.1. Domain-Driven Design (DDD)
   8.2. Event-Driven Architecture
   8.3. Service Agnostic Abstraction Layer
   8.4. Code Reusability & DRY
   8.5. Semantic Naming Conventions
   8.6. File Decoupling & Organization
   8.7. Error Handling & System Recovery
   8.8. Security & Audit Standards
   8.9. Performance & SEO Optimization
   8.10. Product KPIs & Analytics
   8.11. Concurrency & Race Condition Prevention
   8.12. Monitoring & Observability

Please confirm your understanding of each point and flag any areas where you need clarification or further review.
```

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Feature Overview](#2-feature-overview)
3. [Project Structure](#3-project-structure)
4. [Dream Mode Implementation](#4-dream-mode-implementation)
5. [Future You Calculator Implementation](#5-future-you-calculator-implementation)
6. [Dream Card Generation](#6-dream-card-generation)
7. [Data Integration](#7-data-integration)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Animation Specifications](#9-animation-specifications)
10. [CLO Compliance Requirements](#10-clo-compliance-requirements)
11. [Analytics Events](#11-analytics-events)
12. [Accessibility Requirements](#12-accessibility-requirements)
13. [Testing Requirements](#13-testing-requirements)

---

# 1. EXECUTIVE SUMMARY

## What to Build

| Feature | Description | Target User | Priority |
|---------|-------------|-------------|----------|
| **Dream Mode** | Strategy simulation with historical data | Waitlist users (logged in) | P0 |
| **Future You Calculator** | Compound growth calculator | Anonymous visitors | P1 |
| **Dream Card** | Shareable image with results | All users | P0 (part of Dream Mode) |

## Source Specifications

| Board | Document | Key Content |
|-------|----------|-------------|
| **Innovation Board** | Innovation_Dream_Mode_Specification.md | UX flows, screens, animations, behavioral triggers |
| **CMO Board** | CMO_Dream_Mode_Specification.md | Copy (4 languages), visual direction, Dream Card design |
| **CLO Board** | CLO_Dream_Mode_Specification.md | Disclaimers, regional detection, legal requirements |

## Timeline

| Day | Deliverable |
|-----|-------------|
| Day 1 | Project understanding + component architecture |
| Day 2 | Future You Calculator (simpler, standalone) |
| Day 3-4 | Dream Mode screens 0-3 |
| Day 5 | Dream Mode screen 4 + Dream Card generation |
| Day 6 | Testing, polish, i18n verification |

---

# 2. FEATURE OVERVIEW

## 2.1 Dream Mode Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DREAM MODE v0.1 — USER FLOW                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ENTRY (waitlist users only)                                          │
│     │                                                                   │
│     ▼                                                                   │
│   ┌──────────────┐                                                      │
│   │  SCREEN 0    │  Disclaimer Gate (CLO Required)                     │
│   │  "I understand"                                                     │
│   └──────┬───────┘                                                      │
│          │                                                              │
│          ▼                                                              │
│   ┌──────────────┐                                                      │
│   │  SCREEN 1    │  Invitation — "What if your money worked for you?" │
│   │  "Let me see"                                                       │
│   └──────┬───────┘                                                      │
│          │                                                              │
│          ▼                                                              │
│   ┌──────────────┐                                                      │
│   │  SCREEN 2    │  Choose Your Path (Safety / Balance / Growth)       │
│   │  Select card                                                        │
│   └──────┬───────┘                                                      │
│          │                                                              │
│          ▼                                                              │
│   ┌──────────────┐                                                      │
│   │  SCREEN 3    │  Set Your Amount (€50 - €10,000 slider)            │
│   │  "Watch it grow"                                                    │
│   └──────┬───────┘                                                      │
│          │                                                              │
│          ▼                                                              │
│   ┌──────────────┐                                                      │
│   │  SCREEN 4    │  Watch It Grow + Bank Comparison                    │
│   │  Time controls: 1W / 1M / 1Y / 5Y                                   │
│   └──────┬───────┘                                                      │
│          │                                                              │
│          ├──► "Share My Dream" → SCREEN 5 (Dream Card Modal)           │
│          │                                                              │
│          └──► "Try Another Path" → Back to SCREEN 2                    │
│                                                                         │
│   POST-FLOW: Waitlist position reveal toast                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Future You Calculator Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FUTURE YOU CALCULATOR — USER FLOW                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ENTRY (anonymous visitors — landing page section)                    │
│     │                                                                   │
│     ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  Monthly amount slider (€5 - €500)                           │     │
│   │  Years selector (5, 10, 15, 20 years)                        │     │
│   │                                                               │     │
│   │  Result: "€20/month for 20 years → €X with diBoaS"           │     │
│   │  Comparison: "Your bank would give you €Y"                   │     │
│   │                                                               │     │
│   │  CTA: "Join the waitlist to make this real"                  │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 3. PROJECT STRUCTURE

## 3.1 New Files to Create

```
apps/web/src/
├── app/
│   └── [locale]/
│       └── (marketing)/
│           ├── dream-mode/
│           │   └── page.tsx                    # Dream Mode entry page
│           └── page.tsx                        # Add Future You Calculator section
│
├── components/
│   ├── DreamMode/
│   │   ├── index.ts                           # Barrel export
│   │   ├── DreamModeProvider.tsx              # Context for Dream Mode state
│   │   ├── DisclaimerGate.tsx                 # Screen 0
│   │   ├── Invitation.tsx                     # Screen 1
│   │   ├── PathSelector.tsx                   # Screen 2
│   │   ├── AmountSlider.tsx                   # Screen 3
│   │   ├── GrowthVisualization.tsx            # Screen 4
│   │   ├── DreamCardModal.tsx                 # Screen 5
│   │   ├── WaitlistReveal.tsx                 # Post-flow toast
│   │   ├── ProgressDots.tsx                   # Navigation indicator
│   │   ├── SimulationWatermark.tsx            # CLO-required watermark
│   │   └── hooks/
│   │       ├── useDreamModeState.ts           # State management
│   │       ├── useDreamCalculations.ts        # Growth calculations
│   │       └── useRegionalDisclaimer.ts       # CLO region detection
│   │
│   ├── FutureYouCalculator/
│   │   ├── index.ts                           # Barrel export
│   │   ├── FutureYouCalculator.tsx            # Main component
│   │   ├── MonthlySlider.tsx                  # Amount input
│   │   ├── YearsSelector.tsx                  # Time horizon
│   │   └── ResultDisplay.tsx                  # Growth visualization
│   │
│   └── DreamCard/
│       ├── index.ts                           # Barrel export
│       ├── DreamCardGenerator.tsx             # Canvas-based card generation
│       ├── DreamCardPreview.tsx               # Preview component
│       ├── ShareButtons.tsx                   # Social share buttons
│       └── templates/
│           └── dreamCardTemplate.ts           # Card layout definition
│
├── lib/
│   ├── dream-mode/
│   │   ├── types.ts                           # TypeScript interfaces
│   │   ├── calculations.ts                    # Growth math
│   │   ├── constants.ts                       # Path definitions, colors
│   │   ├── regional-detection.ts              # CLO region logic
│   │   └── analytics.ts                       # Event tracking
│   │
│   └── data/
│       └── dream_mode_data.json               # From analytics app (static for now)
│
└── messages/
    ├── en/
    │   └── dream-mode.json                    # English translations
    ├── de/
    │   └── dream-mode.json                    # German translations
    ├── pt-BR/
    │   └── dream-mode.json                    # Portuguese translations
    └── es/
        └── dream-mode.json                    # Spanish translations
```

## 3.2 Integration Points

| Existing Component | Integration |
|-------------------|-------------|
| `Navigation` | Add "Dream Mode" link (logged-in users only) |
| `WaitingList` | Trigger Dream Mode entry after signup |
| `InteractiveDemo` | Add "Try Dream Mode" CTA on screen 5 |
| Landing page | Add Future You Calculator section |

---

# 4. DREAM MODE IMPLEMENTATION

## 4.1 DreamModeProvider (Context)

```typescript
// components/DreamMode/DreamModeProvider.tsx

import { createContext, useContext, useState, ReactNode } from 'react';

interface DreamModeState {
  currentScreen: number;  // 0-5
  disclaimerAccepted: boolean;
  selectedPath: 'safety' | 'balance' | 'growth' | null;
  amount: number;
  selectedTimeframe: '1_week' | '1_month' | '1_year' | '5_years';
  calculatedResult: number | null;
  bankResult: number | null;
}

interface DreamModeContextType {
  state: DreamModeState;
  setScreen: (screen: number) => void;
  acceptDisclaimer: () => void;
  selectPath: (path: 'safety' | 'balance' | 'growth') => void;
  setAmount: (amount: number) => void;
  setTimeframe: (timeframe: '1_week' | '1_month' | '1_year' | '5_years') => void;
  reset: () => void;
}

const initialState: DreamModeState = {
  currentScreen: 0,
  disclaimerAccepted: false,
  selectedPath: null,
  amount: 500,  // Default €500
  selectedTimeframe: '1_year',
  calculatedResult: null,
  bankResult: null,
};

const DreamModeContext = createContext<DreamModeContextType | undefined>(undefined);

export function DreamModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DreamModeState>(initialState);

  const setScreen = (screen: number) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  };

  const acceptDisclaimer = () => {
    // Store acceptance timestamp for CLO compliance
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dream_disclaimer_accepted', new Date().toISOString());
    }
    setState(prev => ({ ...prev, disclaimerAccepted: true, currentScreen: 1 }));
  };

  const selectPath = (path: 'safety' | 'balance' | 'growth') => {
    setState(prev => ({ ...prev, selectedPath: path, currentScreen: 3 }));
  };

  const setAmount = (amount: number) => {
    setState(prev => ({ ...prev, amount }));
  };

  const setTimeframe = (timeframe: '1_week' | '1_month' | '1_year' | '5_years') => {
    setState(prev => ({ ...prev, selectedTimeframe: timeframe }));
  };

  const reset = () => {
    setState({ ...initialState, disclaimerAccepted: true, currentScreen: 2 });
  };

  return (
    <DreamModeContext.Provider value={{
      state,
      setScreen,
      acceptDisclaimer,
      selectPath,
      setAmount,
      setTimeframe,
      reset,
    }}>
      {children}
    </DreamModeContext.Provider>
  );
}

export function useDreamMode() {
  const context = useContext(DreamModeContext);
  if (context === undefined) {
    throw new Error('useDreamMode must be used within a DreamModeProvider');
  }
  return context;
}
```

## 4.2 Screen 0: Disclaimer Gate

```typescript
// components/DreamMode/DisclaimerGate.tsx

'use client';

import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDreamMode } from './DreamModeProvider';
import { useRegionalDisclaimer } from './hooks/useRegionalDisclaimer';
import { SimulationWatermark } from './SimulationWatermark';

export function DisclaimerGate() {
  const intl = useIntl();
  const { acceptDisclaimer } = useDreamMode();
  const { disclaimerType, disclaimerText, enhancedDisclaimer } = useRegionalDisclaimer();
  const [isChecked, setIsChecked] = useState(false);

  const handleAccept = () => {
    if (isChecked) {
      // Track analytics
      window.dispatchEvent(new CustomEvent('dream_disclaimer_accepted', {
        detail: { locale: intl.locale, disclaimer_type: disclaimerType }
      }));
      acceptDisclaimer();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <SimulationWatermark />
      
      <div className="mx-4 max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="text-4xl">⚠️</span>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">
            {intl.formatMessage({ id: 'dream.disclaimer.headline' })}
          </h2>
        </div>

        {/* Disclaimer Text */}
        <div className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <p className="whitespace-pre-line">{disclaimerText}</p>
          
          {/* Enhanced disclaimer for US/Brazil */}
          {enhancedDisclaimer && (
            <div className="mt-4 border-t border-slate-200 pt-4 text-amber-700">
              <p className="whitespace-pre-line">{enhancedDisclaimer}</p>
            </div>
          )}
        </div>

        {/* Checkbox */}
        <label className="mb-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-700">
            {intl.formatMessage({ id: 'dream.disclaimer.checkbox' })}
          </span>
        </label>

        {/* CTA Button */}
        <button
          onClick={handleAccept}
          disabled={!isChecked}
          className={`w-full rounded-xl py-4 text-lg font-semibold transition-all ${
            isChecked
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'cursor-not-allowed bg-slate-200 text-slate-400'
          }`}
        >
          {intl.formatMessage({ id: 'dream.disclaimer.cta' })}
        </button>
      </div>
    </div>
  );
}
```

## 4.3 Screen 2: Path Selector

```typescript
// components/DreamMode/PathSelector.tsx

'use client';

import { useIntl } from 'react-intl';
import { motion } from 'framer-motion';
import { useDreamMode } from './DreamModeProvider';
import { PATH_CONFIG } from '@/lib/dream-mode/constants';

const pathCards = [
  { id: 'safety', icon: '🛡️', color: 'blue' },
  { id: 'balance', icon: '⚖️', color: 'purple' },
  { id: 'growth', icon: '🚀', color: 'red' },
] as const;

export function PathSelector() {
  const intl = useIntl();
  const { selectPath } = useDreamMode();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-semibold text-slate-900"
      >
        {intl.formatMessage({ id: 'dream.paths.headline' })}
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12 text-center text-lg text-slate-600"
      >
        {intl.formatMessage({ id: 'dream.paths.subhead' })}
      </motion.p>

      {/* Path Cards */}
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-3">
        {pathCards.map((path, index) => (
          <motion.button
            key={path.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectPath(path.id)}
            className={`group rounded-2xl border-2 border-transparent bg-white p-6 text-left shadow-lg transition-all hover:border-${path.color}-500`}
          >
            <span className="mb-4 block text-4xl">{path.icon}</span>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              {intl.formatMessage({ id: `dream.paths.${path.id}.name` })}
            </h3>
            <p className="text-sm text-slate-600">
              {intl.formatMessage({ id: `dream.paths.${path.id}.description` })}
            </p>
            
            {/* Risk indicator */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {intl.formatMessage({ id: `dream.paths.${path.id}.risk` })}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

## 4.4 Screen 4: Growth Visualization

```typescript
// components/DreamMode/GrowthVisualization.tsx

'use client';

import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useDreamMode } from './DreamModeProvider';
import { useDreamCalculations } from './hooks/useDreamCalculations';

const timeframes = ['1_week', '1_month', '1_year', '5_years'] as const;

export function GrowthVisualization() {
  const intl = useIntl();
  const { state, setTimeframe } = useDreamMode();
  const { calculateGrowth, bankComparison } = useDreamCalculations();
  
  const [displayValue, setDisplayValue] = useState(state.amount);
  const result = calculateGrowth(state.amount, state.selectedPath!, state.selectedTimeframe);
  const bankResult = bankComparison(state.amount, state.selectedTimeframe);

  // Animated counter
  useEffect(() => {
    const controls = animate(displayValue, result, {
      duration: 2.5,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
      onUpdate: (v) => setDisplayValue(v),
    });
    return () => controls.stop();
  }, [result]);

  const difference = result - bankResult;
  const percentageGain = ((result - state.amount) / state.amount) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        {/* Starting amount */}
        <div className="mb-2 text-center text-sm text-slate-500">
          {intl.formatMessage({ id: 'dream.results.started_with' })} €{state.amount.toLocaleString()}
        </div>

        {/* Main result */}
        <div className="mb-6 text-center">
          <motion.div
            className="relative inline-block text-6xl font-bold text-slate-900"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            €{displayValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            
            {/* Completion glow */}
            {displayValue === result && (
              <motion.div
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: [0, 0.5, 0], scale: [1, 1.02, 1] }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 rounded-lg bg-teal-400 blur-xl"
              />
            )}
          </motion.div>
          
          {/* Percentage gain */}
          <div className="mt-2 text-lg font-medium text-teal-600">
            +{percentageGain.toFixed(1)}%
          </div>
        </div>

        {/* Timeframe buttons */}
        <div className="mb-6 flex justify-center gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                state.selectedTimeframe === tf
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {intl.formatMessage({ id: `dream.results.timeframe.${tf}` })}
            </button>
          ))}
        </div>

        {/* Bank comparison */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {intl.formatMessage({ id: 'dream.results.bank_comparison' })}
            </span>
            <span className="text-sm text-slate-500">
              €{bankResult.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-teal-600">
              {intl.formatMessage({ id: 'dream.results.more_with_diboas' })}
            </span>
            <span className="text-sm font-bold text-teal-600">
              +€{difference.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          {/* Bank source footnote (CLO required) */}
          <p className="mt-3 text-xs text-slate-400">
            {intl.formatMessage({ id: 'dream.results.bank_source' })}
          </p>
        </div>
      </motion.div>

      {/* CTAs */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => {/* Open share modal */}}
          className="rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-teal-700"
        >
          {intl.formatMessage({ id: 'dream.results.share_cta' })}
        </button>
        <button
          onClick={() => {/* Reset to path selection */}}
          className="rounded-xl border-2 border-slate-200 px-8 py-4 text-lg font-semibold text-slate-700 transition-all hover:border-slate-300"
        >
          {intl.formatMessage({ id: 'dream.results.try_another' })}
        </button>
      </div>
    </div>
  );
}
```

---

# 5. FUTURE YOU CALCULATOR IMPLEMENTATION

```typescript
// components/FutureYouCalculator/FutureYouCalculator.tsx

'use client';

import { useState } from 'react';
import { useIntl } from 'react-intl';
import { motion, animate } from 'framer-motion';

const BANK_RATE = 0.005;  // 0.5% APY
const DIBOAS_RATE = 0.095; // 9.5% (Safety path average)

export function FutureYouCalculator() {
  const intl = useIntl();
  const [monthly, setMonthly] = useState(20);
  const [years, setYears] = useState(20);
  const [displayValue, setDisplayValue] = useState(0);

  // Calculate compound growth with monthly contributions
  const calculateFutureValue = (monthlyAmount: number, annualRate: number, years: number) => {
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    // FV = PMT × ((1 + r)^n - 1) / r
    return monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  };

  const diboasResult = calculateFutureValue(monthly, DIBOAS_RATE, years);
  const bankResult = calculateFutureValue(monthly, BANK_RATE, years);
  const difference = diboasResult - bankResult;
  const totalContributed = monthly * years * 12;

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-24">
      <div className="mx-auto max-w-4xl px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-slate-900">
            {intl.formatMessage({ id: 'future_you.headline' })}
          </h2>
          <p className="text-xl text-slate-600">
            {intl.formatMessage({ id: 'future_you.subhead' })}
          </p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-white p-8 shadow-xl"
        >
          {/* Monthly Amount Slider */}
          <div className="mb-8">
            <label className="mb-4 flex items-center justify-between">
              <span className="text-lg font-medium text-slate-700">
                {intl.formatMessage({ id: 'future_you.monthly_label' })}
              </span>
              <span className="text-2xl font-bold text-teal-600">€{monthly}</span>
            </label>
            <input
              type="range"
              min={5}
              max={500}
              step={5}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
            />
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>€5</span>
              <span>€500</span>
            </div>
          </div>

          {/* Years Selector */}
          <div className="mb-8">
            <label className="mb-4 block text-lg font-medium text-slate-700">
              {intl.formatMessage({ id: 'future_you.years_label' })}
            </label>
            <div className="flex gap-3">
              {[5, 10, 15, 20].map((y) => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className={`flex-1 rounded-xl py-3 text-lg font-semibold transition-all ${
                    years === y
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {y} {intl.formatMessage({ id: 'future_you.years' })}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-teal-100 p-6">
            <div className="mb-4 text-center">
              <p className="mb-2 text-sm text-slate-600">
                {intl.formatMessage({ id: 'future_you.result_intro' }, { monthly, years })}
              </p>
              <motion.p
                key={diboasResult}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold text-teal-600"
              >
                €{diboasResult.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
              </motion.p>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-slate-500">
                  {intl.formatMessage({ id: 'future_you.you_contributed' })}
                </p>
                <p className="font-semibold text-slate-700">
                  €{totalContributed.toLocaleString('de-DE')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">
                  {intl.formatMessage({ id: 'future_you.bank_gave' })}
                </p>
                <p className="font-semibold text-slate-700">
                  €{bankResult.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-teal-600">
                  {intl.formatMessage({ id: 'future_you.difference' })}
                </p>
                <p className="font-bold text-teal-600">
                  +€{difference.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button className="mt-6 w-full rounded-xl bg-teal-600 py-4 text-lg font-semibold text-white transition-all hover:bg-teal-700">
            {intl.formatMessage({ id: 'future_you.cta' })}
          </button>

          {/* Disclaimer (CLO required) */}
          <p className="mt-4 text-center text-xs text-slate-400">
            {intl.formatMessage({ id: 'future_you.disclaimer' })}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
```

---

# 6. DREAM CARD GENERATION

## 6.1 Canvas-Based Card Generator

```typescript
// components/DreamCard/DreamCardGenerator.tsx

'use client';

import { useRef, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useRegionalDisclaimer } from '../DreamMode/hooks/useRegionalDisclaimer';

interface DreamCardProps {
  path: 'safety' | 'balance' | 'growth';
  startAmount: number;
  endAmount: number;
  timeframe: string;
  bankAmount: number;
  locale: string;
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

export function DreamCardGenerator({
  path,
  startAmount,
  endAmount,
  timeframe,
  bankAmount,
  locale,
}: DreamCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intl = useIntl();
  const { cardDisclaimer } = useRegionalDisclaimer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(1, '#1E293B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Watermark badge (top-right) - CLO REQUIRED
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('⚠️ SIMULATION', CARD_WIDTH - 40, 50);

    // Main headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      intl.formatMessage({ id: 'dream.share.card.headline' }),
      CARD_WIDTH / 2,
      150
    );

    // Amount transition
    ctx.font = 'bold 72px system-ui';
    ctx.fillStyle = '#14B8A6';
    ctx.fillText(
      `€${startAmount.toLocaleString()} → €${endAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
      CARD_WIDTH / 2,
      280
    );

    // "SIMULATION" overlay on amount - CLO REQUIRED
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 24px system-ui';
    ctx.fillText('SIMULATION', CARD_WIDTH / 2, 320);
    ctx.globalAlpha = 1;

    // Timeframe and path
    ctx.fillStyle = '#94A3B8';
    ctx.font = '24px system-ui';
    ctx.fillText(
      `${path.charAt(0).toUpperCase() + path.slice(1)} path • ${timeframe}`,
      CARD_WIDTH / 2,
      380
    );

    // Bank comparison
    ctx.font = '20px system-ui';
    ctx.fillText(
      intl.formatMessage(
        { id: 'dream.share.card.bank_gave' },
        { amount: bankAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) }
      ),
      CARD_WIDTH / 2,
      430
    );

    // Divider line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 480);
    ctx.lineTo(CARD_WIDTH - 100, 480);
    ctx.stroke();

    // Footer disclaimer - CLO REQUIRED (embedded in image)
    ctx.fillStyle = '#64748B';
    ctx.font = '14px system-ui';
    ctx.fillText(cardDisclaimer, CARD_WIDTH / 2, 530);

    // diBoaS branding
    ctx.fillStyle = '#14B8A6';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText('diboas.com | #WhileISlept', CARD_WIDTH / 2, 580);

  }, [path, startAmount, endAmount, timeframe, bankAmount, locale, cardDisclaimer, intl]);

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `dream_card_${locale}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        className="max-w-full rounded-xl shadow-xl"
      />
      <button
        onClick={downloadCard}
        className="mt-4 w-full rounded-xl bg-slate-800 py-3 font-semibold text-white"
      >
        {intl.formatMessage({ id: 'dream.share.platforms.download' })}
      </button>
    </div>
  );
}
```

---

# 7. DATA INTEGRATION

## 7.1 Data Source

For pre-launch, use static data from the analytics application:

```typescript
// lib/data/dream_mode_data.json

{
  "version": "1.0",
  "generated_at": "2025-12-30T12:00:00Z",
  "data_sources": {
    "apy_data": {
      "source": "DeFiLlama",
      "period": "2022-05-01 to 2025-12-31"
    },
    "bank_comparison": {
      "rate": 0.5,
      "source": "ECB Statistics",
      "date": "December 2024"
    }
  },
  "paths": {
    "safety": {
      "strategies": [1, 3, 5, 7, 9],
      "label": "Safety First",
      "avg_apy": 9.5,
      "max_drawdown": 0.0,
      "probability_of_loss": 0.0,
      "projections": {
        "1_week": { "multiplier": 1.0018 },
        "1_month": { "multiplier": 1.0079 },
        "1_year": { "multiplier": 1.095 },
        "5_years": { "multiplier": 1.574 }
      }
    },
    "balance": {
      "strategies": [2, 4, 6],
      "label": "Balanced Growth",
      "avg_apy": 29.4,
      "max_drawdown": 13.0,
      "probability_of_loss": 18.7,
      "projections": {
        "1_week": { "multiplier": 1.0055 },
        "1_month": { "multiplier": 1.024 },
        "1_year": { "multiplier": 1.294 },
        "5_years": { "multiplier": 3.62 }
      }
    },
    "growth": {
      "strategies": [8, 10],
      "label": "Maximum Growth",
      "avg_apy": 184.0,
      "max_drawdown": 66.1,
      "probability_of_loss": 25.5,
      "projections": {
        "1_week": { "multiplier": 1.027 },
        "1_month": { "multiplier": 1.12 },
        "1_year": { "multiplier": 2.84 },
        "5_years": { "multiplier": 18.4 }
      },
      "warning": "High volatility — up to 66% drawdown observed"
    }
  },
  "disclaimers": {
    "simulation": "This is a simulation based on historical data from May 2022 to December 2025. Past performance does not guarantee future returns.",
    "risk": "Capital is at risk. Actual results may differ significantly.",
    "card_watermark": "⚠️ SIMULATION — Based on historical data. Not a guarantee. diboas.com"
  }
}
```

## 7.2 Calculations Hook

```typescript
// components/DreamMode/hooks/useDreamCalculations.ts

import dreamModeData from '@/lib/data/dream_mode_data.json';

export function useDreamCalculations() {
  const calculateGrowth = (
    amount: number,
    path: 'safety' | 'balance' | 'growth',
    timeframe: '1_week' | '1_month' | '1_year' | '5_years'
  ): number => {
    const pathData = dreamModeData.paths[path];
    const multiplier = pathData.projections[timeframe].multiplier;
    return amount * multiplier;
  };

  const bankComparison = (
    amount: number,
    timeframe: '1_week' | '1_month' | '1_year' | '5_years'
  ): number => {
    const bankRate = dreamModeData.data_sources.bank_comparison.rate / 100;
    const yearsMap = {
      '1_week': 7 / 365,
      '1_month': 30 / 365,
      '1_year': 1,
      '5_years': 5,
    };
    const years = yearsMap[timeframe];
    return amount * Math.pow(1 + bankRate, years);
  };

  return { calculateGrowth, bankComparison };
}
```

---

# 8. INTERNATIONALIZATION (i18n)

## 8.1 Translation Keys Structure

```json
// messages/en/dream-mode.json

{
  "dream": {
    "disclaimer": {
      "headline": "Before you dream...",
      "body": "This is a simulation using historical market data. The projections shown are based on past performance and do not guarantee future results.",
      "bullets": {
        "no_money": "No real money is involved",
        "not_advice": "This is not investment advice",
        "past_performance": "Past performance ≠ future results"
      },
      "checkbox": "I understand this is for educational purposes only",
      "cta": "Enter Dream Mode"
    },
    "invitation": {
      "headline": "What if your money actually worked for you?",
      "subhead": "No real money. No strings. Just a glimpse of what's possible.",
      "cta": "Let me see"
    },
    "paths": {
      "headline": "How do you feel about crypto?",
      "subhead": "Pick the path that matches your comfort level",
      "safety": {
        "name": "Safety First",
        "description": "Your money stays put. No crypto exposure, steady growth.",
        "risk": "Minimal risk"
      },
      "balance": {
        "name": "Balanced Growth",
        "description": "The middle path. Some ups and downs, more potential.",
        "risk": "Low-Medium risk"
      },
      "growth": {
        "name": "Maximum Growth",
        "description": "Higher potential, but buckle up. 70-85% crypto.",
        "risk": "Higher risk"
      }
    },
    "amount": {
      "headline": "How much would you start with?",
      "helper": "Don't worry — this is just pretend money",
      "cta": "Watch it grow"
    },
    "results": {
      "headline": "Your dream portfolio",
      "started_with": "You started with",
      "timeframe": {
        "1_week": "1 Week",
        "1_month": "1 Month",
        "1_year": "1 Year",
        "5_years": "5 Years"
      },
      "bank_comparison": "Your bank would give you",
      "bank_source": "Bank comparison based on average EU savings account rate of 0.5% APY. Source: ECB Statistics, December 2024. Rates may vary.",
      "more_with_diboas": "More with diBoaS",
      "share_cta": "Share My Dream",
      "try_another": "Try Another Path"
    },
    "share": {
      "headline": "Share your dream",
      "card": {
        "headline": "💭 In Dream Mode, my money could become",
        "bank_gave": "My bank would give me: €{amount}"
      },
      "platforms": {
        "instagram": "Instagram Stories",
        "twitter": "X (Twitter)",
        "whatsapp": "WhatsApp",
        "download": "Download Image"
      },
      "copy_link": "Copy Referral Link"
    },
    "postflow": {
      "headline": "🎉 Nice dreaming!",
      "position": "You're #{position} on the waitlist.",
      "message": "The sooner we launch, the sooner this becomes real.",
      "share_cta": "Share to move up",
      "explore_cta": "Explore more"
    },
    "watermark": "⚠️ SIMULATION"
  },
  "future_you": {
    "headline": "Meet Future You",
    "subhead": "See what your money could become with consistent small deposits",
    "monthly_label": "If you set aside each month",
    "years_label": "For how long?",
    "years": "years",
    "result_intro": "€{monthly}/month for {years} years could become",
    "you_contributed": "You contributed",
    "bank_gave": "Bank would give",
    "difference": "Extra with diBoaS",
    "cta": "Join the waitlist to make this real",
    "disclaimer": "Projection based on historical average returns. Past performance does not guarantee future results. Capital is at risk."
  }
}
```

---

# 9. ANIMATION SPECIFICATIONS

## 9.1 Growth Counter Animation

```typescript
// Animation specs from Innovation Board

const counterAnimation = {
  duration: 2500, // 2.5 seconds
  easing: [0.16, 1, 0.3, 1], // easeOutExpo
  
  // Tick sound (optional)
  tickInterval: 50, // ms between number changes
  
  // Completion effect
  completionGlow: {
    color: '#5EEAD4', // Teal light
    duration: 200,
    scale: [1, 1.02, 1],
  },
};
```

## 9.2 Screen Transitions

```typescript
const screenTransitions = {
  forward: {
    exit: { x: '-100%', opacity: 0 },
    enter: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    duration: 250,
    easing: 'easeInOut',
  },
  backward: {
    exit: { x: '100%', opacity: 0 },
    enter: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    duration: 250,
    easing: 'easeInOut',
  },
};
```

## 9.3 Path Card Selection

```typescript
const pathCardAnimation = {
  // On load (staggered)
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  staggerDelay: 100, // ms between cards
  
  // On hover
  hover: {
    scale: 1.02,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    transition: { duration: 150 },
  },
  
  // On click (selection)
  select: {
    scale: 1.05,
    borderColor: '#14B8A6',
    transition: { duration: 150 },
  },
  
  // Auto-advance after selection
  autoAdvanceDelay: 500,
};
```

## 9.4 Reduced Motion Support

```typescript
// Respect user preferences
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return reducedMotion;
};

// Usage: If reducedMotion is true, skip animations and show final state instantly
```

---

# 10. CLO COMPLIANCE REQUIREMENTS

## 10.1 Regional Detection Logic

```typescript
// lib/dream-mode/regional-detection.ts

export type DisclaimerRegion = 'EU' | 'US' | 'BRAZIL';

export function getDisclaimerRegion(): DisclaimerRegion {
  // 1. Check URL parameter (for testing)
  if (typeof window !== 'undefined') {
    const urlRegion = new URLSearchParams(window.location.search).get('region');
    if (urlRegion && ['US', 'BRAZIL', 'EU'].includes(urlRegion.toUpperCase())) {
      return urlRegion.toUpperCase() as DisclaimerRegion;
    }
  }
  
  // 2. Check browser language
  const browserLang = typeof navigator !== 'undefined' 
    ? navigator.language || (navigator as any).userLanguage 
    : 'en';
  
  if (browserLang === 'pt-BR' || browserLang.startsWith('pt-BR')) {
    return 'BRAZIL';
  }
  if (browserLang === 'en-US' || browserLang.startsWith('en-US')) {
    return 'US';
  }
  
  // 3. Default to EU
  return 'EU';
}
```

## 10.2 Implementation Checklist

| Requirement | Location | Status |
|-------------|----------|--------|
| Full-screen disclaimer modal before entry | Screen 0 | Required |
| "I understand" checkbox required | Screen 0 | Required |
| "⚠️ SIMULATION" watermark on every screen | Top corner | Required |
| Watermark embedded in Dream Card image | Canvas render | Required |
| Regional disclaimer applied based on detection | All screens | Required |
| Bank comparison cites ECB source | Screen 4 | Required |
| No "invest" or "deposit" language | All copy | Required |

## 10.3 Disclaimer Texts (Copy-Paste Ready)

See `CLO_Dream_Mode_Specification.md` Appendix for complete texts in all languages.

---

# 11. ANALYTICS EVENTS

```typescript
// lib/dream-mode/analytics.ts

export const trackDreamModeEvent = (
  eventName: string,
  params: Record<string, any>
) => {
  // Dispatch custom event for analytics integration
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail: params }));
    
    // Also log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dream Mode Analytics]', eventName, params);
    }
  }
};

// Events to track
export const DREAM_MODE_EVENTS = {
  STARTED: 'dream_mode_started',
  DISCLAIMER_ACCEPTED: 'dream_disclaimer_accepted',
  PATH_SELECTED: 'dream_path_selected',
  AMOUNT_SET: 'dream_amount_set',
  TIMEFRAME_CHANGED: 'dream_timeframe_changed',
  SHARE_INITIATED: 'dream_share_initiated',
  SHARE_COMPLETED: 'dream_share_completed',
  SHARE_CANCELLED: 'dream_share_cancelled',
  LINK_COPIED: 'dream_link_copied',
  CARD_DOWNLOADED: 'dream_card_downloaded',
  COMPLETED: 'dream_mode_completed',
  PATH_RETRY: 'dream_path_retry',
};
```

---

# 12. ACCESSIBILITY REQUIREMENTS

## 12.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text meets 4.5:1 ratio minimum |
| Focus indicators | Visible focus rings on all interactive elements |
| Keyboard navigation | Tab, Enter, Escape, Arrow keys |
| Screen readers | ARIA labels on all interactive elements |
| Reduced motion | Respect `prefers-reduced-motion` |

## 12.2 Screen Reader Announcements

```typescript
// Use aria-live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {/* Counter value announced when animation completes */}
</div>
```

---

# 13. TESTING REQUIREMENTS

## 13.1 Unit Tests

```typescript
describe('Dream Mode Calculations', () => {
  it('should calculate growth correctly for safety path', () => {
    const result = calculateGrowth(500, 'safety', '1_year');
    expect(result).toBeCloseTo(547.5, 1); // 9.5% growth
  });

  it('should calculate bank comparison correctly', () => {
    const result = bankComparison(500, '1_year');
    expect(result).toBeCloseTo(502.5, 1); // 0.5% growth
  });
});
```

## 13.2 E2E Tests

```typescript
describe('Dream Mode Flow', () => {
  it('should complete full Dream Mode journey', () => {
    cy.visit('/en/dream-mode');
    
    // Screen 0: Disclaimer
    cy.get('[data-testid="disclaimer-checkbox"]').click();
    cy.get('[data-testid="disclaimer-cta"]').click();
    
    // Screen 1: Invitation
    cy.get('[data-testid="invitation-cta"]').click();
    
    // Screen 2: Path Selection
    cy.get('[data-testid="path-balance"]').click();
    
    // Screen 3: Amount
    cy.get('[data-testid="amount-slider"]').invoke('val', 1000).trigger('input');
    cy.get('[data-testid="amount-cta"]').click();
    
    // Screen 4: Results
    cy.get('[data-testid="result-amount"]').should('contain', '€');
    cy.get('[data-testid="share-cta"]').should('be.visible');
  });
});
```

---

# IMPLEMENTATION NOTES

## Priority Order

1. **Day 1:** Read existing codebase, understand patterns
2. **Day 2:** Future You Calculator (simpler, standalone component)
3. **Day 3:** Dream Mode screens 0-2 (Disclaimer, Invitation, Path Selection)
4. **Day 4:** Dream Mode screens 3-4 (Amount, Results)
5. **Day 5:** Dream Card generation, share functionality
6. **Day 6:** Testing, i18n verification, polish

## Key Principles

1. **Follow existing patterns** — Use the same component structure, styling approach, and i18n setup
2. **CLO compliance is non-negotiable** — Every disclaimer, watermark, and regional rule must be implemented
3. **Animation serves UX** — Not decoration; makes numbers feel alive and builds trust
4. **Accessibility first** — Keyboard navigation, screen readers, reduced motion
5. **Test everything** — Especially calculations and regional disclaimer logic

---

**END OF FRONTEND HANDOFF DOCUMENT**
