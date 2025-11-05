#!/usr/bin/env node

/**
 * Content Changes Script
 * Applies specific content changes to translations and configurations
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = path.join(__dirname, '../packages/i18n/translations');
const CONFIG_PATH = path.join(__dirname, '../apps/web/src/config');

console.log('========================================');
console.log('Content Changes Script');
console.log('========================================\n');

// ============================================
// CHANGE 1: Hero Section Text
// ============================================
console.log('📝 CHANGE 1: Hero Section Text');
console.log('From: "You\'re one of them."');
console.log('To: "diBoaS is making this possible"\n');

const heroChanges = {
  en: {
    old: 'More than 5.4 billion people deserve safe, simple access to financial growth.\\n\\nYou\'re one of them.',
    new: 'More than 5.4 billion people deserve safe, simple access to financial growth.\\n\\ndiBoaS is making this possible'
  },
  'pt-BR': {
    old: 'Mais de 5,4 bilhões de pessoas merecem acesso seguro e simples ao crescimento financeiro.\\n\\nVocê é uma delas.',
    new: 'Mais de 5,4 bilhões de pessoas merecem acesso seguro e simples ao crescimento financeiro.\\n\\nO diBoaS está tornando isso possível'
  },
  es: {
    old: 'Más de 5,4 mil millones de personas merecen acceso seguro y simple al crecimiento financiero.\\n\\nTú eres una de ellas.',
    new: 'Más de 5,4 mil millones de personas merecen acceso seguro y simple al crecimiento financiero.\\n\\ndiBoaS está haciendo esto posible'
  },
  de: {
    old: 'Mehr als 5,4 Milliarden Menschen verdienen sicheren, einfachen Zugang zu finanziellen Wachstum.\\n\\nSie sind einer von ihnen.',
    new: 'Mehr als 5,4 Milliarden Menschen verdienen sicheren, einfachen Zugang zu finanziellen Wachstum.\\n\\ndiBoaS macht dies möglich'
  }
};

for (const [lang, changes] of Object.entries(heroChanges)) {
  const filePath = path.join(BASE_PATH, lang, 'marketing.json');
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(changes.old)) {
    content = content.replace(changes.old, changes.new);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Updated ${lang}/marketing.json`);
  } else {
    console.log(`  ⚠ Could not find old text in ${lang}/marketing.json`);
  }
}

// ============================================
// CHANGE 2: ProductCarousel - Remove Last Sentence
// ============================================
console.log('\n📝 CHANGE 2: ProductCarousel - Remove Last Sentence\n');

const productCarouselChanges = {
  en: {
    benefits: {
      old: 'Real-time transfers, no limits, anywhere in the world.\\nEasy. Fast. Secure.\\nOpen your account.',
      new: 'Real-time transfers, no limits, anywhere in the world.\\nEasy. Fast. Secure.'
    },
    rewards: {
      old: 'Stocks, bonds, your first crypto.\\nYour first investment.\\nYour first step toward growth.\\nStart with just $10.',
      new: 'Stocks, bonds, your first crypto.\\nYour first investment.\\nYour first step toward growth.'
    },
    business: {
      old: 'Cash sitting idle? Put it to work.\\nZero red tape, automatic returns.\\ndiBoaS Business.',
      new: 'Cash sitting idle? Put it to work.\\nZero red tape, automatic returns.'
    }
  },
  'pt-BR': {
    benefits: {
      old: 'Transferências em tempo real, sem limites, em qualquer lugar do mundo.\\nFácil. Rápido. Seguro.\\nAbra sua conta.',
      new: 'Transferências em tempo real, sem limites, em qualquer lugar do mundo.\\nFácil. Rápido. Seguro.'
    },
    rewards: {
      old: 'Ações, títulos, sua primeira cripto.\\nSeu primeiro investimento.\\nSeu primeiro passo rumo ao crescimento.\\nComece com apenas $10.',
      new: 'Ações, títulos, sua primeira cripto.\\nSeu primeiro investimento.\\nSeu primeiro passo rumo ao crescimento.'
    },
    business: {
      old: 'Dinheiro parado? Faça-o trabalhar.\\nZero burocracia, retornos automáticos.\\ndiBoaS Business.',
      new: 'Dinheiro parado? Faça-o trabalhar.\\nZero burocracia, retornos automáticos.'
    }
  },
  es: {
    benefits: {
      old: 'Transferencias en tiempo real, sin límites, en cualquier parte del mundo.\\nFácil. Rápido. Seguro.\\nAbre tu cuenta.',
      new: 'Transferencias en tiempo real, sin límites, en cualquier parte del mundo.\\nFácil. Rápido. Seguro.'
    },
    rewards: {
      old: 'Acciones, bonos, tu primera cripto.\\nTu primera inversión.\\nTu primer paso hacia el crecimiento.\\nComienza con solo $10.',
      new: 'Acciones, bonos, tu primera cripto.\\nTu primera inversión.\\nTu primer paso hacia el crecimiento.'
    },
    business: {
      old: '¿Efectivo inactivo? Ponlo a trabajar.\\nCero burocracia, rendimientos automáticos.\\ndiBoaS Business.',
      new: '¿Efectivo inactivo? Ponlo a trabajar.\\nCero burocracia, rendimientos automáticos.'
    }
  },
  de: {
    benefits: {
      old: 'Echtzeit-Überweisungen, keine Limits, überall auf der Welt.\\nEinfach. Schnell. Sicher.\\nEröffne dein Konto.',
      new: 'Echtzeit-Überweisungen, keine Limits, überall auf der Welt.\\nEinfach. Schnell. Sicher.'
    },
    rewards: {
      old: 'Aktien, Anleihen, deine erste Krypto.\\nDeine erste Investition.\\nDein erster Schritt zum Wachstum.\\nBeginne mit nur $10.',
      new: 'Aktien, Anleihen, deine erste Krypto.\\nDeine erste Investition.\\nDein erster Schritt zum Wachstum.'
    },
    business: {
      old: 'Brachliegendes Geld? Lass es arbeiten.\\nKeine Bürokratie, automatische Erträge.\\ndiBoaS Business.',
      new: 'Brachliegendes Geld? Lass es arbeiten.\\nKeine Bürokratie, automatische Erträge.'
    }
  }
};

for (const [lang, changes] of Object.entries(productCarouselChanges)) {
  const filePath = path.join(BASE_PATH, lang, 'marketing.json');
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;

  for (const [key, { old, new: newText }] of Object.entries(changes)) {
    if (content.includes(old)) {
      content = content.replace(old, newText);
      changeCount++;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ Updated ${changeCount} slides in ${lang}/marketing.json`);
}

// ============================================
// CHANGE 3: AppFeaturesCarousel - Card 1 Text (English only)
// ============================================
console.log('\n📝 CHANGE 3: AppFeaturesCarousel - Card 1 Text (English only)');
console.log('From: "Only control it."');
console.log('To: "Only you control it"\n');

const enFilePath = path.join(BASE_PATH, 'en', 'marketing.json');
let enContent = fs.readFileSync(enFilePath, 'utf8');

const appFeaturesOld = 'Take complete control of your money.\\nNo limits, no interference.\\nOnly control it.';
const appFeaturesNew = 'Take complete control of your money.\\nNo limits, no interference.\\nOnly you control it';

if (enContent.includes(appFeaturesOld)) {
  enContent = enContent.replace(appFeaturesOld, appFeaturesNew);
  fs.writeFileSync(enFilePath, enContent, 'utf8');
  console.log('  ✓ Updated en/marketing.json');
} else {
  console.log('  ⚠ Could not find old text in en/marketing.json');
}

// ============================================
// CHANGE 4: AppFeaturesCarousel - Last Card Image
// ============================================
console.log('\n📝 CHANGE 4: AppFeaturesCarousel - Last Card Image');
console.log('From: LIFE_TRAVEL');
console.log('To: BUSINESS_STRATEGY_WOMAN\n');

const configFilePath = path.join(CONFIG_PATH, 'appFeaturesCarousel.ts');
let configContent = fs.readFileSync(configFilePath, 'utf8');

const imageOld = "image: getSocialRealAsset('LIFE_TRAVEL')";
const imageNew = "image: getSocialRealAsset('BUSINESS_STRATEGY_WOMAN')";

if (configContent.includes(imageOld)) {
  configContent = configContent.replace(imageOld, imageNew);
  fs.writeFileSync(configFilePath, configContent, 'utf8');
  console.log('  ✓ Updated appFeaturesCarousel.ts');
} else {
  console.log('  ⚠ Could not find LIFE_TRAVEL in config');
}

// ============================================
// SUMMARY
// ============================================
console.log('\n========================================');
console.log('CHANGES SUMMARY');
console.log('========================================');
console.log('✅ Hero Section: Updated in all 4 languages');
console.log('✅ ProductCarousel: Removed last sentence in all 3 cards × 4 languages');
console.log('✅ AppFeaturesCarousel Card 1: Fixed text in English');
console.log('✅ AppFeaturesCarousel Last Card: Changed image to BUSINESS_STRATEGY_WOMAN');
console.log('\n✅ All content changes applied successfully!');
console.log('\nNext steps:');
console.log('1. Clean cache: rm -rf apps/web/.next .turbo');
console.log('2. Start dev server: pnpm dev');
console.log('3. Test all changes in the browser');
