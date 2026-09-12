import type { ShellMode } from '@/lib/shell/family';
import styles from './ModeMarker.module.css';

/**
 * `ModeMarker` — persistent mode truth (Minimum UI System §10.2, Shell Spec §7).
 *
 * ## What it is
 *
 * A non-interactive statement of which financial mode the surface carries.
 * Neutral surfaces have no financial mode marker (§7.3), so `neutral` renders
 * NOTHING — Welcome, Consent and Entry Readiness must not carry a Practice
 * marker (Product `P-QA4`, Legal `L-QA2`).
 *
 * ## Why the label is a prop
 *
 * The canonical labels are `PRACTICE · SIMULATED` and `REAL MONEY` (§7.1/§7.2),
 * and Minimum UI §10.2 adds *"exact copy may be refined later"*. No
 * authority-approved wording exists for the other three locales, and this is
 * Legal-adjacent copy — the label *"must keep communicating no-real-value"*. So
 * the component takes its label from the caller: Storybook supplies the
 * canonical English for state evidence, and the live shell mounts it only once
 * the four-locale label is approved. Authoring it here would be inventing
 * Legal-reviewed copy.
 *
 * ## Mode must survive without colour (§7.5, `SHELL-2`, P01 `A11Y-01`)
 *
 * The signal is the TEXT, in every theme: the label states the mode in words.
 * The border and the letter-spaced caps are structure, not decoration; the mode
 * accent, when a palette is active, is *"reinforcement, not the only signal"*.
 * That is why this component never renders a colour-only difference between
 * practice and real — in greyscale the two are still distinguishable, because
 * they say different things.
 *
 * ## Not a control (`SHELL-3`)
 *
 * §10.2: *"not interactive unless future mode-entry authority explicitly allows
 * it; never implemented as an unauthorized global mode switch"*. It renders as
 * a `<span>` — no button, no link, no handler — and `SHELL-3`'s guard asserts
 * exactly that.
 */
export function ModeMarker({
  mode,
  label,
  size = 'standard',
}: {
  mode: ShellMode;
  /** The canonical label for this mode, supplied by the caller (see above). */
  label: string;
  /** §10.2 states `compact` and `standard`; both are structure, not colour. */
  size?: 'compact' | 'standard';
}) {
  if (mode === 'neutral') return null;
  return (
    <span className={styles.marker} data-mode={mode} data-size={size}>
      {label}
    </span>
  );
}
