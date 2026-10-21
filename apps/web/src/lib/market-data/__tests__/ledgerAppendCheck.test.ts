/**
 * The pre-PR ledger check (`check-ledgers.mjs`, 2026-10-20): the weekly PR
 * must not carry a fragment of a row, or any edit to existing rows, into an
 * append-only ledger without saying so. Pure text in, verdict out: no ledger
 * is read here.
 */
import { describe, expect, it } from 'vitest';
import { checkLedgerAppend } from '../../../../scripts/market-refresh/check-ledgers.mjs';

const ROW = '{"anchor":"2026-10-09"}\n';
const NEXT = '{"anchor":"2026-10-16"}\n';

describe('checkLedgerAppend — only whole rows may be appended', () => {
  it('should pass an unchanged ledger', () => {
    expect(checkLedgerAppend(ROW, ROW)).toEqual({ ok: true, rowsAdded: 0, problems: [] });
  });

  it('should pass whole rows appended, and count them', () => {
    expect(checkLedgerAppend(ROW, ROW + NEXT + NEXT)).toEqual({
      ok: true,
      rowsAdded: 2,
      problems: [],
    });
  });

  it('should pass a new ledger that holds whole rows', () => {
    expect(checkLedgerAppend('', NEXT).ok).toBe(true);
  });

  it('should pass a row appended after an old torn tail once a newline closes it', () => {
    expect(checkLedgerAppend(`${ROW}{"anch`, `${ROW}{"anch\n${NEXT}`).ok).toBe(true);
  });

  it('should flag a fragment at the end (the partial-append case)', () => {
    const r = checkLedgerAppend(ROW, `${ROW}{"anchor":"2026`);
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toContain('partial line');
  });

  it('should flag a fragment after a whole row, and still count the whole one', () => {
    const r = checkLedgerAppend(ROW, `${ROW}${NEXT}{"anch`);
    expect(r).toMatchObject({ ok: false, rowsAdded: 1 });
  });

  it('should flag a new ledger that is only a fragment', () => {
    expect(checkLedgerAppend('', '{"anchor"').ok).toBe(false);
  });

  it('should flag a row fused onto an old torn tail', () => {
    const r = checkLedgerAppend(`${ROW}{"anch`, `${ROW}{"anch${NEXT}`);
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toContain('joined to an earlier incomplete line');
  });

  it('should flag an added line that is not a JSON object', () => {
    expect(checkLedgerAppend(ROW, `${ROW}42\n`).ok).toBe(false);
    expect(checkLedgerAppend(ROW, `${ROW}not json\n`).ok).toBe(false);
  });

  it('should flag any change to existing content: edited, truncated or emptied', () => {
    expect(checkLedgerAppend(ROW + NEXT, NEXT + ROW).ok).toBe(false);
    expect(checkLedgerAppend(ROW + NEXT, ROW).ok).toBe(false);
    expect(checkLedgerAppend(ROW, '').ok).toBe(false);
  });
});
