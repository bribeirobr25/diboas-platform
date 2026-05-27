import { describe, it, expect } from 'vitest';
import { preDreamReducer, initialPreDreamState } from '../preDreamReducer';
import type { PreDreamState, PreDreamAction } from '../types';

const baseState: PreDreamState = { ...initialPreDreamState };

const acceptedDisclaimerState: PreDreamState = {
  ...initialPreDreamState,
  disclaimerAccepted: true,
  screen: 'welcome',
};

describe('preDreamReducer — disclaimer + welcome flow', () => {
  it('should advance disclaimer → welcome on ACCEPT_DISCLAIMER', () => {
    const next = preDreamReducer(baseState, { type: 'ACCEPT_DISCLAIMER' });
    expect(next.disclaimerAccepted).toBe(true);
    expect(next.screen).toBe('welcome');
  });

  it('should land on welcome on GO_TO_WELCOME', () => {
    const next = preDreamReducer(acceptedDisclaimerState, { type: 'GO_TO_WELCOME' });
    expect(next.screen).toBe('welcome');
  });
});

describe('preDreamReducer — goalStrategy step (6B)', () => {
  it('should advance welcome → goalStrategy on GO_TO_GOAL_STRATEGY', () => {
    const next = preDreamReducer(acceptedDisclaimerState, { type: 'GO_TO_GOAL_STRATEGY' });
    expect(next.screen).toBe('goalStrategy');
  });

  it.each(['retirement', 'christmas', 'emergency', 'wealthy'] as const)(
    'should set selectedGoal=%s and advance to pathSelect on SELECT_GOAL',
    (goal) => {
      const goalStrategyState: PreDreamState = {
        ...acceptedDisclaimerState,
        screen: 'goalStrategy',
      };
      const next = preDreamReducer(goalStrategyState, { type: 'SELECT_GOAL', goal });
      expect(next.selectedGoal).toBe(goal);
      expect(next.screen).toBe('pathSelect');
    }
  );

  it('should preserve selectedGoal when later transitions fire (path/timeframe/etc)', () => {
    const withGoal: PreDreamState = {
      ...acceptedDisclaimerState,
      selectedGoal: 'retirement',
      screen: 'pathSelect',
    };
    const afterPath = preDreamReducer(withGoal, { type: 'SELECT_PATH', path: 'balance' });
    expect(afterPath.selectedGoal).toBe('retirement');
    expect(afterPath.selectedPath).toBe('balance');
    expect(afterPath.screen).toBe('input');
  });
});

describe('preDreamReducer — RESET behavior', () => {
  const seededState: PreDreamState = {
    ...initialPreDreamState,
    disclaimerAccepted: true,
    selectedGoal: 'retirement',
    selectedPath: 'balance',
    initialAmount: 5000,
    monthlyContribution: 250,
    selectedTimeframe: '5years',
    screen: 'results',
  };

  it('should land on goalStrategy when disclaimerAccepted, not pathSelect (so the goal step is not skipped)', () => {
    const next = preDreamReducer(seededState, { type: 'RESET' });
    expect(next.screen).toBe('goalStrategy');
  });

  it('should land on disclaimer when disclaimerAccepted=false', () => {
    const noDisclaimer: PreDreamState = { ...seededState, disclaimerAccepted: false };
    const next = preDreamReducer(noDisclaimer, { type: 'RESET' });
    expect(next.screen).toBe('disclaimer');
  });

  it('should clear selectedGoal back to null', () => {
    const next = preDreamReducer(seededState, { type: 'RESET' });
    expect(next.selectedGoal).toBeNull();
  });

  it('should preserve disclaimerAccepted but reset all other inputs', () => {
    const next = preDreamReducer(seededState, { type: 'RESET' });
    expect(next.disclaimerAccepted).toBe(true);
    expect(next.selectedPath).toBeNull();
    expect(next.initialAmount).toBe(initialPreDreamState.initialAmount);
    expect(next.monthlyContribution).toBe(initialPreDreamState.monthlyContribution);
    expect(next.selectedTimeframe).toBe(initialPreDreamState.selectedTimeframe);
    expect(next.result).toBeNull();
  });
});

describe('preDreamReducer — exhaustive screen flow', () => {
  it('should walk the full flow disclaimer → welcome → goalStrategy → pathSelect → input → timeframe → simulation → results', () => {
    let s: PreDreamState = baseState;
    s = preDreamReducer(s, { type: 'ACCEPT_DISCLAIMER' });
    expect(s.screen).toBe('welcome');
    s = preDreamReducer(s, { type: 'GO_TO_GOAL_STRATEGY' });
    expect(s.screen).toBe('goalStrategy');
    s = preDreamReducer(s, { type: 'SELECT_GOAL', goal: 'retirement' });
    expect(s.screen).toBe('pathSelect');
    expect(s.selectedGoal).toBe('retirement');
    s = preDreamReducer(s, { type: 'SELECT_PATH', path: 'balance' });
    expect(s.screen).toBe('input');
    s = preDreamReducer(s, { type: 'GO_TO_TIMEFRAME' });
    expect(s.screen).toBe('timeframe');
    s = preDreamReducer(s, { type: 'SELECT_TIMEFRAME', timeframe: '5years' });
    expect(s.selectedTimeframe).toBe('5years');
    const fakeResult = {
      totalInvestment: 1000,
      defiBalance: 1500,
      defiInterest: 500,
      bankBalance: 1100,
      bankInterest: 100,
      difference: 400,
      growthPercentage: 50,
      pathApy: 7,
      bankApy: 1,
    };
    s = preDreamReducer(s, { type: 'START_SIMULATION', result: fakeResult });
    expect(s.screen).toBe('simulation');
    expect(s.isAnimating).toBe(true);
    s = preDreamReducer(s, { type: 'COMPLETE_SIMULATION' });
    expect(s.screen).toBe('results');
    expect(s.isAnimating).toBe(false);
    // selectedGoal threads through to results
    expect(s.selectedGoal).toBe('retirement');
  });
});

describe('preDreamReducer — unknown action', () => {
  it('should return state unchanged for unknown actions', () => {
    const next = preDreamReducer(baseState, { type: '__UNKNOWN__' as never } as PreDreamAction);
    expect(next).toBe(baseState);
  });
});
