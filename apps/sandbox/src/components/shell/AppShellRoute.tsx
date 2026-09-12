'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { destinationsFor } from './destinations';
import { shellSurfaceFromPathname, type ShellSurface } from '@/lib/shell/family';

/**
 * Resolves the current surface ONCE, then hands the shell a declared value.
 *
 * This is the only place in the app that reads a pathname for chrome, and what
 * it does with it is a LOOKUP into `SHELL_SURFACES` — not a chrome decision.
 * Everything downstream (header variant, navigation visibility, mode, the
 * selected destination) is read from that declaration. The old `AppChrome`
 * re-derived the same facts three different ways inline (`pathname === home`,
 * `startsWith(move)`, an `isRoot` boolean), which is what the plan means by a
 * family *"never inferred from `pathname`"*.
 *
 * ## Why the resolution lives in a layout and not in each page
 *
 * A Next layout persists across navigations inside its segment, so the chrome
 * is not remounted when the user moves between destinations — the scroll
 * position and the mounted ledger gate survive. A per-page `<AppShell>` wrapper
 * would be equally declarative and would remount the whole shell on every
 * navigation. The layout cannot know which child page is rendering, so the
 * surface comes from the URL here, checked against the registry.
 *
 * A path the registry does not know cannot normally reach this component —
 * middleware answers an unknown route with the localized 404 before rendering —
 * so `null` means a route exists that nobody declared. The shell then renders
 * the focused (S2) chrome, which is the conservative choice inside the app: the
 * R-4 disclosure rides, and no navigation invites a context switch out of a
 * surface we cannot classify. `family.test.ts` asserts the case stays
 * hypothetical by walking every route on disk.
 */
const UNDECLARED_FALLBACK: ShellSurface = 'goals/[id]';

export function AppShellRoute({
  locale,
  paletteEnabled,
  children,
}: {
  locale: string;
  paletteEnabled: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const surface = shellSurfaceFromPathname(pathname) ?? UNDECLARED_FALLBACK;

  return (
    <AppShell
      locale={locale}
      surface={surface}
      destinations={destinationsFor(locale)}
      paletteEnabled={paletteEnabled}
    >
      {children}
    </AppShell>
  );
}
