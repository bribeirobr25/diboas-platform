# CMO Board — Waitlist i18n (Spanish)
## VERSION 2.0 — Jargon-Free

**Language:** Spanish (ES)  
**Market:** Spain, Latin America  
**Purpose:** Waitlist form, confirmation, referral system, and email sequences  
**Version:** 2.0  
**Date:** December 31, 2025  
**Cultural Note:** Uses informal "tú" form for approachable tone

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| Email 2 subject | "Cómo funciona DeFi realmente" | "Cómo tu dinero podría realmente trabajar para ti" |
| Email 3 subject | "Conoce a tus guías de IA" | "Conoce a Aqua, Mystic y Coral — tus guías financieros" |
| Terminology | Any DeFi/protocol/crypto references | Plain language throughout |

---

## i18n JSON Structure

```json
{
  "waitlist": {
    "form": {
      "email_placeholder": "Tu correo electrónico",
      "cta": "Unirse a la lista",
      "submitting": "Uniéndose...",
      "privacy_note": "Solo te enviaremos emails sobre diBoaS. Cancela cuando quieras."
    },
    "error": {
      "generic": "Algo salió mal. Intenta de nuevo.",
      "invalid_email": "Por favor ingresa un correo válido.",
      "already_registered": "¡Ya estás en la lista!",
      "network": "Error de conexión. Verifica tu internet e intenta de nuevo."
    },
    "confirmation": {
      "headline": "¡Estás dentro!",
      "subhead": "Bienvenido al futuro de tus finanzas.",
      "position_intro": "Tu posición:",
      "position_format": "#{position}",
      "share_intro": "¿Quieres subir en la fila?",
      "share_benefit": "Comparte tu enlace — cada registro te sube {spots} posiciones",
      "share_explanation": "Entre más pronto lancemos, más pronto esto se vuelve realidad.",
      "referral_link_label": "Tu enlace personal:",
      "copy": "Copiar enlace",
      "copied": "¡Copiado!",
      "dream_mode_cta": "Probar el Modo Sueño",
      "explore_cta": "Explorar lo que viene"
    },
    "referral": {
      "moved_up": "¡Subiste {spots} posiciones!",
      "new_position": "Nueva posición: #{position}",
      "thanks": "Gracias por correr la voz.",
      "notification_title": "¡Alguien usó tu enlace!",
      "notification_body": "Acabas de subir {spots} posiciones a #{position}"
    },
    "returning_user": {
      "welcome_back": "¡Bienvenido de vuelta!",
      "current_position": "Estás en la posición #{position} de la lista",
      "referral_count": "Has referido a {count} personas",
      "keep_sharing": "¡Sigue compartiendo para subir!"
    }
  }
}
```

---

## Email Sequence

### Welcome Email (Immediate)

| Element | Content |
|---------|---------|
| **Subject** | Bienvenido a diBoaS — Eres el #{position} 🎉 |
| **Preview** | El futuro de tus finanzas empieza aquí |
| **Headline** | ¡Estás dentro! |
| **Body** | Bienvenido a diBoaS, {name}. Eres el #{position} en la lista de espera. Entre más pronto entres, más pronto obtienes acceso cuando lancemos. ¿Quieres subir en la fila? Comparte tu enlace personal — cada registro te sube 10 posiciones. |
| **CTA 1** | Compartir mi enlace |
| **CTA 2** | Probar el Modo Sueño |
| **Footer** | Recibes esto porque te uniste a la lista de espera de diBoaS. Cancela cuando quieras. |

---

### Email 1: The Problem (+7 days)

| Element | Content |
|---------|---------|
| **Subject** | Por qué tu banco no está trabajando para ti |
| **Preview** | La brecha de la que nadie habla |
| **Headline** | Déjame contarte sobre mi abuela. |
| **Body** | Ella ahorró toda su vida. Hizo todo bien. Trabajó duro. Gastó poco. Puso dinero en el banco cada mes. Y aun así no fue suficiente. Esto es lo que nadie le dijo: Su banco le pagaba 0.5% de interés. Ganaban 7% con su dinero. ¿Esos €65 de diferencia por cada €1,000? Eso debía ser de ella. La misma brecha existe hoy. Con tu dinero. Ahora mismo. Por eso estoy construyendo diBoaS. |
| **CTA** | Ver lo que mi dinero podría hacer |
| **Links to** | Future You Calculator |

---

### Email 2: The Education (+14 days)

| Element | Content |
|---------|---------|
| **Subject** | Cómo tu dinero podría realmente trabajar para ti |
| **Preview** | Es más simple de lo que piensas |
| **Headline** | ¿Y si tus ahorros trabajaran tan duro como tú? |
| **Body** | Ahora mismo, tu dinero está en un banco ganando casi nada. Pero hay sistemas donde el dinero genera rendimientos reales — los mismos que usan los bancos. Hasta hace poco, esto solo era accesible para instituciones con millones. diBoaS cambia eso. Te conectamos con estas oportunidades — de forma simple, segura y en tus términos. Sin palabras complicadas. Sin complejidad. Solo tu dinero, trabajando más duro. |
| **CTA** | Probar el Modo Sueño |
| **Links to** | Dream Mode |

---

### Email 3: The Guides (+21 days)

| Element | Content |
|---------|---------|
| **Subject** | Conoce a Aqua, Mystic y Coral — tus guías financieros |
| **Preview** | Compañeros de IA que realmente ayudan |
| **Headline** | No estarás solo en este viaje. |
| **Body** | Estamos construyendo algo diferente: guías de IA que enseñan, apoyan y crecen contigo. **Aqua** — Tu guía tranquilo y claro para decisiones del día a día. Explicaciones simples. Respuestas pacientes. **Mystic** — Para cuando quieras profundizar. Insights de estrategia. Contexto de mercado. **Coral** — Tu porrista. Celebra logros. Te mantiene motivado. No son bots que leen scripts. Son compañeros diseñados para hacer que las finanzas se sientan humanas. |
| **CTA** | Verlos en acción |
| **Links to** | Platform preview / Demo |

---

### Email 4: The Preview (+28 days)

| Element | Content |
|---------|---------|
| **Subject** | Qué viene — y por qué estás temprano |
| **Preview** | El lanzamiento se acerca |
| **Headline** | Estás temprano. Eso importa. |
| **Body** | Ser el #{position} en la lista de espera significa que serás de los primeros en acceder a diBoaS cuando lancemos. Esto es lo que viene: ✓ Rendimientos reales en tus ahorros ✓ Pagos globales instantáneos sin comisiones ✓ Guías de IA que realmente te ayudan a aprender ✓ Transparencia total — ve exactamente a dónde va tu dinero Estamos en la recta final. Gracias por creer en lo que estamos construyendo. ¿Quieres subir antes del lanzamiento? Comparte tu enlace. |
| **CTA 1** | Compartir mi enlace |
| **CTA 2** | Ver mi posición |
| **Links to** | Referral share / Waitlist status |

---

## Contextual Usage

### Waitlist Form (Landing Page)

```
┌─────────────────────────────────────────────┐
│  ┌───────────────────────────────────────┐  │
│  │ Tu correo electrónico                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│         [ Unirse a la lista ]               │
│                                             │
│  Solo te enviaremos emails sobre diBoaS.    │
│  Cancela cuando quieras.                    │
└─────────────────────────────────────────────┘
```

### Confirmation Screen

```
┌─────────────────────────────────────────────┐
│                    🎉                       │
│                                             │
│           ¡Estás dentro!                    │
│   Bienvenido al futuro de tus finanzas.     │
│                                             │
│            Tu posición:                     │
│               #847                          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │   ¿Quieres subir en la fila?          │  │
│  │                                       │  │
│  │  Comparte tu enlace — cada            │  │
│  │  registro te sube 10 posiciones       │  │
│  │                                       │  │
│  │  ┌─────────────────────────┐ [Copiar] │  │
│  │  │ diboas.com/?ref=BAR847  │  enlace  │  │
│  │  └─────────────────────────┘          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│     [ Probar el Modo Sueño ]                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Character Limits

| Element | Max Characters | Notes |
|---------|----------------|-------|
| `form.email_placeholder` | 25 | Input placeholder |
| `form.cta` | 25 | Button text |
| `confirmation.headline` | 20 | Large display text |
| `confirmation.subhead` | 50 | Supporting text |
| `error.*` | 80 | Error messages |
| Email subjects | 60 | Gmail truncation point |

---

## Regional Notes

### Spain vs Latin America

This version is designed to work across both Spain and Latin American markets. Key considerations:

| Aspect | Approach |
|--------|----------|
| **Vocabulary** | Use neutral Spanish that works in both regions |
| **"Tú" vs "Vos"** | Use "tú" form (works everywhere) |
| **Currency** | Use € for Spain, but system should detect region for LatAm currencies |
| **Expressions** | Avoid region-specific slang |

---

## Cultural Notes

1. **Informal "tú":** Use informal tone for approachability
2. **Inverted punctuation:** Remember ¿ and ¡ for questions and exclamations
3. **Number formatting:** Use Spanish format (1.234,56)
4. **Currency:** € for Spain, regional currencies for LatAm
5. **Date formatting:** Use DD/MM/YYYY format

---

**END OF WAITLIST i18n ES v2**
