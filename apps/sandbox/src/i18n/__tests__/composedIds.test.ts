import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STRATEGY_CATALOG } from '@diboas/defi';
import type { GoalStatus } from '@diboas/banking';
import { CHART_TIMEFRAMES } from '../../components/ApyChart';
import { CONSENT_OPT_IN_IDS } from '../../components/Consent';
import { MONEY_OUT_ACTIONS } from '../../components/MoneyOut';
import { RISK_FACTOR_KEYS } from '../../components/StrategyDetail';
import { HORIZON_BANDS } from '../../components/StrategyPicker';
import { SOURCE_ORDER } from '../../lib/monthReport';
import { SIM_EVENT_OPTION_KEYS } from '../../lib/simulatedEvents';
import { composeIds, findComposedMessageIds, toPattern } from '../composedIds';
import { SANDBOX_LOCALES } from '../config';
import { getMessages } from '../loadMessages';

/**
 * CID-1 — every template-composed message id resolves in every locale.
 *
 * The registry below is the ONLY place a composed pattern is allowed to exist;
 * each entry names the runtime array the template iterates, so adding a value
 * to the code without its keys fails here — not in a user's browser two weeks
 * later (PENDING_ALL 5.155/5.156). Where the code iterates a type union with no
 * runtime array (GoalStatus), the rendered subset is listed here `satisfies`
 * the union, so a renamed status fails `tsc`, not just this test.
 */
// The status chip renders only for NON-active goals (GoalRow `closed`,
// GoalsListScreen `status !== 'active'`), so `goalsList.status.active` is never
// composed and has no key. Listing exactly the rendered subset, typed against
// GoalStatus so a renamed status fails `tsc`; a NEW status must be added here
// AND to the catalogs, which is the point.
const RENDERED_GOAL_STATUSES = [
  'paused',
  'dropped',
  'accomplished',
] as const satisfies readonly Exclude<GoalStatus, 'active'>[];

const STRATEGY_KEYS = [...new Set(STRATEGY_CATALOG.flatMap((s) => [s.id, s.i18nKey]))];
const PROTOCOL_IDS = [
  ...new Set(STRATEGY_CATALOG.flatMap((s) => s.allocation.map((l) => l.protocolId))),
];

const REGISTRY: { pattern: string; values: readonly (string | number)[] }[] = [
  { pattern: 'move.*', values: MONEY_OUT_ACTIONS },
  { pattern: 'move.*Title', values: MONEY_OUT_ACTIONS },
  { pattern: 'move.*Body', values: MONEY_OUT_ACTIONS },
  { pattern: 'catalog.strategies.*.name', values: STRATEGY_KEYS },
  { pattern: 'catalog.strategies.*.tagline', values: STRATEGY_KEYS },
  { pattern: 'catalog.protocols.*', values: PROTOCOL_IDS },
  { pattern: 'strategyDetail.*', values: RISK_FACTOR_KEYS },
  { pattern: 'monthReport.source.*', values: SOURCE_ORDER },
  { pattern: 'monthReport.sourceNote.*', values: SOURCE_ORDER },
  { pattern: 'catalogFilters.horizonBand.*', values: HORIZON_BANDS },
  { pattern: 'consent.*Title', values: CONSENT_OPT_IN_IDS },
  { pattern: 'consent.*Body', values: CONSENT_OPT_IN_IDS },
  { pattern: 'goalsList.status.*', values: RENDERED_GOAL_STATUSES },
  { pattern: 'simEvent.option.*', values: SIM_EVENT_OPTION_KEYS },
  { pattern: 'simEvent.optionNote.*', values: SIM_EVENT_OPTION_KEYS },
  { pattern: 'apyChart.tf.*', values: CHART_TIMEFRAMES },
];

const SRC = join(__dirname, '..', '..');
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === '__tests__' || name === 'test' || name === 'node_modules') continue;
    // The finder's own doc comment quotes the three contexts as examples.
    if (name === 'composedIds.ts') continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('CID-1 — composed message ids resolve in every locale', () => {
  const files = walk(SRC);
  const found = files.flatMap((f) =>
    findComposedMessageIds(readFileSync(f, 'utf8')).map((c) => ({ ...c, file: relative(SRC, f) }))
  );

  it('should find composed ids in the source tree (the scan itself must not go vacuous)', () => {
    expect(files.length).toBeGreaterThan(50);
    expect(found.length).toBeGreaterThan(10);
    expect(found.some((c) => c.pattern === 'move.*Body')).toBe(true);
  });

  it('should have every composed pattern in the source registered with its value source', () => {
    const registered = new Set(REGISTRY.map((r) => r.pattern));
    const unregistered = found.filter((c) => !registered.has(c.pattern));
    expect(
      unregistered.map((c) => `${c.file}:${c.line} → ${c.pattern}`),
      'unregistered composed message ids — add each to REGISTRY with the array the code iterates'
    ).toEqual([]);
  });

  it('should have no registry entry that no source uses any more', () => {
    const inSource = new Set(found.map((c) => c.pattern));
    const stale = REGISTRY.filter((r) => !inSource.has(r.pattern)).map((r) => r.pattern);
    expect(stale, 'stale registry entries').toEqual([]);
  });

  it.each(REGISTRY)(
    'should resolve $pattern for every value in every locale',
    ({ pattern, values }) => {
      expect(values.length).toBeGreaterThan(0);
      const ids = composeIds(pattern, values);
      for (const locale of SANDBOX_LOCALES) {
        const messages = getMessages(locale);
        const missing = ids.filter((id) => !messages[id]?.trim());
        // Sabotage: delete `move.addBody` from en.json (or add 'earn' to
        // MONEY_OUT_ACTIONS without its keys) and this row goes red.
        expect(missing, `${locale} is missing`).toEqual([]);
      }
    }
  );
});

describe('CID-1 — the finder itself', () => {
  it('should match the three message-id contexts and ignore DOM ids', () => {
    const src = [
      '<FormattedMessage id={`move.${a.id}`} />',
      '<BottomSheet titleId={`move.${sheet}Title`} onClose={x}>',
      'intl.formatMessage({ id: `monthReport.source.${key}` })',
      '<p id={`opt-${o.id}`} className={s}>',
      '<input id={`${fieldId}-horizon`} />',
      '<FormattedMessage id="move.balance" />',
    ].join('\n');
    expect(findComposedMessageIds(src).map((c) => c.pattern)).toEqual([
      'move.*',
      'move.*Title',
      'monthReport.source.*',
    ]);
  });

  it('should report the 1-based line of each match', () => {
    const src = 'a\nb\n<FormattedMessage id={`x.${y}`} />';
    expect(findComposedMessageIds(src)[0].line).toBe(3);
  });

  it('should normalise any expression inside ${…} to one star', () => {
    expect(toPattern('catalog.strategies.${strategy.i18nKey}.name')).toBe(
      'catalog.strategies.*.name'
    );
  });

  it('should refuse a pattern without exactly one star', () => {
    expect(() => composeIds('move.add', ['x'])).toThrow(/exactly one/);
    expect(() => composeIds('a.*.*', ['x'])).toThrow(/exactly one/);
  });
});
