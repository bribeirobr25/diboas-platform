/**
 * verifyHuman — thin service-agnostic wrapper around the bot-detection provider
 * (BotID 5.22, founder-approved 2026-07-16; plan: docs/audit/PLAN_BOTID_2026-07-15.md).
 *
 * P3 (service-agnostic abstraction): route handlers call `classifyRequest()`,
 * never the vendor directly — a future provider swap is a one-file change.
 *
 * STAGE 1 = LOG-ONLY: the classification is recorded, never enforced. Routes
 * keep their existing rate-limit + CSRF stack (defense in depth); enforcement
 * (403 on isBot) is Stage 2, after ≥1 week of observed false-positive rate.
 *
 * Ordering contract (cost + defense-in-depth): callers invoke this AFTER the
 * free Upstash rate-limit passes — `checkBotId()` Deep Analysis calls are
 * billed ($1/1k), so bots caught by rate limiting never reach the paid check.
 *
 * Fail-open by design: outside Vercel (vitest, local node) `checkBotId()` may
 * throw or return the dev default (`isBot: false`); any error yields
 * `classification: 'unavailable'` and the request proceeds. A bot-check outage
 * must never take down signup.
 */

import { Logger } from '@/lib/monitoring/Logger';

export type HumanClassification = 'human' | 'bot' | 'unavailable';

export interface VerifyHumanResult {
  classification: HumanClassification;
  /** Verbatim provider verdict when available (Stage-2 enforcement input). */
  isBot: boolean;
}

/**
 * Classify the current request context. Log-only consumer contract in Stage 1:
 * callers may log `result.classification` but MUST NOT reject on it yet.
 */
export async function classifyRequest(surface: string): Promise<VerifyHumanResult> {
  try {
    // Dynamic import keeps the vendor SDK out of any non-route bundle and lets
    // test environments run without the module resolving Vercel-only context.
    const { checkBotId } = await import('botid/server');
    const verification = await checkBotId();
    const result: VerifyHumanResult = {
      classification: verification.isBot ? 'bot' : 'human',
      isBot: verification.isBot,
    };
    Logger.info('botid.classification', {
      surface,
      classification: result.classification,
    });
    return result;
  } catch (error) {
    // Fail open (Stage-1 contract): classification unavailable, request proceeds.
    Logger.warn('botid.unavailable', {
      surface,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return { classification: 'unavailable', isBot: false };
  }
}
