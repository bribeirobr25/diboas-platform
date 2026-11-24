/**
 * ⛑ LEDGER-CHAR-1 · histories for the characterization cases, with literal ids and stamps.
 *
 * Every event carries a fixed `seed-N` id and a literal instant, never the clock (plan §4.1:
 * literal-dated histories only; the defi fixture calendar reads the real clock). `History`
 * keeps the day counter so a builder can place an event on a later sim day.
 */
import type { LedgerEvent } from '@diboas/banking';

type Body<T extends LedgerEvent['type']> = Omit<
  Extract<LedgerEvent, { type: T }>,
  'eventId' | 'simDay' | 'recordedAt' | 'correlationId' | 'type'
>;

export class History {
  readonly events: LedgerEvent[] = [];
  private n = 0;
  simDay = 0;

  add<T extends LedgerEvent['type']>(type: T, body: Body<T>): this {
    this.n += 1;
    this.events.push({
      eventId: `seed-${this.n}`,
      simDay: this.simDay,
      recordedAt: '2026-07-24T00:00:00.000Z',
      correlationId: `seed-corr-${this.n}`,
      type,
      ...body,
    } as LedgerEvent);
    return this;
  }

  grant(amount = '10000.00', currency: 'USD' | 'BRL' | 'EUR' = 'USD', mode: 'b2c' | 'b2b' = 'b2c') {
    return this.add('PlayMoneyGranted', { amount, currency, mode });
  }

  goal(goalId: string, target = '3000.00', name = 'Trip') {
    return this.add('GoalCreated', {
      goalId,
      name,
      icon: 'plane',
      targetAmount: target,
      horizonMonths: 24,
    });
  }

  fund(goalId: string, amount: string) {
    return this.add('GoalFunded', { goalId, amount });
  }

  enterV2(goalId: string, positionId: string, amount: string, strategyId = 'safeHarbor') {
    return this.add('StrategyEntered', {
      goalId,
      positionId,
      strategyId,
      amount,
      schemaVersion: 2,
      modeledNetworkFee: '0.50',
    });
  }

  /** A legacy v1 entry: `amount` already net of its network fee. */
  enterV1(goalId: string, positionId: string, amount: string, strategyId = 'safeHarbor') {
    return this.add('StrategyEntered', {
      goalId,
      positionId,
      strategyId,
      amount,
      networkFee: '0.50',
    });
  }

  advance(days: number, source: 'real' | 'machine' = 'machine') {
    this.add('TimeAdvanced', { days, source });
    this.simDay += days;
    return this;
  }

  get(): LedgerEvent[] {
    return this.events.map((e) => ({ ...e }));
  }
}

export const history = () => new History();
