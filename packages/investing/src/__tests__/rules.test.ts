import { describe, it, expect } from 'vitest';
import { allocateByRule, generateProposal, isValidRuleSplit, type RuleSplitLine } from '../rules';

describe('allocateByRule — floor-then-remainder (D-r §4)', () => {
  it('should allocate whole shares and leave the remainder to Available', () => {
    const a = allocateByRule(1000, [
      { goalId: 'g1', percent: 50 },
      { goalId: 'g2', percent: 30 },
    ]);
    expect(a.lines).toEqual([
      { goalId: 'g1', amount: 500 },
      { goalId: 'g2', amount: 300 },
    ]);
    expect(a.remainderToAvailable).toBe(200); // the un-allocated 20%
  });

  it('should FLOOR each line and route the rounding crumbs to the remainder', () => {
    // 33% of 1000 = 330 each; 3×330 = 990 → 10 remainder (never over-allocates).
    const a = allocateByRule(1000, [
      { goalId: 'g1', percent: 33 },
      { goalId: 'g2', percent: 33 },
      { goalId: 'g3', percent: 33 },
    ]);
    expect(a.lines.map((l) => l.amount)).toEqual([330, 330, 330]);
    expect(a.remainderToAvailable).toBe(10);
  });

  it('should conserve exactly: sum(lines) + remainder == total, for any input', () => {
    const cases: Array<[number, RuleSplitLine[]]> = [
      [1000, [{ goalId: 'g1', percent: 100 }]],
      [777, [{ goalId: 'g1', percent: 40 }, { goalId: 'g2', percent: 35 }]],
      [1, [{ goalId: 'g1', percent: 99 }]],
      [25000, [{ goalId: 'g1', percent: 1 }, { goalId: 'g2', percent: 1 }, { goalId: 'g3', percent: 1 }]],
    ];
    for (const [total, split] of cases) {
      const a = allocateByRule(total, split);
      const summed = a.lines.reduce((s, l) => s + l.amount, 0) + a.remainderToAvailable;
      expect(summed, `total ${total}`).toBe(total);
      expect(a.remainderToAvailable).toBeGreaterThanOrEqual(0); // never negative
    }
  });

  it('should satisfy preview == application: the SAME function, so identical output for identical input', () => {
    const total = 1234;
    const split: RuleSplitLine[] = [
      { goalId: 'g1', percent: 45 },
      { goalId: 'g2', percent: 25 },
    ];
    const preview = allocateByRule(total, split);
    const application = allocateByRule(total, split);
    expect(preview).toEqual(application);
  });

  it('should be deterministic (replay-stable) across repeated calls', () => {
    const split: RuleSplitLine[] = [{ goalId: 'g1', percent: 60 }];
    expect(allocateByRule(500, split)).toEqual(allocateByRule(500, split));
  });
});

describe('isValidRuleSplit — the builder validation (D-r §5)', () => {
  it('should accept a valid split summing to <= 100', () => {
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 50 }, { goalId: 'g2', percent: 30 }])).toBe(true);
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 100 }])).toBe(true); // exactly 100 ok
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 1 }])).toBe(true); // remainder line is fine
  });

  it('should reject sum > 100 (no over-allocation)', () => {
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 60 }, { goalId: 'g2', percent: 50 }])).toBe(false);
  });

  it('should reject non-integer, out-of-range, duplicate, or empty splits', () => {
    expect(isValidRuleSplit([])).toBe(false);
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 0 }])).toBe(false);
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 101 }])).toBe(false);
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 33.5 }])).toBe(false);
    expect(isValidRuleSplit([{ goalId: 'g1', percent: 40 }, { goalId: 'g1', percent: 20 }])).toBe(false);
  });
});

describe('generateProposal — the ONE proposal per collected total (D-r §3)', () => {
  const rule = {
    ruleId: 'r1',
    ruleVersion: 2,
    split: [
      { goalId: 'g1', percent: 50 },
      { goalId: 'g2', percent: 30 },
    ],
  };
  const allActive = () => 'active' as const;

  it('should carry the rule version it was generated under and the sorted week-set key', () => {
    const p = generateProposal({
      proposalId: 'p1',
      rule,
      total: 2000,
      weekSet: [4, 3],
      statusOf: allActive,
    });
    expect(p.ruleVersion).toBe(2);
    expect(p.weekSet).toEqual([3, 4]);
    expect(p.status).toBe('proposed');
    expect(p.repairNeeded).toBe(false);
  });

  it('should equal allocateByRule exactly — preview == application holds through generation', () => {
    const p = generateProposal({
      proposalId: 'p1',
      rule,
      total: 1000,
      weekSet: [1],
      statusOf: allActive,
    });
    const a = allocateByRule(1000, rule.split);
    expect(p.lines).toEqual(a.lines);
    expect(p.remainderToAvailable).toBe(a.remainderToAvailable);
  });

  it('should divert a PAUSED destination to Available, visibly marked, conserving the total (W-17d)', () => {
    const p = generateProposal({
      proposalId: 'p1',
      rule,
      total: 1000,
      weekSet: [1],
      statusOf: (id) => (id === 'g2' ? 'paused' : 'active'),
    });
    const paused = p.lines.find((l) => l.goalId === 'g2');
    expect(paused?.pausedDiversion).toBe(true);
    expect(paused?.amount).toBe(300); // the share stays STATED on the line
    expect(p.remainderToAvailable).toBe(200 + 300); // …but the money goes to Available
    // Conservation: fundable lines + remainder == total (diverted lines are display-only).
    const fundable = p.lines.filter((l) => !l.pausedDiversion).reduce((s, l) => s + l.amount, 0);
    expect(fundable + p.remainderToAvailable).toBe(1000);
    expect(p.repairNeeded).toBe(false); // paused is NOT repair (the rule keeps its shape)
  });

  it('should flip repairNeeded when a destination is dropped/accomplished — never silent skip', () => {
    for (const closed of ['dropped', 'accomplished'] as const) {
      const p = generateProposal({
        proposalId: 'p1',
        rule,
        total: 1000,
        weekSet: [1],
        statusOf: (id) => (id === 'g1' ? closed : 'active'),
      });
      expect(p.repairNeeded).toBe(true);
      expect(p.lines.map((l) => l.goalId)).toEqual(['g2']); // the closed share has no line…
      expect(p.remainderToAvailable).toBe(200 + 500); // …its amount waits in Available for the user's call
      const fundable = p.lines.reduce((s, l) => s + l.amount, 0);
      expect(fundable + p.remainderToAvailable).toBe(1000);
    }
  });
});
