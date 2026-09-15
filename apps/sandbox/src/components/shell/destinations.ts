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
 * - **Learn** is inert (`no`) — still, but for a NARROWER reason than before
 *   (AUD-B06, 2026-09-14). The explainer copy now EXISTS: handoff §7.1 approved
 *   it in all four locales and it is in the catalogue as `learn.explainer`.
 *   What is still missing is the availability beat. Community's surface needs
 *   four approved strings — title ("Community isn't available yet"),
 *   explanation, availability ("Public access is not open yet.") and an action
 *   — and Legal's `L-QA3` condition is explicit that the explanation must never
 *   render alone "in a way that could be read as a description of an
 *   operational service". Learn's approved title is just "Learn", and its
 *   explainer describes what Learn DOES, so a surface carrying only those two
 *   is precisely that prohibited reading.
 *
 *   So this stays `no` until one availability string is approved in four
 *   locales. It is NOT pushed into `unavailableLabel` either: that is a
 *   resolved string this function has no intl to produce, and a two-sentence
 *   paragraph as a tab's `aria-label` would be an invented screen-reader
 *   anti-pattern. Registered, not invented.
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
      available: 'no',
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
