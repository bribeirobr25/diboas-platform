import { redirect } from 'next/navigation';
import { isPublicAccess } from '@/lib/gate';
import { GateForm } from './GateForm';

/**
 * The shared-password gate (MVP-0). When the app is public
 * (`SANDBOX_PUBLIC_ACCESS=true`) this route has nothing to ask for, so it sends
 * the visitor to the real front door instead of showing a password field that
 * grants nothing — a form that does not gate anything is a fake control.
 */
export default async function GatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (isPublicAccess()) redirect(`/${locale}/welcome`);
  return <GateForm />;
}
