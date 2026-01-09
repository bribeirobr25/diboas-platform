# CMO Board — Viral Cards Templates Specification
## VERSION 2.0 — Jargon-Free

**Purpose:** Design specifications for Dream Card and Waitlist Card  
**Part of:** #WhileISlept viral sharing system  
**Languages:** English (EN), German (DE), Portuguese-Brazil (PT-BR), Spanish (ES)  
**Version:** 2.0  
**Date:** December 31, 2025

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| **Watermark** | "⚠️ SIMULATION" | "PROJECTION" |
| **Terminology** | Any DeFi/protocol references | Plain language |
| **Rate** | 9.5% | 8% (conservative) |

---

## 1. Overview

The diBoaS viral sharing system uses two primary card types:

| Card Type | Purpose | Trigger | Personalization |
|-----------|---------|---------|-----------------|
| **Dream Card** | Share Dream Mode projection results | Dream Mode Screen 4 | Amount, timeframe, path, growth |
| **Waitlist Card** | Share waitlist position | Waitlist confirmation | Position, referral code |

Both cards are part of the **#WhileISlept** campaign and include required disclaimers per CLO Board requirements.

---

## 2. Dream Card Specification

### 2.1 Dimensions

| Platform | Dimensions | Aspect Ratio | Use Case |
|----------|------------|--------------|----------|
| Instagram Stories | 1080 × 1920 px | 9:16 | Stories, Reels |
| Instagram Feed | 1080 × 1350 px | 4:5 | Feed posts |
| Twitter/X | 1200 × 675 px | 16:9 | Timeline posts |
| OG/Link Preview | 1200 × 630 px | 1.91:1 | Link sharing |
| WhatsApp | 1200 × 630 px | 1.91:1 | Chat sharing |

### 2.2 Visual Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PROJECTION                                        [diBoaS Logo]            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                                                                             │
│                     IN DREAM MODE, I COULD GROW                             │
│                                                                             │
│                                                                             │
│                         €500 → €794                                         │
│                                                                             │
│                          in 5 years                                         │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                   My bank would have given me:                              │
│                            €512                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                                                                             │
│                     Ready to stop dreaming?                                 │
│                          diboas.com                                         │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Based on historical data. Past performance ≠ future results.              │
│                                                                             │
│                          #WhileISlept                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Color Specifications

| Element | Color | Hex | RGB |
|---------|-------|-----|-----|
| Background (top) | Deep Navy | #0F172A | 15, 23, 42 |
| Background (bottom) | Teal Dark | #0D9488 | 13, 148, 136 |
| Primary text | White | #FFFFFF | 255, 255, 255 |
| Secondary text | Slate Light | #CBD5E1 | 203, 213, 225 |
| Watermark | Amber | #F59E0B | 245, 158, 11 |
| Accent (amounts) | Teal Light | #5EEAD4 | 94, 234, 212 |
| Divider lines | Slate | #334155 | 51, 65, 85 |

### 2.4 Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Watermark | System sans | 18px | Bold | Amber |
| Main headline | System sans | 24px | Semibold | White |
| Amount (large) | System sans, tabular | 64px | Bold | Teal Light |
| Timeframe | System sans | 20px | Regular | Slate Light |
| Bank comparison | System sans | 18px | Regular | Slate Light |
| Bank amount | System sans, tabular | 32px | Semibold | White |
| CTA | System sans | 20px | Semibold | White |
| URL | System sans | 18px | Bold | Teal Light |
| Disclaimer | System sans | 12px | Regular | Slate Light |
| Hashtag | System sans | 16px | Semibold | White |

### 2.5 Dream Card Copy — All Languages

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

### 2.6 Timeframe Translations

| Key | EN | DE | PT-BR | ES |
|-----|----|----|-------|-----|
| `1_week` | 1 week | 1 Woche | 1 semana | 1 semana |
| `1_month` | 1 month | 1 Monat | 1 mês | 1 mes |
| `1_year` | 1 year | 1 Jahr | 1 ano | 1 año |
| `5_years` | 5 years | 5 Jahren | 5 anos | 5 años |

---

## 3. Waitlist Card Specification

### 3.1 Dimensions

Same as Dream Card dimensions.

### 3.2 Visual Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                       [diBoaS Logo]        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                                                                             │
│                I'M #847 ON THE DIBOAS WAITLIST                              │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                                                                             │
│           Banks earn 7% with our savings.                                   │
│           They pay us 0.5%.                                                 │
│                                                                             │
│           That gap? It's been there the whole time.                         │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                                                                             │
│                    Join me:                                                 │
│              diboas.com/?ref=BAR847                                         │
│                                                                             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│                          #WhileISlept                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Waitlist Card Copy — All Languages

#### English (EN)

| Element | Content |
|---------|---------|
| **Headline** | I'M #{{position}} ON THE DIBOAS WAITLIST |
| **Body Line 1** | Banks earn 7% with our savings. |
| **Body Line 2** | They pay us 0.5%. |
| **Body Line 3** | That gap? It's been there the whole time. |
| **CTA Intro** | Join me: |
| **Referral URL** | diboas.com/?ref={{referral_code}} |
| **Hashtag** | #WhileISlept |

#### German (DE)

| Element | Content |
|---------|---------|
| **Headline** | ICH BIN #{{position}} AUF DER DIBOAS-WARTELISTE |
| **Body Line 1** | Banken verdienen 7% mit unseren Ersparnissen. |
| **Body Line 2** | Sie zahlen uns 0,5%. |
| **Body Line 3** | Diese Lücke? Die war schon immer da. |
| **CTA Intro** | Machen Sie mit: |
| **Referral URL** | diboas.com/?ref={{referral_code}} |
| **Hashtag** | #WhileISlept |

#### Portuguese-Brazil (PT-BR)

| Element | Content |
|---------|---------|
| **Headline** | EU SOU O #{{position}} NA LISTA DO DIBOAS |
| **Body Line 1** | Bancos ganham 7% com nossas economias. |
| **Body Line 2** | Nos pagam 0,5%. |
| **Body Line 3** | Essa diferença? Sempre esteve lá. |
| **CTA Intro** | Entra comigo: |
| **Referral URL** | diboas.com/?ref={{referral_code}} |
| **Hashtag** | #WhileISlept |

#### Spanish (ES)

| Element | Content |
|---------|---------|
| **Headline** | SOY EL #{{position}} EN LA LISTA DE DIBOAS |
| **Body Line 1** | Los bancos ganan 7% con nuestros ahorros. |
| **Body Line 2** | Nos pagan 0.5%. |
| **Body Line 3** | ¿Esa brecha? Siempre estuvo ahí. |
| **CTA Intro** | Únete conmigo: |
| **Referral URL** | diboas.com/?ref={{referral_code}} |
| **Hashtag** | #WhileISlept |

---

## 4. Template JSON Specifications

### 4.1 Dream Card Template

```json
{
  "id": "dream_card_v2",
  "version": "2.0",
  "name": "Dream Card",
  "type": "dream",
  "dimensions": {
    "instagram_story": { "width": 1080, "height": 1920 },
    "instagram_feed": { "width": 1080, "height": 1350 },
    "twitter": { "width": 1200, "height": 675 },
    "og": { "width": 1200, "height": 630 }
  },
  "background": {
    "type": "gradient",
    "gradient": {
      "type": "linear",
      "angle": 180,
      "stops": [
        { "position": 0, "color": "#0F172A" },
        { "position": 1, "color": "#0D9488" }
      ]
    }
  },
  "elements": [
    {
      "type": "text",
      "id": "watermark",
      "content": "{{i18n.dream_card.watermark}}",
      "position": { "x": 60, "y": 60 },
      "style": {
        "fontSize": 18,
        "fontWeight": "700",
        "color": "#F59E0B",
        "textTransform": "uppercase"
      }
    },
    {
      "type": "image",
      "id": "logo",
      "src": "/assets/logo-white.svg",
      "position": { "x": "right-60", "y": 60 },
      "size": { "width": 120, "height": 40 }
    },
    {
      "type": "text",
      "id": "headline",
      "content": "{{i18n.dream_card.main_text}}",
      "position": { "x": "center", "y": 200 },
      "style": {
        "fontSize": 24,
        "fontWeight": "600",
        "color": "#FFFFFF",
        "textAlign": "center",
        "textTransform": "uppercase"
      }
    },
    {
      "type": "dynamic",
      "id": "amount_growth",
      "dataKey": ["start", "end"],
      "content": "€{{start}} → €{{end}}",
      "position": { "x": "center", "y": 300 },
      "style": {
        "fontSize": 64,
        "fontWeight": "700",
        "color": "#5EEAD4",
        "textAlign": "center",
        "fontFeatureSettings": "tnum"
      }
    },
    {
      "type": "dynamic",
      "id": "timeframe",
      "dataKey": "timeframe",
      "content": "in {{timeframe}}",
      "position": { "x": "center", "y": 380 },
      "style": {
        "fontSize": 20,
        "fontWeight": "400",
        "color": "#CBD5E1",
        "textAlign": "center"
      }
    },
    {
      "type": "text",
      "id": "bank_label",
      "content": "{{i18n.dream_card.bank_comparison}}",
      "position": { "x": "center", "y": 480 },
      "style": {
        "fontSize": 18,
        "fontWeight": "400",
        "color": "#CBD5E1",
        "textAlign": "center"
      }
    },
    {
      "type": "dynamic",
      "id": "bank_amount",
      "dataKey": "bank_amount",
      "content": "€{{bank_amount}}",
      "position": { "x": "center", "y": 520 },
      "style": {
        "fontSize": 32,
        "fontWeight": "600",
        "color": "#FFFFFF",
        "textAlign": "center",
        "fontFeatureSettings": "tnum"
      }
    },
    {
      "type": "text",
      "id": "cta",
      "content": "{{i18n.dream_card.cta}}",
      "position": { "x": "center", "y": 620 },
      "style": {
        "fontSize": 20,
        "fontWeight": "600",
        "color": "#FFFFFF",
        "textAlign": "center"
      }
    },
    {
      "type": "text",
      "id": "url",
      "content": "diboas.com",
      "position": { "x": "center", "y": 660 },
      "style": {
        "fontSize": 18,
        "fontWeight": "700",
        "color": "#5EEAD4",
        "textAlign": "center"
      }
    }
  ],
  "footer": {
    "y": 750,
    "showDivider": true,
    "dividerColor": "#334155",
    "padding": 100,
    "text": "{{i18n.dream_card.disclaimer}}",
    "fontSize": 12,
    "color": "#CBD5E1",
    "branding": "#WhileISlept",
    "brandingSize": 16,
    "brandingColor": "#FFFFFF"
  }
}
```

### 4.2 Waitlist Card Template

```json
{
  "id": "waitlist_card_v2",
  "version": "2.0",
  "name": "Waitlist Card",
  "type": "waitlist",
  "dimensions": {
    "instagram_story": { "width": 1080, "height": 1920 },
    "instagram_feed": { "width": 1080, "height": 1350 },
    "twitter": { "width": 1200, "height": 675 },
    "og": { "width": 1200, "height": 630 }
  },
  "background": {
    "type": "gradient",
    "gradient": {
      "type": "linear",
      "angle": 180,
      "stops": [
        { "position": 0, "color": "#0F172A" },
        { "position": 1, "color": "#1E293B" }
      ]
    }
  },
  "elements": [
    {
      "type": "dynamic",
      "id": "position_headline",
      "dataKey": "position",
      "content": "{{i18n.waitlist_card.headline}}",
      "position": { "x": "center", "y": 200 },
      "style": {
        "fontSize": 28,
        "fontWeight": "700",
        "color": "#FFFFFF",
        "textAlign": "center"
      }
    },
    {
      "type": "text",
      "id": "body_line1",
      "content": "{{i18n.waitlist_card.body_line1}}",
      "position": { "x": "center", "y": 320 },
      "style": {
        "fontSize": 20,
        "fontWeight": "400",
        "color": "#CBD5E1",
        "textAlign": "center"
      }
    },
    {
      "type": "text",
      "id": "body_line2",
      "content": "{{i18n.waitlist_card.body_line2}}",
      "position": { "x": "center", "y": 360 },
      "style": {
        "fontSize": 20,
        "fontWeight": "400",
        "color": "#CBD5E1",
        "textAlign": "center"
      }
    },
    {
      "type": "text",
      "id": "body_line3",
      "content": "{{i18n.waitlist_card.body_line3}}",
      "position": { "x": "center", "y": 420 },
      "style": {
        "fontSize": 20,
        "fontWeight": "600",
        "color": "#FFFFFF",
        "textAlign": "center"
      }
    },
    {
      "type": "text",
      "id": "cta_intro",
      "content": "{{i18n.waitlist_card.cta_intro}}",
      "position": { "x": "center", "y": 520 },
      "style": {
        "fontSize": 18,
        "fontWeight": "400",
        "color": "#CBD5E1",
        "textAlign": "center"
      }
    },
    {
      "type": "dynamic",
      "id": "referral_url",
      "dataKey": "referral_code",
      "content": "diboas.com/?ref={{referral_code}}",
      "position": { "x": "center", "y": 560 },
      "style": {
        "fontSize": 22,
        "fontWeight": "700",
        "color": "#5EEAD4",
        "textAlign": "center"
      }
    }
  ],
  "footer": {
    "y": 680,
    "showDivider": true,
    "dividerColor": "#334155",
    "padding": 100,
    "branding": "#WhileISlept",
    "brandingSize": 20,
    "brandingColor": "#FFFFFF"
  }
}
```

---

## 5. CLO Compliance Requirements

### 5.1 Dream Card Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| "PROJECTION" watermark | Top-left, Amber color, always visible | ✅ Required |
| Watermark embedded in image | Part of canvas render, not overlay | ✅ Required |
| Past performance disclaimer | Footer text, embedded in image | ✅ Required |
| No "invest" language | Uses "grow", "could become" | ✅ Verified |
| Bank comparison source | ECB average (0.5%) | ✅ Documented |

### 5.2 Regional Variations

For PT-BR users, add BCB disclaimer to footer if sharing outside Dream Mode context.

---

## 6. Implementation Notes

### 6.1 Card Generation

```typescript
// Example: Generate Dream Card
const card = new CardRenderer(dreamCardTemplate);

card.setData({
  start: 500,
  end: 794,
  timeframe: '5 years',
  bank_amount: 512,
  locale: 'en'
});

const canvas = await card.render();
const dataUrl = card.toDataURL('image/png');
const blob = await card.toBlob('image/png');
```

### 6.2 Analytics Events

| Event | Trigger | Parameters |
|-------|---------|------------|
| `card_generated` | Card rendered | `card_type`, `locale`, `platform` |
| `card_share_initiated` | User clicks share | `card_type`, `platform` |
| `card_share_completed` | Share successful | `card_type`, `platform` |
| `card_downloaded` | User downloads image | `card_type`, `locale` |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 30, 2025 | CMO Board | Initial specification |
| 2.0 | Dec 31, 2025 | CMO Board | Jargon-free update: "SIMULATION" → "PROJECTION" |

---

**END OF VIRAL CARDS TEMPLATES SPECIFICATION v2**
