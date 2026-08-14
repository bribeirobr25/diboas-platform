import { StrategyDetail } from '@/components/StrategyDetail';

/**
 * Dual-view showcase preview (Phase B). Ungated. The example strategy ("Grow
 * steadily", a STEADY strategy) uses a gentle series that still shows real dips
 * (the §5 honesty rule — a growth strategy would show bigger swings). Real data
 * = the packages/defi catalog + analytics provider (deferred).
 */
export default function StrategyPreviewPage() {
  // Steady strategy: gentle upward drift WITH small honest dips (never only-up).
  const series = [100, 101, 100.4, 102, 101.2, 103, 102.3, 104, 102.8, 104.5, 103.6, 105];
  return (
    <StrategyDetail
      series={series}
      apyLow="2.0%"
      apyHigh="4.0%"
      protocols={['Sky', 'Aave', 'Compound']}
    />
  );
}
