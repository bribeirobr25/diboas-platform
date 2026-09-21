import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __resetEvidencePersistence, getEvidencePersistence } from '../factory';
import { PostgresEvidenceStore } from '../PostgresEvidenceStore';

const ORIGINAL = { ...process.env };

/**
 * Durable-adapter selection.
 *
 * The requirement is a prohibition: the runtime must never translate
 * "durable store unavailable" into "persistence succeeded" via an in-memory
 * stand-in. The union makes that unexpressible; these tests prove the selection
 * actually behaves that way, and that no in-memory adapter is reachable here.
 */
describe('evidence persistence selection', () => {
  beforeEach(() => {
    __resetEvidencePersistence();
    delete process.env.SANDBOX_EVIDENCE_PERSISTENCE;
    delete process.env.DATABASE_URL;
  });
  afterEach(() => {
    process.env = { ...ORIGINAL };
    __resetEvidencePersistence();
  });

  it('should be DISABLED with a reason when the opt-in is absent', () => {
    expect(getEvidencePersistence()).toEqual({ enabled: false, reason: 'NOT_CONFIGURED' });
  });

  it('should keep the opt-in STRICT — only the exact string opens it', () => {
    for (const value of ['TRUE', 'True', '1', ' true', 'yes', '']) {
      __resetEvidencePersistence();
      process.env.SANDBOX_EVIDENCE_PERSISTENCE = value;
      process.env.DATABASE_URL = 'postgres://ignored';
      expect(getEvidencePersistence()).toEqual({ enabled: false, reason: 'NOT_CONFIGURED' });
    }
  });

  it('should be DISABLED with a DIFFERENT reason when the flag is on but no database is configured', () => {
    process.env.SANDBOX_EVIDENCE_PERSISTENCE = 'true';
    expect(getEvidencePersistence()).toEqual({ enabled: false, reason: 'NO_DATABASE_URL' });
  });

  it('should select the DURABLE adapter when both are present', () => {
    process.env.SANDBOX_EVIDENCE_PERSISTENCE = 'true';
    process.env.DATABASE_URL = 'postgres://example';
    const persistence = getEvidencePersistence();
    expect(persistence.enabled).toBe(true);
    if (!persistence.enabled) throw new Error('unreachable');
    expect(persistence.store).toBeInstanceOf(PostgresEvidenceStore);
  });

  it('should memoise the decision so two call sites cannot differ', () => {
    process.env.SANDBOX_EVIDENCE_PERSISTENCE = 'true';
    process.env.DATABASE_URL = 'postgres://example';
    expect(getEvidencePersistence()).toBe(getEvidencePersistence());
  });

  it('should never name an in-memory adapter — the fallback that must not exist', () => {
    /* Read the SOURCE, not the behaviour: the prohibition is that no code path
       here can construct one, and a behavioural test can only sample paths. */
    const source = readFileSync(join(__dirname, '..', 'factory.ts'), 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(code).not.toContain('InMemoryEvidenceStore');
    expect(code).not.toContain('testing');
  });
});
