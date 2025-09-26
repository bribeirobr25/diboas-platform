/**
 * Benefits Page Product Carousel Configuration
 * 
 * Domain-Driven Design: Benefits-specific carousel configuration
 * Service Agnostic Abstraction: Decoupled from main product carousel
 * No Hardcoded Values: Configurable through interfaces
 */

import type { ProductCarouselSlide, ProductCarouselContent } from './productCarousel';

// Benefits-specific carousel slides
export const BENEFITS_CAROUSEL_SLIDES: ProductCarouselSlide[] = [
  {
    id: 'exclusive-rewards',
    title: 'Exclusive Rewards',
    subtitle: 'Earn points on every transaction and unlock premium perks',
    image: '/assets/socials/real/rewards-with-icon.avif',
    imageAlt: 'Visual representation of rewards and benefits',
    ctaText: 'Explore Rewards',
    ctaHref: '/rewards'
  },
  {
    id: 'financial-freedom',
    title: 'Financial Freedom',
    subtitle: 'Take control with tools designed for your success',
    image: '/assets/socials/real/couple.avif',
    imageAlt: 'Couple enjoying financial freedom',
    ctaText: 'Start Your Journey',
    ctaHref: '/account'
  },
  {
    id: 'smart-investing',
    title: 'Smart Investing',
    subtitle: 'Grow your wealth with intelligent investment options',
    image: '/assets/socials/real/investing-with-icon.avif',
    imageAlt: 'Investment growth visualization',
    ctaText: 'Learn More',
    ctaHref: '/investing'
  },
  {
    id: 'secure-banking',
    title: 'Secure Banking',
    subtitle: 'Bank-grade security with complete transparency',
    image: '/assets/socials/real/secure-with-icon.avif',
    imageAlt: 'Security shield illustration',
    ctaText: 'Security Details',
    ctaHref: '/security'
  }
] as const;

// Benefits carousel content
export const BENEFITS_CAROUSEL_CONTENT: ProductCarouselContent = {
  heading: 'Discover Your Benefits',
  slides: BENEFITS_CAROUSEL_SLIDES
} as const;