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
