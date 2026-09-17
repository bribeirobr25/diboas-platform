'use client';

import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './UnavailableSurface.module.css';

/**
 * Learn — the controlled unavailable destination (`5.349`).
 *
 * ## Why this exists now, and did not before
 *
 * Learn was an INERT tab for exactly one reason: Legal's `L-QA3` condition
 * forbids rendering the explanation *"alone in a way that could be read as a
 * description of an operational service"*, and `learn.explainer` describes what
 * Learn DOES. Title + explainer alone IS that prohibited reading, and the
 * availability beat that would fix it did not exist. Execution Rulings §18
 * supplies it — *"This area isn't available yet."* — in all four locales, so
 * the surface can now be built as Community's already is.
 *
 * §18 states the required composition exactly:
 *
 *   Learn title + approved Learn explainer + availability line
 *
 * The approved explainer is KEPT, not discarded (Consolidated Disposition §16).
 *
 * ## The title
 *
 * `nav.learn` is the approved per-locale title and carries the RULED German
 * display label `Verstehen` (`5.351`: canonical ontology stays `Learn`, the
 * route and destination id unchanged, only the German VALUE moved). So the
 * heading resolves the same key the navigation does — no second title string is
 * invented, and none is needed: §18 says "Learn title", and that is it.
 *
 * ## Propless by design
 *
 * Like `CommunityUnavailable`, this takes no slots a caller could use
 * selectively — the three beats render together or not at all, which is how the
 * Legal condition is enforced structurally rather than by convention. `locale`
 * is the way back only.
 *
 * Every string is approved wording transcribed byte-for-byte; nothing here is
 * authored.
 */
export function LearnUnavailable({ locale }: { locale: string }) {
  return (
    <section className={styles.wrap} aria-labelledby="learn-title">
      <span className={styles.icon}>
        <LucideIcon name="book-open" size={26} />
      </span>
      <h1 id="learn-title" className={styles.title}>
        <FormattedMessage id="nav.learn" />
      </h1>
      <p className={styles.explanation}>
        <FormattedMessage id="learn.explainer" />
      </p>
      <p className={styles.availability}>
        <FormattedMessage id="learn.availability" />
      </p>
      <Link href={`/${locale}`} className={styles.action}>
        <LucideIcon name="arrow-left" size={18} />
        <FormattedMessage id="community.action" />
      </Link>
    </section>
  );
}
