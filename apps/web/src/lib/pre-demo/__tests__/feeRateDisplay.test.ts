/**
 * PreDemo fee-rate display helper — contract test (Phase 7 PR-1).
 *
 * Pins the contract that fee rates displayed in PreDemo's FeeBreakdown
 * are sourced from `marketDataService.getSync()` (NOT a duplicate local
 * constants table). Mocks the service to assert the mapping is correct.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreDemoFeeRateValues } from '../feeRateDisplay';

vi.mock('@/lib/market-data', () => ({
  marketDataService: {
    getSync: vi.fn(),
  },
}));

import { marketDataService } from '@/lib/market-data';

const stubSnapshot = {
  thirdPartyFees: {
    paymentProcessor: 0.01,
    networkFee: 0.00001,
    crossChainSwap: 0.003,
    btcMiner: 0.02,
    xautIssuer: 0.0025,
  },
  platformFees: {
    deposit: { rate: 0.0048, minFee: 0.25, maxFee: 25 },
  },
} as unknown as ReturnType<typeof marketDataService.getSync>;

describe('getPreDemoFeeRateValues — contract', () => {
  beforeEach(() => {
    vi.mocked(marketDataService.getSync).mockReturnValue(stubSnapshot);
  });

  it('routes thirdPartyFees.paymentProcessor through to the formatted display string (en)', () => {
    const v = getPreDemoFeeRateValues('en');
    expect(v.paymentProcessor.rate).toMatch(/1\s?%/);
  });

  it('formats networkFee (0.001%) with 3 decimals — formatRate.cap=2 is insufficient for this magnitude', () => {
    const v = getPreDemoFeeRateValues('en');
    expect(v.networkFee.rate).toMatch(/0\.001\s?%/);
  });

  it('formats crossChainSwap as 0.30% (2 decimals, sub-1% magnitude)', () => {
    const v = getPreDemoFeeRateValues('en');
    expect(v.crossChainSwap.rate).toMatch(/0\.30\s?%/);
  });

  it('formats btcMinerFee as 2% (integer-magnitude, 0 decimals)', () => {
    const v = getPreDemoFeeRateValues('en');
    expect(v.btcMinerFee.rate).toMatch(/2\s?%/);
  });

  it('formats issuerMintRedemption as 0.25% (sub-1% with 2 decimals)', () => {
    const v = getPreDemoFeeRateValues('en');
    expect(v.issuerMintRedemption.rate).toMatch(/0\.25\s?%/);
  });

  it('emits all three slots (rate/min/max) for diboasFeeDeposit', () => {
    const v = getPreDemoFeeRateValues('en');
    expect(v.diboasFeeDeposit.rate).toMatch(/0\.48\s?%/);
    expect(v.diboasFeeDeposit.min).toContain('0.25');
    expect(v.diboasFeeDeposit.max).toContain('25');
  });

  it('non-USD locales use locale-appropriate decimal separator (de uses comma)', () => {
    const v = getPreDemoFeeRateValues('de');
    // 0.30% in de-DE locale renders as "0,3 %" or "0,30 %" — both have comma.
    expect(v.crossChainSwap.rate).toMatch(/0,\d+\s?%/);
  });

  it('locale-formats currency in min/max for non-USD (pt-BR uses R$)', () => {
    const v = getPreDemoFeeRateValues('pt-BR');
    // formatCurrency for pt-BR yields BRL symbol "R$" with comma decimals.
    expect(v.diboasFeeDeposit.min).toContain('R$');
  });

  it('a change in snapshot.thirdPartyFees flows through to the rendered rate string', () => {
    vi.mocked(marketDataService.getSync).mockReturnValueOnce({
      ...stubSnapshot,
      thirdPartyFees: { ...stubSnapshot.thirdPartyFees, paymentProcessor: 0.025 },
    } as ReturnType<typeof marketDataService.getSync>);
    const v = getPreDemoFeeRateValues('en');
    expect(v.paymentProcessor.rate).toMatch(/2\.5\s?%/);
  });
});
