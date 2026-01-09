# CMO Board — Share i18n Copy (All Languages)
## VERSION 2.0 — Jargon-Free

**Languages:** English (EN), German (DE), Portuguese-Brazil (PT-BR), Spanish (ES)  
**Purpose:** Platform share buttons, toast notifications, and share-related UI  
**Version:** 2.0  
**Date:** December 31, 2025

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| LinkedIn share text | "DeFi yields" | "what's actually possible" |
| Technical terms | "investment strategies" | "different approaches" |
| Removed | Any DeFi/protocol references | Plain language throughout |

---

## Complete JSON Structure

```json
{
  "en": {
    "share": {
      "headline": "Share your dream",
      "subhead": "Show others what's possible",
      "platform": {
        "instagram": "Instagram",
        "twitter": "X / Twitter",
        "whatsapp": "WhatsApp",
        "facebook": "Facebook",
        "linkedin": "LinkedIn",
        "download": "Download image",
        "copy_link": "Copy link",
        "native": "Share..."
      },
      "toast": {
        "link_copied": "Link copied!",
        "download_started": "Downloading...",
        "download_complete": "Image saved!",
        "share_success": "Shared!",
        "share_failed": "Couldn't share. Try downloading instead.",
        "share_cancelled": "Share cancelled"
      },
      "instagram_instructions": "Image saved! Open Instagram and share from your gallery.",
      "card": {
        "cta": "See what yours could do →",
        "generating": "Creating your card...",
        "ready": "Your card is ready!"
      },
      "referral": {
        "intro": "Your personal link:",
        "benefit": "Each signup = {spots} spots up",
        "copied": "Link copied to clipboard!"
      }
    }
  },
  "de": {
    "share": {
      "headline": "Teilen Sie Ihren Traum",
      "subhead": "Zeigen Sie anderen, was möglich ist",
      "platform": {
        "instagram": "Instagram",
        "twitter": "X / Twitter",
        "whatsapp": "WhatsApp",
        "facebook": "Facebook",
        "linkedin": "LinkedIn",
        "download": "Bild herunterladen",
        "copy_link": "Link kopieren",
        "native": "Teilen..."
      },
      "toast": {
        "link_copied": "Link kopiert!",
        "download_started": "Wird heruntergeladen...",
        "download_complete": "Bild gespeichert!",
        "share_success": "Geteilt!",
        "share_failed": "Teilen nicht möglich. Versuchen Sie den Download.",
        "share_cancelled": "Teilen abgebrochen"
      },
      "instagram_instructions": "Bild gespeichert! Öffnen Sie Instagram und teilen Sie aus Ihrer Galerie.",
      "card": {
        "cta": "Sehen Sie, was Ihres erreichen könnte →",
        "generating": "Ihre Karte wird erstellt...",
        "ready": "Ihre Karte ist fertig!"
      },
      "referral": {
        "intro": "Ihr persönlicher Link:",
        "benefit": "Jede Anmeldung = {spots} Plätze nach vorne",
        "copied": "Link in die Zwischenablage kopiert!"
      }
    }
  },
  "pt-BR": {
    "share": {
      "headline": "Compartilhe seu sonho",
      "subhead": "Mostre pros outros o que é possível",
      "platform": {
        "instagram": "Instagram",
        "twitter": "X / Twitter",
        "whatsapp": "WhatsApp",
        "facebook": "Facebook",
        "linkedin": "LinkedIn",
        "download": "Baixar imagem",
        "copy_link": "Copiar link",
        "native": "Compartilhar..."
      },
      "toast": {
        "link_copied": "Link copiado!",
        "download_started": "Baixando...",
        "download_complete": "Imagem salva!",
        "share_success": "Compartilhado!",
        "share_failed": "Não deu pra compartilhar. Tenta baixar a imagem.",
        "share_cancelled": "Compartilhamento cancelado"
      },
      "instagram_instructions": "Imagem salva! Abra o Instagram e compartilhe da sua galeria.",
      "card": {
        "cta": "Veja o que o seu poderia fazer →",
        "generating": "Criando seu card...",
        "ready": "Seu card tá pronto!"
      },
      "referral": {
        "intro": "Seu link pessoal:",
        "benefit": "Cada cadastro = {spots} posições pra cima",
        "copied": "Link copiado!"
      }
    }
  },
  "es": {
    "share": {
      "headline": "Comparte tu sueño",
      "subhead": "Muestra a otros lo que es posible",
      "platform": {
        "instagram": "Instagram",
        "twitter": "X / Twitter",
        "whatsapp": "WhatsApp",
        "facebook": "Facebook",
        "linkedin": "LinkedIn",
        "download": "Descargar imagen",
        "copy_link": "Copiar enlace",
        "native": "Compartir..."
      },
      "toast": {
        "link_copied": "¡Enlace copiado!",
        "download_started": "Descargando...",
        "download_complete": "¡Imagen guardada!",
        "share_success": "¡Compartido!",
        "share_failed": "No se pudo compartir. Intenta descargar la imagen.",
        "share_cancelled": "Compartir cancelado"
      },
      "instagram_instructions": "¡Imagen guardada! Abre Instagram y comparte desde tu galería.",
      "card": {
        "cta": "Mira lo que el tuyo podría hacer →",
        "generating": "Creando tu tarjeta...",
        "ready": "¡Tu tarjeta está lista!"
      },
      "referral": {
        "intro": "Tu enlace personal:",
        "benefit": "Cada registro = {spots} posiciones arriba",
        "copied": "¡Enlace copiado!"
      }
    }
  }
}
```

---

## Platform-Specific Share Text

### Dream Mode Share Text

```json
{
  "en": {
    "twitter": "In Dream Mode, I could grow €{{start}} → €{{end}} in {{timeframe}}. My bank? Only €{{bank}}. #WhileISlept diboas.com",
    "whatsapp": "Check this out — in Dream Mode, I saw what my €{{start}} could become: €{{end}} in {{timeframe}}. My bank would give me {{bank}}. See what yours could do: diboas.com #WhileISlept",
    "linkedin": "I just explored what my savings could become with different strategies. The gap between traditional banking (0.5%) and what's actually possible is eye-opening. Try it yourself: diboas.com #WhileISlept #FinancialLiteracy"
  },
  "de": {
    "twitter": "Im Dream Mode könnte ich €{{start}} → €{{end}} in {{timeframe}} wachsen lassen. Meine Bank? Nur €{{bank}}. #WhileISlept diboas.com",
    "whatsapp": "Schau dir das an — im Dream Mode habe ich gesehen, was aus meinen €{{start}} werden könnte: €{{end}} in {{timeframe}}. Meine Bank würde mir {{bank}} geben. Schau, was deines erreichen könnte: diboas.com #WhileISlept",
    "linkedin": "Ich habe gerade erkundet, was aus meinen Ersparnissen mit verschiedenen Strategien werden könnte. Die Lücke zwischen traditionellem Banking (0,5%) und dem, was tatsächlich möglich ist, ist erstaunlich. Probieren Sie es selbst: diboas.com #WhileISlept"
  },
  "pt-BR": {
    "twitter": "No Modo Sonho, eu poderia crescer €{{start}} → €{{end}} em {{timeframe}}. Meu banco? Só €{{bank}}. #WhileISlept diboas.com",
    "whatsapp": "Olha isso — no Modo Sonho, vi no que meus €{{start}} poderiam virar: €{{end}} em {{timeframe}}. Meu banco me daria {{bank}}. Veja o que o seu poderia fazer: diboas.com #WhileISlept",
    "linkedin": "Acabei de explorar no que minhas economias poderiam se transformar com diferentes estratégias. A diferença entre banco tradicional (0,5%) e o que é realmente possível é impressionante. Experimente você mesmo: diboas.com #WhileISlept"
  },
  "es": {
    "twitter": "En Modo Sueño, podría crecer €{{start}} → €{{end}} en {{timeframe}}. ¿Mi banco? Solo €{{bank}}. #WhileISlept diboas.com",
    "whatsapp": "Mira esto — en Modo Sueño, vi en qué podrían convertirse mis €{{start}}: €{{end}} en {{timeframe}}. Mi banco me daría {{bank}}. Mira lo que podría hacer el tuyo: diboas.com #WhileISlept",
    "linkedin": "Acabo de explorar en qué podrían convertirse mis ahorros con diferentes estrategias. La brecha entre la banca tradicional (0.5%) y lo que realmente es posible es reveladora. Pruébalo tú mismo: diboas.com #WhileISlept"
  }
}
```

### Waitlist Position Share Text

```json
{
  "en": {
    "twitter": "I'm #{{position}} on the @diBoaS waitlist. Banks earn 7% with our savings. They pay us 0.5%. That gap? It's been there the whole time. #WhileISlept",
    "whatsapp": "I just joined the diBoaS waitlist (#{{position}}). Did you know banks earn 7% with our savings but only pay us 0.5%? Check it out: diboas.com/?ref={{referral_code}}"
  },
  "de": {
    "twitter": "Ich bin #{{position}} auf der @diBoaS-Warteliste. Banken verdienen 7% mit unseren Ersparnissen. Sie zahlen uns 0,5%. Diese Lücke? Die war schon immer da. #WhileISlept",
    "whatsapp": "Ich bin gerade der diBoaS-Warteliste beigetreten (#{{position}}). Wussten Sie, dass Banken 7% mit unseren Ersparnissen verdienen, uns aber nur 0,5% zahlen? Schauen Sie es sich an: diboas.com/?ref={{referral_code}}"
  },
  "pt-BR": {
    "twitter": "Eu sou o #{{position}} na lista de espera do @diBoaS. Bancos ganham 7% com nossas economias. Nos pagam 0,5%. Essa diferença? Sempre esteve lá. #WhileISlept",
    "whatsapp": "Acabei de entrar na lista de espera do diBoaS (#{{position}}). Sabia que os bancos ganham 7% com nossas economias mas só nos pagam 0,5%? Dá uma olhada: diboas.com/?ref={{referral_code}}"
  },
  "es": {
    "twitter": "Soy el #{{position}} en la lista de espera de @diBoaS. Los bancos ganan 7% con nuestros ahorros. Nos pagan 0.5%. ¿Esa brecha? Siempre estuvo ahí. #WhileISlept",
    "whatsapp": "Acabo de unirme a la lista de espera de diBoaS (#{{position}}). ¿Sabías que los bancos ganan 7% con nuestros ahorros pero solo nos pagan 0.5%? Échale un vistazo: diboas.com/?ref={{referral_code}}"
  }
}
```

---

## Platform Priority by Market

| Market | Primary | Secondary | Tertiary |
|--------|---------|-----------|----------|
| **EN (Global)** | Twitter/X | LinkedIn | WhatsApp |
| **DE (Germany)** | WhatsApp | LinkedIn | Twitter/X |
| **PT-BR (Brazil)** | WhatsApp | Instagram | Twitter/X |
| **ES (Spain/LatAm)** | WhatsApp | Instagram | Twitter/X |

---

## Character Limits by Platform

| Platform | Text Limit | Notes |
|----------|------------|-------|
| Twitter/X | 280 chars | Include hashtag + URL |
| WhatsApp | 65,536 chars | But keep under 500 for readability |
| LinkedIn | 3,000 chars | Professional tone |
| Instagram | Caption: 2,200 chars | Image-focused, minimal text |
| Facebook | 63,206 chars | But keep under 500 |

---

## Implementation Notes

1. **Platform detection:** Show WhatsApp first on mobile, Twitter/LinkedIn first on desktop
2. **Native share:** Use Web Share API when available (`navigator.share`)
3. **Fallback:** If native share fails, show platform buttons
4. **Instagram:** Always download image first, then show instructions
5. **Character counting:** Include URL and hashtag in character count
6. **UTM parameters:** Add `?utm_source={{platform}}&utm_medium=share&utm_campaign=prelaunch` to URLs

---

**END OF SHARE i18n v2**
