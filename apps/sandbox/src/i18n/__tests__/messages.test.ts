import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STRATEGY_CATALOG } from '@diboas/defi';
import { GOAL_ICONS } from '@diboas/investing';
import { SANDBOX_LOCALES } from '../config';
import { flattenMessages, getMessages, getRawMessages } from '../loadMessages';
import { findRenderedText } from '../renderedText';

/** The component/app source tree, walked as CID-1 walks it. */
const SRC = join(__dirname, '..', '..');
function sourceFiles(dir: string = SRC, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === '__tests__' || name === 'test' || name === 'node_modules') continue;
    if (name.endsWith('.stories.tsx')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx$/.test(name)) out.push(full);
  }
  return out;
}

describe('goal-icon accessible labels (F-1: no raw Lucide tokens as aria-labels)', () => {
  // The real tripwire: aria-labels for the goal-icon radios come from
  // goalNew.icon.<token>; if GOAL_ICONS (owned by @diboas/investing) gains an
  // icon without a label, the radio would announce the raw developer token to a
  // screen reader. Key-parity alone can't catch this (all locales lack it
  // equally) — this asserts every icon has a human label in every locale.
  it('should have a goalNew.icon.<token> label for every GOAL_ICONS token, in every locale', () => {
    for (const locale of SANDBOX_LOCALES) {
      const messages = getMessages(locale);
      for (const icon of GOAL_ICONS) {
        const key = `goalNew.icon.${icon}`;
        expect(messages[key]?.trim(), `${locale}:${key}`).toBeTruthy();
      }
    }
  });
});

describe('message key parity (the app-local validate:translations, G-1)', () => {
  const flat = Object.fromEntries(
    SANDBOX_LOCALES.map((l) => [l, Object.keys(getMessages(l)).sort()])
  );

  it('should have identical key sets across all four locales', () => {
    const reference = flat.en;
    for (const locale of SANDBOX_LOCALES) {
      expect(flat[locale], locale).toEqual(reference);
    }
  });

  it('should have no empty strings in any locale', () => {
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        expect(msg.trim().length, `${locale}:${id}`).toBeGreaterThan(0);
      }
    }
  });

  it('should carry identical ICU argument sets per key across locales', () => {
    const args = (msg: string) => (msg.match(/\{(\w+)/g) ?? []).map((m) => m.slice(1)).sort();
    for (const id of flat.en) {
      const reference = args(getMessages('en')[id]);
      for (const locale of SANDBOX_LOCALES) {
        expect(args(getMessages(locale)[id]), `${locale}:${id}`).toEqual(reference);
      }
    }
  });
});

/** Keys whose value is byte-for-byte Legal-owned copy (docs/sandbox-app/legal-current/). */
const EXACT_LEGAL_COPY = new Set([
  'legalReadiness.terms',
  'legalReadiness.privacy',
  'legalReadiness.age',
  'legalReadiness.analytics',
]);

/**
 * Brand-approved EXACT copy, exempt from the house dash style the same way
 * `EXACT_LEGAL_COPY` is (`5.311`). Keep this set as small as the authority
 * documents require, and name the document for each entry.
 */
const EXACT_BRAND_COPY = new Set([
  'learn.explainer', // Consolidated Handoff 2026-09-12 §7.1
  // Brand/Localization §3, verified verbatim at Brand-Legal-Monetization.txt
  // lines 198/200/202 — each ships an EN-dash in its approved German wording.
  'catalog.strategies.stableGrowth.tagline',
  'catalog.strategies.steadyProgress.tagline',
  'catalog.strategies.balancedBuilder.tagline',
]);

describe('anti-slop punctuation guard (checklist Part 2, baked in as a test)', () => {
  /**
   * ⚑ `5.311` CLOSED 2026-09-14. This checked the EM-dash only, so an author
   * could ship an EN-dash freely — and the German corpus proved the gap was
   * real, not theoretical. Both are now banned. Every EN-dash currently in the
   * corpus is APPROVED authority copy and is named in `EXACT_BRAND_COPY`
   * above, so the exemption list is the complete statement of what this rule
   * does not see.
   */
  it('should contain no em-dashes or en-dashes in any user-facing string', () => {
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        // Legal-approved EXACT copy is not subject to the house style guard:
        // LC-TD-02 §4.2 fixes the LEGAL-PRIVACY string with an em-dash in all
        // four locales, and the lane may not alter Legal copy (I-0b).
        if (EXACT_LEGAL_COPY.has(id)) continue;
        // Same principle, different authority (`5.311`, AUD-B06): the handoff
        // §7.1 Learn explainer is Brand-approved EXACT copy carrying an em-dash
        // in en/pt-BR. The rule exists to stop AUTHORED em-dashes, and this lane
        // may not edit approved copy — so the exception is named, not widened.
        // ⚑ What this drops: the two ids below are no longer dash-checked in ANY
        // locale. Nothing else is exempt.
        if (EXACT_BRAND_COPY.has(id)) continue;
        expect(msg.includes('—'), `${locale}:${id} contains an em-dash`).toBe(false);
        expect(msg.includes('–'), `${locale}:${id} contains an en-dash`).toBe(false);
      }
    }
  });

  it('should contain no emoji in any user-facing string', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        expect(emoji.test(msg), `${locale}:${id} contains emoji`).toBe(false);
      }
    }
  });
});

describe('FE-1: the exit floor travels with the exit rate', () => {
  /**
   * FEES.md v3.5 design principle FE-1: "The only non-percentage element is
   * the small Sell/Exit floor, DISCLOSED NEXT TO THE RATE WHEREVER THE RATE
   * APPEARS."
   *
   * Two strings stated a bare 0.39% — `strategyDetail.costLine` (the Simple
   * view's lead cost line, the one most readers see) and `goalPause.alsoStop`.
   * On a $50 exit the real price is the $0.25 floor, i.e. 0.5%, not the 0.39%
   * quoted. Understating a fee is a Voice Q3 breach, not a copy nit — it is
   * the same defect class as live web 5.103.
   */
  it('should never quote the exit rate without its floor, in any locale', () => {
    const RATE = /0[.,]39\s*%/;
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        if (!RATE.test(msg)) continue;
        expect(msg.includes('{min}'), `${locale}:${id} quotes 0.39% without {min} — "${msg}"`).toBe(
          true
        );
      }
    }
  });
});

describe('5.421 — the exit floor is stated PER EXITED POSITION wherever the rate appears', () => {
  /**
   * FE-1 next door proves the floor TRAVELS with the rate (`{min}` is present).
   * It cannot see whether the floor is scoped correctly: `{min}` alone reads as a
   * single minimum for the whole exit, while the Legal-accepted mechanic is one
   * economic disposition PER POSITION — 2 small positions cost 2 x the floor, not
   * one. `5.420` fixed the exit path's wording; this pins the same scope on the
   * entry path, and it is locale-complete because a missing scope in one locale
   * understates the price for exactly those readers.
   *
   * ⚑ Deliberately NARROW: it fires only on strings that quote the rate. A row
   * that names the floor without the rate (`strategyDetail.minExit`) is covered
   * by its own render assertion, and prose that mentions neither is untouched.
   */
  const RATE = /0[.,]39\s*%/;
  const PER_POSITION: Record<string, RegExp> = {
    en: /per exited position/i,
    'pt-BR': /por posição encerrada/i,
    es: /por posición cerrada/i,
    de: /pro beendeter Position/i,
  };

  it('should scope the floor per exited position in every rate-quoting string, per locale', () => {
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        if (!RATE.test(msg)) continue;
        expect(
          PER_POSITION[locale].test(msg),
          `${locale}:${id} quotes the exit rate without per-position scope — "${msg}"`
        ).toBe(true);
      }
    }
  });
});

describe('F-CLO-B1/B2: strategy copy carries no return-promise, superlative, or suitability framing', () => {
  // The picker taglines + the "rate now" line sit on the advice-adjacent
  // surface (StrategyPicker). The EU Case-4 defence (ESMA35-43-3861) rests on
  // the copy staying an OBJECTIVE filter: no promised return, no reward
  // superlative, no "suitable for you" framing. This guard pins that so a
  // future copy edit can't silently reintroduce F-CLO-B1/B2. Scoped to
  // taglines + apyNow ONLY — risk words ("maximum risk", the "Growth" band
  // badge, "growth exposure") are honest disclosure and must NOT trip it.
  const BANNED: Array<[RegExp, string]> = [
    // return / performance promises (EN + pt-BR)
    [/\bgrows?\b/i, 'return-promise'],
    [/\bgrowth\b/i, 'return-promise'],
    [/\boutpace\b/i, 'return-promise'],
    [/steady returns?/i, 'return-promise'],
    [/steady growth/i, 'return-promise'],
    [/\bcresce\b/i, 'return-promise'],
    [/crescimento/i, 'return-promise'],
    [/à frente da inflação/i, 'return-promise'],
    [/retorno constante/i, 'return-promise'],
    // guarantees
    [/\bguarantee/i, 'guarantee'],
    [/\bgarant/i, 'guarantee'],
    // reward superlatives (NOT "maximum risk"/"maximum exposure" — those are honest)
    [/maximum (potential|return|gain|profit|upside)/i, 'reward-superlative'],
    [/highest return/i, 'reward-superlative'],
    [/\bbest\b/i, 'reward-superlative'],
    [/potencial máximo/i, 'reward-superlative'],
    [/melhor retorno/i, 'reward-superlative'],
    // suitability framing (= advice, ESMA Test 3)
    [/\bfor you\b/i, 'suitability-framing'],
    [/right for you/i, 'suitability-framing'],
    [/\brecommend/i, 'suitability-framing'],
    [/suits? you/i, 'suitability-framing'],
    [/pra você/i, 'suitability-framing'],
    [/\brecomend/i, 'suitability-framing'],
  ];
  const isTagline = (id: string) => /^catalog\.strategies\.[^.]+\.tagline$/.test(id);

  /**
   * The ADVICE patterns are corpus-wide, not tagline-scoped. The narrow scope
   * let a real breach through: Settings offered "tailored recommendations" and
   * the CONSENT screen asked permission for "more relevant suggestions" about
   * the reader's goals and money — in all four locales — on a product whose
   * own picker says "You choose. diBoaS never advises." A consent surface
   * asking to do the thing the product says it never does is a Q3 breach, not
   * a style note.
   *
   * Return-promise and superlative patterns stay tagline-scoped on purpose:
   * "growth" is honest disclosure elsewhere (the Growth risk band, growth
   * exposure), and banning it corpus-wide would forbid telling the truth.
   */
  const ADVICE_WORDS: RegExp[] = [
    /\brecommend/i,
    /\brecomend/i,
    /\bsuggestion/i,
    /\bsugest/i,
    /\bsugerencia/i,
    /\bempfehl/i,
    /\bvorschl/i,
    /right for you/i,
    /suits? you/i,
  ];

  it('should carry no ADVICE vocabulary anywhere in the corpus, any locale', () => {
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        for (const pattern of ADVICE_WORDS) {
          expect(pattern.test(msg), `${locale}:${id} — "${msg}"`).toBe(false);
        }
      }
    }
  });

  it('should have no banned promotional/advice pattern in any strategy tagline, any locale', () => {
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        if (!isTagline(id)) continue;
        for (const [re, kind] of BANNED) {
          expect(re.test(msg), `${locale}:${id} (${kind}): ${msg}`).toBe(false);
        }
      }
    }
  });

  // NB: goalNew.apyNow was reframed to "Current pool rate: {apy}%/yr (real,
  // variable)" per the CLO GENIUS-Act copy wall (CC_B1_B2_EXECUTION_LIST B2-1,
  // 2026-07-21) — it superseded the earlier "no change now" §F-CLO-B2 read. It
  // is a variable-rate statement, not a "you are earning" claim; the tagline
  // guard above (taglines only) does not cover it. The broader GENIUS earn/yield-
  // near-stablecoin guard (B2-5) is pending CLO scoping of the full inventory.
});

describe('5.420 — a Practice reference cost is never described as charged or deducted', () => {
  /**
   * Brand + Legal + Strategy reconciliation. `5.409` removed the arithmetic; this
   * removes the LANGUAGE. The surface may show a reference cost and must say, in
   * the reader's own language, that it is not charged and does not reduce the
   * Practice outcome — so the guard is catalogue-wide and locale-complete rather
   * than one English assertion at one call site.
   */
  /* `5.421` adds the ENTRY-side qualifier. Same architecture deliberately: one
     catalogue-wide, locale-complete guard over the keys that MUST carry the
     non-deduction statement — not a second mechanism beside it. */
  const QUALIFIED = [
    'exitCeremony.referenceCostQualifier',
    'goalPause.alsoStop',
    'strategyDetail.referenceCostQualifier',
  ];

  it('should ship a non-deduction statement on both qualifying keys, in every locale', () => {
    // Per-locale, because a guard that only reads English is how the de/es
    // disclosure gap shipped twice before (`5.292`, `5.115`).
    const NON_DEDUCTION: Record<string, RegExp> = {
      en: /not charged or deducted/i,
      'pt-BR': /não (são|é) cobrad[ao]s? nem descontad[ao]s?/i,
      es: /no se cobra(n)? ni se descuenta(n)?/i,
      de: /weder erhoben noch abgezogen/i,
    };
    for (const locale of SANDBOX_LOCALES) {
      for (const key of QUALIFIED) {
        const msg = getMessages(locale)[key];
        expect(msg, `${locale}:${key}`).toBeTruthy();
        expect(NON_DEDUCTION[locale].test(msg), `${locale}:${key} states no non-deduction`).toBe(
          true
        );
      }
    }
  });

  it('should no longer say the exit fee APPLIES in any locale', () => {
    // The pre-`5.420` wording asserted the fee was levied ("applies" / "se
    // aplica"). In Practice nothing is charged, so that claim may not return.
    const APPLIES: Record<string, RegExp> = {
      en: /fee applies/i,
      'pt-BR': /se aplica/i,
      es: /se aplica/i,
      de: /f\u00e4llt an/i,
    };
    for (const locale of SANDBOX_LOCALES) {
      const msg = getMessages(locale)['goalPause.alsoStop'];
      expect(APPLIES[locale].test(msg), `${locale}: alsoStop still says the fee applies`).toBe(
        false
      );
    }
  });
});

describe('B2-5 — GENIUS-Act stablecoin/yield wall (sandbox side)', () => {
  // Mirror of the web guard (apps/web .../genius-stablecoin-wall.test.ts). The
  // stablecoin ("digital dollar"/USDC) must never be described as earning/
  // yielding — returns come from the strategy. The sandbox has NO allow-list:
  // after the B2-1..B2-3 reframe (apyNow "Current pool rate", earnings "would
  // have returned") it carries zero pairings, and it must stay that way.
  const EARN = String.raw`earn|yield|rendend|rend[eo]|verdien|rendi`;
  const STABLE = String.raw`digital dollar|d[oó]lar[es]* digital|USDC|stablecoin`;
  const PAIRING = new RegExp(
    `(?:${EARN}).{0,40}(?:${STABLE})|(?:${STABLE}).{0,40}(?:${EARN})`,
    'i'
  );

  it('should have no earn/yield-near-stablecoin pairing in any locale', () => {
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        expect(
          PAIRING.test(msg),
          `${locale}:${id} pairs earn/yield with a stablecoin token: ${msg}`
        ).toBe(false);
      }
    }
  });
});

describe('E9-c — catalog i18n completeness (a missing key would render a dev token inside a COMPLIANCE stamp)', () => {
  it('should have protocol + strategy strings for every catalog entry, in every locale', () => {
    const protocolIds = new Set(
      STRATEGY_CATALOG.flatMap((s) => s.allocation.map((l) => l.protocolId))
    );
    for (const locale of SANDBOX_LOCALES) {
      const messages = getMessages(locale);
      for (const id of protocolIds) {
        expect(
          messages[`catalog.protocols.${id}`],
          `${locale}: catalog.protocols.${id}`
        ).toBeTruthy();
      }
      for (const s of STRATEGY_CATALOG) {
        expect(
          messages[`catalog.strategies.${s.i18nKey}.name`],
          `${locale}: ${s.i18nKey}.name`
        ).toBeTruthy();
        expect(
          messages[`catalog.strategies.${s.i18nKey}.tagline`],
          `${locale}: ${s.i18nKey}.tagline`
        ).toBeTruthy();
      }
    }
  });
});

describe('flattenMessages', () => {
  it('should flatten nested objects to dot-path ids', () => {
    expect(flattenMessages({ a: { b: 'x' }, c: 'y' })).toEqual({ 'a.b': 'x', c: 'y' });
  });

  it('should expose all four raw locales', () => {
    expect(Object.keys(getRawMessages()).sort()).toEqual(['de', 'en', 'es', 'pt-BR']);
  });
  it('should name the play balance ONE way across every surface (mode-lexicon safety)', () => {
    // Mockup-audit finding 2 called mode-label drift "the one real safety
    // risk": Home said "Play balance" while Move said "Practice balance" for
    // the identical figure. Mode confusion is how someone moves real money by
    // accident, so the same quantity keeps one name per locale.
    for (const locale of SANDBOX_LOCALES) {
      const m = getMessages(locale) as Record<string, string>;
      expect(m['move.balance'], locale).toBe(m['home.playBalance']);
    }
  });
});

/**
 * F-R4 — THE PUBLIC NAME IS "PRACTICE"; "sandbox" IS INTERNAL VOCABULARY ONLY.
 *
 * ⚑ Added 2026-09-16 with the §19 copy application, because its absence is the
 * whole reason that application was needed. F-R4 ruled the public name on
 * 2026-08-29. On 2026-09-16 a system-gate sweep found **24 user-facing strings
 * across four locales, on 7 keys**, still saying "Sandbox" — including
 * `common.playBadge` ("Sandbox · play money") and `gate.enter` ("Enter the
 * sandbox"), i.e. the FIRST SCREEN of a live public app. The full suite was
 * green throughout: parity, ICU args, dashes, emoji, the exit floor, advice
 * vocabulary and the GENIUS wall are all guarded, and none of them is about the
 * product's NAME.
 *
 * Applying approved copy without this guard would leave the hole exactly as it
 * was for the next string anyone adds. Paths, package names and internal docs
 * are unaffected — this asserts the CATALOGUE only, which is what a user reads.
 */
describe('F-R4: the public name is Practice, never Sandbox', () => {
  it.each(SANDBOX_LOCALES)('should carry no user-facing "sandbox" in %s', (locale) => {
    const offenders = Object.entries(getMessages(locale))
      .filter(([, v]) => typeof v === 'string' && /sandbox/i.test(v))
      .map(([k, v]) => `${k} = ${v}`);
    expect(offenders, `F-R4 violated in ${locale}:\n${offenders.join('\n')}`).toEqual([]);
  });

  /**
   * `5.371` blind spot 3, closed 2026-09-16 (founder-approved). COPY-3 asserted
   * the catalogue only, so a user-facing "Sandbox" hardcoded into a component
   * was caught by NOTHING — proven by planting one and watching this file and
   * `check:ux-greps` both stay green.
   *
   * Measured before shipping: a naive /sandbox/i sweep of components flags 13
   * lines, every one legitimate non-copy (a font CSS variable, the health
   * route's `app: 'sandbox'`, `SandboxNotification` types, storage keys, a log
   * tag, a scope literal, comments). Scoping to RENDERED text flags 0 — which is
   * why the finder quotes context instead of carrying an exception list.
   */
  it('should carry no user-facing "sandbox" in any component RENDERED text', () => {
    const offenders = sourceFiles().flatMap((file) =>
      findRenderedText(readFileSync(file, 'utf8'), /sandbox/i).map(
        (m) => `${relative(SRC, file)}:${m.line} (${m.context}) ${m.text}`
      )
    );
    expect(offenders, `F-R4 violated in component rendered text:\n${offenders.join('\n')}`).toEqual(
      []
    );
  });

  it('should be scanning a real source tree (the finder must not go vacuous)', () => {
    const files = sourceFiles();
    expect(files.length).toBeGreaterThan(50);
    // A positive control: the finder DOES see the class it exists to catch.
    expect(findRenderedText('<p>Welcome to the Sandbox</p>', /sandbox/i)).toHaveLength(1);
    expect(
      findRenderedText('const s: ReadonlySet<Action> = new Set<Action>(["x"]);', /sandbox/i)
    ).toHaveLength(0);
  });

  it('should still allow the internal package name (this guard is about COPY, not code)', () => {
    // Stated so the rule's scope is explicit rather than inferred: F-R4 keeps
    // "sandbox" as internal/dev vocabulary. If someone later renames the
    // package, that is a separate decision this test must not pre-empt.
    expect(/sandbox/i.test('apps/sandbox')).toBe(true);
  });
});
