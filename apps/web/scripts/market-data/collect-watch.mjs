#!/usr/bin/env node
/**
 * collect-watch.mjs — did the Saturday collection run? (plan MP-3b, gate COLLECT-WATCH-1)
 *
 * The weekly refresh has its own watchdog; the store's Saturday collection had none, so a
 * collection GitHub dropped would only show up as stale data days later. This decides, from
 * `gh run list --workflow market-data-collect.yml --branch main` output, whether a scheduled
 * collection, or a manual one dispatched from main (the remedy), was created since Saturday
 * 00:00 UTC of the current weekend. A run that started counts (blocked series fail that run
 * visibly on their own); none at all is the failure this catches.
 *
 *   RUNS_FILE=<gh run list JSON> node apps/web/scripts/market-data/collect-watch.mjs
 * Exits 0 when a collection ran, 1 (with a remedy) when none did.
 */
import fs from 'node:fs';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';

/** 00:00 UTC of the most recent Saturday on or before `now`. */
export function saturdayStartUtc(now) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since = (d.getUTCDay() - 6 + 7) % 7;
  return new Date(d.getTime() - since * 86_400_000);
}

/**
 * @param {{ runs: { createdAt: string, event?: string, status?: string, conclusion?: string|null }[], now: Date }} io
 * @returns {{ ok: boolean, reason: string }}
 */
export function collectWatch({ runs, now }) {
  const since = saturdayStartUtc(now);
  const counted = new Set(['schedule', 'workflow_dispatch']);
  const run = runs.find(
    (r) => Date.parse(r.createdAt) >= since.getTime() && (r.event == null || counted.has(r.event))
  );
  if (run)
    return {
      ok: true,
      reason: `a collection ran (${run.event ?? 'unknown event'}, created ${run.createdAt}, ${run.status ?? 'unknown'}/${run.conclusion ?? 'pending'})`,
    };
  return {
    ok: false,
    reason: `no market data collection since ${since.toISOString()}: GitHub most likely dropped Saturday's. Remedy (a person; CC never dispatches a collection): GitHub → Actions → "Market data collection" → Run workflow, branch main, defaults. Its run should end green; re-run this watchdog to confirm.`,
  };
}

if (isDirectInvocation(import.meta.url)) {
  const runs = JSON.parse(fs.readFileSync(process.env.RUNS_FILE ?? '', 'utf8'));
  const { ok, reason } = collectWatch({ runs, now: new Date() });
  console.log(ok ? reason : `::error::${reason}`);
  process.exitCode = ok ? 0 : 1;
}
