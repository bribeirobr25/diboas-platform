/**
 * Market view switcher (M2 — plan v3 D-M2-6). A calm link-row under the hero
 * letting users move between market views. Renders NOTHING until the registry
 * exposes at least two destinations (root + one live view) — so M2 ships this
 * invisible, and it appears atomically with the first status flip (M3).
 *
 * Real `<a>` navigation (LocaleLink), not ARIA tabs — path-routed views are
 * documents, not tab panels. `prefetch={false}` per the prefetch-hygiene
 * register (secondary/exploratory nav opts out). Order = the registry spine,
 * NEVER scores (R-4 anti-ranking is structural — there is no other order to
 * walk). Per-view labels + `aria-current` styling land with M3 (plan §9
 * rider 4d); until then the fallback label is the slug, which no user sees.
 */

import { LocaleLink } from '@/components/UI/LocaleLink';
import { switcherDestinations, viewPath, type MarketViewDef } from '@/lib/market/viewRegistry';
import styles from './page.module.css';

interface MarketViewSwitcherProps {
  /** Resolves a view's display label from the SHARED market namespace
   *  (`market.views.<slug>` — M3 adds the keys ×4 locales). */
  labelFor: (view: MarketViewDef) => string;
}

// M3 riders (plan §9 rider 4d, deliberately NOT built early): per-view
// `aria-current` (needs LocaleLink to forward it) + the nav aria-label from
// i18n. Both land with the first status flip, when this first renders.
export function MarketViewSwitcher({ labelFor }: MarketViewSwitcherProps) {
  const destinations = switcherDestinations();
  if (destinations.length < 2) return null;

  return (
    <nav aria-label="Market views" className={styles.viewSwitcher}>
      <ul className={styles.viewSwitcherList}>
        {destinations.map((view) => (
          <li key={view.slug}>
            <LocaleLink href={viewPath(view)} prefetch={false} className={styles.viewSwitcherLink}>
              {labelFor(view)}
            </LocaleLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
