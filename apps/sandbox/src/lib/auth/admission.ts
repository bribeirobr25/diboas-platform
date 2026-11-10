import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthProvider } from './factory';

/**
 * The onboarding pages a visitor returns to after the gate (founder B15, register 5.522). An
 * allow-list: the return target is a NAME from this list, never a path taken from the request,
 * so the gate cannot be turned into an open redirect.
 */
export const GATE_RETURN_PAGES = ['consent', 'claim'] as const;
export type GateReturnPage = (typeof GATE_RETURN_PAGES)[number];

export function isGateReturnPage(value: unknown): value is GateReturnPage {
  return (GATE_RETURN_PAGES as readonly unknown[]).includes(value);
}

/**
 * The one "who may enter" check (Principle 3; SHELL duty 1), shared by the protected `(app)`
 * layout, the gated onboarding pages and their server actions (F22: a data-producing route or
 * action checks too, never relying on a layout). Fail-closed: no valid grant → the gate, then
 * back to `returnTo` once admitted. While the app is public every visitor holds a grant, so this
 * changes nothing (C1). `locale` must already be allow-listed by the caller.
 */
export async function requireAdmission(locale: string, returnTo?: GateReturnPage): Promise<void> {
  const auth = getAuthProvider();
  const cookieStore = await cookies();
  if (!auth.verifySession(cookieStore.get(auth.sessionCookieName)?.value)) {
    redirect(returnTo ? `/${locale}/gate?next=${returnTo}` : `/${locale}/gate`);
  }
}
