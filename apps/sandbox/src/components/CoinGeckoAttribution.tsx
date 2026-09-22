/**
 * COINGECKO ATTRIBUTION — shown beside the data it attributes, never alone.
 *
 * Product/Brand ruling 2026-09-22:
 *
 * ```text
 * COPY                          = Data provided by CoinGecko   (exact)
 * LINK                          = https://www.coingecko.com/en/api
 * COPY LOCALIZATION             = NO
 * ATTRIBUTION PROXIMITY         = REQUIRED
 * GLOBAL-FOOTER-ONLY            = NOT SUFFICIENT
 * MOBILE / DESKTOP              = SAME REQUIREMENT
 * ENDORSEMENT IMPLICATION       = NO
 * ```
 *
 * ⚑ RENDER IT ONLY WHERE COINGECKO-DERIVED DATA ACTUALLY RENDERS. The ruling
 * draws the line explicitly: *"no rendered CoinGecko-derived data -> no
 * attribution required solely because provider exists upstream"*. Every call
 * site below is therefore guarded by the presence of the value itself, not by
 * the provider being wired up somewhere. Branding a surface that shows nothing
 * from CoinGecko would be the opposite failure, and it has its own test.
 *
 * ⚑ THE COPY IS NOT TRANSLATED, AND THAT IS A RULING, NOT AN OVERSIGHT. The
 * string lives in the message catalogue for all four locales with the identical
 * English value, and `common.coingeckoAttribution` carries a single-key
 * exemption in the untranslated ratchet. Catalogue rather than a hardcoded
 * literal because that is this app's existing pattern for rendered text and it
 * keeps the string auditable in one place per locale — canon §18: Engineering
 * must not invent or vary provider attribution copy.
 *
 * ⚑ NO ENDORSEMENT. "Data provided by" states a source. It is not "powered by",
 * "in partnership with", or any construction implying sponsorship or approval —
 * the ruling names those explicitly, and the exact-copy test pins it.
 */

import { FormattedMessage } from 'react-intl';
import styles from './CoinGeckoAttribution.module.css';

/** The attribution target, fixed by the ruling. Not configurable. */
const COINGECKO_URL = 'https://www.coingecko.com/en/api';

export function CoinGeckoAttribution({ className }: { className?: string }) {
  return (
    <p className={className ? `${styles.attribution} ${className}` : styles.attribution}>
      <a
        className={styles.link}
        href={COINGECKO_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="coingecko-attribution"
      >
        <FormattedMessage id="common.coingeckoAttribution" />
      </a>
    </p>
  );
}
