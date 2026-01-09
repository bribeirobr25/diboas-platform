# CMO Board — Waitlist i18n Copy (All Languages)
## VERSION 2.0 — Consolidated & Jargon-Free

**Languages:** English (EN), German (DE), Portuguese-Brazil (PT-BR), Spanish (ES)  
**Purpose:** Waitlist form, confirmation, referral system, and email sequences  
**Version:** 2.0  
**Date:** December 31, 2025

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| Email 2 subject | "How DeFi actually works (simply)" | "How your money could actually work for you" |
| Email 3 subject | "Meet your AI guides..." | "Meet Aqua, Mystic & Coral — your financial guides" |
| Terminology | Any DeFi/protocol references | Plain language throughout |
| Consolidation | 4 separate files | Single consolidated file |

---

## Complete JSON Structure

```json
{
  "en": {
    "waitlist": {
      "form": {
        "email_placeholder": "Your email address",
        "cta": "Join the waitlist",
        "submitting": "Joining...",
        "privacy_note": "We'll only email you about diBoaS. Unsubscribe anytime."
      },
      "error": {
        "generic": "Something went wrong. Please try again.",
        "invalid_email": "Please enter a valid email address.",
        "already_registered": "You're already on the waitlist!",
        "network": "Connection error. Please check your internet and try again."
      },
      "confirmation": {
        "headline": "You're in!",
        "subhead": "Welcome to the future of your finances.",
        "position_intro": "Your position:",
        "position_format": "#{position}",
        "share_intro": "Want to move up?",
        "share_benefit": "Share your link — each signup moves you up {spots} spots",
        "share_explanation": "The sooner we launch, the sooner this becomes real.",
        "referral_link_label": "Your personal link:",
        "copy": "Copy link",
        "copied": "Copied!",
        "dream_mode_cta": "Try Dream Mode while you wait",
        "explore_cta": "Explore what's coming"
      },
      "referral": {
        "moved_up": "You moved up {spots} spots!",
        "new_position": "New position: #{position}",
        "thanks": "Thanks for spreading the word.",
        "notification_title": "Someone used your link!",
        "notification_body": "You just moved up {spots} spots to #{position}"
      },
      "returning_user": {
        "welcome_back": "Welcome back!",
        "current_position": "You're currently #{position} on the waitlist",
        "referral_count": "You've referred {count} people",
        "keep_sharing": "Keep sharing to move up!"
      }
    }
  },
  "de": {
    "waitlist": {
      "form": {
        "email_placeholder": "Ihre E-Mail-Adresse",
        "cta": "Auf die Warteliste",
        "submitting": "Wird hinzugefügt...",
        "privacy_note": "Wir senden Ihnen nur E-Mails über diBoaS. Jederzeit abmeldbar."
      },
      "error": {
        "generic": "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
        "invalid_email": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        "already_registered": "Sie sind bereits auf der Warteliste!",
        "network": "Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung."
      },
      "confirmation": {
        "headline": "Sie sind dabei!",
        "subhead": "Willkommen in der Zukunft Ihrer Finanzen.",
        "position_intro": "Ihre Position:",
        "position_format": "#{position}",
        "share_intro": "Möchten Sie nach vorne rücken?",
        "share_benefit": "Teilen Sie Ihren Link — jede Anmeldung bringt Sie {spots} Plätze nach vorne",
        "share_explanation": "Je früher wir starten, desto früher wird das Realität.",
        "referral_link_label": "Ihr persönlicher Link:",
        "copy": "Link kopieren",
        "copied": "Kopiert!",
        "dream_mode_cta": "Dream Mode ausprobieren",
        "explore_cta": "Entdecken Sie, was kommt"
      },
      "referral": {
        "moved_up": "Sie sind {spots} Plätze vorgerückt!",
        "new_position": "Neue Position: #{position}",
        "thanks": "Danke fürs Weitersagen.",
        "notification_title": "Jemand hat Ihren Link verwendet!",
        "notification_body": "Sie sind gerade {spots} Plätze auf #{position} vorgerückt"
      },
      "returning_user": {
        "welcome_back": "Willkommen zurück!",
        "current_position": "Sie sind aktuell #{position} auf der Warteliste",
        "referral_count": "Sie haben {count} Personen empfohlen",
        "keep_sharing": "Teilen Sie weiter, um nach vorne zu rücken!"
      }
    }
  },
  "pt-BR": {
    "waitlist": {
      "form": {
        "email_placeholder": "Seu email",
        "cta": "Entrar na lista",
        "submitting": "Entrando...",
        "privacy_note": "A gente só manda email sobre o diBoaS. Cancela quando quiser."
      },
      "error": {
        "generic": "Algo deu errado. Tenta de novo.",
        "invalid_email": "Coloca um email válido.",
        "already_registered": "Você já tá na lista!",
        "network": "Erro de conexão. Verifica sua internet e tenta de novo."
      },
      "confirmation": {
        "headline": "Você tá dentro!",
        "subhead": "Bem-vindo ao futuro das suas finanças.",
        "position_intro": "Sua posição:",
        "position_format": "#{position}",
        "share_intro": "Quer subir na fila?",
        "share_benefit": "Compartilha seu link — cada cadastro te sobe {spots} posições",
        "share_explanation": "Quanto antes a gente lançar, antes isso vira realidade.",
        "referral_link_label": "Seu link pessoal:",
        "copy": "Copiar link",
        "copied": "Copiado!",
        "dream_mode_cta": "Experimentar o Modo Sonho",
        "explore_cta": "Explorar o que vem por aí"
      },
      "referral": {
        "moved_up": "Você subiu {spots} posições!",
        "new_position": "Nova posição: #{position}",
        "thanks": "Valeu por divulgar.",
        "notification_title": "Alguém usou seu link!",
        "notification_body": "Você acabou de subir {spots} posições pra #{position}"
      },
      "returning_user": {
        "welcome_back": "Bem-vindo de volta!",
        "current_position": "Você tá na posição #{position} da lista",
        "referral_count": "Você indicou {count} pessoas",
        "keep_sharing": "Continua compartilhando pra subir!"
      }
    }
  },
  "es": {
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
}
```

---

## Email Sequence — All Languages

### English (EN)

| Email | Subject Line | Timing |
|-------|--------------|--------|
| Welcome | Welcome to diBoaS — You're #{position} 🎉 | Immediate |
| Email 1 | Why your bank isn't working for you | +7 days |
| Email 2 | How your money could actually work for you | +14 days |
| Email 3 | Meet Aqua, Mystic & Coral — your financial guides | +21 days |
| Email 4 | What's next — and why you're early | +28 days |

### German (DE)

| Email | Subject Line | Timing |
|-------|--------------|--------|
| Welcome | Willkommen bei diBoaS — Sie sind #{position} 🎉 | Immediate |
| Email 1 | Warum Ihre Bank nicht für Sie arbeitet | +7 days |
| Email 2 | Wie Ihr Geld tatsächlich für Sie arbeiten könnte | +14 days |
| Email 3 | Lernen Sie Aqua, Mystic & Coral kennen — Ihre Finanzbegleiter | +21 days |
| Email 4 | Was kommt — und warum Sie früh dran sind | +28 days |

### Portuguese-Brazil (PT-BR)

| Email | Subject Line | Timing |
|-------|--------------|--------|
| Welcome | Bem-vindo ao diBoaS — Você é o #{position} 🎉 | Immediate |
| Email 1 | Por que seu banco não tá trabalhando pra você | +7 days |
| Email 2 | Como seu dinheiro poderia trabalhar de verdade pra você | +14 days |
| Email 3 | Conheça Aqua, Mystic & Coral — seus guias financeiros | +21 days |
| Email 4 | O que vem por aí — e por que você tá na frente | +28 days |

### Spanish (ES)

| Email | Subject Line | Timing |
|-------|--------------|--------|
| Welcome | Bienvenido a diBoaS — Eres el #{position} 🎉 | Immediate |
| Email 1 | Por qué tu banco no está trabajando para ti | +7 days |
| Email 2 | Cómo tu dinero podría realmente trabajar para ti | +14 days |
| Email 3 | Conoce a Aqua, Mystic y Coral — tus guías financieros | +21 days |
| Email 4 | Qué viene — y por qué estás temprano | +28 days |

---

## Copy Reference Table

| Key | EN | DE | PT-BR | ES | Char Limit |
|-----|----|----|-------|-----|------------|
| `form.email_placeholder` | Your email address | Ihre E-Mail-Adresse | Seu email | Tu correo electrónico | 30 |
| `form.cta` | Join the waitlist | Auf die Warteliste | Entrar na lista | Unirse a la lista | 25 |
| `form.submitting` | Joining... | Wird hinzugefügt... | Entrando... | Uniéndose... | 15 |
| `confirmation.headline` | You're in! | Sie sind dabei! | Você tá dentro! | ¡Estás dentro! | 15 |
| `confirmation.subhead` | Welcome to the future of your finances. | Willkommen in der Zukunft Ihrer Finanzen. | Bem-vindo ao futuro das suas finanças. | Bienvenido al futuro de tus finanzas. | 50 |
| `confirmation.copy` | Copy link | Link kopieren | Copiar link | Copiar enlace | 15 |
| `confirmation.copied` | Copied! | Kopiert! | Copiado! | ¡Copiado! | 10 |
| `confirmation.dream_mode_cta` | Try Dream Mode while you wait | Dream Mode ausprobieren | Experimentar o Modo Sonho | Probar el Modo Sueño | 35 |

---

## Contextual Usage

### Waitlist Form (Landing Page)

```
┌─────────────────────────────────────────────┐
│  ┌───────────────────────────────────────┐  │
│  │ Your email address                    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│         [ Join the waitlist ]               │
│                                             │
│  We'll only email you about diBoaS.         │
│  Unsubscribe anytime.                       │
└─────────────────────────────────────────────┘
```

### Confirmation Screen

```
┌─────────────────────────────────────────────┐
│                    🎉                       │
│                                             │
│              You're in!                     │
│   Welcome to the future of your finances.   │
│                                             │
│            Your position:                   │
│               #847                          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │        Want to move up?               │  │
│  │                                       │  │
│  │  Share your link — each signup        │  │
│  │  moves you up 10 spots                │  │
│  │                                       │  │
│  │  ┌─────────────────────────┐ [Copy]   │  │
│  │  │ diboas.com/?ref=BAR847  │  link    │  │
│  │  └─────────────────────────┘          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│     [ Try Dream Mode while you wait ]       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Notes for Implementation

1. **Position formatting:** Use `toLocaleString()` for position numbers (e.g., "1,234" not "1234")
2. **Referral spots:** Default value is 10, but make this configurable
3. **Dream Mode CTA:** Only show if user is on waitlist (not for new signups until confirmed)
4. **Privacy note:** Links to Privacy Policy should be added by CTO
5. **Cultural note (DE):** Use formal "Sie" throughout
6. **Cultural note (PT-BR):** Use informal "você" and Brazilian expressions
7. **Cultural note (ES):** Use informal "tú" for approachable tone

---

## BCB Disclaimer (PT-BR Only)

Add to footer of all PT-BR emails:

> O diBoaS NÃO é uma instituição financeira autorizada pelo Banco Central do Brasil.

---

**END OF WAITLIST i18n v2**
