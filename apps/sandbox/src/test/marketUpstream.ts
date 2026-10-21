/**
 * The market UPSTREAMS, faked at the network boundary — DeFiLlama and CoinGecko answers in
 * their real wire shapes, deterministic, with no request ever leaving the process.
 *
 * ⛑ `5.578` (2026-10-20): `route.test.ts` and `rateLimit.test.ts` drove the REAL factory
 * with nothing faked below it, so every run sent 11 live requests to `yields.llama.fi` and
 * `api.coingecko.com` (measured with a fetch probe; up to 4.6 s each). Under load or a slow
 * upstream they timed out, a timed-out test left its scheduled `after()` work behind for the
 * next one, and every CI run spent the providers' public rate limits. Only the network is
 * faked here: the route, the factory, the adapters and their parsing still run for real.
 *
 * An unknown URL answers 404 rather than silently succeeding, so a new upstream call shows up
 * as a failure in the test that made it.
 */

const DAY = 86_400_000;

const POOLS = [
  ['sky-lending', 'SUSDS', 'Arbitrum'],
  ['aave-v3', 'USDC', 'Arbitrum'],
  ['compound-v3', 'USDC', 'Arbitrum'],
  ['sanctum-infinity', 'INF', 'Solana'],
  ['jupiter-perpetual-exchange', 'JLP', 'Solana'],
  ['jito-liquid-staking', 'JITOSOL', 'Solana'],
].map(([project, symbol, chain], i) => ({
  pool: `pool-${i}`,
  project,
  symbol,
  chain,
  apy: 4 + i / 10,
  apyBase: 4 + i / 10,
  apyReward: 0,
  tvlUsd: 1_000_000 + i,
}));

/** One upstream answer for `url`, with day-series ending at `now` (epoch ms). */
export function marketUpstream(url: string, now: number): Response {
  const daysBack = (n: number) => Array.from({ length: n }, (_, i) => now - (n - 1 - i) * DAY);
  const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
  if (url === 'https://yields.llama.fi/pools') return json({ status: 'success', data: POOLS });
  if (url.startsWith('https://yields.llama.fi/chart/'))
    return json({
      data: daysBack(60).map((t) => ({ timestamp: new Date(t).toISOString(), apy: 5 })),
    });
  if (url.includes('/simple/price'))
    return json(
      Object.fromEntries(
        ['bitcoin', 'ethereum', 'solana', 'sui', 'usd-coin', 'tether-gold'].map((id) => [
          id,
          { usd: id === 'usd-coin' ? 1 : 100, brl: 5.4, eur: 0.86 },
        ])
      )
    );
  if (url.includes('/market_chart')) return json({ prices: daysBack(366).map((t) => [t, 150]) });
  return new Response('not found', { status: 404 });
}
