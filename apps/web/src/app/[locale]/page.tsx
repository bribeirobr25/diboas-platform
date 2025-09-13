import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import Image from 'next/image';

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
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Financial Freedom <span className="text-teal-600">Made Simple</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl">
                Manage your banking, investing, and DeFi assets all in one place. 
                The future of finance is here, powered by AI-driven insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-teal-700">
                  Get Started Free
                </button>
                <button className="border border-teal-500 text-teal-500 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-teal-50">
                  Learn More
                </button>
              </div>
              <div className="mt-8 text-sm text-gray-500">
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
                  className="mx-auto shadow-2xl rounded-3xl"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Complete <span className="text-teal-600">Financial Ecosystem</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Three powerful domains unified in one platform.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart Banking',
                description: 'Zero-fee transactions, intelligent budgeting, and instant transfers.',
                icon: '/assets/icons/money-flow.avif'
              },
              {
                title: 'Crypto Investing',
                description: 'AI-powered portfolio management with low fees and real-time analytics.',
                icon: '/assets/icons/investing.avif'
              },
              {
                title: 'DeFi Protocols',
                description: 'Access decentralized finance with maximum security and optimal yields.',
                icon: '/assets/icons/safe-money.avif'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                <div className="mb-6">
                  <Image 
                    src={feature.icon} 
                    alt={feature.title} 
                    width={64} 
                    height={64}
                    className="rounded-2xl"
                    style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <button className="text-teal-600 font-medium hover:text-teal-700">
                  Learn More →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Image 
                src="/assets/logos/logo-icon.avif" 
                alt="diBoaS Logo" 
                width={32} 
                height={32} 
                className="rounded-lg"
                style={{ width: 'auto', height: 'auto' }}
              />
              <span className="text-xl font-bold">diBoaS</span>
            </div>
            <p className="text-gray-400 mb-4">
              The future of finance, unified in one platform.
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 diBoaS Platform. All rights reserved. | Current locale: <span className="text-teal-400">{locale}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}