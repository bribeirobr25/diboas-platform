import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  collectWeeklyCredits,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';
import { PLAY_MONEY_GRANT, SANDBOX_LOCALES } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import { DENIAL_EXCEPTIONS, excepted, staleExceptions, textDigest } from '@/test/denialExceptions';
import { DENIAL_HINT, readsAsDenial } from '@/test/negation';

/**
 * ⚙ `CI-N2` · NO BRAZIL FUNDING INCENTIVE — IN MECHANISM OR IN COPY.
 *
 * **Requirement:** the repository covenant (CLAUDE.md, "Brazil — no funding
 * incentive, in mechanism or copy"), traced to `LC-RR-01-02` and made
 * merge-blocking by `LC-RR-01-10`; the weekly-credit rule from the Growth
 * authority. The authority texts live in the private canon; this file states
 * only the engineering invariants it enforces:
 *
 *   1. No benefit (credit, bonus, multiplier, eligibility, advantage) varies
 *      with deposit, funding, invested value or transaction volume.
 *   2. The weekly credit is flat and unconditional — not tied to streaks,
 *      logins, tasks or referrals.
 *   3. No copy frames a practice credit as a reward, bonus, prize, streak,
 *      multiplier or referral benefit, or says the user "earned" it — in any
 *      locale.
 *
 * ⚑ THE MECHANISM HALF IS THE PRIMARY ONE. A word list cannot see a benefit
 * that scales with funding, and a benefit that scales with funding is the
 * violation whatever it is called. So this gate drives the REAL ledger at two
 * very different funding volumes and asserts the benefit is identical, before
 * it looks at any copy.
 *
 * ⚑ SCOPE LIMIT (stated, not hidden): the position-conditioned comparison
 * credit (`grantComparisonCredit`, register 5.453) is NOT ruled on and NOT
 * covered here — see the `it.todo` below.
 *
 * ⚑ THE EXISTING SCREEN-LOCAL GUARD IS NOT THIS GATE.
 * `WeeklyCycleScreen.test.tsx` bans reward vocabulary in ONE rendered screen.
 * That is a WG-1 presentation rule for one surface and must not be read as
 * `CI-N2` already existing.
 */

const GENESIS = new Date('2026-08-01T09:00:00Z');
/* Eight weeks later — enough real calendar for weekly credits to be collectible. */
const LATER = new Date('2026-09-26T09:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(GENESIS);
  resetSandbox();
});
afterEach(() => {
  vi.useRealTimers();
  resetSandbox();
});

/**
 * Runs one whole Practice life at a given FUNDING volume, returns what was granted.
 *
 * ⛑ THE GENESIS GRANT IS HELD CONSTANT AT THE REAL CONSTANT, and that is the
 * point of the test rather than a detail. The first draft varied the grant
 * itself (1,000 vs 100,000) and the heavy run received NO credits at all —
 * because `creditCeilingReached` measures `granted + credited − spent − fees`
 * against `grant × CREDIT_CEILING_MULTIPLE`, so a 100× grant is instantly past
 * its own ceiling. That proved nothing about funding: a different grant is a
 * different genesis, not a deposit. Invariant 1 is about what happens when a
 * user FUNDS — so the grant is fixed and only funding behaviour varies.
 */
function creditsAfterFunding(options: { goals: number; fundEach: number; enterEach: number }): {
  amounts: string[];
  weeks: number[];
} {
  resetSandbox();
  vi.setSystemTime(GENESIS);
  grantPlayMoney(PLAY_MONEY_GRANT.b2c, 'BRL', 'b2c');

  for (let i = 0; i < options.goals; i += 1) {
    const goalId = createGoal({
      name: `Goal ${i}`,
      icon: 'star',
      targetAmount: options.fundEach * 4,
      horizonMonths: 24,
      fundAmount: options.fundEach,
    });
    if (options.enterEach > 0) {
      enterStrategy({
        goalId,
        strategyId: 'safeHarbor',
        totalFromCash: options.enterEach,
        networkFeeLocal: 0,
      });
    }
  }

  vi.setSystemTime(LATER);
  const result = collectWeeklyCredits(LATER.toISOString());
  const amounts = getLedgerState()
    .events.filter((e) => e.type === 'WeeklyCreditGranted')
    .map((e) => (e as { amount: string }).amount);
  return { amounts, weeks: result.granted };
}

/* ── 1 · the mechanism ────────────────────────────────────────────────────── */

describe('CI-N2 · the practice credit is flat and unconditional', () => {
  it('should grant the SAME credit whatever the funded volume', () => {
    /**
     * The whole prohibition in one assertion. `lean` funds one goal with a
     * little; `heavy` funds four goals with 40× more and moves all of it into
     * a diBoaS-presented mechanism. If any benefit were conditioned on deposit,
     * funding, invested value or transaction volume, these would differ.
     */
    const lean = creditsAfterFunding({ goals: 1, fundEach: 50, enterEach: 25 });
    const heavy = creditsAfterFunding({ goals: 4, fundEach: 1_500, enterEach: 1_200 });

    expect(lean.amounts.length, 'no credit was granted — the test proves nothing').toBeGreaterThan(
      0
    );
    expect(heavy.amounts).toEqual(lean.amounts);
    expect(heavy.weeks).toEqual(lean.weeks);
  });

  it('should grant the same credit when NOTHING is funded at all', () => {
    /**
     * The other direction: eligibility must not be an ADVANTAGE either. A user
     * who never funds a goal receives exactly what the heavy funder receives —
     * that is what "unconditional" means, and a gate asserting only "does not
     * scale" would miss an eligibility gate entirely.
     */
    const none = creditsAfterFunding({ goals: 0, fundEach: 0, enterEach: 0 });
    const funded = creditsAfterFunding({ goals: 2, fundEach: 100, enterEach: 80 });
    expect(none.amounts.length).toBeGreaterThan(0);
    expect(none.amounts).toEqual(funded.amounts);
  });

  it('should emit NO credit event as a consequence of a funding action', () => {
    resetSandbox();
    vi.setSystemTime(GENESIS);
    grantPlayMoney(PLAY_MONEY_GRANT.b2c, 'BRL', 'b2c');
    const before = getLedgerState().events.length;

    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4_000,
      horizonMonths: 12,
      fundAmount: 1_000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 900, networkFeeLocal: 0 });

    const emitted = getLedgerState().events.slice(before);
    expect(
      emitted.length,
      'the funding actions emitted nothing — the test is vacuous'
    ).toBeGreaterThan(0);
    const credits = emitted.filter(
      (e) => e.type === 'WeeklyCreditGranted' || e.type === 'ComparisonCreditGranted'
    );
    expect(
      credits.map((e) => e.type),
      'a credit was emitted as a consequence of funding'
    ).toEqual([]);
  });

  it.todo(
    'SCOPE LIMIT · 5.453 · the comparison credit requires an open position — awaiting a Legal ruling; NOT covered by this gate'
  );
});

/* ── 2 · the copy ─────────────────────────────────────────────────────────── */

const YOU_EARNED =
  /you(?:'ve| have)? earned|voc[êe] (?:ganhou|conquistou)|has ganado|\bganaste\b|du hast\b[^.]{0,20}\bverdient/i;

const CATALOGUE = SANDBOX_LOCALES.map((locale) => ({
  locale,
  strings: Object.entries(getMessages(locale)) /* already flat, dotted keys */,
}));

/**
 * ⚑ WHOLE CATALOGUE, MEASURED (PB-3, 2026-10-15). The first version scanned
 * five funding namespaces, because a broader screen-local word list had
 * flagged `goalComplete.wellDone`. Measured against all four catalogues, THESE
 * patterns hit exactly one key — `common.playDisclaimer`, which DENIES that
 * credits are Rewards. So the namespace filter bought nothing and hid every
 * other surface; it is gone.
 *
 * ⚑ PER-LOCALE VOCABULARY. The English-only controls let ten Spanish,
 * Portuguese and German phrasings through (P0 review). Each locale's own words
 * are in the patterns AND in the planted probes below.
 *
 * ⛑ GERMAN COMPOUNDS (R4-11, independent review 2026-10-16). `\bbonus` needs a
 * word boundary in front, so "Einzahlungsbonus" (deposit bonus),
 * "Willkommensprämie", "Treueprämie" and "Gewinnserie" were never DETECTED.
 * The suffix forms now match inside a compound. Measured 2026-10-16: 0 new
 * Practice matches.
 */
const COMPOUND = '[a-zäöüß]+';
const INCENTIVE_FRAMING: ReadonlyArray<readonly [string, RegExp, string]> = [
  [
    'reward / bonus / prize framing',
    new RegExp(
      [
        '\\breward\\w*',
        '\\bbonus\\w*',
        '\\bprize\\w*',
        '\\bpr[êe]mio\\w*',
        '\\bb[oô]nus\\w*',
        '\\brecompensa\\w*',
        '\\bpremio\\w*',
        '\\bbelohnung\\w*',
        '\\bpr[äa]mie\\w*',
        '\\bbonificaci[oó]n\\w*',
        '\\bbonifica[çc][ãa]o\\w*',
        '\\bbonifica[çc][õo]es\\b',
        `${COMPOUND}(?:bonus|pr[äa]mie|belohnung)\\w*`,
        /* R4 correction — measured 2026-10-16: 0 Practice matches each */
        '\\bbono\\w*',
        '\\bcash\\s?-?back\\b',
        '\\bpremi(?:ad[oa]s?|amos)\\b',
      ].join('|'),
      'i'
    ),
    'Collect your weekly bonus reward now.',
  ],
  [
    'streak / multiplier framing',
    new RegExp(
      [
        '\\bstreak\\w*',
        '\\bmultiplier\\w*',
        '\\bmultiplicador\\w*',
        '\\bmultiplikator\\w*',
        '\\bsequ[êe]ncia de semanas\\b',
        '\\brachas?\\b',
        '\\bserie\\b',
        '\\bsträhne\\b',
        `${COMPOUND}(?:serie|strähne|multiplikator)\\b`,
        /* R4 correction — streak words that are also ordinary words count only with a run length */
        '\\bsequ[êe]ncia\\s+de\\s+\\d+',
        '\\bofensiva\\s+de\\s+\\d+',
        '\\bdouble\\s+(?:credits?|rewards?|points?)\\b',
        '\\bem\\s+dobro\\b',
        '\\bdoppelte\\w*\\s+(?:credits?|punkte)\\b',
        '\\bcr[ée]ditos?\\s+dobles?\\b',
      ].join('|'),
      'i'
    ),
    'Keep your 4-week streak going.',
  ],
  [
    'referral framing',
    /\breferr\w*|\bindica[çc][ãa]o\b|\bindica[çc][õo]es\b|\breferid\w*|\bempfehl\w*|\binvit\w* (?:a |your |un |a un |tus )?(?:friend|amig)\w*|\bconvid\w* (?:um |seus |uma )?amig\w*|\blad\w* (?:einen |deine )?freund\w*|\brefer\w*\s+(?:a\s+|your\s+)?friend\w*|freunde?\s+werb\w*|werb\w*\s+(?:einen\s+|deine\s+)?freund\w*|\bindiqu\w*\s+(?:um\s+|seus\s+|uma\s+)?amig\w*/i,
    'Invite a friend with your referral link.',
  ],
];
const RULES = new Map(INCENTIVE_FRAMING.map(([name, rx]) => [name, rx]));

/** Every place a rule's pattern matches — punctuation is no shield, so the whole text is searched. */
function framingTerms(text: string, pattern: RegExp): Array<{ term: string; at: number }> {
  return [...text.matchAll(new RegExp(pattern.source, 'gi'))].map((m) => ({
    term: m[0],
    at: m.index!,
  }));
}

/**
 * ⛑ A MATCHED TERM IS A FINDING UNLESS AN EXACT, REVIEWED EXCEPTION COVERS IT
 * (PB-3 exact-text denial exceptions, founder decision 2026-10-16). The negation
 * rule that used to excuse terms is gone; `readsAsDenial` only adds a hint to
 * the failure message.
 */
function findings(
  locale: string,
  key: string,
  text: string,
  rule: string,
  pattern: RegExp
): string[] {
  const terms = framingTerms(text, pattern);
  if (terms.length === 0 || excepted('CI-N2', rule, locale, key, text)) return [];
  const first = terms[0]!;
  /* Up to the END of the term, as CI-N4 measures it ("Rewards are not …" reads as a denial). */
  const hint = readsAsDenial(text, first.at + first.term.length, locale) ? ` — ${DENIAL_HINT}` : '';
  return [
    `${locale}::${key} — "${first.term}" in: ${text.slice(0, 140)} (sha256 ${textDigest(text)})${hint}`,
  ];
}

const lookup = (locale: string, key: string): string | undefined =>
  CATALOGUE.find((c) => c.locale === locale)?.strings.find(([k]) => k === key)?.[1];

describe('CI-N2 · the copy names a practice credit, never an incentive', () => {
  it('should have actually loaded four catalogues', () => {
    expect(CATALOGUE).toHaveLength(4);
    for (const { locale, strings } of CATALOGUE) {
      expect(strings.length, locale).toBeGreaterThan(400);
    }
  });

  it('should never say "you earned", in any locale, anywhere', () => {
    /* Invariant 3 — unambiguous everywhere, so unscoped. */
    const hits: string[] = [];
    for (const { locale, strings } of CATALOGUE) {
      for (const [key, text] of strings) {
        if (YOU_EARNED.test(text)) hits.push(`${locale}::${key} — ${text}`);
      }
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  it.each(INCENTIVE_FRAMING.map(([name, rx, control]) => [name, rx, control] as const))(
    'should carry no %s anywhere in the catalogue, except an exact reviewed denial',
    (name, pattern, _control) => {
      const hits: string[] = [];
      for (const { locale, strings } of CATALOGUE) {
        for (const [key, text] of strings) hits.push(...findings(locale, key, text, name, pattern));
      }
      expect(hits, `${name}\n${hits.join('\n')}`).toEqual([]);
    }
  );

  it('should hold NO stale exception — every entry still covers a live finding', () => {
    const stale = staleExceptions('CI-N2', lookup, (rule, text) => {
      const rx = RULES.get(rule);
      return rx !== undefined && framingTerms(text, rx).length > 0;
    });
    expect(stale).toEqual([]);
    /* Non-vacuity: the inventory measured 2026-10-16 is exactly these four. */
    expect(DENIAL_EXCEPTIONS.filter((e) => e.guard === 'CI-N2')).toHaveLength(4);
  });

  /**
   * Planted probes — every one must be CAUGHT. The phrasings earlier reviews
   * found slipping through, the English controls, and (R4-10) the natural claim
   * shapes the negation rule used to excuse.
   */
  const PLANTED: ReadonlyArray<readonly [string, string]> = [
    ['en', 'Collect your weekly bonus reward now.'],
    ['en', 'Not sure? Collect your weekly bonus now.'],
    ['en', 'Invite a friend and keep going.'],
    ['es', 'Gana una bonificación cada semana.'],
    ['es', 'Mantén tu racha de cuatro semanas.'],
    ['es', 'Invita a un amigo y sigue practicando.'],
    ['es', 'Sin límite: cobra tu bonus.'],
    ['pt-BR', 'Ganhe uma bonificação semanal.'],
    ['pt-BR', 'Convide um amigo para praticar.'],
    ['de', 'Halte deine Serie am Laufen.'],
    ['de', 'Empfehlung an Freunde senden.'],
    ['en', 'No limits, claim your bonus.'],
    ['pt-BR', 'Sem limites, resgate seu bônus.'],
    ['en', 'No limits, and claim your bonus.'],
    ['pt-BR', 'No depósito receba um bônus.'],
    ['pt-BR', 'No investimento ganhe uma bonificação.'],
    ['en', 'No fees and claim your weekly bonus.'],
    ['en', 'Not a gift but a weekly bonus.'],
    ['de', 'Keine Gebühren und hol dir deine Prämie.'],
    ['en', 'No fees on your weekly bonus.'],
    ['en', 'Not a gift, a weekly bonus.'],
    ['en', 'No fees, only bonuses.'],
    ['en', 'There is no fee and a bonus.'],
    ['en', 'No fees on deposits or bonuses.'],
    ['en', 'No fees for a deposit or a bonus.'],
    ['es', 'Sin comisiones en depósitos o bonificaciones.'],
    ['pt-BR', 'Sem taxas em depósitos ou bônus.'],
    ['de', 'Keine Gebühren auf Einzahlungen oder Prämien.'],
    ['es', 'Sin comisiones en tu bonificación semanal.'],
    ['de', 'Keine Gebühren auf deine wöchentliche Prämie.'],
    /* R4-10 · double negation, a negated object, a negated quantifier */
    ['en', 'Never without a bonus.'],
    ['en', 'No deposit without a bonus.'],
    ['pt-BR', 'Nenhum depósito sem bônus.'],
    ['pt-BR', 'Nunca sem bônus.'],
    ['de', 'Keine Einzahlung ohne Prämie.'],
    ['es', 'Ningún depósito sin bonificación.'],
    ['en', 'Leave no bonus unclaimed.'],
    ['en', 'Miss no reward this week.'],
    ['de', 'Verpasse keine Prämie!'],
    ['de', 'Verliere nie die Serie.'],
    ['de', 'Nicht die Prämie vergessen!'],
    ['en', 'No bonus limits.'],
    ['en', 'No bonus beats this one.'],
    ['en', 'No reward is bigger than this week’s.'],
    ['en', 'Why not a bonus every week?'],
    ['en', "Aren't rewards great? Keep going."],
    /* R4-10 · comma lists, parentheses, separators without spaces */
    ['en', 'Not a bonus, a reward for every deposit.'],
    ['en', 'No streak resets, the streak multiplier keeps growing.'],
    ['en', 'No fees (bonus every week).'],
    ['en', 'Deposit with no lock-up (bonus included).'],
    ['pt-BR', 'Sem taxas (bônus toda semana).'],
    ['en', 'No fees—bonuses instead.'],
    ['en', 'No fees/bonus every week.'],
    ['en', 'Fees? No… bonus every week.'],
    ['de', 'Nie ist die Prämie höher als jetzt.'],
    /* R4-11 · German compounds */
    ['de', 'Hol dir deinen Einzahlungsbonus!'],
    ['de', 'Sichere dir die Willkommensprämie.'],
    ['de', 'Deine Treueprämie wartet.'],
    ['de', 'Halte deine Gewinnserie.'],
    /* R4 correction · vocabulary the second review found missing */
    ['en', 'Refer a friend today.'],
    ['de', 'Freunde werben lohnt sich.'],
    ['pt-BR', 'Indique amigos e continue.'],
    ['pt-BR', 'Suas indicações rendem créditos.'],
    ['es', 'Recibe un bono semanal.'],
    ['en', 'Get 2% cashback on deposits.'],
    ['pt-BR', 'Você é premiado a cada depósito.'],
    ['es', 'Te premiamos cada semana.'],
    ['pt-BR', 'Mantenha sua sequência de 7 dias.'],
    ['pt-BR', 'Sua ofensiva de 5 semanas continua.'],
    ['en', 'Earn double credits this week.'],
    ['pt-BR', 'Créditos em dobro hoje.'],
  ];
  it.each(PLANTED)('should catch a planted %s incentive phrasing: %s', (locale, text) => {
    const caught = INCENTIVE_FRAMING.some(
      ([name, pattern]) => findings(locale, 'planted.key', text, name, pattern).length > 0
    );
    expect(caught, `missed: ${text}`).toBe(true);
  });

  /**
   * ⛑ INVERTED (R4-10). These denials used to be EXCUSED by the negation rule.
   * A real denial now passes only as an exact, reviewed exception, so each must
   * be FLAGGED — and its message must say it reads like a denial, so a reviewer
   * knows what to check.
   */
  it('should FLAG an unreviewed denial, with the denial hint, in each locale', () => {
    for (const [locale, text] of [
      ['en', 'they are not fiat currency or Rewards.'],
      ['de', 'keine Fiatwährung und keine Rewards (Belohnungen).'],
      ['es', 'no son moneda fiduciaria ni Rewards (recompensas).'],
      ['pt-BR', 'não são moeda fiduciária nem Rewards (recompensas).'],
      ['en', 'Credits are not a bonus, a prize or a reward.'],
      ['en', 'They are not rewards.'],
      ['de', 'Credits sind keine Rewards.'],
      ['pt-BR', 'Créditos não são bônus.'],
      ['pt-BR', 'Créditos nunca são uma bonificação.'],
      ['es', 'Los créditos no son un premio.'],
      ['en', 'Credits are neither a bonus nor a reward.'],
      ['en', "Credits aren't rewards."],
      ['en', 'No fees or bonuses here.'],
      ['en', 'No fee or bonus applies.'],
    ] as const) {
      const hits = INCENTIVE_FRAMING.flatMap(([name, pattern]) =>
        findings(locale, 'planted.key', text, name, pattern)
      );
      expect(hits.length, `an unreviewed denial passed: ${text}`).toBeGreaterThan(0);
      expect(hits.join(' '), text).toContain(DENIAL_HINT);
    }
  });

  /**
   * The exception properties (a)–(f) of plan §5.4.2, each against the REAL
   * reviewed sentence: a reviewed text passes; nothing else inherits it.
   */
  describe('PB-3 exact-text denial exceptions', () => {
    const RULE = 'reward / bonus / prize framing';
    const KEY = 'common.playDisclaimer';
    const en = lookup('en', KEY)!;
    const de = lookup('de', KEY)!;

    it('(a) should PASS the reviewed sentence under its key and locale', () => {
      expect(en).toBeDefined();
      expect(excepted('CI-N2', RULE, 'en', KEY, en)).toBe(true);
    });
    it('(b) should FAIL the same sentence with one word changed', () => {
      expect(excepted('CI-N2', RULE, 'en', KEY, en.replace('not', 'now'))).toBe(false);
    });
    it('(c) should FAIL the sentence with a prohibited claim appended', () => {
      const appended = `${en} Deposit today and get a weekly bonus.`;
      expect(excepted('CI-N2', RULE, 'en', KEY, appended)).toBe(false);
      expect(findings('en', KEY, appended, RULE, RULES.get(RULE)!)).toHaveLength(1);
    });
    it('(d) should FAIL the same sentence under another key', () => {
      expect(excepted('CI-N2', RULE, 'en', 'common.somewhereElse', en)).toBe(false);
    });
    it("(e) should FAIL another locale's text under the same key and locale", () => {
      expect(excepted('CI-N2', RULE, 'en', KEY, de)).toBe(false);
      expect(excepted('CI-N2', RULE, 'de', KEY, en)).toBe(false);
    });
    it('(f) should report a STALE entry — key gone, text changed, or no longer triggering', () => {
      const entry = DENIAL_EXCEPTIONS.find((e) => e.guard === 'CI-N2' && e.locale === 'en')!;
      const triggers = (): boolean => true;
      expect(staleExceptions('CI-N2', () => undefined, triggers, [entry])).toEqual([
        'en::common.playDisclaimer — key no longer exists',
      ]);
      expect(staleExceptions('CI-N2', () => `${en} `, triggers, [entry])).toEqual([
        'en::common.playDisclaimer — text changed since review',
      ]);
      expect(
        staleExceptions(
          'CI-N2',
          () => en,
          () => false,
          [entry]
        )
      ).toEqual([
        'en::common.playDisclaimer — no longer triggers "reward / bonus / prize framing"',
      ]);
    });
  });

  it('should catch "earned" framing in Spanish preterite too (PB-3)', () => {
    expect(YOU_EARNED.test('¡Ganaste tu crédito semanal!')).toBe(true);
  });
});
