import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  checkInvestorPassword,
  verifyInvestorGate,
  investorGrantToken,
  isInvestorGateConfigured,
} from '../investorGate';
import { isInvestorType } from '@/lib/investor';

const PW = 'super-secret-room-pw';

describe('investorGate (shared-password room access)', () => {
  const original = process.env.INVESTOR_ROOM_PASSWORD;

  beforeEach(() => {
    process.env.INVESTOR_ROOM_PASSWORD = PW;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.INVESTOR_ROOM_PASSWORD;
    else process.env.INVESTOR_ROOM_PASSWORD = original;
  });

  it('should report configured only when a password is set', () => {
    expect(isInvestorGateConfigured()).toBe(true);
    delete process.env.INVESTOR_ROOM_PASSWORD;
    expect(isInvestorGateConfigured()).toBe(false);
  });

  it('should accept the exact password and reject everything else', () => {
    expect(checkInvestorPassword(PW)).toBe(true);
    expect(checkInvestorPassword('wrong')).toBe(false);
    expect(checkInvestorPassword('')).toBe(false);
    expect(checkInvestorPassword(`${PW}x`)).toBe(false);
  });

  it('should fail closed when no password is configured', () => {
    delete process.env.INVESTOR_ROOM_PASSWORD;
    expect(checkInvestorPassword('anything')).toBe(false);
    expect(investorGrantToken()).toBeNull();
    expect(verifyInvestorGate('anything')).toBe(false);
  });

  it('should verify only the current signed grant token', () => {
    const token = investorGrantToken();
    expect(token).toBeTruthy();
    expect(verifyInvestorGate(token)).toBe(true);
    expect(verifyInvestorGate('forged-token')).toBe(false);
    expect(verifyInvestorGate(undefined)).toBe(false);
    expect(verifyInvestorGate('')).toBe(false);
  });

  it('should invalidate old grant tokens when the password rotates', () => {
    const token = investorGrantToken();
    process.env.INVESTOR_ROOM_PASSWORD = 'a-rotated-password';
    expect(verifyInvestorGate(token)).toBe(false);
    expect(verifyInvestorGate(investorGrantToken())).toBe(true);
  });
});

describe('isInvestorType', () => {
  it('should accept every known investor type', () => {
    for (const t of ['angel', 'vc', 'founder-operator', 'strategic', 'family-office', 'other']) {
      expect(isInvestorType(t)).toBe(true);
    }
  });

  it('should reject unknown or non-string values', () => {
    expect(isInvestorType('hacker')).toBe(false);
    expect(isInvestorType('')).toBe(false);
    expect(isInvestorType(123)).toBe(false);
    expect(isInvestorType(undefined)).toBe(false);
    expect(isInvestorType(null)).toBe(false);
  });
});
