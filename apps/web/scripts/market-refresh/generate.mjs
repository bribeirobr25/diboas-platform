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
 *   - NUMERIC ENGINE-MIRRORS (added 2026-07-27 — the weekly-workflow root-cause-B
 *     fix: these were hand-transcribed before, so any week the engine's result
 *     changed, the F-M4 reconcile gate correctly failed the automated refresh):
 *       regime.json  score / max_score / regime_code / regime_label /
 *                    environment_bias / last_updated_at (:= computed_at) /
 *                    signal_groups[].{points_awarded,status}
 *       signals.json groups[].{points_awarded,status} +
 *                    groups[].signals[].{state,points_awarded,max_points,last_updated_at}
 *     All are pure deterministic transcriptions of computed.json — no editorial
 *     judgment. Group status maps from the SAME groupLevel() band that drives
 *     the group summary copy (status chip and copy can no longer disagree).
 *     Per-signal last_updated_at: monthly-anchored → end of the anchor month;
 *     weekly-anchored → computed_at (preserves the committed semantics).
 *
 * PRESERVED (editorial-owned, never touched here): the research-memo voice
 * (regime.summary.<locale>.{short,detailed,confidence_level,mixed_signals,
 * key_*}) and data_status (P2's output). An `editorial-override.json` may
 * replace any single generated string for a cycle (judgment preserved).
 *
 * Plain-layer assembly (2026-07-28 restructure): the grandmother lead is
 *   [weekly opener] + [monthly "standing" read] + "What we're watching: …".
 * The weekly opener (weekly-openers.json) names the week-over-week score/band
 * move vs the prior snapshot — shown only once the ledger is real (not
 * synthetic_seed). The monthly standing (plain-summaries.json, per band ×
 * week-rotated variant, ISO-week % 3) is transition-agnostic (state + why) and
 * reads standalone when no opener applies. {watching} fills from
 * plain-phrases.json. This split killed the earlier week/month blur (a weekly
 * delta driving month-framed copy).
 *
 * synthetic_seed flip (founder ruling 2026-07-11): flips to false once the
 * archive holds >= REAL_SNAPSHOTS_FOR_FLIP consecutive real snapshots.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MAX_BY_GROUP,
  GROUP_STATUS,
  fill,
  groupLevel,
  groupSummary,
} from './lib/group-summaries.mjs';
import { activeOverrides } from './lib/editorial-overrides.mjs';
import { deriveDataStatus, DATA_STATUS_COMMENT } from './lib/data-status.mjs';
import { readSnapshots } from './lib/etf-flows.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const MARKET_DIR = path.join(REPO_ROOT, 'apps/web/data/market');
const SHARED_DIR = path.join(MARKET_DIR, 'shared'); // 5.92: run-shared outputs
const TPL_DIR = path.join(__dirname, 'templates');

const LOCALES = ['en', 'pt-BR', 'es', 'de'];
const REAL_SNAPSHOTS_FOR_FLIP = 8; // founder ruling 2026-07-11
const HISTORICAL_CAP = 52;

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const readIfExists = (p) => (fs.existsSync(p) ? read(p) : null);

const computed = read(path.join(SHARED_DIR, 'computed.json'));
const signalTpl = read(path.join(TPL_DIR, 'signal-sentences.json'));
const groupTpl = read(path.join(TPL_DIR, 'group-summaries.json'));
const signalLabels = read(path.join(TPL_DIR, 'signal-labels.json'));
const weeklyTpl = read(path.join(TPL_DIR, 'weekly-openers.json'));
const plainTpl = read(path.join(TPL_DIR, 'plain-summaries.json'));
const phrases = read(path.join(TPL_DIR, 'plain-phrases.json'));
// Cycle-scoped (B2): a stale or unstamped _cycle ⇒ the whole file is ignored
// with a warning — an override never outlives the cycle it was written for.
const overrides = activeOverrides(
  readIfExists(path.join(SHARED_DIR, 'editorial-override.json')),
  computed.computed_at
);

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

// ── signal sentences ───────────────────────────────────────────────────────
const byId = Object.fromEntries(computed.signals.map((s) => [s.id, s]));

// Group-summary selection + the shared group maps live in
// lib/group-summaries.mjs (extracted 2026-08-11 for unit-testability). The
// selection context injects this cycle's computed state + template library.
const copyCtx = {
  byId,
  groupTotals: computed.group_totals,
  groupTpl,
  signalLabels,
};

// ── numeric engine-mirror maps (root-cause-B fix, 2026-07-27) ───────────────
// regime_code → display label / bias (fixture-confirmed pure maps,
// apps/web/src/lib/analytics-sdk/types.ts RegimeLabel/EnvironmentBias).
const REGIME_LABELS = {
  VERY_FAVORABLE: 'Very Favorable',
  CONSTRUCTIVE: 'Constructive',
  NEUTRAL_MIXED: 'Neutral / Mixed',
  DEFENSIVE: 'Defensive',
  HOSTILE: 'Hostile',
};
const ENVIRONMENT_BIAS = {
  VERY_FAVORABLE: 'STRONG_ALIGNMENT',
  CONSTRUCTIVE: 'CONSTRUCTIVE',
  NEUTRAL_MIXED: 'MIXED',
  DEFENSIVE: 'DEFENSIVE',
  HOSTILE: 'HOSTILE',
};
// Plain-language regime word per locale — the {band} slot in the weekly opener's
// band-change case (kept plain; distinct from the UI's title-case regime labels).
const PLAIN_BAND = {
  en: {
    HOSTILE: 'hostile',
    DEFENSIVE: 'defensive',
    NEUTRAL_MIXED: 'mixed',
    CONSTRUCTIVE: 'constructive',
    VERY_FAVORABLE: 'very favorable',
  },
  'pt-BR': {
    HOSTILE: 'hostil',
    DEFENSIVE: 'defensivo',
    NEUTRAL_MIXED: 'misto',
    CONSTRUCTIVE: 'construtivo',
    VERY_FAVORABLE: 'muito favorável',
  },
  es: {
    HOSTILE: 'hostil',
    DEFENSIVE: 'defensivo',
    NEUTRAL_MIXED: 'mixto',
    CONSTRUCTIVE: 'constructivo',
    VERY_FAVORABLE: 'muy favorable',
  },
  de: {
    HOSTILE: 'ungünstig',
    DEFENSIVE: 'defensiv',
    NEUTRAL_MIXED: 'gemischt',
    CONSTRUCTIVE: 'konstruktiv',
    VERY_FAVORABLE: 'sehr günstig',
  },
};
/** '2026-06-01' (anchor month) → '2026-06-30T00:00:00Z' (end of that month). */
function monthEnd(anchor) {
  const y = Number(anchor.slice(0, 4));
  const m = Number(anchor.slice(5, 7));
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${anchor.slice(0, 7)}-${String(lastDay).padStart(2, '0')}T00:00:00Z`;
}
/** Committed vintage semantics: monthly signals date to their anchor month's
 *  end; weekly signals date to the refresh moment. */
function signalUpdatedAt(sig) {
  return sig.anchorKind === 'monthly' ? monthEnd(sig.anchor) : computed.computed_at;
}

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

// ── plain (grandmother) summary ─────────────────────────────────────────────
/** Most recent snapshot on a DIFFERENT date than today's (the prior refresh), or
 *  null if none — the basis for the week-over-week lead-in. */
function priorSnapshot() {
  const hist = read(path.join(SHARED_DIR, 'historical.json'));
  const snaps = hist.snapshots ?? [];
  const today = computed.computed_at.slice(0, 10);
  for (let i = snaps.length - 1; i >= 0; i -= 1) {
    if (snaps[i].date.slice(0, 10) !== today) return snaps[i];
  }
  return null;
}
/** Week-over-week lead-in for the plain read: names the score/band move since the
 *  prior refresh. Returns '' when the real weekly ledger isn't trusted yet
 *  (synthetic_seed) or there is no genuine prior — so the monthly "standing" read
 *  stands alone rather than claim a comparison against seed data. Priority:
 *  band change > score move > held. */
function weeklyOpener(locale) {
  const hist = read(path.join(SHARED_DIR, 'historical.json'));
  // FORCE_WEEKLY_OPENER=1 previews the opener before the real ledger flips
  // synthetic_seed to false (dev/preview only — never set in CI/prod, so the
  // committed output and the drift gate stay opener-off until the data is real).
  if (hist.synthetic_seed && !process.env.FORCE_WEEKLY_OPENER) return '';
  const prior = priorSnapshot();
  if (!prior || prior.score == null) return '';
  const score = computed.score;
  const slots = {
    score: String(score),
    max: String(computed.max_score),
    prior: String(prior.score),
  };
  if (prior.regime_code && prior.regime_code !== computed.regime_code) {
    const key = score > prior.score ? 'bandUp' : 'bandDown';
    return fill(weeklyTpl[key][locale], {
      ...slots,
      band: PLAIN_BAND[locale][computed.regime_code],
    });
  }
  if (score > prior.score) return fill(weeklyTpl.moveUp[locale], slots);
  if (score < prior.score) return fill(weeklyTpl.moveDown[locale], slots);
  return fill(weeklyTpl.held[locale], slots);
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
  // Monthly "standing" read (transition-agnostic: state + why), rotated weekly.
  const variants = plainTpl[computed.regime_code].standing;
  const week = isoWeek(computed.computed_at.slice(0, 10));
  const standing = variants[week % variants.length][locale];
  const ids = watchingIds();
  const watchParts = ids.map((id) => phrases.watching[id]?.[locale]).filter(Boolean);
  // Localize the joining conjunction (F-2, 2026-07-12). German joins two
  // "ob"-clauses without a comma ("ob A und ob B"); es/pt keep the comma.
  const AND = { en: 'and', 'pt-BR': 'e', es: 'y', de: 'und' };
  const sep = locale === 'de' ? ` ${AND[locale]} ` : `, ${AND[locale] ?? 'and'} `;
  const watching =
    watchParts.length === 2 ? `${watchParts[0]}${sep}${watchParts[1]}` : (watchParts[0] ?? '');
  const body = fill(standing, { watching });
  // Prepend the week-over-week lead-in (empty while the ledger is seed-only).
  const opener = weeklyOpener(locale);
  return opener ? `${opener} ${body}` : body;
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
      out.groupSummaries[g][loc] = applyOverride(
        `group.${g}.${loc}`,
        groupSummary(copyCtx, g, loc)
      );
    }
  }
  return out;
}

// ── historical append + prune + seed flip ───────────────────────────────────
function nextHistorical(archiveRealCount) {
  const hist = read(path.join(SHARED_DIR, 'historical.json'));
  const date = `${computed.computed_at.slice(0, 10)}T00:00:00Z`;
  const snaps = hist.snapshots.filter((s) => s.date !== date);
  snaps.push({ date, score: computed.score, regime_code: computed.regime_code });
  const pruned = snaps.slice(-HISTORICAL_CAP);
  const seed = archiveRealCount >= REAL_SNAPSHOTS_FOR_FLIP ? false : hist.synthetic_seed;
  return { ...hist, synthetic_seed: seed, snapshots: pruned };
}
function realSnapshotCount() {
  const archivePath = path.join(SHARED_DIR, 'run-archive.jsonl');
  if (!fs.existsSync(archivePath)) return 0;
  return fs.readFileSync(archivePath, 'utf8').split('\n').filter(Boolean).length;
}

// ── write / check ───────────────────────────────────────────────────────────
/**
 * Write JSON in the repo's committed style. Prettier collapses short primitive
 * arrays (e.g. data_status.delayed_sources) that JSON.stringify always expands
 * — without this, every generate-written regime.json fails CI `format:check`
 * (found 2026-07-27 fixing the weekly workflow). Falls back to raw stringify
 * if prettier isn't installed (the output is still valid JSON; CI formatting
 * is then the caller's job).
 */
async function writeJsonFormatted(p, obj) {
  let text = JSON.stringify(obj, null, 2) + '\n';
  try {
    const { format } = await import('prettier');
    text = await format(text, { parser: 'json', filepath: p });
  } catch {
    /* prettier unavailable — raw JSON.stringify remains valid */
  }
  fs.writeFileSync(p, text);
}

async function patchEditorial(gen, write) {
  const regimePath = path.join(SHARED_DIR, 'regime.json');
  const signalsPath = path.join(SHARED_DIR, 'signals.json');
  const regime = read(regimePath);
  const signals = read(signalsPath);
  const drift = [];
  const setField = (obj, key, want, label) => {
    if (obj[key] !== want) {
      drift.push(label);
      obj[key] = want;
    }
  };

  // ── numeric engine-mirrors (root-cause-B fix): pure transcription of
  //    computed.json. Before 2026-07-27 these had NO automated writer, so any
  //    week the engine's result changed, the F-M4 reconcile gate failed the
  //    weekly workflow (07-20: REL-01 flipped ACTIVE → rel total 1→2 while
  //    signals.json still said 1). ─────────────────────────────────────────
  setField(regime, 'score', computed.score, 'regime.score');
  setField(regime, 'max_score', computed.max_score, 'regime.max_score');
  setField(regime, 'regime_code', computed.regime_code, 'regime.regime_code');
  setField(regime, 'regime_label', REGIME_LABELS[computed.regime_code], 'regime.regime_label');
  setField(
    regime,
    'environment_bias',
    ENVIRONMENT_BIAS[computed.regime_code],
    'regime.environment_bias'
  );
  setField(regime, 'last_updated_at', computed.computed_at, 'regime.last_updated_at');
  for (const g of regime.signal_groups) {
    setField(
      g,
      'points_awarded',
      computed.group_totals[g.id],
      `regime.signal_groups.${g.id}.points_awarded`
    );
    setField(
      g,
      'status',
      GROUP_STATUS[groupLevel(computed.group_totals[g.id], MAX_BY_GROUP[g.id])],
      `regime.signal_groups.${g.id}.status`
    );
  }
  for (const g of signals.groups) {
    setField(g, 'points_awarded', computed.group_totals[g.id], `signals.${g.id}.points_awarded`);
    setField(
      g,
      'status',
      GROUP_STATUS[groupLevel(computed.group_totals[g.id], MAX_BY_GROUP[g.id])],
      `signals.${g.id}.status`
    );
    for (const s of g.signals) {
      const c = byId[s.id];
      if (!c) continue; // a registry drift is caught by the market vitest, not silently synced
      setField(s, 'state', c.state, `signals.${s.id}.state`);
      setField(s, 'points_awarded', c.points, `signals.${s.id}.points_awarded`);
      setField(s, 'max_points', c.weight, `signals.${s.id}.max_points`);
      setField(s, 'last_updated_at', signalUpdatedAt(c), `signals.${s.id}.last_updated_at`);
    }
  }

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

  // ── data_status (B3, 2026-08-11 — closes Follow-up L): ONE derivation
  //    written to BOTH panels, so the F-M6 mirror holds by construction and
  //    the --check gate makes a hand-edited panel un-mergeable. ─────────────
  const derivedStatus = deriveDataStatus(computed, readSnapshots());
  if (JSON.stringify(regime.data_status) !== JSON.stringify(derivedStatus)) {
    drift.push('regime.data_status');
    regime.data_status = derivedStatus;
  }
  const dataStatusPath = path.join(SHARED_DIR, 'data-status.json');
  const nextDataStatus = { _comment: DATA_STATUS_COMMENT, ...derivedStatus };
  if (JSON.stringify(read(dataStatusPath)) !== JSON.stringify(nextDataStatus)) {
    drift.push('data-status.json');
  }

  const nextHist = nextHistorical(realSnapshotCount());
  const curHist = read(path.join(SHARED_DIR, 'historical.json'));
  if (JSON.stringify(curHist) !== JSON.stringify(nextHist)) drift.push('historical.json');

  if (write) {
    await writeJsonFormatted(regimePath, regime);
    await writeJsonFormatted(signalsPath, signals);
    await writeJsonFormatted(dataStatusPath, nextDataStatus);
    await writeJsonFormatted(path.join(SHARED_DIR, 'historical.json'), nextHist);
  }
  return drift;
}

const checkMode = process.argv.includes('--check');
const gen = generate();
const drift = await patchEditorial(gen, !checkMode);

console.log(`\n=== market generate (Stage 4) — ${checkMode ? 'CHECK' : 'WRITE'} ===`);
console.log(
  `  variant: week ${isoWeek(computed.computed_at.slice(0, 10)) % 3} · weekly-opener: ${weeklyOpener('en') ? 'on' : 'off (seed/no prior)'}`
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
