import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { generateStaticPageMetadata } from '@/lib/seo';
import { StaticPageTemplate } from '@/components/Pages/StaticPageTemplate';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('rewards/token-airdrop', locale as SupportedLocale);
}

export default async function TokenAirdropPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <StaticPageTemplate pageKey="rewards/token-airdrop" locale={locale} />
  );
}
