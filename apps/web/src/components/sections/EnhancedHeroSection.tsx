'use client';

import React from 'react';
import { Button } from '@diboas/ui';
import { getMascotAsset } from '@/lib/assets';
import { type HeroContent } from '@/lib/content/types';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@diboas/ui';

/**
 * Enhanced Hero Section Component
 * 
 * Reusability: Configurable variants for different page types
 * Accessibility: WCAG 2.1 AA compliant with proper headings
 * Performance: Optimized image loading and animations
 * SEO: Proper heading hierarchy and semantic HTML
 */

interface HeroSectionProps {
  content: HeroContent;
  sectionId?: string;
  locale?: string;
  variant?: 'centered' | 'split' | 'minimal';
  background?: 'gradient' | 'gradient-banking' | 'gradient-investing' | 'gradient-defi' | 'mesh' | 'solid';
  className?: string;
}

// DRY Principle: Variant configurations
const HERO_VARIANTS = {
  centered: {
    container: 'text-center max-w-5xl mx-auto',
    content: 'space-y-8',
    title: 'text-4xl md:text-5xl lg:text-6xl',
    layout: 'single'
  },
  split: {
    container: 'grid lg:grid-cols-2 gap-12 items-center',
    content: 'space-y-8 text-center lg:text-left',
    title: 'text-4xl md:text-5xl lg:text-6xl',
    layout: 'two-column'
  },
  minimal: {
    container: 'text-center max-w-3xl mx-auto',
    content: 'space-y-6',
    title: 'text-3xl md:text-4xl lg:text-5xl',
    layout: 'single'
  }
} as const;

// Semantic Naming: Background style configurations
const BACKGROUND_STYLES = {
  'gradient': 'bg-gradient-to-br from-primary-50 via-white to-primary-100',
  'gradient-banking': 'bg-gradient-to-br from-primary-50 via-primary-25 to-white',
  'gradient-investing': 'bg-gradient-to-br from-secondary-purple-50 via-white to-secondary-purple-25',
  'gradient-defi': 'bg-gradient-to-br from-secondary-coral-50 via-white to-secondary-coral-25',
  'mesh': 'bg-mesh-pattern bg-white',
  'solid': 'bg-white'
} as const;

export function HeroSection({
  content,
  sectionId = 'hero',
  locale = 'en',
  variant = 'centered',
  background = 'gradient',
  className
}: HeroSectionProps) {
  const variantConfig = HERO_VARIANTS[variant];
  const backgroundStyle = BACKGROUND_STYLES[background];

  return (
    <section
      className={cn(
        'relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24',
        backgroundStyle,
        className
      )}
      aria-labelledby={`${sectionId}-title`}
    >
      {/* Background Decorations */}
      <BackgroundDecorations background={background} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={variantConfig.container}>
          {/* Content Column */}
          <div className={variantConfig.content}>
            <HeroContent
              content={content}
              sectionId={sectionId}
              titleClassName={variantConfig.title}
              layout={variantConfig.layout}
              locale={locale}
            />
          </div>

          {/* Visual Column (for split layout) */}
          {variant === 'split' && (
            <HeroVisual
              content={content}
              sectionId={sectionId}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// File Decoupling: Separate hero content component
function HeroContent({
  content,
  sectionId,
  titleClassName,
  layout,
  locale
}: {
  content: HeroContent;
  sectionId: string;
  titleClassName: string;
  layout: string;
  locale: string;
}) {
  return (
    <>
      {/* Main Heading */}
      <div className="space-y-4">
        <h1
          id={`${sectionId}-title`}
          className={cn(
            'font-bold text-neutral-900 leading-tight tracking-tight',
            titleClassName
          )}
        >
          {content.title}
        </h1>

        {content.subtitle && (
          <p className="text-xl md:text-2xl font-semibold text-primary-600">
            {content.subtitle}
          </p>
        )}

        {content.description && (
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            {content.description}
          </p>
        )}
      </div>

      {/* Call-to-Action Buttons */}
      {content.cta && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          {content.cta.primary && (
            <Link href={content.cta.primary.href} aria-describedby={content.cta.primary.href.startsWith('#') ? undefined : 'external-link-desc'} className="inline-block">
              <Button
                variant="gradient"
                size="xl"
                className="animate-pulse-glow"
              >
                {content.cta.primary.text}
              </Button>
            </Link>
          )}

          {content.cta.secondary && (
            <Link href={content.cta.secondary.href} className="inline-block">
              <Button
                variant="outline"
                size="xl"
              >
                {content.cta.secondary.text}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Trust Indicators */}
      {content.trustIndicators && (
        <TrustIndicators
          indicators={content.trustIndicators}
          layout={layout}
        />
      )}

      {/* Accessibility: External link description */}
      <span id="external-link-desc" className="sr-only">
        Opens in the same tab
      </span>
    </>
  );
}

// Performance: Separate visual component for code splitting
function HeroVisual({ content, sectionId }: { content: HeroContent; sectionId: string }) {
  return (
    <div className="relative">
      {/* Phone/Device Mockup */}
      <div className="relative z-10 mx-auto max-w-sm lg:max-w-md">
        {/* Background decoration for visual */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-20 animate-bounce-gentle" />

        {/* Main visual content */}
        {content.backgroundImage ? (
          <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl p-4 overflow-hidden">
            <Image
              src={content.backgroundImage}
              alt=""
              width={400}
              height={600}
              className="w-full h-auto rounded-2xl"
              priority
            />
          </div>
        ) : (
          <PhoneMockup sectionId={sectionId} />
        )}
      </div>

      {/* Mascot */}
      {content.mascot && (
        <div className="absolute -bottom-4 -right-4 z-20">
          <div className="relative">
            <Image
              src={getMascotAsset(content.mascot.type, content.mascot.variant || 'flying')}
              alt={`${content.mascot.type} mascot`}
              width={120}
              height={120}
              className={cn(
                content.mascot.animation === 'bounce' && 'animate-bounce-gentle',
                content.mascot.animation === 'float' && 'animate-pulse-glow'
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Code Reusability: Trust indicators component
function TrustIndicators({
  indicators,
  layout
}: {
  indicators: NonNullable<HeroContent['trustIndicators']>;
  layout: string;
}) {
  return (
    <div className="pt-8 space-y-2">
      {indicators.users && (
        <p className="text-sm text-neutral-500 font-medium">
          {indicators.users}
        </p>
      )}

      <div className={cn(
        'flex items-center space-x-1',
        layout === 'single' ? 'justify-center' : 'justify-center lg:justify-start'
      )}>
        {/* Star Rating */}
        {indicators.rating && (
          <>
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-5 h-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-neutral-600" aria-label="Rating">
              {indicators.rating}
            </span>
          </>
        )}

        {indicators.security && (
          <>
            <span className="text-neutral-300 mx-2" aria-hidden="true">•</span>
            <span className="text-sm text-neutral-600">
              {indicators.security}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Background decorations component
function BackgroundDecorations({ background }: { background: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-300/20 rounded-full blur-2xl" />

      {background.includes('investing') && (
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-secondary-purple-200/20 rounded-full blur-2xl" />
      )}

      {background.includes('defi') && (
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-secondary-coral-200/20 rounded-full blur-2xl" />
      )}
    </>
  );
}

// Phone mockup component (reused from current implementation)
function PhoneMockup({ sectionId }: { sectionId: string }) {
  return (
    <div className="relative bg-neutral-900 rounded-3xl p-2 shadow-2xl">
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-neutral-900 h-6 rounded-t-2xl flex items-center justify-center">
          <div className="w-16 h-1 bg-white rounded-full opacity-60" />
        </div>

        {/* App content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Portfolio</h3>
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-primary-500 rounded-full" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-neutral-500">Total Balance</p>
            <p className="text-3xl font-bold text-neutral-900">$12,480</p>
            <p className="text-sm text-semantic-success font-medium">+8.1% all time</p>
          </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}