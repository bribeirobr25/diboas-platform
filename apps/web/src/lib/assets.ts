/**
 * diBoaS Asset Management - Single Source of Truth
 * 
 * IMPORTANT: This contains ONLY path definitions (strings), not actual files.
 * Physical files exist once in /public/assets/
 * 
 * SEMANTIC NAMING CONVENTION:
 * 
 * Icons: {domain}-{action}-{variant}.avif
 * - financial-buy-action.avif (general financial purchases)
 * - crypto-buy-interface.avif (crypto-specific purchase UI)
 * - investment-buy-stocks.avif (stock investment purchases)
 * - money-outflow-transaction.avif (transaction flows)
 * - learn-advanced-course.avif (education content)
 * - rewards-medal-bronze.avif (achievement levels)
 * 
 * Inspiration Assets: {platform}-{section}-{content}.png
 * - desktop-menu-expanded.png (desktop navigation states)
 * - mobile-account-hero.png (mobile page sections)
 * - desktop-account-hero.png (desktop page sections)
 * 
 * Mascots: mascot-{type}-{expression}.avif
 * - mascot-acqua-basic.avif (default state)
 * - mascot-coral-celebrating.avif (emotional states)
 * - mascot-mystic-flying.avif (action states)
 * 
 * Navigation: {page}-banner.avif
 * - about-banner.avif (page-specific banners)
 * - security-banner.avif (domain-specific content)
 * 
 * This convention ensures:
 * - Self-documenting file names
 * - Domain context preservation  
 * - Easy asset discovery
 * - Consistent organization
 * - No ambiguous naming
 */

export const DIBOAS_ASSET_PATHS = {
  // Icons - Small UI elements, symbols, interface graphics
  icons: {
    card: '/assets/icons/card.avif',
    charGrowing: '/assets/icons/char-growing.avif',
    charGrowing2: '/assets/icons/char-growing2.avif',
    chartGrowing3: '/assets/icons/chart-growing3.avif',
    financialBuyAction: '/assets/icons/financial-buy-action.avif',
    cryptoBuyInterface: '/assets/icons/crypto-buy-interface.avif',
    investmentBuyStocks: '/assets/icons/investment-buy-stocks.avif',
    investing: '/assets/icons/investing.avif',
    learn: '/assets/icons/learn.avif',
    learnAdvancedCourse: '/assets/icons/learn-advanced-course.avif',
    learnCertificate: '/assets/icons/learn-certificate.avif',
    learnLamp: '/assets/icons/learn-lamp.avif',
    learnLaptop: '/assets/icons/learn-laptop.avif',
    learnQuestion: '/assets/icons/learn-question.avif',
    learnRead: '/assets/icons/learn-read.avif',
    learnVideo: '/assets/icons/learn-video.avif',
    moneyCircle: '/assets/icons/money-circle.avif',
    moneyFlow: '/assets/icons/money-flow.avif',
    moneyFlow2: '/assets/icons/money-flow2.avif',
    moneyOut: '/assets/icons/money-out.avif',
    moneyOut2: '/assets/icons/money-out2.avif',
    moneyOutflowTransaction: '/assets/icons/money-outflow-transaction.avif',
    rewardsBox: '/assets/icons/rewards-box.avif',
    rewardsMedal: '/assets/icons/rewards-medal.avif',
    rewardsMedalBronze: '/assets/icons/rewards-medal-bronze.avif',
    rewardsTrophy: '/assets/icons/rewards-trophy.avif',
    rewardsTrophy2: '/assets/icons/rewards-trophy2.avif',
    safeMoney: '/assets/icons/safe-money.avif',
  },

  // Images - Larger graphics, photos, illustrations
  mascots: {
    acqua: {
      basic: '/assets/mascots/acqua/mascot-acqua-basic.avif',
      cute: '/assets/mascots/acqua/mascot-acqua-cute.avif',
      hello: '/assets/mascots/acqua/mascot-acqua-hello.avif',
      simple: '/assets/landing/mascot-acqua-simple.avif',
      full: '/assets/landing/mascot-acqua.avif',
      flying: '/assets/landing/mascot-acqua-flying.avif',
      flying2: '/assets/landing/mascot-acqua-flying2.avif'
    },
    mystic: {
      basic: '/assets/mascots/mystic/mascot-mystic-basic.avif',
      flying: '/assets/mascots/mystic/mascot-mystic-flying.avif',
      simple: '/assets/landing/mascot-mystic-simple.avif'
    },
    coral: {
      basic: '/assets/mascots/coral/mascot-coral-basic.avif',
      celebrating: '/assets/mascots/coral/mascot-coral-celebrating.avif',
      flying: '/assets/mascots/coral/mascot-coral-flying.avif',
      hello: '/assets/mascots/coral/mascot-coral-hello.avif',
      smiling: '/assets/mascots/coral/mascot-coral-smiling.avif',
      simple: '/assets/landing/mascot-coral-simple.avif',
      learn: '/assets/landing/mascot-coral-learn.avif'
    }
  },

  logos: {
    primary: '/assets/logos/logo-wordmark.avif',
    icon: '/assets/logos/logo-icon.avif',
    b2b: {
      wordmark: '/assets/logos/logo-wordmark-b2b.avif',
      icon: '/assets/logos/logo-icon-b2b.avif'
    }
  },

  landing: {
    badgeAcqua: '/assets/landing/badge-acqua.avif',
    bgCircleAcqua: '/assets/landing/bg-circle-acqua.avif',
    chartAcqua: '/assets/landing/chart-acqua.avif',
    defiAcqua: '/assets/landing/defi-acqua.avif',
    phoneAccount: '/assets/landing/phone-account.avif',
    vaultSecurity: '/assets/landing/vault-security.avif'
  },

  navigation: {
    aboutBanner: '/assets/navigation/about-banner.avif',
    businessBanner: '/assets/navigation/business-banner.avif',
    businessBanner2: '/assets/navigation/business-banner2.avif',
    diboasBanner: '/assets/navigation/diboas-banner.avif',
    learnBanner: '/assets/navigation/learn-banner.avif',
    rewardsBanner: '/assets/navigation/rewards-banner.avif',
    securityBanner: '/assets/navigation/security-banner.avif'
  },

  socials: {
    real: {
      couple: '/assets/socials/real/life_couple.avif',
      family: '/assets/socials/real/life_bike.avif',
      friends: '/assets/socials/real/life_friends.avif',
      growth: '/assets/socials/real/life_happy_jumping.avif',
      happy: '/assets/socials/real/rewards_happy.avif'
    },
    drawing: {
      balanceCard: '/assets/socials/drawing/phone-balance-breakdown.avif',
      architecture: '/assets/socials/drawing/phone-dashboard.avif',
      mascots: '/assets/socials/drawing/banner-mascots-hello-black-white.avif',
      security: '/assets/socials/drawing/safe.avif'
    }
  }
} as const;

// Helper functions for type-safe asset retrieval
export const getMascotAsset = (
  mascot: 'acqua' | 'mystic' | 'coral',
  variant: 'basic' | 'simple' | 'cute' | 'hello' | 'flying' | 'flying2' | 'learn' | 'full' | 'celebrating' | 'smiling' = 'basic'
): string => {
  return DIBOAS_ASSET_PATHS.mascots[mascot]?.[variant as keyof typeof DIBOAS_ASSET_PATHS.mascots[typeof mascot]] || DIBOAS_ASSET_PATHS.mascots[mascot]?.basic || '';
};

export const getLogoAsset = (
  type: 'primary' | 'icon' | 'b2b',
  variant?: 'wordmark' | 'icon'
): string => {
  if (type === 'b2b' && variant) {
    return DIBOAS_ASSET_PATHS.logos.b2b[variant] || '';
  }
  return DIBOAS_ASSET_PATHS.logos[type as 'primary' | 'icon'] || '';
};

export const getIconAsset = (iconName: keyof typeof DIBOAS_ASSET_PATHS.icons): string => {
  return DIBOAS_ASSET_PATHS.icons[iconName] || '';
};

export const getLandingAsset = (assetName: keyof typeof DIBOAS_ASSET_PATHS.landing): string => {
  return DIBOAS_ASSET_PATHS.landing[assetName] || '';
};

export const getNavigationAsset = (page: string): string => {
  const key = `${page}Banner` as keyof typeof DIBOAS_ASSET_PATHS.navigation;
  return DIBOAS_ASSET_PATHS.navigation[key] || '';
};

export const getSocialAsset = (
  category: 'real' | 'drawing',
  assetName: string
): string => {
  return DIBOAS_ASSET_PATHS.socials[category]?.[assetName as keyof typeof DIBOAS_ASSET_PATHS.socials[typeof category]] || '';
};