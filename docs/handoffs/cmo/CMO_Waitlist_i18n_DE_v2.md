# CMO Board — Waitlist i18n (German)
## VERSION 2.0 — Jargon-Free

**Language:** German (DE)  
**Market:** Germany, Austria, Switzerland  
**Purpose:** Waitlist form, confirmation, referral system, and email sequences  
**Version:** 2.0  
**Date:** December 31, 2025  
**Cultural Note:** Uses formal "Sie" form throughout

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| Email 2 subject | "Wie DeFi wirklich funktioniert" | "Wie Ihr Geld tatsächlich für Sie arbeiten könnte" |
| Email 3 subject | "Lernen Sie Ihre KI-Begleiter kennen" | "Lernen Sie Aqua, Mystic & Coral kennen — Ihre Finanzbegleiter" |
| Terminology | Any DeFi/protocol/crypto references | Plain language throughout |

---

## i18n JSON Structure

```json
{
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
      "share_explanation": "Je früher wir starten, desto eher wird das Realität.",
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
}
```

---

## Email Sequence

### Welcome Email (Immediate)

| Element | Content |
|---------|---------|
| **Subject** | Willkommen bei diBoaS — Sie sind #{position} 🎉 |
| **Preview** | Die Zukunft Ihrer Finanzen beginnt hier |
| **Headline** | Sie sind dabei! |
| **Body** | Willkommen bei diBoaS, {name}. Sie sind #{position} auf der Warteliste. Je früher Sie dabei sind, desto früher erhalten Sie Zugang bei unserem Start. Möchten Sie nach vorne rücken? Teilen Sie Ihren persönlichen Link — jede Anmeldung bringt Sie 10 Plätze nach vorne. |
| **CTA 1** | Link teilen |
| **CTA 2** | Dream Mode ausprobieren |
| **Footer** | Sie erhalten diese E-Mail, weil Sie sich für die diBoaS-Warteliste angemeldet haben. Jederzeit abmeldbar. |

---

### Email 1: The Problem (+7 days)

| Element | Content |
|---------|---------|
| **Subject** | Warum Ihre Bank nicht für Sie arbeitet |
| **Preview** | Die Lücke, über die niemand spricht |
| **Headline** | Lassen Sie mich Ihnen von meiner Großmutter erzählen. |
| **Body** | Sie hat ihr ganzes Leben gespart. Alles richtig gemacht. Hart gearbeitet. Wenig ausgegeben. Jeden Monat Geld auf die Bank gebracht. Und es hat trotzdem nicht gereicht. Das hat ihr niemand gesagt: Ihre Bank zahlte ihr 0,5% Zinsen. Sie verdienten 7% mit ihrem Geld. Diese €65 Differenz bei jedem €1.000? Das sollte ihr gehören. Die gleiche Lücke existiert heute. Mit Ihrem Geld. Genau jetzt. Deshalb baue ich diBoaS. |
| **CTA** | Sehen Sie, was Ihr Geld erreichen könnte |
| **Links to** | Future You Calculator |

---

### Email 2: The Education (+14 days)

| Element | Content |
|---------|---------|
| **Subject** | Wie Ihr Geld tatsächlich für Sie arbeiten könnte |
| **Preview** | Es ist einfacher als Sie denken |
| **Headline** | Was wäre, wenn Ihre Ersparnisse so hart arbeiten würden wie Sie? |
| **Body** | Im Moment liegt Ihr Geld bei einer Bank und verdient fast nichts. Aber es gibt Systeme, wo Geld echte Renditen erwirtschaftet — dieselben, die Banken nutzen. Bis vor kurzem waren diese nur für Institutionen mit Millionen zugänglich. diBoaS ändert das. Wir verbinden Sie mit diesen Möglichkeiten — einfach, sicher und zu Ihren Bedingungen. Kein Fachjargon. Keine Komplexität. Nur Ihr Geld, das härter arbeitet. |
| **CTA** | Dream Mode ausprobieren |
| **Links to** | Dream Mode |

---

### Email 3: The Guides (+21 days)

| Element | Content |
|---------|---------|
| **Subject** | Lernen Sie Aqua, Mystic & Coral kennen — Ihre Finanzbegleiter |
| **Preview** | KI-Begleiter, die wirklich helfen |
| **Headline** | Sie werden auf dieser Reise nicht allein sein. |
| **Body** | Wir bauen etwas Anderes: KI-Begleiter, die lehren, unterstützen und mit Ihnen wachsen. **Aqua** — Ihr ruhiger, klarer Begleiter für alltägliche Entscheidungen. Einfache Erklärungen. Geduldige Antworten. **Mystic** — Wenn Sie tiefer gehen möchten. Strategie-Einblicke. Marktkontext. **Coral** — Ihr Cheerleader. Feiert Erfolge. Hält Sie motiviert. Sie sind keine Bots, die Skripte ablesen. Sie sind Begleiter, die Finanzen menschlich machen. |
| **CTA** | In Aktion sehen |
| **Links to** | Platform preview / Demo |

---

### Email 4: The Preview (+28 days)

| Element | Content |
|---------|---------|
| **Subject** | Was kommt — und warum Sie früh dran sind |
| **Preview** | Der Start rückt näher |
| **Headline** | Sie sind früh dran. Das zählt. |
| **Body** | Position #{position} auf der Warteliste bedeutet, dass Sie zu den Ersten gehören, die Zugang zu diBoaS erhalten. Das kommt: ✓ Echte Renditen auf Ihre Ersparnisse ✓ Sofortige weltweite Zahlungen ohne Gebühren ✓ KI-Begleiter, die Ihnen wirklich helfen zu lernen ✓ Volle Transparenz — sehen Sie genau, wohin Ihr Geld geht Wir sind auf der Zielgeraden. Danke, dass Sie an das glauben, was wir aufbauen. Möchten Sie vor dem Start nach vorne rücken? Teilen Sie Ihren Link. |
| **CTA 1** | Link teilen |
| **CTA 2** | Position prüfen |
| **Links to** | Referral share / Waitlist status |

---

## Contextual Usage

### Waitlist Form (Landing Page)

```
┌─────────────────────────────────────────────┐
│  ┌───────────────────────────────────────┐  │
│  │ Ihre E-Mail-Adresse                   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│         [ Auf die Warteliste ]              │
│                                             │
│  Wir senden Ihnen nur E-Mails über diBoaS.  │
│  Jederzeit abmeldbar.                       │
└─────────────────────────────────────────────┘
```

### Confirmation Screen

```
┌─────────────────────────────────────────────┐
│                    🎉                       │
│                                             │
│           Sie sind dabei!                   │
│   Willkommen in der Zukunft Ihrer Finanzen. │
│                                             │
│            Ihre Position:                   │
│               #847                          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │   Möchten Sie nach vorne rücken?      │  │
│  │                                       │  │
│  │  Teilen Sie Ihren Link — jede         │  │
│  │  Anmeldung bringt Sie 10 Plätze       │  │
│  │  nach vorne                           │  │
│  │                                       │  │
│  │  ┌─────────────────────────┐ [Link ]  │  │
│  │  │ diboas.com/?ref=BAR847  │ kopieren │  │
│  │  └─────────────────────────┘          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│     [ Dream Mode ausprobieren ]             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Character Limits

| Element | Max Characters | Notes |
|---------|----------------|-------|
| `form.email_placeholder` | 30 | Input placeholder |
| `form.cta` | 25 | Button text |
| `confirmation.headline` | 20 | Large display text (German is longer) |
| `confirmation.subhead` | 60 | Supporting text |
| `error.*` | 100 | Error messages (German is longer) |
| Email subjects | 70 | Gmail truncation point |

---

## Cultural Notes

1. **Formal "Sie":** Always use the formal form throughout all copy
2. **Compound words:** German tends to create compound words — keep them readable
3. **Number formatting:** Use German number format (1.234,56 instead of 1,234.56)
4. **Date formatting:** Use DD.MM.YYYY format
5. **Currency:** Use € symbol before amount with space (€ 1.000)

---

**END OF WAITLIST i18n DE v2**
