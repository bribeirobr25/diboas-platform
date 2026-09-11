import { CommunityUnavailable } from '@/components/CommunityUnavailable';

/**
 * Community — a destination that is VISIBLE from the start and truthfully
 * unavailable (Shell Spec §9.5/§23, Product `P-QA5`, Brand copy approved by
 * Legal as `L-QA3`).
 *
 * It is a real route, not a disabled tab, because §23 says a controlled
 * unavailable destination *"is usually more informative than a dead icon"* —
 * and because §9.5 forbids both populating it with fake content and silently
 * removing it while public enablement is `WAIT`.
 *
 * Nothing here is gated on a capability: the surface makes no claim that needs
 * one. What is gated is public Community FUNCTIONALITY, which does not exist in
 * any form — there is no feed, no member list and no social object anywhere in
 * this app to switch on.
 */
export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CommunityUnavailable locale={locale} />;
}
