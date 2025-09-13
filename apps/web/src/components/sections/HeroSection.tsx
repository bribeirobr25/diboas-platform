'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { getMascotAsset, getLandingAsset } from '@/lib/assets';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 pt-20 pb-16 md:pt-32 md:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-300/20 rounded-full blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                <span className="text-primary-600">Financial Freedom</span>
                <br />
                Made Simple
              </h1>
              <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto lg:mx-0">
                Manage your banking, investing, and DeFi assets all in one place.
                The future of finance is here, powered by AI-driven insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="gradient"
                size="xl"
                className="animate-pulse-glow"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="xl"
              >
                Learn More
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 space-y-2">
              <p className="text-sm text-neutral-500 font-medium">
                Trusted by 50,000+ users worldwide
              </p>
              <div className="flex items-center justify-center lg:justify-start space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-neutral-600">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Phone mockup container */}
            <div className="relative z-10 mx-auto max-w-sm lg:max-w-md">
              {/* Background decoration for phone */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-20 animate-bounce-gentle" />

              {/* Phone mockup */}
              <div className="relative bg-neutral-900 rounded-3xl p-2 shadow-2xl">
                <div className="bg-white rounded-2xl overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-neutral-900 h-6 rounded-t-2xl flex items-center justify-center">
                    <div className="w-16 h-1 bg-white rounded-full opacity-60" />
                  </div>

                  {/* App content */}
                  <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900">Portfolio</h3>
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary-500 rounded-full" />
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="text-center">
                      <p className="text-sm text-neutral-500">Total Balance</p>
                      <p className="text-3xl font-bold text-neutral-900">$12,480</p>
                      <p className="text-sm text-semantic-success font-medium">+8.1% all time</p>
                    </div>

                    {/* Chart placeholder */}
                    <div className="h-24 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-end justify-center p-2">
                      <div className="flex items-end space-x-1 h-full">
                        {[60, 80, 40, 90, 70, 85, 95].map((height, i) => (
                          <div
                            key={i}
                            className="bg-primary-500 rounded-t-sm w-2"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Recent activity */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-neutral-700">Recent Activity</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-primary-500 rounded" />
                            </div>
                            <span className="text-sm text-neutral-700">Bitcoin</span>
                          </div>
                          <span className="text-sm font-medium text-neutral-900">+$500</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-secondary-purple-100 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 bg-secondary-purple-500 rounded" />
                            </div>
                            <span className="text-sm text-neutral-700">Ethereum</span>
                          </div>
                          <span className="text-sm font-medium text-neutral-900">+$200</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acqua mascot */}
            <div className="absolute -bottom-4 -right-4 z-20">
              <div className="relative">
                <Image
                  src={getMascotAsset('acqua', 'flying')}
                  alt="Acqua mascot"
                  width={120}
                  height={120}
                  className="animate-bounce-gentle"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}