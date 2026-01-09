# CMO Board — Waitlist i18n (Portuguese-Brazil)
## VERSION 2.0 — Jargon-Free

**Language:** Portuguese (PT-BR)  
**Market:** Brazil  
**Purpose:** Waitlist form, confirmation, referral system, and email sequences  
**Version:** 2.0  
**Date:** December 31, 2025  
**Cultural Note:** Uses informal "você" form and Brazilian expressions

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| Email 2 subject | "Como DeFi funciona de verdade" | "Como seu dinheiro poderia trabalhar de verdade pra você" |
| Email 3 subject | "Conheça seus guias de IA" | "Conheça Aqua, Mystic & Coral — seus guias financeiros" |
| Terminology | Any DeFi/protocol/crypto references | Plain language throughout |

---

## i18n JSON Structure

```json
{
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
}
```

---

## Email Sequence

### Welcome Email (Immediate)

| Element | Content |
|---------|---------|
| **Subject** | Bem-vindo ao diBoaS — Você é o #{position} 🎉 |
| **Preview** | O futuro das suas finanças começa aqui |
| **Headline** | Você tá dentro! |
| **Body** | Bem-vindo ao diBoaS, {name}. Você é o #{position} na lista de espera. Quanto mais cedo você entrar, mais cedo você ganha acesso quando a gente lançar. Quer subir na fila? Compartilha seu link pessoal — cada cadastro te sobe 10 posições. |
| **CTA 1** | Compartilhar meu link |
| **CTA 2** | Experimentar o Modo Sonho |
| **Footer** | Você tá recebendo isso porque entrou na lista de espera do diBoaS. Cancela quando quiser. |

---

### Email 1: The Problem (+7 days)

| Element | Content |
|---------|---------|
| **Subject** | Por que seu banco não tá trabalhando pra você |
| **Preview** | A diferença que ninguém fala |
| **Headline** | Deixa eu te contar sobre minha avó. |
| **Body** | Ela guardou dinheiro a vida inteira. Fez tudo certo. Trabalhou duro. Gastou pouco. Colocou dinheiro no banco todo mês. E mesmo assim não foi suficiente. Olha o que ninguém contou pra ela: O banco pagava 0,5% de juros. Eles ganhavam 7% com o dinheiro dela. Esses R$65 de diferença a cada R$1.000? Isso era pra ser dela. A mesma diferença existe hoje. Com seu dinheiro. Agora. É por isso que eu tô construindo o diBoaS. |
| **CTA** | Ver o que meu dinheiro poderia fazer |
| **Links to** | Future You Calculator |

---

### Email 2: The Education (+14 days)

| Element | Content |
|---------|---------|
| **Subject** | Como seu dinheiro poderia trabalhar de verdade pra você |
| **Preview** | É mais simples do que você pensa |
| **Headline** | E se suas economias trabalhassem tão duro quanto você? |
| **Body** | Agora, seu dinheiro tá parado no banco ganhando quase nada. Mas existem sistemas onde o dinheiro rende de verdade — os mesmos que os bancos usam. Até pouco tempo, isso só era acessível pra instituições com milhões. O diBoaS muda isso. A gente te conecta com essas oportunidades — de forma simples, segura e do seu jeito. Sem palavras difíceis. Sem complicação. Só seu dinheiro trabalhando mais. |
| **CTA** | Experimentar o Modo Sonho |
| **Links to** | Dream Mode |

---

### Email 3: The Guides (+21 days)

| Element | Content |
|---------|---------|
| **Subject** | Conheça Aqua, Mystic & Coral — seus guias financeiros |
| **Preview** | Companheiros de IA que realmente ajudam |
| **Headline** | Você não vai estar sozinho nessa jornada. |
| **Body** | A gente tá construindo algo diferente: guias de IA que ensinam, apoiam e crescem com você. **Aqua** — Seu guia calmo e claro pra decisões do dia a dia. Explicações simples. Respostas pacientes. **Mystic** — Pra quando você quiser ir mais fundo. Insights de estratégia. Contexto de mercado. **Coral** — Seu torcedor. Celebra conquistas. Te mantém motivado. Eles não são robôs que leem scripts. São companheiros feitos pra fazer finanças parecer humano. |
| **CTA** | Ver eles em ação |
| **Links to** | Platform preview / Demo |

---

### Email 4: The Preview (+28 days)

| Element | Content |
|---------|---------|
| **Subject** | O que vem por aí — e por que você tá na frente |
| **Preview** | O lançamento tá chegando |
| **Headline** | Você tá na frente. Isso importa. |
| **Body** | Ser o #{position} na lista de espera significa que você vai ser um dos primeiros a ter acesso ao diBoaS quando a gente lançar. Olha o que vem: ✓ Rendimentos reais nas suas economias ✓ Pagamentos globais instantâneos sem taxas ✓ Guias de IA que realmente te ajudam a aprender ✓ Transparência total — veja exatamente pra onde seu dinheiro vai A gente tá na reta final. Valeu por acreditar no que estamos construindo. Quer subir antes do lançamento? Compartilha seu link. |
| **CTA 1** | Compartilhar meu link |
| **CTA 2** | Ver minha posição |
| **Links to** | Referral share / Waitlist status |

---

## Contextual Usage

### Waitlist Form (Landing Page)

```
┌─────────────────────────────────────────────┐
│  ┌───────────────────────────────────────┐  │
│  │ Seu email                             │  │
│  └───────────────────────────────────────┘  │
│                                             │
│         [ Entrar na lista ]                 │
│                                             │
│  A gente só manda email sobre o diBoaS.     │
│  Cancela quando quiser.                     │
└─────────────────────────────────────────────┘
```

### Confirmation Screen

```
┌─────────────────────────────────────────────┐
│                    🎉                       │
│                                             │
│           Você tá dentro!                   │
│   Bem-vindo ao futuro das suas finanças.    │
│                                             │
│            Sua posição:                     │
│               #847                          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │        Quer subir na fila?            │  │
│  │                                       │  │
│  │  Compartilha seu link — cada          │  │
│  │  cadastro te sobe 10 posições         │  │
│  │                                       │  │
│  │  ┌─────────────────────────┐ [Copiar] │  │
│  │  │ diboas.com/?ref=BAR847  │   link   │  │
│  │  └─────────────────────────┘          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│     [ Experimentar o Modo Sonho ]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## BCB Disclaimer

**REQUIRED on all email footers:**

> O diBoaS NÃO é uma instituição financeira autorizada pelo Banco Central do Brasil.

---

## Character Limits

| Element | Max Characters | Notes |
|---------|----------------|-------|
| `form.email_placeholder` | 20 | Input placeholder |
| `form.cta` | 20 | Button text |
| `confirmation.headline` | 20 | Large display text |
| `confirmation.subhead` | 50 | Supporting text |
| `error.*` | 80 | Error messages |
| Email subjects | 60 | Gmail truncation point |

---

## Cultural Notes

1. **Informal "você":** Use informal tone throughout — approachable and friendly
2. **Contractions:** Use Brazilian contractions like "tá" (está), "pra" (para)
3. **Local expressions:** Use Brazilian expressions where natural
4. **Currency:** Use R$ symbol before amount (R$1.000,00)
5. **Number formatting:** Use Brazilian format (1.234,56)
6. **Date formatting:** Use DD/MM/YYYY format

---

**END OF WAITLIST i18n PT-BR v2**
