import { notFound } from 'next/navigation'; // prevents rendering content for ANY UR security protection
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import Image from 'next/image';
import { Button } from '@diboas/ui';
import { SectionWrapper, TwoColumnGrid, SectionHeader } from '@/components/UI';

// Use static generation for better performance  
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

      {/* Hero Section */}
      <SectionWrapper background="gradient">
        <TwoColumnGrid>
          <div className="hero-content">
            <SectionHeader
              title="Financial Freedom Made Simple"
              description="Manage your banking, investing, and DeFi assets all in one place. The future of finance is here, powered by AI-driven insights."
              size="xl"
              alignment="left"
              className="mb-8"
              titleClassName="text-gray-900"
            />
            <div className="hero-actions">
              <Button variant="gradient" size="lg">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
            <div className="hero-trust">
              Trusted by 50,000+ users worldwide • ⭐⭐⭐⭐⭐ 4.9/5 rating
            </div>
          </div>

          <div className="relative">
            {/* Mascot */}
            <div className="absolute -top-4 -right-4 z-10">
              <Image
                src="/assets/mascots/acqua/mascot-acqua-hello.avif"
                alt="Acqua Mascot"
                width={120}
                height={120}
                className="animate-bounce-gentle"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>

            {/* Phone Mockup */}
            <div className="relative">
              <Image
                src="/assets/landing/phone-account.avif"
                alt="diBoaS App Preview"
                width={300}
                height={600}
                className="hero-image"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
          </div>
        </TwoColumnGrid>
      </SectionWrapper>

    </div>
  );
}