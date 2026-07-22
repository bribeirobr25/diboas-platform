import { HomeGate } from '@/components/HomeGate';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <HomeGate locale={locale} />;
}
