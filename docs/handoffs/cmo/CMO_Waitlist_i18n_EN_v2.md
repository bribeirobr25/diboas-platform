# CMO Board — Waitlist i18n (English)
## VERSION 2.0 — Jargon-Free

**Language:** English (EN)  
**Market:** Global  
**Purpose:** Waitlist form, confirmation, referral system, and email sequences  
**Version:** 2.0  
**Date:** December 31, 2025

---

## VERSION 2.0 CHANGES

| Change | Before | After |
|--------|--------|-------|
| Email 2 subject | "How DeFi actually works (simply)" | "How your money could actually work for you" |
| Email 3 subject | "Meet your AI guides..." | "Meet Aqua, Mystic & Coral — your financial guides" |
| Terminology | Any DeFi/protocol/crypto references | Plain language throughout |

---

## i18n JSON Structure

```json
{
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
}
```

---

## Email Sequence

### Welcome Email (Immediate)

| Element | Content |
|---------|---------|
| **Subject** | Welcome to diBoaS — You're #{position} 🎉 |
| **Preview** | The future of your finances starts here |
| **Headline** | You're in! |
| **Body** | Welcome to diBoaS, {name}. You're #{position} on the waitlist. The earlier you are, the earlier you get access when we launch. Want to move up? Share your personal link — each signup moves you up 10 spots. |
| **CTA 1** | Share your link |
| **CTA 2** | Try Dream Mode |
| **Footer** | You're receiving this because you joined the diBoaS waitlist. Unsubscribe anytime. |

---

### Email 1: The Problem (+7 days)

| Element | Content |
|---------|---------|
| **Subject** | Why your bank isn't working for you |
| **Preview** | The gap nobody talks about |
| **Headline** | Let me tell you about my grandmother. |
| **Body** | She saved her whole life. Did everything right. Worked hard. Spent little. Put money in the bank every month. And it still wasn't enough. Here's what nobody told her: Her bank paid her 0.5% interest. They earned 7% with her money. That €65 difference on every €1,000? That was supposed to be hers. The same gap exists today. With your money. Right now. That's why I'm building diBoaS. |
| **CTA** | See what your money could do |
| **Links to** | Future You Calculator |

---

### Email 2: The Education (+14 days)

| Element | Content |
|---------|---------|
| **Subject** | How your money could actually work for you |
| **Preview** | It's simpler than you think |
| **Headline** | What if your savings worked as hard as you do? |
| **Body** | Right now, your money sits in a bank earning almost nothing. But there are systems where money earns real returns — the same ones banks use. Until recently, these were only accessible to institutions with millions. diBoaS changes that. We connect you to these opportunities — simply, safely, and on your terms. No jargon. No complexity. Just your money, working harder. |
| **CTA** | Try Dream Mode |
| **Links to** | Dream Mode |

---

### Email 3: The Guides (+21 days)

| Element | Content |
|---------|---------|
| **Subject** | Meet Aqua, Mystic & Coral — your financial guides |
| **Preview** | AI companions that actually help |
| **Headline** | You won't be alone on this journey. |
| **Body** | We're building something different: AI guides that teach, support, and grow with you. **Aqua** — Your calm, clear guide for everyday decisions. Simple explanations. Patient answers. **Mystic** — For when you want to go deeper. Strategy insights. Market context. **Coral** — Your cheerleader. Celebrates wins. Keeps you motivated. They're not bots that read scripts. They're companions designed to make finance feel human. |
| **CTA** | See them in action |
| **Links to** | Platform preview / Demo |

---

### Email 4: The Preview (+28 days)

| Element | Content |
|---------|---------|
| **Subject** | What's next — and why you're early |
| **Preview** | Launch is coming |
| **Headline** | You're early. That matters. |
| **Body** | Being #{position} on the waitlist means you'll be among the first to access diBoaS when we launch. Here's what's coming: ✓ Real returns on your savings ✓ Instant global payments with zero fees ✓ AI guides that actually help you learn ✓ Full transparency — see exactly where your money goes We're in the final stretch. Thanks for believing in what we're building. Want to move up before launch? Share your link. |
| **CTA 1** | Share your link |
| **CTA 2** | Check your position |
| **Links to** | Referral share / Waitlist status |

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

## Character Limits

| Element | Max Characters | Notes |
|---------|----------------|-------|
| `form.email_placeholder` | 30 | Input placeholder |
| `form.cta` | 25 | Button text |
| `confirmation.headline` | 15 | Large display text |
| `confirmation.subhead` | 50 | Supporting text |
| `error.*` | 80 | Error messages |
| Email subjects | 60 | Gmail truncation point |

---

## Notes

1. **Position formatting:** Use `toLocaleString()` for position numbers (e.g., "1,234" not "1234")
2. **Referral spots:** Default value is 10, but make this configurable
3. **Dream Mode CTA:** Only show if user is on waitlist
4. **Privacy note:** Links to Privacy Policy should be added by CTO
5. **Email sending:** Respect user timezone for optimal open rates

---

**END OF WAITLIST i18n EN v2**
