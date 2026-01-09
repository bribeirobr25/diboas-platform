# CMO Board — Demo Flow: Dream Mode CTA Update
## VERSION 2.0 — Jargon-Free

**Purpose:** Update Demo Screen 5 to include Dream Mode entry point  
**Applies to:** FINAL-Interactive-Demo-Flow.md  
**Target:** Demo completers (both logged-in and anonymous)  
**Languages:** English (EN), German (DE), Portuguese-Brazil (PT-BR), Spanish (ES)  
**Version:** 2.0  
**Date:** December 31, 2025

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| Helper text | "different strategies" | "different approaches" |
| Terminology | Any remaining jargon | Plain language throughout |
| Consistency | Aligned with v2 messaging | Matches all updated CMO docs |

---

## Overview

The Interactive Demo's final screen (Screen 5) currently only has a waitlist CTA. This update adds a secondary CTA for users who are already on the waitlist to try Dream Mode.

### Logic

| User State | Primary CTA | Secondary CTA |
|------------|-------------|---------------|
| **Anonymous** | Join the waitlist | (none) |
| **Logged in (waitlist member)** | Try Dream Mode | Explore what's coming |

---

## Updated Screen 5 Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         SCREEN 5: THE INVITATION                            │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │                                                                  │    │
│     │              THE LEARNING IS REAL.                              │    │
│     │                                                                  │    │
│     │  The gap between what banks earn and what they pay you?         │    │
│     │  That's been there the whole time.                              │    │
│     │                                                                  │    │
│     │              Now you know what my grandma never did.            │    │
│     │                                                                  │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │                                                                  │    │
│     │  [FOR ANONYMOUS USERS]                                          │    │
│     │                                                                  │    │
│     │              [ JOIN THE WAITLIST ]                              │    │
│     │                                                                  │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │                                                                  │    │
│     │  [FOR LOGGED-IN WAITLIST MEMBERS]                               │    │
│     │                                                                  │    │
│     │              [ TRY DREAM MODE ]                                 │    │
│     │                                                                  │    │
│     │     ────────────── or ──────────────                            │    │
│     │                                                                  │    │
│     │              [ Explore what's coming ]                          │    │
│     │                                                                  │    │
│     │  ⓘ Dream Mode: See what different approaches could do          │    │
│     │     with your money — using real historical data.               │    │
│     │                                                                  │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Copy — English (EN)

### Existing Copy (Unchanged)

| Element | Content |
|---------|---------|
| **Headline** | THE LEARNING IS REAL. |
| **Body Line 1** | The gap between what banks earn and what they pay you? |
| **Body Line 2** | That's been there the whole time. |
| **Closing** | Now you know what my grandma never did. |

### New Copy (For Logged-In Users)

| Element | Content |
|---------|---------|
| **Primary CTA** | Try Dream Mode |
| **Divider** | or |
| **Secondary CTA** | Explore what's coming |
| **Helper Text** | Dream Mode: See what different approaches could do with your money — using real historical data. |

### Anonymous Users

| Element | Content |
|---------|---------|
| **Primary CTA** | Join the waitlist |

---

## Copy — German (DE)

### Existing Copy (Unchanged)

| Element | Content |
|---------|---------|
| **Headline** | DAS WISSEN IST ECHT. |
| **Body Line 1** | Die Lücke zwischen dem, was Banken verdienen, und dem, was sie Ihnen zahlen? |
| **Body Line 2** | Die war schon immer da. |
| **Closing** | Jetzt wissen Sie, was meine Großmutter nie erfahren hat. |

### New Copy (For Logged-In Users)

| Element | Content |
|---------|---------|
| **Primary CTA** | Dream Mode ausprobieren |
| **Divider** | oder |
| **Secondary CTA** | Entdecken Sie, was kommt |
| **Helper Text** | Dream Mode: Sehen Sie, was verschiedene Ansätze mit Ihrem Geld erreichen könnten — mit echten historischen Daten. |

### Anonymous Users

| Element | Content |
|---------|---------|
| **Primary CTA** | Auf die Warteliste |

---

## Copy — Portuguese-Brazil (PT-BR)

### Existing Copy (Unchanged)

| Element | Content |
|---------|---------|
| **Headline** | O APRENDIZADO É REAL. |
| **Body Line 1** | A diferença entre o que os bancos ganham e o que te pagam? |
| **Body Line 2** | Sempre esteve lá. |
| **Closing** | Agora você sabe o que minha avó nunca soube. |

### New Copy (For Logged-In Users)

| Element | Content |
|---------|---------|
| **Primary CTA** | Experimentar o Modo Sonho |
| **Divider** | ou |
| **Secondary CTA** | Explorar o que vem por aí |
| **Helper Text** | Modo Sonho: Veja o que diferentes abordagens poderiam fazer com seu dinheiro — usando dados históricos reais. |

### Anonymous Users

| Element | Content |
|---------|---------|
| **Primary CTA** | Entrar na lista de espera |

---

## Copy — Spanish (ES)

### Existing Copy (Unchanged)

| Element | Content |
|---------|---------|
| **Headline** | EL APRENDIZAJE ES REAL. |
| **Body Line 1** | ¿La brecha entre lo que los bancos ganan y lo que te pagan? |
| **Body Line 2** | Siempre estuvo ahí. |
| **Closing** | Ahora sabes lo que mi abuela nunca supo. |

### New Copy (For Logged-In Users)

| Element | Content |
|---------|---------|
| **Primary CTA** | Probar el Modo Sueño |
| **Divider** | o |
| **Secondary CTA** | Explorar lo que viene |
| **Helper Text** | Modo Sueño: Mira lo que diferentes enfoques podrían hacer con tu dinero — usando datos históricos reales. |

### Anonymous Users

| Element | Content |
|---------|---------|
| **Primary CTA** | Unirse a la lista de espera |

---

## i18n JSON Structure

```json
{
  "demo": {
    "screen5": {
      "en": {
        "headline": "THE LEARNING IS REAL.",
        "body_line1": "The gap between what banks earn and what they pay you?",
        "body_line2": "That's been there the whole time.",
        "closing": "Now you know what my grandma never did.",
        "cta_anonymous": "Join the waitlist",
        "cta_logged_in": "Try Dream Mode",
        "divider": "or",
        "cta_secondary": "Explore what's coming",
        "dream_mode_helper": "Dream Mode: See what different approaches could do with your money — using real historical data."
      },
      "de": {
        "headline": "DAS WISSEN IST ECHT.",
        "body_line1": "Die Lücke zwischen dem, was Banken verdienen, und dem, was sie Ihnen zahlen?",
        "body_line2": "Die war schon immer da.",
        "closing": "Jetzt wissen Sie, was meine Großmutter nie erfahren hat.",
        "cta_anonymous": "Auf die Warteliste",
        "cta_logged_in": "Dream Mode ausprobieren",
        "divider": "oder",
        "cta_secondary": "Entdecken Sie, was kommt",
        "dream_mode_helper": "Dream Mode: Sehen Sie, was verschiedene Ansätze mit Ihrem Geld erreichen könnten — mit echten historischen Daten."
      },
      "pt-BR": {
        "headline": "O APRENDIZADO É REAL.",
        "body_line1": "A diferença entre o que os bancos ganham e o que te pagam?",
        "body_line2": "Sempre esteve lá.",
        "closing": "Agora você sabe o que minha avó nunca soube.",
        "cta_anonymous": "Entrar na lista de espera",
        "cta_logged_in": "Experimentar o Modo Sonho",
        "divider": "ou",
        "cta_secondary": "Explorar o que vem por aí",
        "dream_mode_helper": "Modo Sonho: Veja o que diferentes abordagens poderiam fazer com seu dinheiro — usando dados históricos reais."
      },
      "es": {
        "headline": "EL APRENDIZAJE ES REAL.",
        "body_line1": "¿La brecha entre lo que los bancos ganan y lo que te pagan?",
        "body_line2": "Siempre estuvo ahí.",
        "closing": "Ahora sabes lo que mi abuela nunca supo.",
        "cta_anonymous": "Unirse a la lista de espera",
        "cta_logged_in": "Probar el Modo Sueño",
        "divider": "o",
        "cta_secondary": "Explorar lo que viene",
        "dream_mode_helper": "Modo Sueño: Mira lo que diferentes enfoques podrían hacer con tu dinero — usando datos históricos reales."
      }
    }
  }
}
```

---

## Implementation Logic

```typescript
// Screen5CTA.tsx

interface Screen5CTAProps {
  isLoggedIn: boolean;
  onJoinWaitlist: () => void;
  onTryDreamMode: () => void;
  onExplore: () => void;
}

export function Screen5CTA({ 
  isLoggedIn, 
  onJoinWaitlist, 
  onTryDreamMode, 
  onExplore 
}: Screen5CTAProps) {
  const intl = useIntl();

  if (!isLoggedIn) {
    return (
      <button onClick={onJoinWaitlist} className="primary-cta">
        {intl.formatMessage({ id: 'demo.screen5.cta_anonymous' })}
      </button>
    );
  }

  return (
    <div className="cta-stack">
      <button onClick={onTryDreamMode} className="primary-cta">
        {intl.formatMessage({ id: 'demo.screen5.cta_logged_in' })}
      </button>
      
      <span className="divider">
        {intl.formatMessage({ id: 'demo.screen5.divider' })}
      </span>
      
      <button onClick={onExplore} className="secondary-cta">
        {intl.formatMessage({ id: 'demo.screen5.cta_secondary' })}
      </button>
      
      <p className="helper-text">
        {intl.formatMessage({ id: 'demo.screen5.dream_mode_helper' })}
      </p>
    </div>
  );
}
```

---

## Analytics Events

| Event | Trigger | Parameters |
|-------|---------|------------|
| `demo_completed` | User reaches Screen 5 | `locale`, `time_spent` |
| `demo_waitlist_click` | Anonymous user clicks waitlist CTA | `locale` |
| `demo_dream_mode_click` | Logged-in user clicks Dream Mode CTA | `locale`, `waitlist_position` |
| `demo_explore_click` | User clicks secondary CTA | `locale`, `is_logged_in` |

---

## Navigation Destinations

| CTA | Destination |
|-----|-------------|
| **Join the waitlist** | Open waitlist modal / scroll to waitlist form |
| **Try Dream Mode** | Navigate to `/dream-mode` |
| **Explore what's coming** | Navigate to features section or `/learn` |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 30, 2025 | CMO Board | Initial specification |
| 2.0 | Dec 31, 2025 | CMO Board | Jargon-free update: "strategies" → "approaches" |

---

**END OF DEMO FLOW DREAM MODE UPDATE v2**
