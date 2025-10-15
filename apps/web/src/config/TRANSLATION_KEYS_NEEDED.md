# Translation Keys Required for Config Files

This document lists all the translation keys that need to be added to the i18n files for the recently updated config files.

## Files Updated
1. `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/config/appFeaturesCarousel.ts`
2. `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/config/oneFeature.ts`
3. `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/config/benefitsCarousel.ts`

## Translation Keys to Add

### For `marketing.json`

#### App Features Carousel Section
```json
"appFeatures": {
  "sectionTitle": "An app for everything. And everything in the app",
  "organizeMoney": {
    "title": "Organize Your Money",
    "description": "Keep your money organized and aligned with your goals.",
    "ctaText": "Learn about diBoaS",
    "chipLabel": "Descubra Casamentos"
  },
  "instantPayments": {
    "title": "Instant Payments",
    "description": "Pay and receive with speed and convenience anytime, anywhere.",
    "ctaText": "Learn about diBoaS",
    "chipLabel": "Pix realizado"
  },
  "securePurchases": {
    "title": "Secure Purchases",
    "description": "Shop with debit or credit safely and receive real-time notifications in the app.",
    "ctaText": "Learn about diBoaS",
    "chipLabel": "Compra no débito"
  },
  "financialGoals": {
    "title": "Achieve Financial Goals",
    "description": "Get financial help to resolve an emergency or fulfill a dream.",
    "ctaText": "Learn about our loans",
    "chipLabel": "Empréstimo efetuado"
  }
}
```

#### One Feature Section (Security)
```json
"oneFeature": {
  "title": "Sua segurança em primeiro lugar",
  "subtitle": "Conheça nossas ferramentas e canais dedicados à proteção da sua conta",
  "ctaText": "Conheça nossas soluções",
  "features": {
    "fraudReport": "Me Roubaram",
    "reports": "Canal de Denúncias",
    "protection": "Central de Proteção",
    "support": "Canais de Atendimento"
  }
}
```

#### Benefits Carousel Section
```json
"benefits": {
  "exclusiveRewards": {
    "title": "Exclusive Rewards",
    "description": "Earn points on every transaction and unlock premium perks",
    "ctaText": "Explore Rewards"
  },
  "financialFreedom": {
    "title": "Financial Freedom",
    "description": "Take control with tools designed for your success",
    "ctaText": "Start Your Journey"
  },
  "smartInvesting": {
    "title": "Smart Investing",
    "description": "Grow your wealth with intelligent investment options"
  },
  "secureBanking": {
    "title": "Secure Banking",
    "description": "Bank-grade security with complete transparency",
    "ctaText": "Security Details"
  }
}
```

### For `common.json`

No additional keys needed for common.json as `common.buttons.learnMore` and `common.buttons.getStarted` are already being used.

## Translation Pattern Summary

### Key Naming Convention
- Section titles: `marketing.{section}.sectionTitle`
- Card/Slide titles: `marketing.{section}.{item}.title`
- Card/Slide descriptions: `marketing.{section}.{item}.description`
- CTA buttons: `marketing.{section}.{item}.ctaText` or `common.buttons.{action}`
- Feature lists: `marketing.{section}.features.{featureName}`
- Chip labels: `marketing.{section}.{item}.chipLabel`

## Notes for Translation Teams

1. **Mixed Languages**: The `oneFeature` section currently contains Portuguese text. This is intentional based on the original config. Please translate to other languages as needed.

2. **Chip Labels**: The chip labels in `appFeaturesCarousel` are currently in Portuguese and represent status messages like "Pix realizado" (Pix completed). These should remain Portuguese for pt-BR but be translated appropriately for other locales.

3. **CTA Consistency**: When possible, use common button translation keys (e.g., `common.buttons.learnMore`) for consistency across the application.

4. **SEO imageAlt attributes**: These are intentionally left as English strings in the config files as they are primarily for accessibility and SEO purposes. Consider if these should also be translated.

## Files to Update

Add these keys to the following translation files:
- `/Users/simonekugler/Desktop/diboas-platform/packages/i18n/translations/en/marketing.json`
- `/Users/simonekugler/Desktop/diboas-platform/packages/i18n/translations/pt-BR/marketing.json`
- `/Users/simonekugler/Desktop/diboas-platform/packages/i18n/translations/es/marketing.json`
- `/Users/simonekugler/Desktop/diboas-platform/packages/i18n/translations/de/marketing.json`
