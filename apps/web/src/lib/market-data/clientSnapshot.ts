/**
 * `toClientSnapshot` (C2-S G4, finding 13): the snapshot without its monthly series, for a
 * server component to hand to `MarketDataContextProvider`. Serializing the series put every
 * monthly price, FX and inflation row into each tools page's HTML.
 */
import type { ClientMarketDataSnapshot, MarketDataSnapshot } from './types';

export function toClientSnapshot(snapshot: MarketDataSnapshot): ClientMarketDataSnapshot {
  const { monthlySeries: _series, ...rest } = snapshot;
  return rest;
}
