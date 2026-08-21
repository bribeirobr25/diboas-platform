import { describe, expect, it } from 'vitest';
import { STRATEGY_CATALOG } from '@diboas/defi';
import { GOAL_ICONS } from '@diboas/investing';
import { SANDBOX_LOCALES } from '../config';
import { flattenMessages, getMessages, getRawMessages } from '../loadMessages';

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

describe('anti-slop punctuation guard (checklist Part 2, baked in as a test)', () => {
  it('should contain no em-dashes in any user-facing string', () => {
    for (const locale of SANDBOX_LOCALES) {
      for (const [id, msg] of Object.entries(getMessages(locale))) {
        expect(msg.includes('—'), `${locale}:${id} contains an em-dash`).toBe(false);
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
