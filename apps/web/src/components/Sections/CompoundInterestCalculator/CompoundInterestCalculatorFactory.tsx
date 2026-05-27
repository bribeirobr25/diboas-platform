import { CalculatorDefault } from './variants/CalculatorDefault';
import type { CalculatorInput } from '@/lib/compound-interest';

export type CalculatorVariant = 'default';

interface CompoundInterestCalculatorProps {
  variant?: CalculatorVariant;
  initialInput?: CalculatorInput;
  enableAnalytics?: boolean;
  reducedMotion?: boolean;
  className?: string;
  /**
   * Engine variant per Phase-7 Q7(a). Default 'lesson' (no hedge) for
   * `/learn/compound-interest`; tool pages pass 'tool' for currency-hedge math.
   */
  engine?: 'lesson' | 'tool';
  /**
   * Phase D.3 — opt-in retrospective DCA mode toggle. Only `/tools/goal-savings`
   * passes `true`; other tool surfaces stay smoothed-hedge only. When `true`,
   * surfaces a Forward / Retrospective tab toggle that activates the
   * path-dependent engine via a separate named function (R1 discipline).
   */
  enablePathDependent?: boolean;
  /**
   * C6 close (TOOLS_41_DEFECTS_FIX_PLAN.md §4.5, 2026-05-26): per-locale
   * ceiling for the recurring-amount slider. Tool pages pass
   * `COMPOUND_TOOL_DEFAULTS[toolKey].recurringSliderMax[locale]` so the
   * slider visually represents large defaults (e.g. pt-BR retirement R$2000).
   * Numeric input still accepts up to INPUT_BOUNDS.amount.max; this is the
   * affordance only.
   */
  recurringSliderMax?: number;
}

export function CompoundInterestCalculator({
  variant = 'default',
  ...rest
}: CompoundInterestCalculatorProps) {
  switch (variant) {
    case 'default':
    default:
      return <CalculatorDefault {...rest} />;
  }
}
