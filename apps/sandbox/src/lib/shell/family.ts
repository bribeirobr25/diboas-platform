/**
 * The shell-family model — I-1e's first-class value.
 *
 * The Shared App Shell Spec §2 names four shell families, and they are
 * *behaviours*, not products:
 *
 *   S0 · Neutral Entry     before the user is inside a financial mode
 *   S1 · Authenticated     a top-level destination (Home · Goals · Move · Learn · Community)
 *   S2 · Focused Task      completing or inspecting one thing
 *   S3 · System / Recovery verification, refusal, unknown state
 *
 * **Why this is a declared registry and not a string match.** Today's shell
 * decides its own chrome with `pathname === home`, `pathname.startsWith(move)`
 * and an `isRoot` boolean — the family is re-derived, differently, at every
 * call site. The plan requires the opposite: *"a first-class `ShellFamily`
 * type, never inferred from `pathname`"* (and it is also what makes a future
 * `surface_family` analytics value honest — Shell Spec §27 asks for mode and
 * family as structured metadata, *"not inferred from colors/routes"*).
 *
 * So every surface is declared ONCE below, with the three things the shell
 * needs to know, and the surface id — not the URL — is what the shell reads.
 * `Record<ShellSurface, …>` makes a new surface that forgets to declare itself
 * a compile error, the same technique as `CAPABILITIES` and `project()`.
 *
 * ## What each field decides
 *
 * `family`      which chrome renders (Spec §3–§6).
 * `bottomNav`   Spec §5.2's rule, stated per surface: *"Hide bottom navigation
 *               when the user is in a task that should be completed, cancelled,
 *               or explicitly exited before changing destination."* Goal Detail
 *               and Goals List KEEP it (Spec §5.2 + §22 *"bottom nav generally
 *               visible"*, Minimum UI §10.5, and Shell Q-2 closed on exactly
 *               that).
 * `mode`        the mode TRUTH the surface carries (Spec §7): `neutral` before
 *               the claim seam, `practice` once inside this app. `EN-03B Claim`
 *               is *"the transition seam… the first explicit Practice surface"*
 *               (§3.3), so Claim is the one S0-chrome surface whose mode is
 *               already `practice`.
 *
 * Mode is deliberately NOT derived from the family: S0 is where they differ,
 * and conflating them is what would put a `PRACTICE · SIMULATED` marker on
 * Welcome and Consent — which Product (P-QA4) and Legal (L-QA2) both say must
 * not happen.
 */

import { isSandboxLocale } from '@/i18n/config';

/** Spec §2. */
export type ShellFamily = 'S0' | 'S1' | 'S2' | 'S3';

/** The mode truth a surface carries (Spec §7). `real` exists for I-8 parity. */
export type ShellMode = 'neutral' | 'practice' | 'real';

/** Spec §5.2 — per surface, never guessed from depth. */
export type BottomNav = 'visible' | 'hidden';

export interface ShellSurfaceSpec {
  readonly family: ShellFamily;
  readonly bottomNav: BottomNav;
  readonly mode: ShellMode;
  /** Why this surface is classified the way it is — the authority, not a restatement. */
  readonly because: string;
}

/**
 * Every surface this app serves. The key is the surface's route segment path
 * WITHOUT the locale (`''` is the app root, i.e. Home).
 */
export type ShellSurface =
  | ''
  | 'goals'
  | 'goals/new'
  | 'goals/[id]'
  | 'move'
  | 'learn'
  | 'community'
  | 'history'
  | 'month'
  | 'weekly'
  | 'rules'
  | 'time-machine'
  | 'practice-event'
  | 'practice-record'
  | 'comprehension'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'handle-claim'
  | 'welcome'
  | 'consent'
  | 'readiness'
  | 'claim'
  | 'gate'
  | 'missing'
  | 'unavailable';

export const SHELL_SURFACES: Record<ShellSurface, ShellSurfaceSpec> = {
  // ── S1 · the five top-level destinations (Spec §4, §8, §10) ───────────────
  '': {
    family: 'S1',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Home — orientation. Spec §9.1.',
  },
  goals: {
    family: 'S1',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Goals — the complete Goal destination. Spec §9.2.',
  },
  move: {
    family: 'S1',
    bottomNav: 'visible',
    mode: 'practice',
    because:
      'Move — visible in Practice for capability continuity; the full journey is PARTIAL and must not be invented (Spec §9.3, §24).',
  },
  learn: {
    family: 'S1',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Learn — destination exists, full IA not closed (Spec §9.4).',
  },
  community: {
    family: 'S1',
    bottomNav: 'visible',
    mode: 'practice',
    because:
      'Community — visible from the start with a controlled unavailable state; public enablement WAIT (Spec §9.5, §23; P-QA5).',
  },

  // ── S2 · focused task or inspection (Spec §5) ─────────────────────────────
  'goals/new': {
    family: 'S2',
    bottomNav: 'hidden',
    mode: 'practice',
    because: 'Goal creation is a multi-step task to finish or cancel (Spec §5.2, first example).',
  },
  'goals/[id]': {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because:
      'Goal Detail — deep but non-destructive; the user is still browsing. Spec §5.2 names it, §22 says bottom nav generally visible, and Shell Q-2 closed on that.',
  },
  history: {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Read-only continuity surface; nothing to complete or cancel (Spec §11.4).',
  },
  month: {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Read-only report (Spec §11.4).',
  },
  'time-machine': {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Read-only simulation of what the market did (Spec §11.4).',
  },
  'practice-record': {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Read-only continuity surface (Spec §11.4).',
  },
  notifications: {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'The inbox behind the bell — a utility, not a destination (Spec §11.2, §14).',
  },
  profile: {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Account access — a utility reached from the header (Spec §11.1, §15).',
  },
  settings: {
    family: 'S2',
    bottomNav: 'visible',
    mode: 'practice',
    because: 'Utility/account form; reduced atmosphere, nothing to complete (Spec §22).',
  },
  weekly: {
    family: 'S2',
    bottomNav: 'hidden',
    mode: 'practice',
    because:
      'The weekly ceremony is a decision to complete or leave; Spec §11.3 also keeps it out of the nav baseline.',
  },
  rules: {
    family: 'S2',
    bottomNav: 'hidden',
    mode: 'practice',
    because: 'The rule builder is a multi-step task to finish or cancel (Spec §5.2).',
  },
  'practice-event': {
    family: 'S2',
    bottomNav: 'hidden',
    mode: 'practice',
    because:
      'A consequential choice with a confirm step — the Spec §5.2 "critical Consequence / confirmation state".',
  },
  comprehension: {
    family: 'S2',
    bottomNav: 'hidden',
    mode: 'practice',
    because:
      'A micro-check to answer or skip — a task to complete or leave (Spec §5.2); switching destination mid-question loses it.',
  },
  'handle-claim': {
    family: 'S2',
    bottomNav: 'hidden',
    mode: 'practice',
    because: 'A form to submit or abandon (and capability-gated off by default — 5.201).',
  },

  // ── S0 · neutral entry (Spec §3) ──────────────────────────────────────────
  welcome: {
    family: 'S0',
    bottomNav: 'hidden',
    mode: 'neutral',
    because: 'EN-01 Welcome — NEUTRAL, no financial mode marker (Spec §3.1; P-QA4).',
  },
  consent: {
    family: 'S0',
    bottomNav: 'hidden',
    mode: 'neutral',
    because:
      'Consent carries no Practice chip: no balance, no simulated result, no money movement (P-QA4 / L-QA2).',
  },
  readiness: {
    family: 'S0',
    bottomNav: 'hidden',
    mode: 'neutral',
    because: 'EN-03A Entry Readiness — NEUTRAL (Spec §3; P-QA4).',
  },
  gate: {
    family: 'S0',
    bottomNav: 'hidden',
    mode: 'neutral',
    because:
      'Access control before the authenticated app: S0, and nothing financial is shown (Spec §3).',
  },
  claim: {
    family: 'S0',
    bottomNav: 'hidden',
    mode: 'practice',
    because:
      'EN-03B Claim is THE transition seam — "the first explicit Practice surface" (Spec §3.3), so S0 chrome with Practice truth.',
  },

  // ── S3 · system / recovery (Spec §6) ──────────────────────────────────────
  missing: {
    family: 'S3',
    bottomNav: 'hidden',
    mode: 'neutral',
    because: 'A refusal surface: minimal shell, one safe next action (Spec §6).',
  },
  unavailable: {
    family: 'S3',
    bottomNav: 'hidden',
    mode: 'neutral',
    because: 'The geofence 451 — a blocking system state (Spec §6).',
  },
};

/** Every declared surface id, for tests and for the middleware's lookup. */
export const SHELL_SURFACE_IDS = Object.keys(SHELL_SURFACES) as ShellSurface[];

/**
 * The surface id for a pathname — the ONE place a URL is read.
 *
 * This is a lookup into the declaration above, not a chrome decision: the
 * shell never sees a pathname, and nothing downstream re-derives a family.
 * `/{locale}/goals/<uuid>` resolves to the declared `goals/[id]`, so a goal id
 * can never be mistaken for a surface of its own.
 *
 * Returns `null` for an unknown path, and the caller decides — the middleware
 * already answers an unknown route with the localized 404, and inventing a
 * family for it here would hide that.
 */
export function shellSurfaceFromPathname(pathname: string): ShellSurface | null {
  const parts = pathname.split('/').filter(Boolean);
  // The locale set is CLOSED, so ask it — never guess from segment length. A
  // guess would misread `/month` (5 chars, like `pt-BR`) as a locale, and
  // `/pt-BR/month` as a surface called `pt-BR`.
  const rest = parts.length > 0 && isSandboxLocale(parts[0]) ? parts.slice(1) : parts;
  if (rest.length === 0) return '';
  const joined = rest.join('/');
  if (isShellSurface(joined)) return joined;
  // `goals/<id>` — a declared dynamic surface, matched on SHAPE, so a goal id
  // can never be mistaken for a surface of its own.
  if (rest.length === 2 && rest[0] === 'goals') return 'goals/[id]';
  return null;
}

export function isShellSurface(value: string): value is ShellSurface {
  return Object.prototype.hasOwnProperty.call(SHELL_SURFACES, value);
}
