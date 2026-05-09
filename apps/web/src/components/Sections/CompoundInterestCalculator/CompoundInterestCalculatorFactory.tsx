import { CalculatorDefault } from './variants/CalculatorDefault';
import type { CalculatorInput } from '@/lib/compound-interest';

export type CalculatorVariant = 'default';

interface CompoundInterestCalculatorProps {
  variant?: CalculatorVariant;
  initialInput?: CalculatorInput;
  enableAnalytics?: boolean;
  reducedMotion?: boolean;
  className?: string;
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
