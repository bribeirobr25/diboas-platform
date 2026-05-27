export {
  AssetHistoryDataError,
  // Phase E v2 (TOOLS_IMPROVEMENT.md, 2026-05-23). Phase 2 §2.7 (2026-05-25):
  // legacy `calculateAssetHistory` + `AssetHistoryArgs` + `AssetHistoryResult`
  // removed (C19 close — the v1.4 BTC-CoinMetrics backfill eliminated the
  // legacy fallback's only reachable path).
  calculateAssetHistoryDcaReplay,
  calculateAssetHistoryLumpSum,
  type AssetHistoryDcaReplayArgs,
  type AssetHistoryRangeResult,
  type AssetHistoryStartYear,
  type ReturnsBasis,
} from './calculator';
