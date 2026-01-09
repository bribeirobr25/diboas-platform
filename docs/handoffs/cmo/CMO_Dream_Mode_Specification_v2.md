# CMO Board — Dream Mode & Future You Calculator Specification

**Document Version:** 2.0  
**Author:** CMO Board  
**Date:** December 31, 2025  
**Status:** FINAL — Ready for CTO Implementation  
**Related Documents:**
- Innovation Board: UX Flows & Animation Specs
- CLO Board: Disclaimer Requirements & Legal Approval
- CTO Board: Technical Integration Guide

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| **Rate** | 9.5% | 8% (conservative mid-range) |
| **Watermark** | "SIMULATION" | "PROJECTION" |
| **"crypto"** | "X% crypto" | "growth potential" or removed |
| **"DeFi"** | Used in descriptions | Removed entirely |
| **Strategy labels** | "With diBoaS strategies" | "With diBoaS" |
| **Path descriptions** | Technical allocation % | Plain language outcomes |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Visual Direction](#2-visual-direction)
3. [Dream Mode Copy — All Screens](#3-dream-mode-copy--all-screens)
4. [Future You Calculator Copy](#4-future-you-calculator-copy)
5. [Dream Card Design Specification](#5-dream-card-design-specification)
6. [#WhileISlept Integration](#6-whileieslept-integration)
7. [Consolidated i18n JSON](#7-consolidated-i18n-json)
8. [CLO Compliance Checklist](#8-clo-compliance-checklist)

---

## 1. Executive Summary

### 1.1 What This Document Contains

This specification provides all marketing copy, visual direction, and design guidelines needed to implement:

| Feature | Description | Target User |
|---------|-------------|-------------|
| **Dream Mode** | Strategy simulation with shareable results | Waitlist users |
| **Future You Calculator** | Compound growth projection tool | Anonymous visitors |
| **Dream Card** | Shareable image with projection results | All users |

### 1.2 Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Education, not selling** | "See what your money could do" — never "invest now" |
| **Cultural adaptation** | Each language reflects local culture, not just translation |
| **Legal compliance** | All CLO-required disclaimers embedded in copy |
| **Trust through transparency** | Watermarks, disclaimers, and honest language throughout |
| **Jargon-free** | No crypto, DeFi, protocol, APY terminology |

### 1.3 Language Support

| Code | Language | Market | Special Requirements |
|------|----------|--------|---------------------|
| `en` | English | Global | Standard disclaimers |
| `de` | German | Germany/Austria | Formal "Sie" form |
| `pt-BR` | Portuguese (Brazil) | Brazil | Enhanced BCB disclaimer |
| `es` | Spanish | Spain/LatAm | Standard disclaimers |

---

## 2. Visual Direction

### 2.1 Color System

| Role | Color Name | Hex Code | RGB | Usage |
|------|------------|----------|-----|-------|
| **Primary** | diBoaS Teal | `#14B8A6` | 20, 184, 166 | CTAs, success states, growth indicators |
| **Secondary** | Deep Navy | `#0F172A` | 15, 23, 42 | Text, dark backgrounds |
| **Accent** | Warm Gold | `#F59E0B` | 245, 158, 11 | Celebrations, "wow" moments |
| **Neutral Light** | Soft Gray | `#F8FAFC` | 248, 250, 252 | Card backgrounds |
| **Neutral Mid** | Slate | `#94A3B8` | 148, 163, 184 | Secondary text |
| **Warning** | Amber | `#F59E0B` | 245, 158, 11 | Projection watermark |
| **Success Glow** | Teal Light | `#5EEAD4` | 94, 234, 212 | Counter completion pulse |

### 2.2 Animation Style — "Organic Money"

| Principle | Description | Technical Implementation |
|-----------|-------------|-------------------------|
| **Money feels alive** | Numbers "breathe" with subtle movement | Scale pulse 1.0 → 1.02 → 1.0 on completion |
| **Growth is satisfying** | Fast start, gentle landing | `easeOutExpo` timing function |
| **Never jarring** | Smooth, predictable transitions | All transitions 200-300ms |
| **Celebration is subtle** | No confetti; soft glow instead | Teal glow with 200ms fade |
| **Trustworthy** | Professional, not flashy | No bouncing, no spinning |

### 2.3 Typography Hierarchy

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| **Money (large)** | System sans, tabular nums | 48-64px | 700 (Bold) | 1.1 |
| **Headlines** | System sans | 24-32px | 600 (Semibold) | 1.2 |
| **Body text** | System sans | 16-18px | 400 (Regular) | 1.5 |
| **Helper text** | System sans | 14px | 400 (Regular) | 1.4 |
| **Disclaimers** | System sans | 12-14px | 400 (Regular) | 1.4 |

### 2.4 The "Feel" Guidelines

> **Dream Mode should feel like:** Opening a birthday card with money inside — the pleasant surprise of seeing a number bigger than expected.

> **It should NOT feel like:** A trading terminal, a casino, a get-rich-quick scheme, or a crypto bro pitch.

**Visual Mood Board Keywords:**
- Calm confidence
- Warm professionalism  
- Accessible sophistication
- Hopeful but grounded

---

## 3. Dream Mode Copy — All Screens

### 3.1 Screen 0: Disclaimer Gate

**Purpose:** Legal requirement before entering simulation. User must acknowledge.

#### English (EN)
| Element | Content |
|---------|---------|
| **Headline** | Before you dream... |
| **Body** | This is an educational projection using historical market data. The numbers shown are based on past performance and do not guarantee future results. No real money is involved. |
| **Checkbox Label** | I understand this is for educational purposes only |
| **CTA Button** | Enter Dream Mode |
| **Watermark** | PROJECTION |

#### German (DE)
| Element | Content |
|---------|---------|
| **Headline** | Bevor Sie träumen... |
| **Body** | Dies ist eine Bildungsprojektion mit historischen Marktdaten. Die gezeigten Zahlen basieren auf vergangener Performance und garantieren keine zukünftigen Ergebnisse. Es ist kein echtes Geld beteiligt. |
| **Checkbox Label** | Ich verstehe, dass dies nur zu Bildungszwecken dient |
| **CTA Button** | Dream Mode starten |
| **Watermark** | PROJEKTION |

#### Portuguese-Brazil (PT-BR)
| Element | Content |
|---------|---------|
| **Headline** | Antes de sonhar... |
| **Body** | Esta é uma projeção educacional usando dados históricos de mercado. Os números mostrados são baseados em desempenho passado e NÃO garantem resultados futuros. Nenhum dinheiro real está envolvido. O diBoaS NÃO é uma instituição financeira autorizada pelo Banco Central do Brasil. |
| **Checkbox Label** | Eu entendo que isso é apenas para fins educacionais |
| **CTA Button** | Entrar no Modo Sonho |
| **Watermark** | PROJEÇÃO |

#### Spanish (ES)
| Element | Content |
|---------|---------|
| **Headline** | Antes de soñar... |
| **Body** | Esta es una proyección educativa que utiliza datos históricos del mercado. Los números mostrados se basan en el rendimiento pasado y no garantizan resultados futuros. No hay dinero real involucrado. |
| **Checkbox Label** | Entiendo que esto es solo con fines educativos |
| **CTA Button** | Entrar al Modo Sueño |
| **Watermark** | PROYECCIÓN |

---

### 3.2 Screen 1: The Invitation

**Purpose:** Soft entry point. Create curiosity without pressure.

#### English (EN)
| Element | Content |
|---------|---------|
| **Headline** | Want to see what your money could do? |
| **Subhead** | No real money. No commitment. Just possibilities. |
| **CTA Button** | Let's explore |
| **Skip Link** | Maybe later |

#### German (DE)
| Element | Content |
|---------|---------|
| **Headline** | Möchten Sie sehen, was Ihr Geld erreichen könnte? |
| **Subhead** | Kein echtes Geld. Keine Verpflichtung. Nur Möglichkeiten. |
| **CTA Button** | Los geht's |
| **Skip Link** | Vielleicht später |

#### Portuguese-Brazil (PT-BR)
| Element | Content |
|---------|---------|
| **Headline** | Quer ver o que seu dinheiro poderia fazer? |
| **Subhead** | Sem dinheiro real. Sem compromisso. Só possibilidades. |
| **CTA Button** | Vamos explorar |
| **Skip Link** | Talvez depois |

#### Spanish (ES)
| Element | Content |
|---------|---------|
| **Headline** | ¿Quieres ver lo que tu dinero podría hacer? |
| **Subhead** | Sin dinero real. Sin compromiso. Solo posibilidades. |
| **CTA Button** | Vamos a explorar |
| **Skip Link** | Quizás después |

---

### 3.3 Screen 2: Choose Your Path

**Purpose:** User selects risk tolerance. Maps to strategy clusters.

#### Screen Copy

| Language | Headline | Subhead |
|----------|----------|---------|
| **EN** | How do you feel about risk? | There's no wrong answer — just different paths. |
| **DE** | Wie stehen Sie zu Risiko? | Es gibt keine falsche Antwort — nur verschiedene Wege. |
| **PT-BR** | Como você se sente em relação a risco? | Não existe resposta errada — só caminhos diferentes. |
| **ES** | ¿Cómo te sientes respecto al riesgo? | No hay respuesta incorrecta — solo caminos diferentes. |

#### Path: Safety First

| Language | Name | Tagline | Description |
|----------|------|---------|-------------|
| **EN** | Safety First | I can't afford to lose this | Steady returns. Your money stays stable. Sleep easy. |
| **DE** | Sicherheit zuerst | Das darf ich nicht verlieren | Stabile Renditen. Ihr Geld bleibt stabil. Ruhig schlafen. |
| **PT-BR** | Segurança em Primeiro | Não posso perder isso | Retornos estáveis. Seu dinheiro fica seguro. Durma tranquilo. |
| **ES** | Seguridad Primero | No puedo perder esto | Rendimientos estables. Tu dinero se mantiene seguro. Duerme tranquilo. |

**Icon:** 🛡️  
**Color:** `#14B8A6` (Teal)  
**Maps to Strategies:** 1, 3, 5, 7, 9 (Stable returns focus)

#### Path: Balanced Growth

| Language | Name | Tagline | Description |
|----------|------|---------|-------------|
| **EN** | Balanced Growth | Some risk for more reward | A mix of stability and growth potential. The middle path. |
| **DE** | Ausgewogenes Wachstum | Etwas Risiko für mehr Ertrag | Eine Mischung aus Stabilität und Wachstumspotenzial. Der Mittelweg. |
| **PT-BR** | Crescimento Equilibrado | Um pouco de risco pra ganhar mais | Um mix de estabilidade e potencial de crescimento. O caminho do meio. |
| **ES** | Crecimiento Equilibrado | Algo de riesgo para más recompensa | Una mezcla de estabilidad y potencial de crecimiento. El camino del medio. |

**Icon:** ⚖️  
**Color:** `#3B82F6` (Blue)  
**Maps to Strategies:** 2, 4, 6 (Balanced approach)

#### Path: Maximum Growth

| Language | Name | Tagline | Description |
|----------|------|---------|-------------|
| **EN** | Maximum Growth | I want my money to work hard | Higher potential, but expect bigger ups and downs. |
| **DE** | Maximales Wachstum | Mein Geld soll hart arbeiten | Höheres Potenzial, aber erwarten Sie größere Schwankungen. |
| **PT-BR** | Crescimento Máximo | Quero que meu dinheiro trabalhe pesado | Potencial maior, mas espere altos e baixos maiores. |
| **ES** | Crecimiento Máximo | Quiero que mi dinero trabaje duro | Mayor potencial, pero espera subidas y bajadas más grandes. |

**Icon:** 🚀  
**Color:** `#8B5CF6` (Purple)  
**Maps to Strategies:** 8, 10 (Growth focus)

---

### 3.4 Screen 3: Set Your Amount

**Purpose:** User inputs hypothetical starting amount via slider.

#### English (EN)
| Element | Content |
|---------|---------|
| **Headline** | How much would you start with? |
| **Subhead** | Remember: this is just a projection |
| **Helper Text** | Drag to set your starting amount |
| **CTA Button** | Show me what happens |

#### German (DE)
| Element | Content |
|---------|---------|
| **Headline** | Mit wie viel würden Sie starten? |
| **Subhead** | Denken Sie daran: Dies ist nur eine Projektion |
| **Helper Text** | Ziehen Sie, um Ihren Startbetrag festzulegen |
| **CTA Button** | Zeig mir, was passiert |

#### Portuguese-Brazil (PT-BR)
| Element | Content |
|---------|---------|
| **Headline** | Com quanto você começaria? |
| **Subhead** | Lembra: isso é só uma projeção |
| **Helper Text** | Arraste para definir seu valor inicial |
| **CTA Button** | Me mostra o que acontece |

#### Spanish (ES)
| Element | Content |
|---------|---------|
| **Headline** | ¿Con cuánto empezarías? |
| **Subhead** | Recuerda: esto es solo una proyección |
| **Helper Text** | Arrastra para establecer tu monto inicial |
| **CTA Button** | Muéstrame qué pasa |

#### Slider Configuration

| Parameter | Value |
|-----------|-------|
| **Minimum** | €50 |
| **Maximum** | €10,000 |
| **Default** | €500 |
| **Step** | €10 |
| **Currency Symbol** | € (prefix) |

---

### 3.5 Screen 4: Watch It Grow (Results)

**Purpose:** Show animated growth projection with bank comparison.

#### Dynamic Headline

| Language | Template |
|----------|----------|
| **EN** | Your €{{amount}} could become... |
| **DE** | Ihre €{{amount}} könnten werden... |
| **PT-BR** | Seus €{{amount}} poderiam virar... |
| **ES** | Tus €{{amount}} podrían convertirse en... |

#### Timeframe Labels

| Code | EN | DE | PT-BR | ES |
|------|----|----|-------|-----|
| `1w` | 1 Week | 1 Woche | 1 Semana | 1 Semana |
| `1m` | 1 Month | 1 Monat | 1 Mês | 1 Mes |
| `1y` | 1 Year | 1 Jahr | 1 Ano | 1 Año |
| `5y` | 5 Years | 5 Jahre | 5 Anos | 5 Años |

**Default Selection:** 1 Year (`1y`)

#### Bank Comparison Section

| Language | Label | Difference Text | Source Note |
|----------|-------|-----------------|-------------|
| **EN** | Your bank would give you: | That's {{difference}} MORE with diBoaS | Based on 0.5% average savings rate |
| **DE** | Ihre Bank würde Ihnen geben: | Das sind {{difference}} MEHR mit diBoaS | Basierend auf 0,5% durchschnittlichem Sparzins |
| **PT-BR** | Seu banco te daria: | Isso é {{difference}} A MAIS com diBoaS | Baseado em 0,5% de rendimento médio da poupança |
| **ES** | Tu banco te daría: | Eso es {{difference}} MÁS con diBoaS | Basado en 0.5% de tasa de ahorro promedio |

#### CTA Buttons

| Language | Share CTA | Retry CTA |
|----------|-----------|-----------|
| **EN** | Share my dream | Try another path |
| **DE** | Meinen Traum teilen | Anderen Weg probieren |
| **PT-BR** | Compartilhar meu sonho | Tentar outro caminho |
| **ES** | Compartir mi sueño | Probar otro camino |

---

### 3.6 Screen 5: Post-Dream Waitlist Nudge

**Purpose:** Convert emotional peak into action. Show waitlist position.

**Trigger:** Displays after user exits Screen 4 (results)

#### English (EN)
| Element | Content |
|---------|---------|
| **Headline** | You're #{{position}} on the waitlist |
| **Subhead** | The sooner we launch, the sooner this becomes real. |
| **Share CTA** | Share to move up |
| **Explore CTA** | Explore more |

#### German (DE)
| Element | Content |
|---------|---------|
| **Headline** | Sie sind #{{position}} auf der Warteliste |
| **Subhead** | Je früher wir starten, desto eher wird das Realität. |
| **Share CTA** | Teilen und aufsteigen |
| **Explore CTA** | Mehr entdecken |

#### Portuguese-Brazil (PT-BR)
| Element | Content |
|---------|---------|
| **Headline** | Você é #{{position}} na lista de espera |
| **Subhead** | Quanto antes a gente lançar, antes isso vira realidade. |
| **Share CTA** | Compartilhar pra subir |
| **Explore CTA** | Explorar mais |

#### Spanish (ES)
| Element | Content |
|---------|---------|
| **Headline** | Eres #{{position}} en la lista de espera |
| **Subhead** | Cuanto antes lancemos, antes esto se hace realidad. |
| **Share CTA** | Comparte para subir |
| **Explore CTA** | Explorar más |

---

## 4. Future You Calculator Copy

### 4.1 Overview

**Purpose:** Anonymous visitors can see compound growth projections without creating an account.  
**Entry Point:** Landing page section or standalone page  
**Conversion Goal:** Waitlist signup  
**Rate Used:** 8% (conservative mid-range of Safe Harbor 6-10%)

### 4.2 Calculator Interface Copy

#### English (EN)
| Element | Content |
|---------|---------|
| **Headline** | What could €20/month become? |
| **Subhead** | See your future — no account needed |
| **Input Label** | Monthly amount you could set aside |
| **Input Placeholder** | €20 |
| **Result Headline** | In {{years}} years, your €{{monthly}}/month could become: |
| **diBoaS Label** | With diBoaS |
| **Bank Label** | With your bank (0.5% savings) |
| **Difference Label** | That's {{difference}} more |
| **CTA Button** | Join the waitlist |
| **Disclaimer** | PROJECTION — Based on historical data. Past performance does not guarantee future results. |

#### German (DE)
| Element | Content |
|---------|---------|
| **Headline** | Was könnten €20/Monat werden? |
| **Subhead** | Sehen Sie Ihre Zukunft — kein Konto nötig |
| **Input Label** | Monatlicher Betrag, den Sie zurücklegen könnten |
| **Input Placeholder** | €20 |
| **Result Headline** | In {{years}} Jahren könnten Ihre €{{monthly}}/Monat werden: |
| **diBoaS Label** | Mit diBoaS |
| **Bank Label** | Mit Ihrer Bank (0,5% Sparzins) |
| **Difference Label** | Das sind {{difference}} mehr |
| **CTA Button** | Auf die Warteliste |
| **Disclaimer** | PROJEKTION — Basierend auf historischen Daten. Vergangene Ergebnisse garantieren keine zukünftigen Erträge. |

#### Portuguese-Brazil (PT-BR)
| Element | Content |
|---------|---------|
| **Headline** | No que R$20/mês poderiam se transformar? |
| **Subhead** | Veja seu futuro — sem precisar de conta |
| **Input Label** | Valor mensal que você poderia guardar |
| **Input Placeholder** | R$20 |
| **Result Headline** | Em {{years}} anos, seus R${{monthly}}/mês poderiam virar: |
| **diBoaS Label** | Com diBoaS |
| **Bank Label** | Com seu banco (0,5% da poupança) |
| **Difference Label** | Isso é {{difference}} a mais |
| **CTA Button** | Entrar na lista de espera |
| **Disclaimer** | PROJEÇÃO — Baseado em dados históricos. Resultados passados não garantem retornos futuros. |

#### Spanish (ES)
| Element | Content |
|---------|---------|
| **Headline** | ¿En qué podrían convertirse €20/mes? |
| **Subhead** | Mira tu futuro — sin necesidad de cuenta |
| **Input Label** | Cantidad mensual que podrías apartar |
| **Input Placeholder** | €20 |
| **Result Headline** | En {{years}} años, tus €{{monthly}}/mes podrían convertirse en: |
| **diBoaS Label** | Con diBoaS |
| **Bank Label** | Con tu banco (0.5% de ahorro) |
| **Difference Label** | Eso es {{difference}} más |
| **CTA Button** | Unirse a la lista de espera |
| **Disclaimer** | PROYECCIÓN — Basado en datos históricos. El rendimiento pasado no garantiza resultados futuros. |

### 4.3 Time Horizon Labels

| Code | EN | DE | PT-BR | ES |
|------|----|----|-------|-----|
| `1y` | 1 year | 1 Jahr | 1 ano | 1 año |
| `5y` | 5 years | 5 Jahre | 5 anos | 5 años |
| `10y` | 10 years | 10 Jahre | 10 anos | 10 años |
| `20y` | 20 years | 20 Jahre | 20 anos | 20 años |

### 4.4 Slider Configuration

| Parameter | Value |
|-----------|-------|
| **Minimum** | €5 |
| **Maximum** | €500 |
| **Default** | €20 |
| **Step** | €5 |
| **Currency Symbol** | € (prefix, R$ for PT-BR) |

### 4.5 Example Calculations (€100/month at 8%)

| Years | Bank (0.5%) | diBoaS (8%) | Difference |
|-------|-------------|-------------|------------|
| 5 | €6,076 | €7,348 | €1,272 |
| 10 | €12,295 | €18,295 | €6,000 |
| 15 | €18,663 | €34,604 | €15,941 |
| 20 | €25,185 | €58,902 | €33,717 |

---

## 5. Dream Card Design Specification

### 5.1 Dimensions

| Platform | Width | Height | Aspect Ratio |
|----------|-------|--------|--------------|
| **Instagram Stories** | 1080px | 1920px | 9:16 |
| **Instagram Feed** | 1080px | 1350px | 4:5 |
| **Twitter/X** | 1200px | 675px | 16:9 |
| **WhatsApp/OG** | 1200px | 630px | 1.91:1 |

### 5.2 Card Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  PROJECTION                                    [diBoaS Logo]            │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                                                         │
│                     IN DREAM MODE, I COULD GROW                         │
│                                                                         │
│                                                                         │
│                         €500 → €794                                     │
│                                                                         │
│                          in 5 years                                     │
│                                                                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                   My bank would have given me:                          │
│                            €512                                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                                                         │
│                     Ready to stop dreaming?                             │
│                          diboas.com                                     │
│                                                                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Based on historical data. Past performance ≠ future results.          │
│                                                                         │
│                          #WhileISlept                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Card Copy — All Languages

#### English (EN)
| Element | Content |
|---------|---------|
| **Watermark** | PROJECTION |
| **Main Headline** | IN DREAM MODE, I COULD GROW |
| **Amount Format** | €{{start}} → €{{end}} |
| **Timeframe Format** | in {{timeframe}} |
| **Bank Comparison** | My bank would have given me: |
| **Bank Amount** | €{{bank_amount}} |
| **CTA** | Ready to stop dreaming? |
| **URL** | diboas.com |
| **Disclaimer** | Based on historical data. Past performance ≠ future results. |
| **Hashtag** | #WhileISlept |

#### German (DE)
| Element | Content |
|---------|---------|
| **Watermark** | PROJEKTION |
| **Main Headline** | IM DREAM MODE KÖNNTE ICH WACHSEN |
| **Amount Format** | €{{start}} → €{{end}} |
| **Timeframe Format** | in {{timeframe}} |
| **Bank Comparison** | Meine Bank hätte mir gegeben: |
| **Bank Amount** | €{{bank_amount}} |
| **CTA** | Bereit, aufzuhören zu träumen? |
| **URL** | diboas.com |
| **Disclaimer** | Basierend auf historischen Daten. Vergangene Performance ≠ zukünftige Ergebnisse. |
| **Hashtag** | #WhileISlept |

#### Portuguese-Brazil (PT-BR)
| Element | Content |
|---------|---------|
| **Watermark** | PROJEÇÃO |
| **Main Headline** | NO MODO SONHO, EU PODERIA CRESCER |
| **Amount Format** | €{{start}} → €{{end}} |
| **Timeframe Format** | em {{timeframe}} |
| **Bank Comparison** | Meu banco teria me dado: |
| **Bank Amount** | €{{bank_amount}} |
| **CTA** | Pronto pra parar de sonhar? |
| **URL** | diboas.com |
| **Disclaimer** | Baseado em dados históricos. Desempenho passado ≠ resultados futuros. |
| **Hashtag** | #WhileISlept |

#### Spanish (ES)
| Element | Content |
|---------|---------|
| **Watermark** | PROYECCIÓN |
| **Main Headline** | EN MODO SUEÑO, PODRÍA CRECER |
| **Amount Format** | €{{start}} → €{{end}} |
| **Timeframe Format** | en {{timeframe}} |
| **Bank Comparison** | Mi banco me habría dado: |
| **Bank Amount** | €{{bank_amount}} |
| **CTA** | ¿Listo para dejar de soñar? |
| **URL** | diboas.com |
| **Disclaimer** | Basado en datos históricos. Rendimiento pasado ≠ resultados futuros. |
| **Hashtag** | #WhileISlept |

### 5.4 Timeframe Translations

| Key | EN | DE | PT-BR | ES |
|-----|----|----|-------|-----|
| `1_week` | 1 week | 1 Woche | 1 semana | 1 semana |
| `1_month` | 1 month | 1 Monat | 1 mês | 1 mes |
| `1_year` | 1 year | 1 Jahr | 1 ano | 1 año |
| `5_years` | 5 years | 5 Jahren | 5 anos | 5 años |

---

## 6. #WhileISlept Integration

### 6.1 Campaign Overview

| Element | Description |
|---------|-------------|
| **Hashtag** | #WhileISlept |
| **Concept** | "While you slept, your money could have been working" |
| **Tone** | Wistful curiosity, not aggressive FOMO |

### 6.2 Share Text Templates

#### Dream Mode Share Text

| Platform | EN |
|----------|-----|
| **Twitter** | In Dream Mode, I could grow €{{start}} → €{{end}} in {{timeframe}}. My bank? Only €{{bank}}. #WhileISlept diboas.com |
| **WhatsApp** | Check this out — in Dream Mode, I saw what my €{{start}} could become: €{{end}} in {{timeframe}}. My bank would give me {{bank}}. See what yours could do: diboas.com #WhileISlept |
| **LinkedIn** | I just explored what my savings could become with different approaches. The gap between traditional banking (0.5%) and what's actually possible is eye-opening. Try it yourself: diboas.com #WhileISlept |

#### Waitlist Position Share Text

| Platform | EN |
|----------|-----|
| **Twitter** | I'm #{{position}} on the @diBoaS waitlist. Banks earn 7% with our savings. They pay us 0.5%. That gap? It's been there the whole time. #WhileISlept |
| **WhatsApp** | I just joined the diBoaS waitlist (#{{position}}). Did you know banks earn 7% with our savings but only pay us 0.5%? Check it out: diboas.com/?ref={{referral_code}} |

---

## 7. Consolidated i18n JSON

```json
{
  "dream_mode": {
    "en": {
      "disclaimer_gate": {
        "headline": "Before you dream...",
        "body": "This is an educational projection using historical market data. The numbers shown are based on past performance and do not guarantee future results. No real money is involved.",
        "checkbox": "I understand this is for educational purposes only",
        "cta": "Enter Dream Mode",
        "watermark": "PROJECTION"
      },
      "invitation": {
        "headline": "Want to see what your money could do?",
        "subhead": "No real money. No commitment. Just possibilities.",
        "cta": "Let's explore",
        "skip": "Maybe later"
      },
      "path_selection": {
        "headline": "How do you feel about risk?",
        "subhead": "There's no wrong answer — just different paths.",
        "paths": {
          "safety": {
            "name": "Safety First",
            "tagline": "I can't afford to lose this",
            "description": "Steady returns. Your money stays stable. Sleep easy."
          },
          "balance": {
            "name": "Balanced Growth",
            "tagline": "Some risk for more reward",
            "description": "A mix of stability and growth potential. The middle path."
          },
          "growth": {
            "name": "Maximum Growth",
            "tagline": "I want my money to work hard",
            "description": "Higher potential, but expect bigger ups and downs."
          }
        }
      },
      "amount_selection": {
        "headline": "How much would you start with?",
        "subhead": "Remember: this is just a projection",
        "helper": "Drag to set your starting amount",
        "cta": "Show me what happens"
      },
      "results": {
        "headline": "Your €{{amount}} could become...",
        "timeframes": {
          "1w": "1 Week",
          "1m": "1 Month",
          "1y": "1 Year",
          "5y": "5 Years"
        },
        "bank_label": "Your bank would give you:",
        "difference": "That's {{difference}} MORE with diBoaS",
        "source": "Based on 0.5% average savings rate",
        "cta_share": "Share my dream",
        "cta_retry": "Try another path"
      },
      "post_dream": {
        "headline": "You're #{{position}} on the waitlist",
        "subhead": "The sooner we launch, the sooner this becomes real.",
        "cta_share": "Share to move up",
        "cta_explore": "Explore more"
      },
      "card": {
        "watermark": "PROJECTION",
        "main_text": "In Dream Mode, I could grow",
        "bank_comparison": "My bank would have given me:",
        "cta": "Ready to stop dreaming?",
        "url": "diboas.com",
        "disclaimer": "Based on historical data. Past performance ≠ future results.",
        "hashtag": "#WhileISlept"
      },
      "share": {
        "twitter": "In Dream Mode, I could grow €{{start}} → €{{end}} in {{timeframe}}. My bank? Only €{{bank}}. #WhileISlept diboas.com",
        "whatsapp": "Check this out — in Dream Mode, I saw what my €{{start}} could become: €{{end}} in {{timeframe}}. My bank would give me {{bank}}. See what yours could do: diboas.com #WhileISlept"
      }
    },
    "de": {
      "disclaimer_gate": {
        "headline": "Bevor Sie träumen...",
        "body": "Dies ist eine Bildungsprojektion mit historischen Marktdaten. Die gezeigten Zahlen basieren auf vergangener Performance und garantieren keine zukünftigen Ergebnisse. Es ist kein echtes Geld beteiligt.",
        "checkbox": "Ich verstehe, dass dies nur zu Bildungszwecken dient",
        "cta": "Dream Mode starten",
        "watermark": "PROJEKTION"
      },
      "invitation": {
        "headline": "Möchten Sie sehen, was Ihr Geld erreichen könnte?",
        "subhead": "Kein echtes Geld. Keine Verpflichtung. Nur Möglichkeiten.",
        "cta": "Los geht's",
        "skip": "Vielleicht später"
      },
      "path_selection": {
        "headline": "Wie stehen Sie zu Risiko?",
        "subhead": "Es gibt keine falsche Antwort — nur verschiedene Wege.",
        "paths": {
          "safety": {
            "name": "Sicherheit zuerst",
            "tagline": "Das darf ich nicht verlieren",
            "description": "Stabile Renditen. Ihr Geld bleibt stabil. Ruhig schlafen."
          },
          "balance": {
            "name": "Ausgewogenes Wachstum",
            "tagline": "Etwas Risiko für mehr Ertrag",
            "description": "Eine Mischung aus Stabilität und Wachstumspotenzial. Der Mittelweg."
          },
          "growth": {
            "name": "Maximales Wachstum",
            "tagline": "Mein Geld soll hart arbeiten",
            "description": "Höheres Potenzial, aber erwarten Sie größere Schwankungen."
          }
        }
      },
      "amount_selection": {
        "headline": "Mit wie viel würden Sie starten?",
        "subhead": "Denken Sie daran: Dies ist nur eine Projektion",
        "helper": "Ziehen Sie, um Ihren Startbetrag festzulegen",
        "cta": "Zeig mir, was passiert"
      },
      "results": {
        "headline": "Ihre €{{amount}} könnten werden...",
        "timeframes": {
          "1w": "1 Woche",
          "1m": "1 Monat",
          "1y": "1 Jahr",
          "5y": "5 Jahre"
        },
        "bank_label": "Ihre Bank würde Ihnen geben:",
        "difference": "Das sind {{difference}} MEHR mit diBoaS",
        "source": "Basierend auf 0,5% durchschnittlichem Sparzins",
        "cta_share": "Meinen Traum teilen",
        "cta_retry": "Anderen Weg probieren"
      },
      "post_dream": {
        "headline": "Sie sind #{{position}} auf der Warteliste",
        "subhead": "Je früher wir starten, desto eher wird das Realität.",
        "cta_share": "Teilen und aufsteigen",
        "cta_explore": "Mehr entdecken"
      },
      "card": {
        "watermark": "PROJEKTION",
        "main_text": "Im Dream Mode könnte ich wachsen",
        "bank_comparison": "Meine Bank hätte mir gegeben:",
        "cta": "Bereit, aufzuhören zu träumen?",
        "url": "diboas.com",
        "disclaimer": "Basierend auf historischen Daten. Vergangene Performance ≠ zukünftige Ergebnisse.",
        "hashtag": "#WhileISlept"
      },
      "share": {
        "twitter": "Im Dream Mode könnte ich €{{start}} → €{{end}} in {{timeframe}} wachsen lassen. Meine Bank? Nur €{{bank}}. #WhileISlept diboas.com",
        "whatsapp": "Schau dir das an — im Dream Mode habe ich gesehen, was aus meinen €{{start}} werden könnte: €{{end}} in {{timeframe}}. Meine Bank würde mir {{bank}} geben. Schau, was deines erreichen könnte: diboas.com #WhileISlept"
      }
    },
    "pt-BR": {
      "disclaimer_gate": {
        "headline": "Antes de sonhar...",
        "body": "Esta é uma projeção educacional usando dados históricos de mercado. Os números mostrados são baseados em desempenho passado e NÃO garantem resultados futuros. Nenhum dinheiro real está envolvido. O diBoaS NÃO é uma instituição financeira autorizada pelo Banco Central do Brasil.",
        "checkbox": "Eu entendo que isso é apenas para fins educacionais",
        "cta": "Entrar no Modo Sonho",
        "watermark": "PROJEÇÃO"
      },
      "invitation": {
        "headline": "Quer ver o que seu dinheiro poderia fazer?",
        "subhead": "Sem dinheiro real. Sem compromisso. Só possibilidades.",
        "cta": "Vamos explorar",
        "skip": "Talvez depois"
      },
      "path_selection": {
        "headline": "Como você se sente em relação a risco?",
        "subhead": "Não existe resposta errada — só caminhos diferentes.",
        "paths": {
          "safety": {
            "name": "Segurança em Primeiro",
            "tagline": "Não posso perder isso",
            "description": "Retornos estáveis. Seu dinheiro fica seguro. Durma tranquilo."
          },
          "balance": {
            "name": "Crescimento Equilibrado",
            "tagline": "Um pouco de risco pra ganhar mais",
            "description": "Um mix de estabilidade e potencial de crescimento. O caminho do meio."
          },
          "growth": {
            "name": "Crescimento Máximo",
            "tagline": "Quero que meu dinheiro trabalhe pesado",
            "description": "Potencial maior, mas espere altos e baixos maiores."
          }
        }
      },
      "amount_selection": {
        "headline": "Com quanto você começaria?",
        "subhead": "Lembra: isso é só uma projeção",
        "helper": "Arraste para definir seu valor inicial",
        "cta": "Me mostra o que acontece"
      },
      "results": {
        "headline": "Seus €{{amount}} poderiam virar...",
        "timeframes": {
          "1w": "1 Semana",
          "1m": "1 Mês",
          "1y": "1 Ano",
          "5y": "5 Anos"
        },
        "bank_label": "Seu banco te daria:",
        "difference": "Isso é {{difference}} A MAIS com diBoaS",
        "source": "Baseado em 0,5% de rendimento médio da poupança",
        "cta_share": "Compartilhar meu sonho",
        "cta_retry": "Tentar outro caminho"
      },
      "post_dream": {
        "headline": "Você é #{{position}} na lista de espera",
        "subhead": "Quanto antes a gente lançar, antes isso vira realidade.",
        "cta_share": "Compartilhar pra subir",
        "cta_explore": "Explorar mais"
      },
      "card": {
        "watermark": "PROJEÇÃO",
        "main_text": "No Modo Sonho, eu poderia crescer",
        "bank_comparison": "Meu banco teria me dado:",
        "cta": "Pronto pra parar de sonhar?",
        "url": "diboas.com",
        "disclaimer": "Baseado em dados históricos. Desempenho passado ≠ resultados futuros.",
        "hashtag": "#WhileISlept"
      },
      "share": {
        "twitter": "No Modo Sonho, eu poderia crescer €{{start}} → €{{end}} em {{timeframe}}. Meu banco? Só €{{bank}}. #WhileISlept diboas.com",
        "whatsapp": "Olha isso — no Modo Sonho, vi no que meus €{{start}} poderiam virar: €{{end}} em {{timeframe}}. Meu banco me daria {{bank}}. Veja o que o seu poderia fazer: diboas.com #WhileISlept"
      }
    },
    "es": {
      "disclaimer_gate": {
        "headline": "Antes de soñar...",
        "body": "Esta es una proyección educativa que utiliza datos históricos del mercado. Los números mostrados se basan en el rendimiento pasado y no garantizan resultados futuros. No hay dinero real involucrado.",
        "checkbox": "Entiendo que esto es solo con fines educativos",
        "cta": "Entrar al Modo Sueño",
        "watermark": "PROYECCIÓN"
      },
      "invitation": {
        "headline": "¿Quieres ver lo que tu dinero podría hacer?",
        "subhead": "Sin dinero real. Sin compromiso. Solo posibilidades.",
        "cta": "Vamos a explorar",
        "skip": "Quizás después"
      },
      "path_selection": {
        "headline": "¿Cómo te sientes respecto al riesgo?",
        "subhead": "No hay respuesta incorrecta — solo caminos diferentes.",
        "paths": {
          "safety": {
            "name": "Seguridad Primero",
            "tagline": "No puedo perder esto",
            "description": "Rendimientos estables. Tu dinero se mantiene seguro. Duerme tranquilo."
          },
          "balance": {
            "name": "Crecimiento Equilibrado",
            "tagline": "Algo de riesgo para más recompensa",
            "description": "Una mezcla de estabilidad y potencial de crecimiento. El camino del medio."
          },
          "growth": {
            "name": "Crecimiento Máximo",
            "tagline": "Quiero que mi dinero trabaje duro",
            "description": "Mayor potencial, pero espera subidas y bajadas más grandes."
          }
        }
      },
      "amount_selection": {
        "headline": "¿Con cuánto empezarías?",
        "subhead": "Recuerda: esto es solo una proyección",
        "helper": "Arrastra para establecer tu monto inicial",
        "cta": "Muéstrame qué pasa"
      },
      "results": {
        "headline": "Tus €{{amount}} podrían convertirse en...",
        "timeframes": {
          "1w": "1 Semana",
          "1m": "1 Mes",
          "1y": "1 Año",
          "5y": "5 Años"
        },
        "bank_label": "Tu banco te daría:",
        "difference": "Eso es {{difference}} MÁS con diBoaS",
        "source": "Basado en 0.5% de tasa de ahorro promedio",
        "cta_share": "Compartir mi sueño",
        "cta_retry": "Probar otro camino"
      },
      "post_dream": {
        "headline": "Eres #{{position}} en la lista de espera",
        "subhead": "Cuanto antes lancemos, antes esto se hace realidad.",
        "cta_share": "Comparte para subir",
        "cta_explore": "Explorar más"
      },
      "card": {
        "watermark": "PROYECCIÓN",
        "main_text": "En Modo Sueño, podría crecer",
        "bank_comparison": "Mi banco me habría dado:",
        "cta": "¿Listo para dejar de soñar?",
        "url": "diboas.com",
        "disclaimer": "Basado en datos históricos. Rendimiento pasado ≠ resultados futuros.",
        "hashtag": "#WhileISlept"
      },
      "share": {
        "twitter": "En Modo Sueño, podría crecer €{{start}} → €{{end}} en {{timeframe}}. ¿Mi banco? Solo €{{bank}}. #WhileISlept diboas.com",
        "whatsapp": "Mira esto — en Modo Sueño, vi en qué podrían convertirse mis €{{start}}: €{{end}} en {{timeframe}}. Mi banco me daría {{bank}}. Mira lo que podría hacer el tuyo: diboas.com #WhileISlept"
      }
    }
  },
  "future_you_calculator": {
    "en": {
      "headline": "What could €20/month become?",
      "subhead": "See your future — no account needed",
      "input_label": "Monthly amount you could set aside",
      "input_placeholder": "€20",
      "time_horizons": {
        "1y": "1 year",
        "5y": "5 years",
        "10y": "10 years",
        "20y": "20 years"
      },
      "result_headline": "In {{years}} years, your €{{monthly}}/month could become:",
      "diboas_label": "With diBoaS",
      "bank_label": "With your bank (0.5% savings)",
      "difference_label": "That's {{difference}} more",
      "cta": "Join the waitlist",
      "disclaimer": "PROJECTION — Based on historical data. Past performance does not guarantee future results."
    },
    "de": {
      "headline": "Was könnten €20/Monat werden?",
      "subhead": "Sehen Sie Ihre Zukunft — kein Konto nötig",
      "input_label": "Monatlicher Betrag, den Sie zurücklegen könnten",
      "input_placeholder": "€20",
      "time_horizons": {
        "1y": "1 Jahr",
        "5y": "5 Jahre",
        "10y": "10 Jahre",
        "20y": "20 Jahre"
      },
      "result_headline": "In {{years}} Jahren könnten Ihre €{{monthly}}/Monat werden:",
      "diboas_label": "Mit diBoaS",
      "bank_label": "Mit Ihrer Bank (0,5% Sparzins)",
      "difference_label": "Das sind {{difference}} mehr",
      "cta": "Auf die Warteliste",
      "disclaimer": "PROJEKTION — Basierend auf historischen Daten. Vergangene Ergebnisse garantieren keine zukünftigen Erträge."
    },
    "pt-BR": {
      "headline": "No que R$20/mês poderiam se transformar?",
      "subhead": "Veja seu futuro — sem precisar de conta",
      "input_label": "Valor mensal que você poderia guardar",
      "input_placeholder": "R$20",
      "time_horizons": {
        "1y": "1 ano",
        "5y": "5 anos",
        "10y": "10 anos",
        "20y": "20 anos"
      },
      "result_headline": "Em {{years}} anos, seus R${{monthly}}/mês poderiam virar:",
      "diboas_label": "Com diBoaS",
      "bank_label": "Com seu banco (0,5% da poupança)",
      "difference_label": "Isso é {{difference}} a mais",
      "cta": "Entrar na lista de espera",
      "disclaimer": "PROJEÇÃO — Baseado em dados históricos. Resultados passados não garantem retornos futuros."
    },
    "es": {
      "headline": "¿En qué podrían convertirse €20/mes?",
      "subhead": "Mira tu futuro — sin necesidad de cuenta",
      "input_label": "Cantidad mensual que podrías apartar",
      "input_placeholder": "€20",
      "time_horizons": {
        "1y": "1 año",
        "5y": "5 años",
        "10y": "10 años",
        "20y": "20 años"
      },
      "result_headline": "En {{years}} años, tus €{{monthly}}/mes podrían convertirse en:",
      "diboas_label": "Con diBoaS",
      "bank_label": "Con tu banco (0.5% de ahorro)",
      "difference_label": "Eso es {{difference}} más",
      "cta": "Unirse a la lista de espera",
      "disclaimer": "PROYECCIÓN — Basado en datos históricos. El rendimiento pasado no garantiza resultados futuros."
    }
  },
  "config": {
    "slider": {
      "dream_mode": {
        "min": 50,
        "max": 10000,
        "default": 500,
        "step": 10,
        "currency": "€"
      },
      "future_you": {
        "min": 5,
        "max": 500,
        "default": 20,
        "step": 5,
        "currency": "€"
      }
    },
    "bank_rate": 0.005,
    "diboas_rate": 0.08,
    "paths_to_strategies": {
      "safety": [1, 3, 5, 7, 9],
      "balance": [2, 4, 6],
      "growth": [8, 10]
    }
  }
}
```

---

## 8. CLO Compliance Checklist

### 8.1 Required Elements (All Markets)

| Requirement | Location | Status |
|-------------|----------|--------|
| "PROJECTION" watermark on all screens | Top-left, 14px | ✅ Specified |
| Entry disclaimer with checkbox | Screen 0 | ✅ Specified |
| No "invest" or "deposit" language | All copy | ✅ Verified |
| Dream Card permanent disclaimer | Footer, embedded | ✅ Specified |
| Bank comparison cites source | Screen 4, card | ✅ Specified |

### 8.2 Enhanced Requirements (Brazil)

| Requirement | Implementation |
|-------------|----------------|
| BCB non-authorization statement | Included in PT-BR disclaimer body |
| Educational purpose emphasis | Checkbox label explicit |

### 8.3 Language NOT Allowed

| ❌ Forbidden | ✅ Use Instead |
|--------------|----------------|
| "Invest" | "Start with" / "Set aside" |
| "Deposit" | "Enter amount" |
| "Returns" | "Could become" / "Growth" |
| "Guaranteed" | "Based on historical data" |
| "Try investing" | "See what your money could do" |
| "Practice trading" | "Explore" / "See possibilities" |
| "DeFi" | (Remove entirely) |
| "Crypto" | "Digital assets" or remove |
| "APY" | "Annual return" or remove |
| "Protocol" | "System" |

### 8.4 CLO Sign-Off Record

| Jurisdiction | Status | Date | Notes |
|--------------|--------|------|-------|
| EU (Germany, Spain) | ✅ Approved | Dec 29, 2025 | Standard disclaimers |
| Brazil | ✅ Approved | Dec 29, 2025 | Enhanced BCB disclaimer |
| US | ✅ Approved | Dec 29, 2025 | SEC/CFTC disclaimer |
| Global (others) | ✅ Approved | Dec 29, 2025 | Standard disclaimers |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 30, 2025 | CMO Board | Initial consolidated specification |
| 2.0 | Dec 31, 2025 | CMO Board | Jargon-free update, 8% rate, PROJECTION watermark |

---

## Appendix A: Quick Reference — Variable Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{amount}}` | User's selected starting amount | €500 |
| `{{start}}` | Starting amount (for card) | €500 |
| `{{end}}` | Projected final amount | €794 |
| `{{timeframe}}` | Selected time period | 5 Years |
| `{{years}}` | Numeric years | 5 |
| `{{monthly}}` | Monthly contribution | €20 |
| `{{difference}}` | Gain over bank | €282 |
| `{{bank}}` | Bank result amount | €512 |
| `{{bank_amount}}` | Bank result (card) | €512 |
| `{{position}}` | Waitlist position | 847 |
| `{{gain}}` | Total gain amount | €294 |
| `{{percentage}}` | Percentage gain | 58.8 |

---

## Appendix B: File Naming Convention

| File | Purpose | Format |
|------|---------|--------|
| `dream_mode_i18n.json` | All Dream Mode translations | JSON |
| `future_you_i18n.json` | Calculator translations | JSON |
| `dream_card_template.svg` | Card design template | SVG |
| `dream_card_{lang}_{timestamp}.png` | Generated card | PNG |

---

**END OF SPECIFICATION**

*CMO Board — diBoaS*  
*"Teach first, sell never."*
