import { AssetHistoryCalculatorDefault } from './variants/Default';

export type AssetHistoryCalculatorVariant = 'default';

interface AssetHistoryCalculatorProps {
  variant?: AssetHistoryCalculatorVariant;
  className?: string;
}

export function AssetHistoryCalculator({ variant = 'default' }: AssetHistoryCalculatorProps) {
  switch (variant) {
    case 'default':
    default:
      return <AssetHistoryCalculatorDefault />;
  }
}

export default AssetHistoryCalculator;
