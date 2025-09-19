/**
 * Product Carousel Configuration
 * 
 * Domain-Driven Design: Carousel domain configuration
 * Service Agnostic Abstraction: Decoupled carousel content from presentation
 * Configuration Management: Centralized carousel content and settings
 */

export interface CarouselSlide {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly ctaText?: string;
  readonly ctaHref?: string;
}

export interface CarouselSettings {
  readonly autoPlay: boolean;
  readonly autoPlayInterval: number; // milliseconds
  readonly transitionDuration: number; // milliseconds
  readonly pauseOnHover: boolean;
  readonly enableKeyboard: boolean;
  readonly enableTouch: boolean;
  readonly enableDots: boolean;
  readonly enablePlayPause: boolean;
}

export interface CarouselConfig {
  readonly heading: string;
  readonly slides: CarouselSlide[];
  readonly settings: CarouselSettings;
}

// Configuration Management - Default carousel settings
export const DEFAULT_CAROUSEL_SETTINGS: CarouselSettings = {
  autoPlay: true,
  autoPlayInterval: 3000,
  transitionDuration: 800,
  pauseOnHover: true,
  enableKeyboard: true,
  enableTouch: true,
  enableDots: true,
  enablePlayPause: true,
} as const;

// Default carousel slides
export const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'benefits',
    title: 'diBoaS Benefits',
    subtitle: 'Take control of your Financial life',
    image: '/assets/socials/real/couple.avif',
    imageAlt: 'Dancing couple enjoying financial freedom',
  },
  {
    id: 'rewards',
    title: 'diBoaS Rewards', 
    subtitle: 'Share what is good and grow with your friends',
    image: '/assets/socials/real/group.avif',
    imageAlt: 'Friends celebrating together',
  },
  {
    id: 'business',
    title: 'diBoaS Business',
    subtitle: 'Make your business cash flow generate passive income',
    image: '/assets/socials/real/share.avif',
    imageAlt: 'Business group collaborating',
  }
] as const;

// Default configuration for homepage
export const DEFAULT_CAROUSEL_CONFIG: CarouselConfig = {
  heading: 'OneFi - One App for Everything',
  slides: DEFAULT_CAROUSEL_SLIDES,
  settings: DEFAULT_CAROUSEL_SETTINGS,
} as const;