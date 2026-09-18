import type { Destination } from './BottomNavigation';

/**
 * The five canonical destinations, in the canonical order (Shell Spec §8/§10,
 * Minimum UI §10.5):
 *
 *   Home · Goals · Move · Learn · Community
 *
 * §10 reads them as five INTENTS — orient · plan · move · understand · belong —
 * which is why the set is closed, and why Profile and Alerts are header
 * utilities (§11.1/§11.2) while Weekly, History, Rules, Month, Practice Record
 * and the Time Machine are retained capabilities whose placement §11.3/§11.4
 * leaves open.
 *
 * Availability is declared per destination, and the two unavailable ones are
 * unavailable in DIFFERENT ways:
 *
 * - **Community** navigates (`yes`) to its controlled unavailable surface,
 *   carrying the Legal-approved explanation (§9.5/§23, `P-QA5`/`L-QA3`). §23
 *   prefers exactly this over *"an unexplained dead icon"*.
 * - **Learn** now navigates (`yes`) to its own controlled unavailable surface
 *   too, resolving `5.349` and `5.288`. It was inert for one reason only: the
 *   availability beat did not exist. handoff §7.1 had approved the explainer
 *   (`learn.explainer`, four locales) but Legal's `L-QA3` forbids rendering the
 *   explanation alone "in a way that could be read as a description of an
 *   operational service" — and title + explainer alone IS that reading.
 *   Execution Rulings §18 supplies the missing line ("This area isn't available
 *   yet.") in all four locales, so `LearnUnavailable` composes the three beats
 *   §18 requires — Learn title + approved explainer + availability line — and
 *   the inert tab is gone.
 *
 *   ⚑ That also dissolves the `5.288` rider rather than working around it: an
 *   inert label could not be signalled by reduced contrast in both appearances
 *   (measured 2.13:1 light / 2.78:1 dark at `opacity: 0.55`), and a destination
 *   that navigates needs no "unavailable" styling at all.
 *
 *   ⚑ The German title question is RULED (Product, 2026-09-15, `5.351`): the
 *   canonical ontology stays **Learn**, the DE DISPLAY LABEL is **Verstehen**
 *   ("Lernen" superseded for the label only), and the ROUTE / DESTINATION ID is
 *   UNCHANGED with no Product IA change. So `labelId` below still resolves
 *   `nav.learn` and this `surface: 'learn'` is untouched — only the German
 *   VALUE of that key moved. This comment previously said the question was
 *   "Product's call"; it has been made, and leaving that sentence standing
 *   would be the `5.358` defect class (prose denying a ruled state).
 */
export function destinationsFor(locale: string): readonly Destination[] {
  const at = (path: string) => `/${locale}${path}`;
  return [
    { surface: '', href: at(''), icon: 'home', labelId: 'nav.home', available: 'yes' },
    {
      surface: 'goals',
      href: at('/goals'),
      icon: 'target',
      labelId: 'nav.goals',
      available: 'yes',
    },
    {
      surface: 'move',
      href: at('/move'),
      icon: 'arrow-right-left',
      labelId: 'nav.move',
      available: 'yes',
    },
    {
      surface: 'learn',
      href: at('/learn'),
      icon: 'book-open',
      labelId: 'nav.learn',
      available: 'yes',
    },
    {
      surface: 'community',
      href: at('/community'),
      icon: 'users',
      labelId: 'nav.community',
      available: 'yes',
    },
  ];
}
