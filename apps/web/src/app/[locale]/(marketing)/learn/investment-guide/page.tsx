import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
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
  return generateStaticPageMetadata('learn/investment-guide', locale as SupportedLocale);
}

export default async function InvestmentGuidePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <StaticPageTemplate pageKey="learn/investment-guide" locale={locale} />
  );
}