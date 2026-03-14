import { useState, useCallback } from 'react';
import { parseLocaleNumber } from '@/lib/currency';
import type { GoalTab, RiskTierIndex, EmergencyCoverage, EmergencyTimeline } from './goalCalculatorTypes';
import { RISK_TIERS, GOAL_CALCULATOR_EVENTS } from './goalCalculatorConstants';

const INITIAL_VACATION_DATE = (): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d;
};

export function useGoalCalculatorState(enableAnalytics: boolean) {
  // Tab state
  const [activeTab, setActiveTab] = useState<GoalTab>('christmas');

  // Input state (raw strings for locale-aware editing)
  const [field1Raw, setField1Raw] = useState('');
  const [initialDepositRaw, setInitialDepositRaw] = useState('');
  const [monthlyDepositRaw, setMonthlyDepositRaw] = useState('');
  const [isMonthlyOverridden, setIsMonthlyOverridden] = useState(false);
  const [riskTierIndex, setRiskTierIndex] = useState<RiskTierIndex>(0);

  // Tab-specific state
  const [emergencyCoverage, setEmergencyCoverage] = useState<EmergencyCoverage>(3);
  const [emergencyTimeline, setEmergencyTimeline] = useState<EmergencyTimeline>(12);
  const [vacationDate, setVacationDate] = useState<Date>(INITIAL_VACATION_DATE);

  // Result state
  const [showResult, setShowResult] = useState(false);
  const [isStartSmaller, setIsStartSmaller] = useState(false);

  // Parsed numeric values
  const field1 = parseLocaleNumber(field1Raw);
  const initialDeposit = parseLocaleNumber(initialDepositRaw);

  // Analytics helper
  const trackEvent = useCallback((event: string, payload: Record<string, unknown>) => {
    if (!enableAnalytics) return;
    import('posthog-js').then(({ default: posthog }) => {
      if (posthog.__loaded) {
        posthog.capture(event, payload);
      }
    }).catch(() => {});
  }, [enableAnalytics]);

  // Handlers
  const handleTabChange = useCallback((tab: GoalTab) => {
    setActiveTab(tab);
    setShowResult(false);
    setIsStartSmaller(false);
    setIsMonthlyOverridden(false);
    setMonthlyDepositRaw('');
    trackEvent(GOAL_CALCULATOR_EVENTS.TAB_SWITCH, { tab });
  }, [trackEvent]);

  const handleField1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setField1Raw(e.target.value.replace(/[^0-9.,]/g, ''));
    setShowResult(false);
    setIsStartSmaller(false);
  }, []);

  const handleInitialDepositChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInitialDepositRaw(e.target.value.replace(/[^0-9.,]/g, ''));
    setShowResult(false);
    setIsStartSmaller(false);
  }, []);

  const handleMonthlyDepositChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthlyDepositRaw(e.target.value.replace(/[^0-9.,]/g, ''));
    setIsMonthlyOverridden(true);
    setShowResult(false);
    setIsStartSmaller(false);
  }, []);

  const handleTierChange = useCallback((index: RiskTierIndex, isOneMonth: boolean) => {
    if (isOneMonth && index !== 0) return;
    setRiskTierIndex(index);
    setShowResult(false);
    setIsStartSmaller(false);
    trackEvent(GOAL_CALCULATOR_EVENTS.TIER_CHANGE, {
      tier: RISK_TIERS[index].label,
      tab: activeTab,
    });
  }, [trackEvent, activeTab]);

  const handleShowResult = useCallback((payload: Record<string, unknown>) => {
    setShowResult(true);
    trackEvent(GOAL_CALCULATOR_EVENTS.RESULT_SHOWN, payload);
  }, [trackEvent]);

  const handleStartSmallerToggle = useCallback((payload: Record<string, unknown>) => {
    setIsStartSmaller(true);
    trackEvent(GOAL_CALCULATOR_EVENTS.START_SMALLER_TOGGLE, payload);
  }, [trackEvent]);

  const handleCtaClick = useCallback((payload: Record<string, unknown>) => {
    const el = document.getElementById('waitlist');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    trackEvent(GOAL_CALCULATOR_EVENTS.CTA_CLICK, payload);
  }, [trackEvent]);

  const handleCoverageChange = useCallback((coverage: EmergencyCoverage) => {
    setEmergencyCoverage(coverage);
    setShowResult(false);
    setIsStartSmaller(false);
  }, []);

  const handleTimelineChange = useCallback((timeline: EmergencyTimeline) => {
    setEmergencyTimeline(timeline);
    setShowResult(false);
    setIsStartSmaller(false);
  }, []);

  const handleVacationDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    if (year && month) {
      setVacationDate(new Date(year, month - 1, 1));
      setShowResult(false);
      setIsStartSmaller(false);
    }
  }, []);

  return {
    // State
    activeTab,
    field1Raw,
    field1,
    initialDepositRaw,
    initialDeposit,
    monthlyDepositRaw,
    isMonthlyOverridden,
    riskTierIndex,
    emergencyCoverage,
    emergencyTimeline,
    vacationDate,
    showResult,
    isStartSmaller,

    // Handlers
    handleTabChange,
    handleField1Change,
    handleInitialDepositChange,
    handleMonthlyDepositChange,
    handleTierChange,
    handleShowResult,
    handleStartSmallerToggle,
    handleCtaClick,
    handleCoverageChange,
    handleTimelineChange,
    handleVacationDateChange,
  };
}
