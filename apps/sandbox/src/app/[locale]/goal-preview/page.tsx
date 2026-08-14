import { GoalDetailDual } from '@/components/GoalDetailDual';

/** Goal dual-view preview (Phase B). Ungated. Example data; real = ledger projection. */
export default function GoalPreviewPage() {
  const series = [1800, 1830, 1810, 1880, 1850, 1920, 1900, 1980, 1950, 2000];
  return (
    <GoalDetailDual
      current="2,000.00"
      target="5,000.00"
      monthsToGo={14}
      strategyName="Grow steadily"
      series={series}
      contributions="1,850.00"
      marketChange="150.00"
      onAdd={undefined}
      onPause={undefined}
    />
  );
}
