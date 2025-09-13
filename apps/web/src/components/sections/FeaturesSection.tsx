'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { getMascotAsset } from '@/lib/assets';
import Image from 'next/image';

export function FeaturesSection() {
  const features = [
    {
      id: 'banking',
      title: 'Smart Banking',
      subtitle: 'Traditional banking reimagined',
      description: 'Manage your everyday finances with zero-fee transactions, intelligent budgeting, and instant transfers.',
      mascot: 'acqua',
      variant: 'simple' as const,
      color: 'primary',
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      features: ['Zero-fee transfers', 'Smart budgeting', 'Instant payments', 'Multi-currency support'],
      cta: 'Start Banking'
    },
    {
      id: 'investing',
      title: 'Crypto Investing',
      subtitle: 'Invest with confidence',
      description: 'Access a wide range of cryptocurrencies and traditional assets with AI-powered portfolio management.',
      mascot: 'mystic',
      variant: 'simple' as const,
      color: 'purple',
      icon: (
        <svg className="w-8 h-8 text-secondary-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      features: ['AI portfolio optimization', 'Low-fee crypto trading', 'Real-time analytics', 'Risk assessment'],
      cta: 'Start Investing'
    },
    {
      id: 'defi',
      title: 'DeFi Protocols',
      subtitle: 'Decentralized finance',
      description: 'Earn interest and access DeFi services directly through our platform with maximum security.',
      mascot: 'coral',
      variant: 'simple' as const,
      color: 'coral',
      icon: (
        <svg className="w-8 h-8 text-secondary-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      features: ['Yield farming', 'Liquidity pools', 'Staking rewards', 'DeFi integrations'],
      cta: 'Explore DeFi'
    }
  ];

  return (
    <section id="features" className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            Your Complete <span className="text-primary-600">Financial Ecosystem</span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto">
            Three powerful domains unified in one platform, each powered by AI-driven mascots to guide your financial journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.id}
              variant="elevated"
              className={`relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${
                feature.color === 'primary' ? 'hover:border-primary-200' :
                feature.color === 'purple' ? 'hover:border-secondary-purple-200' :
                'hover:border-secondary-coral-200'
              }`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${
                feature.color === 'primary' ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                feature.color === 'purple' ? 'bg-gradient-to-br from-secondary-purple-500 to-secondary-purple-600' :
                'bg-gradient-to-br from-secondary-coral-500 to-secondary-coral-600'
              }`} />
              
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${
                    feature.color === 'primary' ? 'bg-primary-100' :
                    feature.color === 'purple' ? 'bg-secondary-purple-100' :
                    'bg-secondary-coral-100'
                  }`}>
                    {feature.icon}
                  </div>
                  
                  {/* Mascot */}
                  <div className="relative">
                    <Image
                      src={getMascotAsset(feature.mascot, feature.variant)}
                      alt={`${feature.mascot} mascot`}
                      width={80}
                      height={80}
                      className="group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                
                <CardTitle className="text-xl font-bold mb-2">{feature.title}</CardTitle>
                <CardDescription className={`font-medium ${
                  feature.color === 'primary' ? 'text-primary-600' :
                  feature.color === 'purple' ? 'text-secondary-purple-600' :
                  'text-secondary-coral-600'
                }`}>
                  {feature.subtitle}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Features list */}
                <ul className="space-y-2">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center space-x-2 text-sm text-neutral-600">
                      <svg className={`w-4 h-4 ${
                        feature.color === 'primary' ? 'text-primary-500' :
                        feature.color === 'purple' ? 'text-secondary-purple-500' :
                        'text-secondary-coral-500'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA */}
                <button className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  feature.color === 'primary' ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg' :
                  feature.color === 'purple' ? 'bg-secondary-purple-500 hover:bg-secondary-purple-600 text-white shadow-md hover:shadow-lg' :
                  'bg-secondary-coral-500 hover:bg-secondary-coral-600 text-white shadow-md hover:shadow-lg'
                }`}>
                  {feature.cta}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-neutral-600 mb-6">
            Ready to experience the future of finance?
          </p>
          <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            Get Started for Free
          </button>
        </div>
      </div>
    </section>
  );
}