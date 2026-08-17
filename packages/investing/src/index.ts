/**
 * @diboas/investing — Investing domain package.
 *
 * MVP-0 (Sandbox) activation, 2026-07-18: jobs split model, goal drafts and
 * validation, and the accrual-replay engine (real APY history onto play
 * positions, "would have" by construction).
 * See docs/sandbox-app/ for the governing rules.
 */

export const INVESTING_PACKAGE_VERSION = '0.2.0';

export * from './jobs';
export * from './goals';
export * from './accrual';
export * from './rules';
