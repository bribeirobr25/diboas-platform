/**
 * B2-5 — GENIUS-Act stablecoin/yield copy wall (regression guard).
 *
 * Rule (US GENIUS Act, signed 2025-07-18; CLO ruling in
 * docs/sandbox-app/CC_B1_B2_EXECUTION_LIST_2026-07-21.md §"CLO VERIFICATION"):
 * a payment stablecoin ("digital dollar" / USDC) must NEVER be described as
 * "earning" or "yielding." Returns come from the *strategy* (the DeFi position,
 * variable), never from *holding* the stablecoin. So an "earn/yield"-family word
 * must not sit within ~40 chars of a "digital dollar / USDC / stablecoin" token.
 *
 * The canonical wall phrasing (CLO-adopted): "the returns come from the
 * strategy, not from holding the dollars."
 *
 * This guard fails the build on any NEW pairing, EXCEPT the explicit allow-list below: named
 * protocol-mechanism texts (each with the founder decision that admits it) and one sentence that
 * states no return is guaranteed. The 2026-07-21 transcreation-pending and disclaimer entries are
 * gone: the strings were rewritten (2026-11-11), not exempted.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fillScenarioCopy } from '@/lib/compound-interest/scenarioCopy';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { OG_TRANSLATIONS } from '../../../app/api/og/share/ogTranslations';

const TRANSLATIONS_DIR = join(__dirname, '../../../../../../packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

/**
 * The patterns live in ONE file both walls read (this one and the apps/sandbox mirror), so
 * they cannot drift (register `5.749`). Widened 2026-11-04: hyphenated "digital-dollar",
 * pt-BR "dólares digitais" and German inflected forms ("digitalen Dollar", "Digital-Dollar"),
 * which the old `digital dollar` missed while live strings paired them with "yield"/"Rendite".
 */
const PATTERNS = JSON.parse(
  readFileSync(join(__dirname, '../../../../../../config/genius-wall-patterns.json'), 'utf8')
) as { earn: string; stable: string };
const EARN = PATTERNS.earn;
const STABLE = PATTERNS.stable;
// `s`: a line break inside a string must not hide a pairing (2026-11-11).
const PAIRING = new RegExp(`(?:${EARN}).{0,40}(?:${STABLE})|(?:${STABLE}).{0,40}(?:${EARN})`, 'is');

/** `${locale}::${namespace}::${keyPath}` — CLO-scoped (2026-07-21 inventory). */
const ALLOW: ReadonlySet<string> = new Set([
  // --- PERMANENT · Cat 2 · protocol-mechanism (factual transparency table) ---
  // Ethena: how a synthetic dollar is made, set against stablecoins (a comparison, not a claim).
  'en::protocols::cards.ethena.description',
  'es::protocols::cards.ethena.description',
  'de::protocols::cards.ethena.description',
  'pt-BR::protocols::cards.ethena.description',
  // Sky's card is no longer an exception: rewritten 2026-11-11 to describe the mechanism with no
  // earn word and no comparison with a savings account in any language (founder, W-B sign-off).
  // Aave/Compound: a distinct mechanism (lending USDC to borrowers) with its condition
  // (variable rate) and its risk, the education LC-RR-01 allows (founder 2026-11-11,
  // DR-2026-11-11-market-cleanup-c2-decisions B; en/pt-BR join with the widened pattern).
  'en::strategies::protocols.items.aaveV3.summary',
  'en::strategies::protocols.items.compoundV3.summary',
  'es::strategies::protocols.items.aaveV3.summary',
  'es::strategies::protocols.items.compoundV3.summary',
  'de::strategies::protocols.items.aaveV3.summary',
  'de::strategies::protocols.items.compoundV3.summary',
  'pt-BR::strategies::protocols.items.aaveV3.summary',
  'pt-BR::strategies::protocols.items.compoundV3.summary',
  // Sky's lending summary ("Returns generated from lending USDS to borrowers. Variable rate."):
  // the same class as Aave/Compound under decision B; USDS joined the pattern 2026-11-11.
  'en::strategies::protocols.items.skySsr.summary',
  'es::strategies::protocols.items.skySsr.summary',
  'de::strategies::protocols.items.skySsr.summary',
  'pt-BR::strategies::protocols.items.skySsr.summary',
  // --- PERMANENT · a negation: "Não existe retorno garantido." then, after a paragraph break,
  // "Dólar digital, …" (visible once the wall reads across line breaks, 2026-11-11). ---
  'pt-BR::landing-b2c::ptbr.trust.body',
  // Removed 2026-11-11 by rewrite, not by exception: the Sky type label ("Stablecoin yield",
  // now "Savings rate"), the es/pt-BR tools disclaimer and the pt-BR Learn calibration note.
  // NB: the investor-docs pitch-deck "USDC plus on-chain yield" bullets were
  // RULED out of consumer GENIUS scope (CLO final sign-off 2026-07-21) yet
  // reworded to "on-chain returns" for house-style hygiene — so they no longer
  // pair and are intentionally NOT allow-listed here.
]);

/**
 * The text as a reader is served it (5.730): the page loader fills `{scenario…}` slots, and a slot
 * is ~20 characters longer than the rate it becomes, so a pairing can be too far apart in the raw
 * catalogue and within reach once served (9th audit). The wall reads both; it only widens.
 */
function served(leaf: string, locale: string): string {
  return fillScenarioCopy({ leaf }, locale).leaf;
}

function walkStrings(
  value: unknown,
  keyPath: string,
  fn: (leaf: string, path: string) => void
): void {
  if (typeof value === 'string') return fn(value, keyPath);
  if (Array.isArray(value)) return value.forEach((v, i) => walkStrings(v, `${keyPath}[${i}]`, fn));
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walkStrings(v, keyPath ? `${keyPath}.${k}` : k, fn);
  }
}

/**
 * Every translation file of a locale, subfolders included (`legal/*.json` were never scanned
 * before 2026-10-30, register `5.725`: a strengthening of the wall, never a relaxation).
 */
function translationFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.json'))
    .sort();
}

describe('B2-5 — GENIUS-Act stablecoin/yield copy wall', () => {
  it('should scan every translation file, the legal pages included, in every locale', () => {
    for (const locale of LOCALES) {
      const files = translationFiles(join(TRANSLATIONS_DIR, locale));
      expect(files, locale).toContain('legal/privacy.json');
      expect(files, locale).toContain('common.json');
    }
  });

  for (const locale of LOCALES) {
    it(`should not pair earn/yield with a stablecoin token outside the allow-list (${locale})`, () => {
      const dir = join(TRANSLATIONS_DIR, locale);
      const unlisted: string[] = [];
      for (const file of translationFiles(dir)) {
        const ns = file.replace(/\.json$/, '');
        const json = JSON.parse(readFileSync(join(dir, file), 'utf8'));
        walkStrings(json, '', (leaf, path) => {
          const pairs = PAIRING.test(leaf) || PAIRING.test(served(leaf, locale));
          if (pairs && !ALLOW.has(`${locale}::${ns}::${path}`)) {
            unlisted.push(`${locale}::${ns}::${path} — "${leaf}"`);
          }
        });
      }
      expect(unlisted, 'new stablecoin-earns pairing (see the GENIUS wall guard)').toEqual([]);
    });
  }

  it('should read the text as served: a scenario slot never hides a pairing (positive control)', () => {
    const planted = 'Conservative: earn {scenarioConservative} a year by holding your USDC';
    expect(PAIRING.test(planted)).toBe(false); // the raw catalogue text alone evades the window
    expect(PAIRING.test(served(planted, 'en'))).toBe(true); // what the reader would see is caught
  });

  /**
   * Code literals too (`5.749`): user-facing text also lives in TS/TSX (SEO constants, JSON-LD
   * fallbacks, share images), and the catalogue scan never saw it. Story files are scanned
   * too. No exception exists: the two dead `protocolsData.ts` descriptions that once needed
   * one were deleted (`5.755`).
   */
  const WEB_SRC = join(__dirname, '../../..');
  const LITERAL = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

  it('should not pair earn/yield with a stablecoin token in any TS/TSX string literal under apps/web/src', () => {
    const found: string[] = [];
    const files = (readdirSync(WEB_SRC, { recursive: true }) as string[])
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /\.tsx?$/.test(f) && !/(__tests__|\.test\.)/.test(f));
    expect(files.length).toBeGreaterThan(300);
    for (const file of files) {
      for (const m of readFileSync(join(WEB_SRC, file), 'utf8').matchAll(LITERAL)) {
        const text = m[0].slice(1, -1);
        if (PAIRING.test(text)) found.push(`${file} — "${text.slice(0, 120)}"`);
      }
    }
    expect(found, 'a code literal pairs earn/yield with a stablecoin token').toEqual([]);
  });

  it('allow-list has no stale entries (every entry still matches the pairing)', () => {
    const stale: string[] = [];
    const seen = new Set<string>();
    for (const locale of LOCALES) {
      const dir = join(TRANSLATIONS_DIR, locale);
      for (const file of translationFiles(dir)) {
        const ns = file.replace(/\.json$/, '');
        const json = JSON.parse(readFileSync(join(dir, file), 'utf8'));
        walkStrings(json, '', (leaf, path) => {
          const id = `${locale}::${ns}::${path}`;
          if (ALLOW.has(id) && PAIRING.test(leaf)) seen.add(id);
        });
      }
    }
    for (const id of ALLOW) if (!seen.has(id)) stale.push(id);
    expect(stale, 'allow-list entry no longer pairs — remove it').toEqual([]);
  });
});

/**
 * POSITIVE CONTROLS (audits 2026-11-05): the patterns live in `config/genius-wall-patterns.json`,
 * and a narrowed pattern used to pass every test above (nothing pairs today, so a weaker regex
 * still finds nothing). `config/genius-wall-controls.json` lists every concrete form the patterns
 * name — each stable form with "earns", each earn form with "USDC" — plus whole breaches found in
 * reviews, so narrowing any form fails. The sandbox mirror reads the same file. The lists have
 * floors, so deleting a control fails too. Out of reach: a rewrite that keeps every listed form
 * but drops an unlisted one — CODEOWNERS on both files notifies, it does not require a review.
 */
const CONTROLS = JSON.parse(
  readFileSync(join(__dirname, '../../../../../../config/genius-wall-controls.json'), 'utf8')
) as { stableForms: string[]; earnForms: string[]; breaches: string[]; windowChars: number };
const GENIUS_POSITIVE_CONTROLS: readonly string[] = [
  ...CONTROLS.stableForms.map((form) => `${form} earns`),
  ...CONTROLS.earnForms.map((form) => `USDC ${form}`),
  ...CONTROLS.breaches,
  // The window, past the 40th character, in both orders: exactly `windowChars` between the two
  // matched words (the window counts from the END of the match, so the earn word is "earn").
  `${'Some long introduction. '.repeat(3)}USDC${'.'.repeat(CONTROLS.windowChars)}earns`,
  `${'Some long introduction. '.repeat(3)}earn${'.'.repeat(CONTROLS.windowChars)}USDC`,
];

describe('B2-5 — the wall still catches every known breach (positive controls)', () => {
  it('should keep every control list at or above its floor when the fixture is read', () => {
    // Floors at the current counts (2026-11-11): narrowing the pattern and deleting its controls
    // in one edit must also lower these, in both walls (W-B review proved the gap at 14/14).
    expect(CONTROLS.stableForms.length).toBeGreaterThanOrEqual(37);
    expect(CONTROLS.earnForms.length).toBeGreaterThanOrEqual(50);
    expect(CONTROLS.breaches.length).toBeGreaterThanOrEqual(27);
    expect(CONTROLS.windowChars).toBeGreaterThanOrEqual(40);
  });

  it('should hold no duplicate control when the fixture is read', () => {
    for (const list of [CONTROLS.stableForms, CONTROLS.earnForms, CONTROLS.breaches]) {
      const lower = list.map((x) => x.toLowerCase());
      expect(new Set(lower).size).toBe(lower.length);
    }
  });

  it.each(GENIUS_POSITIVE_CONTROLS)(
    'should flag "%s" when the shared pattern is applied',
    (sample) => {
      expect(PAIRING.test(sample)).toBe(true);
    }
  );
});

/**
 * Sixth audit (2026-11-05): the share-image texts live in TypeScript
 * (`app/api/og/share/ogTranslations.ts`), outside the catalogues this wall walks, and they say
 * "Held in digital dollars". Every one of them, functions rendered, is held to the same rule.
 */
describe('B2-6 — the share-image texts carry no earn/stablecoin pairing', () => {
  const texts = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') {
      const fn = value as (arg: number | string) => string;
      return [fn(1), fn(5), fn('Ana')];
    }
    if (value && typeof value === 'object') return Object.values(value).flatMap(texts);
    return [];
  };

  it('should render every share-image text and find no pairing in any locale', () => {
    const all = texts(OG_TRANSLATIONS);
    expect(all.length).toBeGreaterThan(80);
    expect(all.filter((t) => PAIRING.test(t))).toEqual([]);
  });

  it('should flag a planted share-image pairing (positive control)', () => {
    expect(PAIRING.test('Your money earning in digital dollars over 5 years')).toBe(true);
  });
});

/**
 * GENIUS-COMBO-1 (register 5.812, founder 2026-11-11): the wall above reads one string at a
 * time, but a reader sees strings TOGETHER. "Conservador (7%)" + " em dólar digital" + a tooltip
 * about "retorno" passed every per-string check while the screen paired a return with the
 * digital dollar. Each group below is the set of catalogue strings one component renders side by
 * side (bound to the component by a source read, so a group cannot drift from the screen). A
 * group fails when an earn word and a stablecoin word occur ANYWHERE in it: co-occurrence, not a
 * 40-character window, so the join separator cannot change the answer. Slots are filled as
 * served. Out of scope, recorded: a chart's screen-reader sentence (decision A kept it) and the
 * protocol table (the named education exception above).
 */
describe('GENIUS-COMBO-1 — strings rendered together carry no earn/stablecoin pairing', () => {
  const EARN_ANY = new RegExp(`(?:${EARN})`, 'i');
  const STABLE_ANY = new RegExp(`(?:${STABLE})`, 'i');
  // Plan §3.5: a stablecoin word next to an earn OR a rate word. "Conservador (7%) em dólar
  // digital" + a tooltip about "taxas" pairs a rate with the stablecoin without any earn word.
  const RATE_ANY = /\b(?:rates?|taxas?|tasas?|tipos?|zins\w*|zinss[äa]tze?)\b|\d\s?%/i;
  const pairsInGroup = (texts: readonly string[]): boolean => {
    const joined = texts.join(' \u2016 ');
    return STABLE_ANY.test(joined) && (EARN_ANY.test(joined) || RATE_ANY.test(joined));
  };
  const SECTIONS = join(__dirname, '../../../components/Sections');
  const catalogue = (locale: string, ns: string): unknown =>
    JSON.parse(readFileSync(join(TRANSLATIONS_DIR, locale, `${ns}.json`), 'utf8'));
  const leaf = (locale: string, id: string): string => {
    const [ns, path] = id.split(':') as [string, string];
    const value = path
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        catalogue(locale, ns)
      );
    if (typeof value !== 'string') throw new Error(`${locale} ${id} is not a string`);
    return served(value, locale);
  };

  type Group = { name: string; file: string; uses: string[]; ids: string[] };
  const SCENARIOS = ['conservative', 'historical', 'optimistic'] as const;
  const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
  const GROUPS: Group[] = [
    {
      name: 'currency result: eyebrow + caption + note',
      file: 'CurrencyDepreciationCalculator/CurrencyDepreciationCalculator.tsx',
      uses: ["t('resultMoment.eyebrow')", "t('output.diboasLabel')", "t('output.diboasNote'"],
      ids: [
        'tools-currency-depreciation:resultMoment.eyebrow',
        'tools-currency-depreciation:output.diboasLabel',
        'tools-currency-depreciation:output.diboasNote',
      ],
    },
    {
      name: 'currency result (US dollar): eyebrow + caption + note',
      file: 'CurrencyDepreciationCalculator/CurrencyDepreciationCalculator.tsx',
      uses: ["t('resultMoment.eyebrowUsd')", "t('output.diboasLabel')", "t('output.diboasNote'"],
      ids: [
        'tools-currency-depreciation:resultMoment.eyebrowUsd',
        'tools-currency-depreciation:output.diboasLabel',
        'tools-currency-depreciation:output.diboasNote',
      ],
    },
    {
      name: 'idle cash result: eyebrow + caption + equal-rate note',
      file: 'IdleCashCalculator/IdleCashCalculator.tsx',
      uses: ["t('resultMoment.eyebrow')", "t('output.diboasLabel')", "t('output.differenceZero'"],
      ids: [
        'tools-idle-cash:resultMoment.eyebrow',
        'tools-idle-cash:output.diboasLabel',
        'tools-idle-cash:output.differenceZero',
      ],
    },
    {
      name: 'emergency fund: conservative label + tooltip',
      file: 'EmergencyFundCalculator/EmergencyFundCalculator.tsx',
      uses: ["tShared('scenarios.conservative')", "tShared('scenarios.conservativeTooltip')"],
      ids: ['tools-shared:scenarios.conservative', 'tools-shared:scenarios.conservativeTooltip'],
    },
    ...SCENARIOS.flatMap((s): Group[] => [
      {
        name: `compound interest, retirement, goal savings: ${s} label + tooltip`,
        file: 'CompoundInterestCalculator/variants/CalculatorDefault/CalculatorOutputs.tsx',
        uses: [
          `learn-compound-interest.calculator.output${cap(s)}`,
          `tools-shared.scenarios.${s}Tooltip`,
        ],
        ids: [
          `learn-compound-interest:calculator.output${cap(s)}`,
          `tools-shared:scenarios.${s}Tooltip`,
        ],
      },
      {
        name: `time to target: ${s} label + tooltip`,
        file: 'TimeToTargetCalculator/TimeToTargetCalculator.tsx',
        uses: ['tShared(`scenarios.${key}`)', 'tShared(`scenarios.${key}Tooltip`)'],
        ids: [`tools-shared:scenarios.${s}`, `tools-shared:scenarios.${s}Tooltip`],
      },
      {
        name: `money jobs: ${s} label`,
        file: 'MoneyJobsCalculator/MoneyJobsCalculator.tsx',
        uses: ['tShared(`scenarios.${row.scenario}`)'],
        ids: [`tools-shared:scenarios.${s}`],
      },
    ]),
  ];

  it.each(GROUPS)('should bind "$name" to the component that renders it', ({ file, uses }) => {
    const src = readFileSync(join(SECTIONS, file), 'utf8');
    for (const use of uses) expect(src, use).toContain(use);
  });

  it('should find no stablecoin word beside an earn or rate word in any rendered group, in all four locales', () => {
    const failing: string[] = [];
    let checked = 0;
    for (const locale of LOCALES) {
      for (const g of GROUPS) {
        checked += 1;
        if (pairsInGroup(g.ids.map((id) => leaf(locale, id)))) failing.push(`${locale}: ${g.name}`);
      }
    }
    // A dropped locale cannot pass quietly (W-B review): every group, every locale.
    expect(LOCALES).toEqual(['en', 'pt-BR', 'es', 'de']);
    expect(checked).toBe(4 * GROUPS.length);
    expect(failing).toEqual([]);
  });

  /**
   * The groups above are hand lists, so a NEW string beside them (the old " em dólar digital"
   * suffix put back as its own key, say) would not be in any group (W-B review). Every tool
   * catalogue string that names a stablecoin is therefore a closed, named list: a new one fails
   * here until someone rules on it. Each entry carries its reason.
   */
  const STABLE_ON_TOOLS: Readonly<Record<string, string>> = {
    'tools-currency-depreciation::hero.subtitle':
      'decision A: says what the tool compares (cash, bank, digital dollar); kept by the founder',
    'tools-currency-depreciation::resultMoment.chartAria':
      'decision A: the chart sentence for screen readers; kept by the founder',
    'tools-currency-depreciation::resultMoment.chartAriaUsd':
      'decision A: the chart sentence for screen readers (US dollar locale); kept by the founder',
    'tools-currency-depreciation::seo.description':
      'decision A: the search description says what the tool compares (en, es, de; pt-BR rewritten)',
    'tools-money-jobs::plan.brDollarLine':
      'reserve diversification, no earn or rate word; renders below the plan table (flagged to the founder 2026-11-11)',
  };
  it('should allow a stablecoin word in a tool catalogue only where it is named and reasoned', () => {
    const found: string[] = [];
    for (const locale of LOCALES) {
      const dir = join(TRANSLATIONS_DIR, locale);
      for (const file of translationFiles(dir).filter((f) =>
        /^(tools-|learn-compound-interest)/.test(f)
      )) {
        const ns = file.replace(/\.json$/, '');
        walkStrings(JSON.parse(readFileSync(join(dir, file), 'utf8')), '', (text, path) => {
          if (STABLE_ANY.test(text) && !STABLE_ON_TOOLS[`${ns}::${path}`]) {
            found.push(`${locale}::${ns}::${path} — "${text.slice(0, 80)}"`);
          }
        });
      }
    }
    expect(found).toEqual([]);
  });

  it("should find no pairing across a share image's headline and line (every tool, every locale)", () => {
    for (const locale of LOCALES) {
      const r = OG_TRANSLATIONS[locale].toolResult;
      for (const headline of [r.headline, ...Object.values(r.headlineByTool)]) {
        for (const years of [1, 5]) {
          expect(pairsInGroup([headline, r.subline(years)]), `${locale} ${headline}`).toBe(false);
        }
      }
    }
  });

  // Planted positives: the texts as they rendered before 2026-11-11. Each must fail, so a
  // weakened group check (a window again, a dropped locale) cannot pass unnoticed.
  it.each([
    [
      'pt-BR label + suffix + tooltip',
      [
        'Conservador (7%)',
        ' em dólar digital',
        'Faixa conservadora de retorno da estratégia no longo prazo',
      ],
    ],
    [
      'es label + suffix + tooltip',
      [
        'Conservador (7%)',
        ' en dólar digital',
        'Rango conservador de rendimiento de la estrategia a largo plazo',
      ],
    ],
    [
      'de label + suffix + tooltip',
      ['Konservativ (7%)', ' im Digital-Dollar', 'Konservative Bandbreite für Strategie-Renditen'],
    ],
    ['en note', ['7% historical strategy return, held in digital dollar']],
    ['pt-BR note', ['7% de retorno histórico da estratégia, mantido em dólar digital']],
    ['en eyebrow + caption', ['What your money really earns', 'Digital dollar at diBoaS']],
    ['pt-BR eyebrow + caption', ['O que seu dinheiro realmente rende', 'Dólar digital no diBoaS']],
    ['es eyebrow + caption', ['Lo que tu dinero realmente gana', 'Dólar digital en diBoaS']],
    ['de eyebrow + caption', ['Was dein Geld wirklich verdient', 'Digital-Dollar bei diBoaS']],
    ['words far apart in one group', ['What your money really earns', 'x'.repeat(200), 'USDC']],
    [
      "pt-BR label + suffix + today's tooltip (a rate word, no earn word)",
      [
        'Conservador (7%)',
        ' em dólar digital',
        'Uma hipótese ilustrativa de longo prazo para uma estratégia conservadora, baseada nas melhores taxas passivas disponíveis em 2026.',
      ],
    ],
  ])('should flag the planted group "%s"', (_name, texts) => {
    expect(pairsInGroup(texts)).toBe(true);
  });
});
