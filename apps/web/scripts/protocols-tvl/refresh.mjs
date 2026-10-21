/**
 * The quarterly /protocols TVL refresh (2026-10-21).
 *
 *   node apps/web/scripts/protocols-tvl/refresh.mjs          pull DeFiLlama, write data + copy x4
 *   node apps/web/scripts/protocols-tvl/refresh.mjs --check  re-render the copy from the committed
 *                                                            data (no network); exit 1 on any drift
 *
 * The pull date and the figures are written together by this script, so the
 * date can only move with a new pull (moving the date alone is prohibited:
 * it would make a stale figure look verified). The refresh refuses to write a
 * combined total below the floor the page states; that needs new wording.
 * Then: review the diff, open a PR, the founder approves and merges.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';
import { LOCALES, measureTvl, renderLocale } from './render.mjs';
import { DEFILLAMA_PROTOCOLS_URL } from './sources.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const TVL_DATA_PATH = path.join(
  REPO_ROOT,
  'apps/web/src/lib/market-data/data/protocolsTvl.json'
);
/** @param {string} locale */
export const protocolsJsonPath = (locale) =>
  path.join(REPO_ROOT, `packages/i18n/translations/${locale}/protocols.json`);

/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
/** @param {any} v */
const serialize = (v) => `${JSON.stringify(v, null, 2)}\n`;

/** Every locale file whose committed text differs from a render of the committed data. */
export function copyDrift() {
  const data = readJson(TVL_DATA_PATH);
  return LOCALES.filter((locale) => {
    const committed = fs.readFileSync(protocolsJsonPath(locale), 'utf8');
    return serialize(renderLocale(JSON.parse(committed), data, locale)) !== committed;
  });
}

async function pull() {
  const res = await fetch(DEFILLAMA_PROTOCOLS_URL, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`DeFiLlama answered ${res.status}`);
  const list = await res.json();
  if (!Array.isArray(list) || list.length < 100) throw new Error('unexpected DeFiLlama response');
  const data = measureTvl(list, new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
  if (data.combined.usd < data.combined.floor_usd) {
    throw new Error(
      `combined TVL ${Math.round(data.combined.usd / 1e9)} billion is below the stated floor; ` +
        'the page wording must change first (founder copy decision). Nothing written.'
    );
  }
  const rendered = LOCALES.map((locale) => [
    locale,
    serialize(renderLocale(readJson(protocolsJsonPath(locale)), data, locale)),
  ]);
  fs.writeFileSync(TVL_DATA_PATH, serialize({ _comment: DATA_COMMENT, ...data }));
  for (const [locale, text] of rendered) fs.writeFileSync(protocolsJsonPath(locale), text);
  const missing = Object.entries(data.cards).filter(([, c]) => c.usd === null);
  console.log(
    `Pulled ${data.pulled_at}: combined ${(data.combined.usd / 1e9).toFixed(1)} billion.`
  );
  if (missing.length)
    console.log(`Not reported by DeFiLlama: ${missing.map(([id]) => id).join(', ')}`);
}

const DATA_COMMENT =
  'Written by apps/web/scripts/protocols-tvl/refresh.mjs from one DeFiLlama pull; never edit by hand (the date moves only with new figures).';

async function main() {
  if (process.argv.includes('--check')) {
    const drift = copyDrift();
    if (drift.length) {
      console.error(
        `TVL copy differs from the committed data in: ${drift.join(', ')}. Run refresh.mjs.`
      );
      process.exitCode = 1;
    } else console.log('TVL copy matches the committed data in all four locales.');
    return;
  }
  await pull();
}

if (isDirectInvocation(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
