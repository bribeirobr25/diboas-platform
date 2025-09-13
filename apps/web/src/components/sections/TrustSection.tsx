'use client';

import React from 'react';
import { FinancialCard, FinancialCardContent } from '@/components/ui';
import { getLandingAsset } from '@/lib/assets';
import Image from 'next/image';

export function TrustSection() {
  const trustFeatures = [
    {
      title: 'Bank-Level Security',
      description: 'Your funds are protected by the same security standards used by traditional banks.',
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Regulatory Compliance',
      description: 'Fully compliant with financial regulations and data protection standards.',
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Zero-Trust Architecture',
      description: 'Advanced security protocols that verify every transaction and user action.',
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: '24/7 Monitoring',
      description: 'Continuous monitoring and fraud detection to keep your assets safe.',
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    }
  ];

  const stats = [
    { number: '99.9%', label: 'Uptime guarantee' },
    { number: '$500M+', label: 'Assets secured' },
    { number: '50K+', label: 'Trusted users' },
    { number: '256-bit', label: 'Encryption standard' }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            Your Security is <span className="text-primary-600">Our Priority</span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto">
            Built with enterprise-grade security and zero-trust architecture to protect your financial future.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Visual */}
          <div className="relative">
            <div className="relative max-w-lg mx-auto">
              {/* Vault security image */}
              <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/10" />
                <Image
                  src={getLandingAsset('vaultSecurity')}
                  alt="Vault Security"
                  width={400}
                  height={300}
                  className="relative z-10 w-full h-auto rounded-2xl"
                />
              </div>
              
              {/* Floating security badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg border border-neutral-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-semantic-success rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-neutral-900">Secure</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-lg border border-neutral-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-neutral-900">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="space-y-8">
            <div className="grid gap-6">
              {trustFeatures.map((feature, index) => (
                <FinancialCard key={index} variant="outlined" className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary-100 rounded-2xl">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </FinancialCard>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 pt-16 border-t border-neutral-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-neutral-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-16 pt-12 border-t border-neutral-200">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Certified & Compliant
            </h3>
            <p className="text-neutral-600">
              We maintain the highest standards of security and compliance
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {/* Placeholder for security badges */}
            <div className="bg-neutral-100 rounded-lg px-6 py-4 text-sm font-medium text-neutral-600">
              SOC 2 Compliant
            </div>
            <div className="bg-neutral-100 rounded-lg px-6 py-4 text-sm font-medium text-neutral-600">
              ISO 27001
            </div>
            <div className="bg-neutral-100 rounded-lg px-6 py-4 text-sm font-medium text-neutral-600">
              GDPR Compliant
            </div>
            <div className="bg-neutral-100 rounded-lg px-6 py-4 text-sm font-medium text-neutral-600">
              PCI DSS Level 1
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}