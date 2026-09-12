'use client';

import { useEffect } from 'react';
import type { ShellMode } from '@/lib/shell/family';

/**
 * Stamps the surface's mode on `<html>`.
 *
 * TWO attributes, on purpose:
 *
 * - **`data-mode`** is the mode TRUTH (Shell Spec §7). It is always stamped
 *   from the shell-family registry, so anything that needs to know which mode a
 *   surface carries — the ModeMarker, a future `surface_family`/`mode_context`
 *   analytics event (§27: structured metadata, *"not inferred from
 *   colors/routes"*) — reads a declared value instead of guessing from the URL.
 * - **`data-palette`** is what `tokens.css` keys the practice/real PALETTE off,
 *   and it is stamped only when the `modePalette` capability is on. The
 *   practice/real token values are provisional calibration (register `5.282`):
 *   stamping them today would re-tint every live Practice screen from teal to
 *   periwinkle, which Product/UIUX has not reviewed. **Truth ships; the re-tint
 *   waits**, and the flag is the single place that changes when it is approved.
 *
 * Why a client effect rather than the server: `<html>` is owned by the root
 * `[locale]` layout, which cannot know which child surface is rendering, and
 * reading `headers()` there to find out would make every page dynamic. The
 * mode attribute drives no paint today (the palette is off), so there is
 * nothing to flash — unlike the theme, which keeps its pre-paint script.
 *
 * `neutral` REMOVES both attributes rather than writing `neutral`: leaving a
 * stale `practice` behind on an S0 surface is exactly the untruth the Consent
 * disposition forbids (P-QA4 / L-QA2), and an absent attribute is what the
 * token file treats as neutral.
 */
export function ModeStamp({ mode, palette }: { mode: ShellMode; palette: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'neutral') {
      root.removeAttribute('data-mode');
      root.removeAttribute('data-palette');
      return;
    }
    root.setAttribute('data-mode', mode);
    if (palette) root.setAttribute('data-palette', mode);
    else root.removeAttribute('data-palette');
  }, [mode, palette]);

  return null;
}
