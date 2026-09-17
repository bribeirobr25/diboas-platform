import { LearnUnavailable } from '@/components/LearnUnavailable';

/**
 * Learn — a destination that is visible from the start and truthfully
 * unavailable (`5.349`, Execution Rulings §18; Shell Spec §9.4/§23).
 *
 * It is a real route rather than a disabled tab for the same reason Community
 * is: §23 holds that a controlled unavailable destination *"is usually more
 * informative than a dead icon"*. Learn stayed inert only because the
 * availability line did not exist in four locales — rendering the explainer
 * under a "Learn" title alone would have read as a description of an
 * operational service, which Legal's `L-QA3` forbids. §18 supplies the line, so
 * the honest surface replaces the inert tab.
 *
 * Nothing here is gated on a capability: the surface makes no claim that needs
 * one. What does not exist is Learn FUNCTIONALITY — there are no lessons,
 * no progress and no content object anywhere in this app to switch on.
 */
export default async function LearnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LearnUnavailable locale={locale} />;
}
