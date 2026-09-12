import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  SHELL_SURFACES,
  SHELL_SURFACE_IDS,
  shellSurfaceFromPathname,
  type ShellSurface,
} from '../family';

/**
 * The shell-family model (I-1e).
 *
 * Every expectation below is DERIVED from the Shared App Shell Spec and the
 * closed Product/Legal dispositions — never read off the registry it checks
 * (coding-standards rule 4). If the registry and the spec disagree, this fails.
 *
 * The registry replaces chrome decided by string-matching the URL
 * (`pathname === home`, `startsWith(move)`, an `isRoot` boolean). The plan's
 * requirement is a first-class value *"never inferred from `pathname`"*, and
 * Shell Spec §27 wants family and mode as structured metadata, *"not inferred
 * from colors/routes"*.
 */

const APP_DIR = join(process.cwd(), 'src', 'app', '[locale]');

/** Every `page.tsx` on disk → its surface id (route groups are not URL parts). */
function routeSurfaces(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === 'page.tsx') {
        const segments = relative(APP_DIR, dir)
          .split('/')
          .filter((s) => s && !s.startsWith('(')); // (app), (top) … are grouping only
        out.push(segments.join('/'));
      }
    }
  };
  walk(APP_DIR);
  return out.sort();
}

/**
 * Declared, but with no route of its own YET. Each entry is a destination the
 * Shell Spec requires in the navigation before its surface exists:
 *
 * - `learn` — Spec §9.4: the destination exists, the full IA is not closed, and
 *   no authority-approved explainer copy exists yet (F-04 wants it tappable).
 * `community` was here until its controlled-unavailable surface landed in this
 * increment with the Legal-approved copy (P-QA5 / L-QA3) — it now has a real
 * route, so it is no longer an exception.
 */
const DECLARED_WITHOUT_ROUTE: ShellSurface[] = ['learn'];

/** Spec §8 + §10: the bottom navigation is exactly these five destinations. */
const TOP_LEVEL: ShellSurface[] = ['', 'goals', 'move', 'learn', 'community'];

/** Spec §3 + P-QA4 / L-QA2: neutral entry carries NO financial mode marker. */
const NEUTRAL_ENTRY: ShellSurface[] = ['welcome', 'consent', 'readiness', 'gate'];

/** Spec §6: system / recovery. */
const SYSTEM: ShellSurface[] = ['missing', 'unavailable'];

/**
 * Spec §5.2 — "hide bottom navigation when the user is in a task that should be
 * completed, cancelled, or explicitly exited before changing destination".
 */
const TASKS_THAT_HIDE_NAV: ShellSurface[] = [
  'goals/new',
  'weekly',
  'rules',
  'practice-event',
  'comprehension',
  'handle-claim',
];

/**
 * Spec §5.2 — "may remain visible on deep but non-destructive destination views
 * when the user is still conceptually browsing", plus §22 "bottom nav generally
 * visible" and Shell Q-2, closed on `goals/[id]` specifically.
 */
const BROWSING_KEEPS_NAV: ShellSurface[] = [
  'goals/[id]',
  'history',
  'month',
  'time-machine',
  'practice-record',
  'notifications',
  'profile',
  'settings',
];

describe('the registry covers what the app actually serves', () => {
  it('should declare a surface for every route on disk', () => {
    const undeclared = routeSurfaces().filter(
      (s) => !SHELL_SURFACE_IDS.includes(s as ShellSurface)
    );
    expect(undeclared).toEqual([]);
  });

  it('should not declare a surface that no route serves, beyond the reasoned list', () => {
    const routes = new Set(routeSurfaces());
    const orphans = SHELL_SURFACE_IDS.filter(
      (id) => !routes.has(id) && !DECLARED_WITHOUT_ROUTE.includes(id)
    );
    expect(orphans).toEqual([]);
  });

  it('should say WHY each surface is classified as it is, citing its authority', () => {
    // The same rule the capability registry carries: a `because` that restates
    // the code teaches nothing. Each must point at a spec section or a decision.
    const weak = SHELL_SURFACE_IDS.filter((id) => {
      const why = SHELL_SURFACES[id].because;
      return why.length < 25 || !/§|Spec|P-QA|L-QA|Q-\d|5\.\d+/.test(why);
    });
    expect(weak).toEqual([]);
  });
});

describe('the families match the spec, not the URL shape', () => {
  it('should make exactly the five canonical destinations top-level (§8, §10)', () => {
    const s1 = SHELL_SURFACE_IDS.filter((id) => SHELL_SURFACES[id].family === 'S1');
    expect(s1.sort()).toEqual([...TOP_LEVEL].sort());
  });

  it('should keep the bottom navigation on every top-level destination', () => {
    for (const id of TOP_LEVEL) expect(SHELL_SURFACES[id].bottomNav, id).toBe('visible');
  });

  it.each(NEUTRAL_ENTRY)('should keep %s neutral with no authenticated navigation', (id) => {
    // P-QA4 + L-QA2: no Practice marker on Welcome / Consent / Entry Readiness.
    expect(SHELL_SURFACES[id].family).toBe('S0');
    expect(SHELL_SURFACES[id].mode).toBe('neutral');
    expect(SHELL_SURFACES[id].bottomNav).toBe('hidden');
  });

  it('should treat Claim as the transition seam: S0 chrome, Practice truth (§3.3)', () => {
    expect(SHELL_SURFACES.claim.family).toBe('S0');
    expect(SHELL_SURFACES.claim.mode).toBe('practice');
  });

  it.each(SYSTEM)('should give %s the minimal system shell (§6)', (id) => {
    expect(SHELL_SURFACES[id].family).toBe('S3');
    expect(SHELL_SURFACES[id].bottomNav).toBe('hidden');
  });

  it.each(TASKS_THAT_HIDE_NAV)('should hide the bottom navigation during %s (§5.2)', (id) => {
    expect(SHELL_SURFACES[id].family).toBe('S2');
    expect(SHELL_SURFACES[id].bottomNav).toBe('hidden');
  });

  it.each(BROWSING_KEEPS_NAV)('should keep the bottom navigation while browsing %s', (id) => {
    expect(SHELL_SURFACES[id].family).toBe('S2');
    expect(SHELL_SURFACES[id].bottomNav).toBe('visible');
  });

  it('should never show authenticated navigation outside the authenticated app', () => {
    // The structural invariant behind both rules above: S0 and S3 are the
    // shells for "not inside the app yet" and "something is wrong".
    const wrong = SHELL_SURFACE_IDS.filter(
      (id) =>
        (SHELL_SURFACES[id].family === 'S0' || SHELL_SURFACES[id].family === 'S3') &&
        SHELL_SURFACES[id].bottomNav === 'visible'
    );
    expect(wrong).toEqual([]);
  });

  it('should carry a real mode on every surface inside the app', () => {
    // Nothing inside the authenticated app may be mode-less: the ModeMarker and
    // the R-4 disclosure both depend on there being a truth to state.
    const modeless = SHELL_SURFACE_IDS.filter(
      (id) =>
        (SHELL_SURFACES[id].family === 'S1' || SHELL_SURFACES[id].family === 'S2') &&
        SHELL_SURFACES[id].mode === 'neutral'
    );
    expect(modeless).toEqual([]);
  });
});

describe('the resolver reads a URL exactly once, and reads it safely', () => {
  it.each([
    ['/', ''],
    ['/en', ''],
    ['/pt-BR', ''],
    ['/en/goals', 'goals'],
    ['/de/goals/new', 'goals/new'],
    ['/pt-BR/time-machine', 'time-machine'],
    ['/es/practice-event', 'practice-event'],
  ] as const)('should resolve %s to %s', (path, surface) => {
    expect(shellSurfaceFromPathname(path)).toBe(surface);
  });

  it('should resolve a goal id by SHAPE, so an id is never a surface', () => {
    expect(shellSurfaceFromPathname('/en/goals/183d3c00-ce1c-4ca1-8694-fa58ef8bfeb2')).toBe(
      'goals/[id]'
    );
    expect(shellSurfaceFromPathname('/de/goals/anything-at-all')).toBe('goals/[id]');
  });

  it('should still resolve a surface whose name could be mistaken for a locale', () => {
    // `month` is five characters, like `pt-BR`. Asking the CLOSED locale set is
    // what makes this safe; guessing from segment length is what would break it.
    expect(shellSurfaceFromPathname('/month')).toBe('month');
    expect(shellSurfaceFromPathname('/pt-BR/month')).toBe('month');
  });

  it('should return null for a path it does not know, rather than inventing a family', () => {
    // The middleware already answers an unknown route with the localized 404;
    // a made-up family here would hide that and render chrome for nothing.
    for (const path of ['/en/nope', '/nope', '/en/goals/new/extra', '/api/health']) {
      expect(shellSurfaceFromPathname(path), path).toBeNull();
    }
  });
});
