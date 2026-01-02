/**
 * Share Redirect Page
 *
 * This page serves as a landing page for shared content with dynamic OG images.
 * When social platforms crawl the shared URL, they get personalized OG metadata.
 * Users who click through are redirected to the main landing page.
 *
 * Usage:
 * - Waitlist: /share?type=waitlist&position=247&name=John
 * - Calculator: /share?type=calculator&amount=125000&years=10&strategy=balanced
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface SharePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    type?: string;
    position?: string;
    name?: string;
    amount?: string;
    years?: string;
    strategy?: string;
    initial?: string;
  }>;
}

/**
 * Generate dynamic metadata based on share type
 */
export async function generateMetadata({
  params,
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const { locale } = await params;
  const search = await searchParams;
  const type = search.type || 'default';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://diboas.com';

  // Build OG image URL
  const ogParams = new URLSearchParams();
  ogParams.set('type', type);

  if (type === 'waitlist') {
    const position = search.position || '1';
    const name = search.name;

    ogParams.set('position', position);
    ogParams.set('locale', locale);
    if (name) {
      ogParams.set('name', name);
    }

    const ogImageUrl = `${baseUrl}/api/og/share?${ogParams.toString()}`;
    const title =
      locale === 'pt-BR'
        ? `Sou #${position} na lista de espera do diBoaS!`
        : locale === 'es'
          ? `Soy #${position} en la lista de espera de diBoaS!`
          : locale === 'de'
            ? `Ich bin #${position} auf der diBoaS Warteliste!`
            : `I'm #${position} on the diBoaS waitlist!`;

    const description =
      locale === 'pt-BR'
        ? 'Junte-se a mim no diBoaS - Liberdade Financeira Simplificada'
        : locale === 'es'
          ? 'Únete a mí en diBoaS - Libertad Financiera Simplificada'
          : locale === 'de'
            ? 'Komm zu mir auf diBoaS - Finanzielle Freiheit Einfach Gemacht'
            : 'Join me on diBoaS - Financial Freedom Made Simple';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${baseUrl}/${locale}/share?${ogParams.toString()}`,
        siteName: 'diBoaS',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }

  if (type === 'calculator') {
    const amount = parseInt(search.amount || '0', 10);
    const years = search.years || '10';
    const strategy = search.strategy;
    const initial = search.initial;

    ogParams.set('amount', amount.toString());
    ogParams.set('years', years);
    ogParams.set('locale', locale);
    if (strategy) {
      ogParams.set('strategy', strategy);
    }
    if (initial) {
      ogParams.set('initial', initial);
    }

    const formattedAmount =
      amount >= 1000000
        ? `$${(amount / 1000000).toFixed(1)}M`
        : amount >= 1000
          ? `$${(amount / 1000).toFixed(0)}K`
          : `$${amount.toLocaleString()}`;

    const ogImageUrl = `${baseUrl}/api/og/share?${ogParams.toString()}`;
    const title =
      locale === 'pt-BR'
        ? `Meu investimento poderia crescer para ${formattedAmount}!`
        : locale === 'es'
          ? `Mi inversión podría crecer a ${formattedAmount}!`
          : locale === 'de'
            ? `Meine Investition könnte auf ${formattedAmount} wachsen!`
            : `My investment could grow to ${formattedAmount}!`;

    const description =
      locale === 'pt-BR'
        ? `Em ${years} anos com o diBoaS Dream Mode Calculator`
        : locale === 'es'
          ? `En ${years} años con la Calculadora Dream Mode de diBoaS`
          : locale === 'de'
            ? `In ${years} Jahren mit dem diBoaS Dream Mode Rechner`
            : `In ${years} years with diBoaS Dream Mode Calculator`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${baseUrl}/${locale}/share?${ogParams.toString()}`,
        siteName: 'diBoaS',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }

  // Default metadata
  return {
    title: 'diBoaS - Financial Freedom Made Simple',
    description:
      'Your money. Your future. One platform. Join the waitlist today.',
    openGraph: {
      title: 'diBoaS - Financial Freedom Made Simple',
      description:
        'Your money. Your future. One platform. Join the waitlist today.',
      type: 'website',
      url: `${baseUrl}/${locale}`,
      siteName: 'diBoaS',
      images: [
        {
          url: `${baseUrl}/api/og/default`,
          width: 1200,
          height: 630,
          alt: 'diBoaS - Financial Freedom Made Simple',
        },
      ],
    },
  };
}

/**
 * Share page component
 * Redirects to the main landing page after metadata is served
 */
export default async function SharePage({ params }: SharePageProps) {
  const { locale } = await params;

  // Redirect to main landing page
  // Note: The redirect happens after metadata generation,
  // so social crawlers will still get the OG metadata
  redirect(`/${locale}`);
}
