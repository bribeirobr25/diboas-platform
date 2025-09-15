import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';

export const dynamic = 'auto';

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="main-page-wrapper">
      {/* Blank page - Navigation is in the layout */}
      <div className="min-h-screen bg-white">
        {/* Empty content area */}
      </div>
    </div>
  );
}