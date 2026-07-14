#!/usr/bin/env node
/**
 * generate.mjs — Stage 4 of the market-refresh pipeline (P3, plan §B Stage 4).
 *
 *   computed.json  ─▶  template library  ─▶  editorial JSONs (regime/signals/historical)
 *
 * Renders the GENERATED fields deterministically from `computed.json` using a
 * reviewed, finite template library (CLO GO 2026-07-11) — so weekly copy is
 * professionally translatable ONCE (F-M9 convergence) instead of hand-written
 * every cycle. Two modes:
 *
 *   node generate.mjs           — write the generated fields into the editorial JSONs
 *   node generate.mjs --check   — regenerate in memory and DIFF against the
 *                                 committed JSONs; exit 1 on drift (F-M4 in CI:
 *                                 a hand-edited generated field can never merge)
 *
 * OWNED (generated + --check-guarded) fields:
 *   - regime.summary.<locale>.plain            (the grandmother layer)
 *   - signals.json groups[].signals[].summary  (per-signal sentences)
 *   - signals.json groups[].summary            (per-group summaries)
 *   - regime.signal_groups[].summary           (group summary mirror)
 *   - historical.json                          (append + 52-cap prune + seed flip)
 *
 * PRESERVED (editorial-owned, never touched here): the research-memo voice
 * (regime.summary.<locale>.{short,detailed,confidence_level,mixed_signals,
 * key_*}) and data_status (P2's output). An `editorial-override.json` may
 * replace any single generated string for a cycle (judgment preserved).
 *
 * Plain-layer selection (plan §C3): band × transition (improved/worsened/
 * unchanged, from the score delta vs the prior published snapshot) × a
 * week-rotated variant (ISO-week % 3, so repeat visitors don't reread the
 * same sentence). Slots fill from plain-phrases.json in plain terms
 * ("about a quarter", not "-24.4%").
 *
 * synthetic_seed flip (founder ruling 2026-07-11): flips to false once the
 * archive holds >= REAL_SNAPSHOTS_FOR_FLIP consecutive real snapshots.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const MARKET_DIR = path.join(REPO_ROOT, 'apps/web/data/market');
const TPL_DIR = path.join(__dirname, 'templates');

const LOCALES = ['en', 'pt-BR', 'es', 'de'];
const REAL_SNAPSHOTS_FOR_FLIP = 8; // founder ruling 2026-07-11
const HISTORICAL_CAP = 52;

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const readIfExists = (p) => (fs.existsSync(p) ? read(p) : null);

const computed = read(path.join(MARKET_DIR, 'computed.json'));
const signalTpl = read(path.join(TPL_DIR, 'signal-sentences.json'));
const groupTpl = read(path.join(TPL_DIR, 'group-summaries.json'));
const plainTpl = read(path.join(TPL_DIR, 'plain-summaries.json'));
const phrases = read(path.join(TPL_DIR, 'plain-phrases.json'));
const overrides = readIfExists(path.join(MARKET_DIR, 'editorial-override.json')) ?? {};

// ── locale number formatting (Intl, matches the rest of the site) ──────────
const MONTHS = {
  en: 'January February March April May June July August September October November December'.split(
    ' '
  ),
  'pt-BR':
    'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'.split(
      ' '
    ),
  es: 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(
    ' '
  ),
  de: 'Januar Februar März April Mai Juni Juli August September Oktober November Dezember'.split(
    ' '
  ),
};
function monthName(ym, locale) {
  if (!ym) return '';
  const m = Number(ym.slice(5, 7)) - 1;
  return MONTHS[locale][m] ?? '';
}
function num(value, locale, digits = 0) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
/** Plain-terms magnitude for a percentage move (C3: "about a quarter"). */
const PLAIN_MOVE = {
  en: [
    [30, 'roughly a third'],
    [22, 'about a quarter'],
    [16, 'about a fifth'],
    [8, 'about a tenth'],
    [0, 'a small slice'],
  ],
  'pt-BR': [
    [30, 'cerca de um terço'],
    [22, 'cerca de um quarto'],
    [16, 'cerca de um quinto'],
    [8, 'cerca de um décimo'],
    [0, 'uma pequena fatia'],
  ],
  es: [
    [30, 'alrededor de un tercio'],
    [22, 'cerca de una cuarta parte'],
    [16, 'alrededor de un quinto'],
    [8, 'alrededor de un décimo'],
    [0, 'una pequeña porción'],
  ],
  de: [
    [30, 'rund ein Drittel'],
    [22, 'etwa ein Viertel'],
    [16, 'rund ein Fünftel'],
    [8, 'rund ein Zehntel'],
    [0, 'ein kleines Stück'],
  ],
};
function plainMove(absPct, locale) {
  for (const [floor, phrase] of PLAIN_MOVE[locale]) if (absPct >= floor) return phrase;
  return PLAIN_MOVE[locale].at(-1)[1];
}

function fill(template, slots) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in slots ? slots[k] : `{${k}}`));
}

// ── signal sentences ───────────────────────────────────────────────────────
const byId = Object.fromEntries(computed.signals.map((s) => [s.id, s]));

function signalSentence(id, locale) {
  const sig = byId[id];
  const set = signalTpl[id]?.[sig.state];
  if (!set) return null;
  const v = sig.values ?? {};
  // Precision follows the magnitude: sub-100 values are rates (yields, indices)
  // that need 2 decimals; large index/price values read cleaner whole. This
  // keeps a value and its own trend line at the SAME precision (the MAC-02
  // yield bug: "4%" beside "4.39%" — caught in the 2026-07-11 audit).
  const scaleDigits = (x) => (x < 100 ? 2 : 0);
  const slots = {
    monthName: monthName(sig.anchor, locale),
    close: v.close != null ? num(v.close, locale, scaleDigits(v.close)) : '',
    ema20: v.ema20 != null ? num(v.ema20, locale, scaleDigits(v.ema20)) : '',
    sma50: v.sma50 != null ? num(v.sma50, locale, scaleDigits(v.sma50)) : '',
    gapAbs: v.gapPct != null ? num(Math.abs(v.gapPct), locale) : '',
    rsiCur: v.rsiCurrent != null ? num(v.rsiCurrent, locale) : '',
    rsiPrev: v.rsiPrev != null ? num(v.rsiPrev, locale) : '',
    stochK: v.stochK != null ? num(v.stochK, locale) : '',
    rsi: v.rsi != null ? num(v.rsi, locale) : '',
    roc12m: v.roc12m != null ? num(v.roc12m, locale, 1) : '',
    ratio: v.ratio != null ? num(v.ratio, locale, 3) : '',
    ratioEma: v.ema20 != null ? num(v.ema20, locale, 3) : '',
    positives: v.positives != null ? String(v.positives) : '',
    snapshots: v.snapshots != null ? String(v.snapshots) : '',
    warmupTarget: v.warmupTarget != null ? String(v.warmupTarget) : '',
  };
  // Guard (2026-07-11 audit): a template slot that resolves to '' means the
  // engine didn't emit the value the sentence needs (the REL-03 empty-slot
  // bug — engine `values` missing, --check blind to it because both sides
  // were equally empty). Fail loudly instead of shipping "the Nasdaq at ".
  const referenced = [...set[locale].matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  const empty = referenced.filter((k) => slots[k] === '');
  if (empty.length) {
    throw new Error(
      `signal ${id} (${sig.state}, ${locale}): template references [${empty.join(', ')}] ` +
        `but computed.json has no value for them — check the engine emits these in \`values\`.`
    );
  }
  return fill(set[locale], slots);
}

// ── group summaries ─────────────────────────────────────────────────────────
function groupLevel(points, max) {
  const r = points / max;
  if (r < 1 / 3) return 'weak';
  if (r <= 2 / 3) return 'mixed';
  return 'strong';
}
function groupSummary(groupId, locale) {
  const totals = computed.group_totals;
  const maxByGroup = {
    btc_structure: 6,
    macro_environment: 3,
    institutional_demand: 2,
    relative_strength: 3,
  };
  const points = totals[groupId];
  const max = maxByGroup[groupId];
  let level = groupLevel(points, max);
  // Honesty override (2026-07-11 audit): a group scored 0 only because its
  // signal is UNAVAILABLE must not read as observed-weak. The /market page's
  // whole identity is honest unavailability — say "unavailable, not weak".
  if (
    groupId === 'institutional_demand' &&
    byId['ETF-01']?.state === 'UNAVAILABLE' &&
    groupTpl[groupId].unavailable
  ) {
    level = 'unavailable';
  }
  return fill(groupTpl[groupId][level][locale], { points: String(points), max: String(max) });
}

// ── plain (grandmother) summary ─────────────────────────────────────────────
function priorScore() {
  const hist = read(path.join(MARKET_DIR, 'historical.json'));
  const snaps = hist.snapshots;
  const today = computed.computed_at.slice(0, 10);
  // Prior = the most recent snapshot on a DIFFERENT date than today's.
  for (let i = snaps.length - 1; i >= 0; i -= 1) {
    if (snaps[i].date.slice(0, 10) !== today) return snaps[i].score;
  }
  return computed.score; // no prior → unchanged
}
function transition() {
  const delta = computed.score - priorScore();
  if (delta > 0) return 'improved';
  if (delta < 0) return 'worsened';
  return 'unchanged';
}
/** ISO week number for deterministic variant rotation (no Date.now — passed in). */
function isoWeek(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDay = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - firstDay + 3);
  return 1 + Math.round((d - firstThu) / (7 * 86400000));
}

/** The dominant driver for the {whatChanged} slot. */
function driverKey(trans) {
  const totals = computed.group_totals;
  const maxByGroup = {
    btc_structure: 6,
    macro_environment: 3,
    institutional_demand: 2,
    relative_strength: 3,
  };
  // A group whose signals are ALL unobservable (e.g. ETF-01 UNAVAILABLE) cannot
  // be "the story" — unobserved is not a headwind. Exclude such groups from the
  // driver pick so we never say "the big funds stepped back" when we simply
  // couldn't see the flows.
  const observable = (g) => {
    const ids = {
      btc_structure: ['BTC-01', 'BTC-02', 'BTC-03', 'BTC-04'],
      macro_environment: ['MAC-01', 'MAC-02', 'MAC-03'],
      institutional_demand: ['ETF-01'],
      relative_strength: ['REL-01', 'REL-02', 'REL-03'],
    }[g];
    return ids.some((id) => byId[id] && byId[id].state !== 'UNAVAILABLE');
  };
  const ratios = Object.entries(totals)
    .filter(([g]) => observable(g))
    .map(([g, p]) => [g, p / maxByGroup[g]]);
  const weakest = ratios.reduce((a, b) => (b[1] < a[1] ? b : a));
  const strongest = ratios.reduce((a, b) => (b[1] > a[1] ? b : a));
  if (trans === 'unchanged') {
    // If the board is genuinely split, say so; else name the weakest driver.
    const spread = strongest[1] - weakest[1];
    if (spread < 0.34) return 'little_moved';
  }
  const focus = trans === 'improved' ? strongest[0] : weakest[0];
  const map = {
    improved: {
      btc_structure: 'btc_recovered',
      macro_environment: 'macro_eased',
      institutional_demand: 'flows_in',
      relative_strength: 'mixed_shift',
    },
    worsened: {
      btc_structure: 'btc_broke',
      macro_environment: 'macro_tightened',
      institutional_demand: 'flows_out',
      relative_strength: 'mixed_shift',
    },
    unchanged: {
      btc_structure: 'btc_broke',
      macro_environment: 'macro_tightened',
      institutional_demand: 'flows_out',
      relative_strength: 'mixed_shift',
    },
  };
  return map[trans][focus] ?? 'mixed_shift';
}

/** The two signals nearest to flipping — the {watching} slot. */
function watchingIds() {
  const flippable = computed.signals
    .filter((s) => (s.state === 'INACTIVE' || s.state === 'ACTIVE') && s.values?.gapPct != null)
    .map((s) => ({ id: s.id, dist: Math.abs(s.values.gapPct) }))
    .sort((a, b) => a.dist - b.dist);
  const two = flippable.slice(0, 2).map((s) => s.id);
  // Deterministic fallback so the slot is never empty.
  if (two.length < 2) {
    for (const s of computed.signals)
      if (!two.includes(s.id) && phrases.watching[s.id]) two.push(s.id);
    return two.slice(0, 2);
  }
  return two;
}

function plainSummary(locale) {
  const trans = transition();
  const week = isoWeek(computed.computed_at.slice(0, 10));
  const variant = plainTpl[computed.regime_code][trans][week % 3];
  const btcMonth = monthName(byId['BTC-01']?.anchor, locale);
  const btcMovePct =
    byId['BTC-01']?.values?.monthMovePct != null ? Math.abs(byId['BTC-01'].values.monthMovePct) : 0;
  const changed = fill(phrases.changed[driverKey(trans)][locale], {
    monthName: btcMonth,
    plainMove: plainMove(btcMovePct, locale),
  });
  const ids = watchingIds();
  const watchParts = ids.map((id) => phrases.watching[id]?.[locale]).filter(Boolean);
  // Localize the joining conjunction — a hardcoded English "and" leaked into the
  // pt-BR/es/de grandmother layer (voice audit F-2, 2026-07-12).
  const AND = { en: 'and', 'pt-BR': 'e', es: 'y', de: 'und' };
  const watching =
    watchParts.length === 2
      ? `${watchParts[0]}, ${AND[locale] ?? 'and'} ${watchParts[1]}`
      : (watchParts[0] ?? '');
  return fill(variant[locale], { whatChanged: changed, watching });
}

// ── assemble the generated object per locale ────────────────────────────────
function applyOverride(pathKey, value) {
  return pathKey in overrides ? overrides[pathKey] : value;
}

function generate() {
  const out = { plain: {}, signalSummaries: {}, groupSummaries: {} };
  for (const loc of LOCALES) {
    out.plain[loc] = applyOverride(`summary.plain.${loc}`, plainSummary(loc));
    for (const s of computed.signals) {
      out.signalSummaries[s.id] = out.signalSummaries[s.id] ?? {};
      out.signalSummaries[s.id][loc] = applyOverride(
        `signal.${s.id}.${loc}`,
        signalSentence(s.id, loc)
      );
    }
    for (const g of Object.keys(computed.group_totals)) {
      out.groupSummaries[g] = out.groupSummaries[g] ?? {};
      out.groupSummaries[g][loc] = applyOverride(`group.${g}.${loc}`, groupSummary(g, loc));
    }
  }
  return out;
}

// ── historical append + prune + seed flip ───────────────────────────────────
function nextHistorical(archiveRealCount) {
  const hist = read(path.join(MARKET_DIR, 'historical.json'));
  const date = `${computed.computed_at.slice(0, 10)}T00:00:00Z`;
  const snaps = hist.snapshots.filter((s) => s.date !== date);
  snaps.push({ date, score: computed.score, regime_code: computed.regime_code });
  const pruned = snaps.slice(-HISTORICAL_CAP);
  const seed = archiveRealCount >= REAL_SNAPSHOTS_FOR_FLIP ? false : hist.synthetic_seed;
  return { ...hist, synthetic_seed: seed, snapshots: pruned };
}
function realSnapshotCount() {
  const archivePath = path.join(MARKET_DIR, 'run-archive.jsonl');
  if (!fs.existsSync(archivePath)) return 0;
  return fs.readFileSync(archivePath, 'utf8').split('\n').filter(Boolean).length;
}

// ── write / check ───────────────────────────────────────────────────────────
function patchEditorial(gen, write) {
  const regimePath = path.join(MARKET_DIR, 'regime.json');
  const signalsPath = path.join(MARKET_DIR, 'signals.json');
  const regime = read(regimePath);
  const signals = read(signalsPath);
  const drift = [];

  for (const loc of LOCALES) {
    if (regime.summary[loc].plain !== gen.plain[loc]) {
      drift.push(`regime.summary.${loc}.plain`);
      regime.summary[loc].plain = gen.plain[loc];
    }
  }
  for (const g of regime.signal_groups) {
    for (const loc of LOCALES) {
      const want = gen.groupSummaries[g.id]?.[loc];
      if (want && g.summary[loc] !== want) {
        drift.push(`regime.signal_groups.${g.id}.summary.${loc}`);
        g.summary[loc] = want;
      }
    }
  }
  for (const g of signals.groups) {
    for (const loc of LOCALES) {
      const gw = gen.groupSummaries[g.id]?.[loc];
      if (gw && g.summary[loc] !== gw) {
        drift.push(`signals.${g.id}.summary.${loc}`);
        g.summary[loc] = gw;
      }
    }
    for (const s of g.signals) {
      for (const loc of LOCALES) {
        const sw = gen.signalSummaries[s.id]?.[loc];
        if (sw && s.summary[loc] !== sw) {
          drift.push(`signals.${s.id}.summary.${loc}`);
          s.summary[loc] = sw;
        }
      }
    }
  }

  const nextHist = nextHistorical(realSnapshotCount());
  const curHist = read(path.join(MARKET_DIR, 'historical.json'));
  if (JSON.stringify(curHist) !== JSON.stringify(nextHist)) drift.push('historical.json');

  if (write) {
    fs.writeFileSync(regimePath, JSON.stringify(regime, null, 2) + '\n');
    fs.writeFileSync(signalsPath, JSON.stringify(signals, null, 2) + '\n');
    fs.writeFileSync(
      path.join(MARKET_DIR, 'historical.json'),
      JSON.stringify(nextHist, null, 2) + '\n'
    );
  }
  return drift;
}

const checkMode = process.argv.includes('--check');
const gen = generate();
const drift = patchEditorial(gen, !checkMode);

console.log(`\n=== market generate (Stage 4) — ${checkMode ? 'CHECK' : 'WRITE'} ===`);
console.log(
  `  transition: ${transition()} · variant: week ${isoWeek(computed.computed_at.slice(0, 10)) % 3}`
);
console.log(`  plain (en): ${gen.plain.en.slice(0, 120)}…`);
if (checkMode) {
  if (drift.length) {
    console.error(`\n✖ ${drift.length} editorial field(s) drift from the generator:`);
    for (const d of drift) console.error(`    - ${d}`);
    console.error('\n  Regenerate: node apps/web/scripts/market-refresh/generate.mjs\n');
    process.exit(1);
  }
  console.log('  ✓ editorial JSONs match the generator (no drift)\n');
} else {
  console.log(
    `  wrote ${drift.length} changed field(s) across regime.json / signals.json / historical.json\n`
  );
}
