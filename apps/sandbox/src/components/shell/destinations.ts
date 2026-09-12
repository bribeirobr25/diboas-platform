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
 * - **Learn** is inert (`no`). F-04 wants it tappable to an explainer, but no
 *   authority-approved explainer copy exists in the four locales; a tab that
 *   navigates to nothing would be the affordance-as-false-claim of
 *   `5.201`/`5.202`. It stays visible and labelled, exactly as it ships today,
 *   and the missing copy is registered rather than invented.
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
