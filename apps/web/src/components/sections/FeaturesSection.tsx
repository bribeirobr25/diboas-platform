'use client';

import React from 'react';
import { FinancialCard, FinancialCardContent, FinancialCardDescription, FinancialCardHeader, FinancialCardTitle, Container, SectionHeader, IconContainer, BankIcon, TrendingUpIcon, CurrencyIcon, CheckIcon } from '@/components/ui';
import { getMascotAsset } from '@/lib/assets';
import { COMMON_CONTENT } from '@/lib/constants/content';
import { getFeatureColors, getConditionalFeatureColor } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@diboas/ui';

export function FeaturesSection() {
  const benefitsList = [
    {
      id: 'banking',
      title: 'Smart Banking',
      subtitle: 'Traditional banking reimagined',
      description: 'Manage your everyday finances with zero-fee transactions, intelligent budgeting, and instant transfers.',
      mascot: 'acqua',
      variant: 'simple' as const,
      color: 'primary',
      icon: <BankIcon />,
      benefitHighlights: ['Zero-fee transfers', 'Smart budgeting', 'Instant payments', 'Multi-currency support'],
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
      icon: <TrendingUpIcon />,
      benefitHighlights: ['AI portfolio optimization', 'Low-fee crypto trading', 'Real-time analytics', 'Risk assessment'],
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
      icon: <CurrencyIcon />,
      benefitHighlights: ['Yield farming', 'Liquidity pools', 'Staking rewards', 'DeFi integrations'],
      cta: 'Explore DeFi'
    }
  ];

  return (
    <section id="features" className="py-20 bg-neutral-50">
      <Container>
        {/* DRY Principle: Use centralized SectionHeader component */}
        <SectionHeader
          title="Your Complete Financial Ecosystem"
          description="Three powerful domains unified in one platform, each powered by AI-driven mascots to guide your financial journey."
          className="mb-16"
          titleClassName="text-primary-600"
        />

        {/* Features Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {benefitsList.map((feature, index) => (
            <FinancialCard 
              key={feature.id}
              variant="elevated"
              className={`relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${
                feature.color === 'primary' ? 'hover:border-primary-200' :
                feature.color === 'purple' ? 'hover:border-secondary-purple-200' :
                'hover:border-secondary-coral-200'
              }`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${getConditionalFeatureColor(feature.color, 'gradient')}`} />
              
              <FinancialCardHeader className="relative pb-4">
                <div className="flex items-start justify-between mb-4">
                  <IconContainer
                    variant={feature.color as any}
                    size="lg"
                    shape="rounded"
                  >
                    {feature.icon}
                  </IconContainer>
                  
                  {/* Mascot */}
                  <div className="relative">
                    <Image
                      src={getMascotAsset(feature.mascot as any, feature.variant as any)}
                      alt={`${feature.mascot} mascot`}
                      width={80}
                      height={80}
                      className="group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                
                <FinancialCardTitle className="text-xl font-bold mb-2">{feature.title}</FinancialCardTitle>
                <FinancialCardDescription className={`font-medium ${getConditionalFeatureColor(feature.color, 'text', '600')}`}>
                  {feature.subtitle}
                </FinancialCardDescription>
              </FinancialCardHeader>
              
              <FinancialCardContent className="relative space-y-6">
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Benefits list */}
                <ul className="space-y-2">
                  {feature.benefitHighlights.map((item) => (
                    <li key={item} className="flex items-center space-x-2 text-sm text-neutral-600">
                      <CheckIcon 
                        className={getConditionalFeatureColor(feature.color, 'text', '500')}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA */}
                <Button 
                  variant="primary" 
                  size="default" 
                  className={feature.color !== 'primary' ? `w-full ${getConditionalFeatureColor(feature.color, 'bg', '500')} ${getConditionalFeatureColor(feature.color, 'hover', '600')}` : 'w-full'}
                >
                  {feature.cta}
                </Button>
              </FinancialCardContent>
            </FinancialCard>
          ))}
        </div>
        
        {/* Bottom CTA - DRY Principle: Use centralized content constants */}
        <div className="text-center mt-16">
          <p className="text-lg text-neutral-600 mb-6">
            Ready to experience the future of finance?
          </p>
          <Button variant="gradient" size="lg">
            {COMMON_CONTENT.CTA_LABELS.GET_STARTED} for Free
          </Button>
        </div>
      </Container>
    </section>
  );
}