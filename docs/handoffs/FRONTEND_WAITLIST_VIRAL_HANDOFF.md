# diBoaS Frontend — Waitlist, Email & Viral Share System Handoff

**Document Purpose:** Complete specification for Claude Code to implement the Waitlist System, Email Automation, and Viral Share Infrastructure
**Created:** December 30, 2025
**Created By:** CTO Board
**For:** Claude Code Implementation in diboas-platform

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Waitlist System](#2-waitlist-system)
3. [Email Automation System](#3-email-automation-system)
4. [Viral Share System](#4-viral-share-system)
5. [Cal.com Integration](#5-calcom-integration)
6. [Project Structure](#6-project-structure)
7. [Implementation Priority](#7-implementation-priority)

---

# 1. EXECUTIVE SUMMARY

## Systems to Build

| System | Description | Integration |
|--------|-------------|-------------|
| **Waitlist System** | User signup, position tracking, referral mechanics | Kit.com (ConvertKit) |
| **Email Automation** | Trigger 4 educational emails on schedule | Kit.com Automations |
| **Viral Share System** | Reusable shareable card infrastructure | Canvas/Image generation |
| **Cal.com Embed** | B2B booking integration | Simple embed |

## Why Kit.com?

Kit.com (formerly ConvertKit) provides:
- Email capture forms
- Subscriber management
- Email automation sequences
- Tagging for segmentation
- API access for custom integrations

---

# 2. WAITLIST SYSTEM

## 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WAITLIST SYSTEM FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   USER                                                                  │
│     │                                                                   │
│     ▼                                                                   │
│   ┌──────────────────┐                                                  │
│   │  Landing Page    │                                                  │
│   │  Waitlist Form   │                                                  │
│   └────────┬─────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────┐     ┌──────────────────┐                        │
│   │  Kit.com Form    │────►│  Kit.com         │                        │
│   │  (Embedded)      │     │  Subscriber DB   │                        │
│   └────────┬─────────┘     └──────────────────┘                        │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────┐                                                  │
│   │  Webhook to      │                                                  │
│   │  diBoaS API      │                                                  │
│   └────────┬─────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────┐     ┌──────────────────┐                        │
│   │  Position        │────►│  Database        │                        │
│   │  Assignment      │     │  (Positions)     │                        │
│   └────────┬─────────┘     └──────────────────┘                        │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────┐                                                  │
│   │  Confirmation    │                                                  │
│   │  + Position #    │                                                  │
│   │  + Referral Link │                                                  │
│   └──────────────────┘                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Waitlist Data Model

```typescript
// lib/waitlist/types.ts

interface WaitlistEntry {
  id: string;                    // UUID
  email: string;                 // User email (from Kit.com)
  kit_subscriber_id: string;     // Kit.com subscriber ID
  position: number;              // Current waitlist position
  original_position: number;     // Position at signup (never changes)
  referral_code: string;         // Unique referral code (e.g., "BAR847")
  referred_by: string | null;    // Referral code used at signup
  referral_count: number;        // Number of successful referrals
  created_at: Date;              // Signup timestamp
  updated_at: Date;              // Last position update
  locale: string;                // User's language preference
  source: string;                // Where they signed up (landing, demo, dream_mode)
  tags: string[];                // Kit.com tags for segmentation
}

interface ReferralEvent {
  id: string;
  referrer_id: string;           // WaitlistEntry.id of referrer
  referee_id: string;            // WaitlistEntry.id of new signup
  created_at: Date;
  positions_moved: number;       // How many spots the referrer moved up
}
```

## 2.3 Position Mechanics

### Initial Position Assignment

```typescript
// When a new user signs up
async function assignPosition(email: string, referralCode?: string): Promise<number> {
  // 1. Get current total waitlist count
  const currentCount = await db.waitlist.count();
  
  // 2. Assign position (end of list)
  const position = currentCount + 1;
  
  // 3. If referred, credit the referrer
  if (referralCode) {
    await creditReferrer(referralCode);
  }
  
  return position;
}
```

### Share-to-Move-Up Mechanic

```typescript
// Referral reward configuration
const REFERRAL_CONFIG = {
  positions_per_referral: 10,    // Move up 10 spots per successful referral
  max_position: 1,               // Can't go below position 1
  notify_referrer: true,         // Send notification when someone uses their code
};

async function creditReferrer(referralCode: string): Promise<void> {
  const referrer = await db.waitlist.findByReferralCode(referralCode);
  if (!referrer) return;
  
  // Calculate new position
  const newPosition = Math.max(
    referrer.position - REFERRAL_CONFIG.positions_per_referral,
    REFERRAL_CONFIG.max_position
  );
  
  // Update referrer
  await db.waitlist.update(referrer.id, {
    position: newPosition,
    referral_count: referrer.referral_count + 1,
    updated_at: new Date(),
  });
  
  // Log referral event
  await db.referralEvents.create({
    referrer_id: referrer.id,
    referee_id: newSignup.id,
    positions_moved: referrer.position - newPosition,
  });
  
  // Optionally notify referrer (via Kit.com or in-app)
  if (REFERRAL_CONFIG.notify_referrer) {
    await notifyReferrer(referrer, newPosition);
  }
}
```

### Referral Code Generation

```typescript
// Generate unique, readable referral codes
function generateReferralCode(position: number): string {
  // Format: First 3 letters of a word + position number
  // Examples: "BAR847", "SUN123", "WIN456"
  const words = ['BAR', 'SUN', 'WIN', 'TOP', 'ACE', 'SKY', 'ZEN', 'MAX'];
  const prefix = words[Math.floor(Math.random() * words.length)];
  return `${prefix}${position}`;
}
```

## 2.4 Kit.com Integration

### Form Embedding

```typescript
// components/Waitlist/WaitlistForm.tsx

'use client';

import { useState } from 'react';
import { useIntl } from 'react-intl';

interface WaitlistFormProps {
  source: 'landing' | 'demo' | 'dream_mode';
  referralCode?: string;
  onSuccess?: (position: number, referralCode: string) => void;
}

export function WaitlistForm({ source, referralCode, onSuccess }: WaitlistFormProps) {
  const intl = useIntl();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          referralCode,
          locale: intl.locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      onSuccess?.(data.position, data.referralCode);
      
    } catch (err) {
      setError(intl.formatMessage({ id: 'waitlist.error.generic' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={intl.formatMessage({ id: 'waitlist.email_placeholder' })}
          required
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-teal-500 focus:outline-none"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-teal-600 py-4 text-lg font-semibold text-white transition-all hover:bg-teal-700 disabled:bg-slate-300"
      >
        {isSubmitting
          ? intl.formatMessage({ id: 'waitlist.submitting' })
          : intl.formatMessage({ id: 'waitlist.cta' })
        }
      </button>
      
      <p className="text-center text-xs text-slate-500">
        {intl.formatMessage({ id: 'waitlist.privacy_note' })}
      </p>
    </form>
  );
}
```

### API Route

```typescript
// app/api/waitlist/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';

const KIT_API_KEY = process.env.KIT_API_KEY;
const KIT_FORM_ID = process.env.KIT_FORM_ID;

export async function POST(request: NextRequest) {
  try {
    const { email, source, referralCode, locale } = await request.json();

    // 1. Subscribe to Kit.com
    const kitResponse = await fetch(
      `https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: KIT_API_KEY,
          email,
          tags: [source, locale, 'waitlist'],
          fields: {
            source,
            locale,
            referred_by: referralCode || '',
          },
        }),
      }
    );

    if (!kitResponse.ok) {
      throw new Error('Kit.com subscription failed');
    }

    const kitData = await kitResponse.json();

    // 2. Create waitlist entry in our database
    const position = await assignPosition(email, referralCode);
    const userReferralCode = generateReferralCode(position);

    const entry = await db.waitlist.create({
      email,
      kit_subscriber_id: kitData.subscription.subscriber.id,
      position,
      original_position: position,
      referral_code: userReferralCode,
      referred_by: referralCode || null,
      referral_count: 0,
      locale,
      source,
      tags: [source, locale],
    });

    // 3. Return success with position and referral code
    return NextResponse.json({
      success: true,
      position: entry.position,
      referralCode: entry.referral_code,
    });

  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}
```

### Kit.com Webhook Handler

```typescript
// app/api/webhooks/kit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const KIT_WEBHOOK_SECRET = process.env.KIT_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Verify webhook signature
  const signature = request.headers.get('X-Kit-Signature');
  const body = await request.text();
  
  const expectedSignature = crypto
    .createHmac('sha256', KIT_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'subscriber.subscriber_activate':
      // Subscriber confirmed email
      await handleSubscriberActivate(event.subscriber);
      break;
    case 'subscriber.subscriber_unsubscribe':
      // Subscriber unsubscribed
      await handleSubscriberUnsubscribe(event.subscriber);
      break;
  }

  return NextResponse.json({ received: true });
}
```

## 2.5 Waitlist Confirmation UI

```typescript
// components/Waitlist/WaitlistConfirmation.tsx

'use client';

import { useIntl } from 'react-intl';
import { motion } from 'framer-motion';

interface WaitlistConfirmationProps {
  position: number;
  referralCode: string;
  onTryDreamMode?: () => void;
}

export function WaitlistConfirmation({
  position,
  referralCode,
  onTryDreamMode,
}: WaitlistConfirmationProps) {
  const intl = useIntl();
  const referralLink = `https://diboas.com/?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    // Show toast notification
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl bg-white p-8 text-center shadow-2xl"
    >
      {/* Celebration */}
      <div className="mb-6">
        <span className="text-6xl">🎉</span>
      </div>

      {/* Headline */}
      <h2 className="mb-2 text-2xl font-bold text-slate-900">
        {intl.formatMessage({ id: 'waitlist.confirmation.headline' })}
      </h2>

      {/* Position */}
      <div className="mb-6">
        <p className="text-lg text-slate-600">
          {intl.formatMessage({ id: 'waitlist.confirmation.position_intro' })}
        </p>
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-5xl font-bold text-teal-600"
        >
          #{position.toLocaleString()}
        </motion.p>
      </div>

      {/* Share to move up */}
      <div className="mb-6 rounded-xl bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">
          {intl.formatMessage({ id: 'waitlist.confirmation.share_intro' })}
        </p>
        <p className="mb-4 text-xs text-slate-500">
          {intl.formatMessage(
            { id: 'waitlist.confirmation.share_benefit' },
            { spots: 10 }
          )}
        </p>
        
        {/* Referral Link */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 rounded-lg bg-white px-3 py-2 text-sm text-slate-600"
          />
          <button
            onClick={copyReferralLink}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
          >
            {intl.formatMessage({ id: 'waitlist.confirmation.copy' })}
          </button>
        </div>
      </div>

      {/* Dream Mode CTA */}
      {onTryDreamMode && (
        <button
          onClick={onTryDreamMode}
          className="w-full rounded-xl bg-slate-900 py-4 text-lg font-semibold text-white transition-all hover:bg-slate-800"
        >
          {intl.formatMessage({ id: 'waitlist.confirmation.dream_mode_cta' })}
        </button>
      )}
    </motion.div>
  );
}
```

---

# 3. EMAIL AUTOMATION SYSTEM

## 3.1 Email Sequence Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    4 EDUCATIONAL EMAIL SEQUENCE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SIGNUP                                                                │
│     │                                                                   │
│     ▼                                                                   │
│   ┌──────────────────┐                                                  │
│   │  Welcome Email   │  Immediate (via Kit.com)                        │
│   │  "You're in!"    │                                                  │
│   └────────┬─────────┘                                                  │
│            │                                                            │
│            │  +7 days                                                   │
│            ▼                                                            │
│   ┌──────────────────┐                                                  │
│   │  Email 1         │  "Why your bank isn't working for you"          │
│   │  THE PROBLEM     │                                                  │
│   └────────┬─────────┘                                                  │
│            │                                                            │
│            │  +7 days                                                   │
│            ▼                                                            │
│   ┌──────────────────┐                                                  │
│   │  Email 2         │  "How DeFi actually works (simply)"             │
│   │  THE EDUCATION   │                                                  │
│   └────────┬─────────┘                                                  │
│            │                                                            │
│            │  +7 days                                                   │
│            ▼                                                            │
│   ┌──────────────────┐                                                  │
│   │  Email 3         │  "Meet Aqua, Mystic & Coral"                    │
│   │  THE GUIDES      │                                                  │
│   └────────┬─────────┘                                                  │
│            │                                                            │
│            │  +7 days                                                   │
│            ▼                                                            │
│   ┌──────────────────┐                                                  │
│   │  Email 4         │  "What's next — and why you're early"           │
│   │  THE PREVIEW     │                                                  │
│   └──────────────────┘                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Kit.com Automation Setup

Kit.com handles all email scheduling natively. Here's what needs to be configured:

### Automation Trigger

| Setting | Value |
|---------|-------|
| **Trigger** | Subscriber added to form |
| **Form** | diBoaS Waitlist Form |
| **Tag filter** | None (all new subscribers) |

### Email Sequence

| Step | Type | Delay | Subject Line |
|------|------|-------|--------------|
| 1 | Email | Immediate | Welcome to diBoaS — You're #{position} 🎉 |
| 2 | Wait | 7 days | — |
| 3 | Email | — | Why your bank isn't working for you |
| 4 | Wait | 7 days | — |
| 5 | Email | — | How DeFi actually works (simply) |
| 6 | Wait | 7 days | — |
| 7 | Email | — | Meet your AI guides: Aqua, Mystic & Coral |
| 8 | Wait | 7 days | — |
| 9 | Email | — | What's next — and why you're early |

### Dynamic Content

Kit.com supports Liquid templating for personalization:

```liquid
Hey {{ subscriber.first_name | default: "there" }},

You're #{{ subscriber.position }} on the diBoaS waitlist.

{% if subscriber.referred_by %}
Thanks for joining through a friend's referral!
{% endif %}

Your personal referral link: https://diboas.com/?ref={{ subscriber.referral_code }}
```

## 3.3 Webhook for Position Updates

```typescript
// When we need to update Kit.com with position changes

async function updateKitSubscriber(
  subscriberId: string,
  fields: Record<string, any>
) {
  await fetch(
    `https://api.convertkit.com/v3/subscribers/${subscriberId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: process.env.KIT_API_SECRET,
        fields,
      }),
    }
  );
}

// Example: Update position after referral
await updateKitSubscriber(entry.kit_subscriber_id, {
  position: newPosition,
  referral_count: entry.referral_count + 1,
});
```

---

# 4. VIRAL SHARE SYSTEM

## 4.1 System Overview

A **reusable** share infrastructure that can power:
- Dream Cards (#WhileISlept)
- Waitlist position cards
- Future shareable achievements
- Any viral content

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      VIRAL SHARE SYSTEM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                     ShareableCardSystem                          │  │
│   │                                                                   │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│   │  │ CardTemplate│  │ CardTemplate│  │ CardTemplate│  ...         │  │
│   │  │ (Dream)     │  │ (Waitlist)  │  │ (Achievement)              │  │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │  │
│   │         │                │                │                      │  │
│   │         └────────────────┼────────────────┘                      │  │
│   │                          ▼                                       │  │
│   │                 ┌─────────────────┐                              │  │
│   │                 │  CardRenderer   │                              │  │
│   │                 │  (Canvas API)   │                              │  │
│   │                 └────────┬────────┘                              │  │
│   │                          │                                       │  │
│   │                          ▼                                       │  │
│   │                 ┌─────────────────┐                              │  │
│   │                 │  ShareManager   │                              │  │
│   │                 └────────┬────────┘                              │  │
│   │                          │                                       │  │
│   │         ┌────────────────┼────────────────┐                      │  │
│   │         ▼                ▼                ▼                      │  │
│   │  ┌───────────┐   ┌───────────┐   ┌───────────┐                  │  │
│   │  │ Instagram │   │ X/Twitter │   │ WhatsApp  │   ...            │  │
│   │  └───────────┘   └───────────┘   └───────────┘                  │  │
│   │                                                                   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Core Types

```typescript
// lib/share/types.ts

export interface ShareableCard {
  id: string;
  type: 'dream' | 'waitlist' | 'achievement' | 'custom';
  template: CardTemplate;
  data: Record<string, any>;
  locale: string;
  generatedAt: Date;
}

export interface CardTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  background: BackgroundConfig;
  elements: CardElement[];
  watermark?: WatermarkConfig;
  footer?: FooterConfig;
}

export interface CardElement {
  type: 'text' | 'image' | 'shape' | 'dynamic';
  id: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style: ElementStyle;
  content?: string;
  dataKey?: string;  // For dynamic content: "{{amount}}"
}

export interface SharePlatform {
  id: 'instagram' | 'twitter' | 'whatsapp' | 'facebook' | 'linkedin' | 'download' | 'copy_link';
  name: string;
  icon: string;
  shareUrl?: string;  // URL template for sharing
  supports: {
    image: boolean;
    text: boolean;
    link: boolean;
  };
}

export interface ShareConfig {
  platforms: SharePlatform[];
  referralCode?: string;
  utmParams?: Record<string, string>;
  analytics?: {
    eventName: string;
    eventParams: Record<string, any>;
  };
}
```

## 4.3 Card Renderer (Canvas API)

```typescript
// lib/share/CardRenderer.ts

export class CardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private template: CardTemplate;
  private data: Record<string, any>;

  constructor(template: CardTemplate) {
    this.template = template;
    this.canvas = document.createElement('canvas');
    this.canvas.width = template.width;
    this.canvas.height = template.height;
    this.ctx = this.canvas.getContext('2d')!;
    this.data = {};
  }

  setData(data: Record<string, any>): this {
    this.data = data;
    return this;
  }

  async render(): Promise<HTMLCanvasElement> {
    // 1. Draw background
    await this.drawBackground();

    // 2. Draw elements
    for (const element of this.template.elements) {
      await this.drawElement(element);
    }

    // 3. Draw watermark (if required)
    if (this.template.watermark) {
      this.drawWatermark();
    }

    // 4. Draw footer (if required)
    if (this.template.footer) {
      this.drawFooter();
    }

    return this.canvas;
  }

  private async drawBackground(): Promise<void> {
    const { background } = this.template;
    
    if (background.type === 'gradient') {
      const gradient = this.ctx.createLinearGradient(
        background.gradient!.start.x,
        background.gradient!.start.y,
        background.gradient!.end.x,
        background.gradient!.end.y
      );
      background.gradient!.stops.forEach(stop => {
        gradient.addColorStop(stop.position, stop.color);
      });
      this.ctx.fillStyle = gradient;
    } else if (background.type === 'solid') {
      this.ctx.fillStyle = background.color!;
    } else if (background.type === 'image') {
      const img = await this.loadImage(background.imageUrl!);
      this.ctx.drawImage(img, 0, 0, this.template.width, this.template.height);
      return;
    }

    this.ctx.fillRect(0, 0, this.template.width, this.template.height);
  }

  private async drawElement(element: CardElement): Promise<void> {
    switch (element.type) {
      case 'text':
        this.drawText(element);
        break;
      case 'dynamic':
        this.drawDynamicText(element);
        break;
      case 'image':
        await this.drawImage(element);
        break;
      case 'shape':
        this.drawShape(element);
        break;
    }
  }

  private drawText(element: CardElement): void {
    const { position, style, content } = element;
    this.ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily || 'system-ui'}`;
    this.ctx.fillStyle = style.color || '#000000';
    this.ctx.textAlign = (style.textAlign as CanvasTextAlign) || 'left';
    this.ctx.fillText(content || '', position.x, position.y);
  }

  private drawDynamicText(element: CardElement): void {
    const { dataKey } = element;
    if (!dataKey) return;

    // Replace {{key}} with actual data
    let content = element.content || `{{${dataKey}}}`;
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    
    for (const match of matches) {
      const key = match.replace(/\{\{|\}\}/g, '');
      const value = this.data[key] ?? '';
      content = content.replace(match, String(value));
    }

    this.drawText({ ...element, content });
  }

  private drawWatermark(): void {
    const { watermark } = this.template;
    if (!watermark) return;

    this.ctx.font = `bold ${watermark.fontSize || 18}px system-ui`;
    this.ctx.fillStyle = watermark.color || '#F59E0B';
    this.ctx.textAlign = watermark.align || 'right';
    this.ctx.fillText(
      watermark.text,
      watermark.position?.x || this.template.width - 40,
      watermark.position?.y || 50
    );
  }

  private drawFooter(): void {
    const { footer } = this.template;
    if (!footer) return;

    // Divider line
    if (footer.showDivider) {
      this.ctx.strokeStyle = footer.dividerColor || '#334155';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(footer.padding || 100, footer.y - 40);
      this.ctx.lineTo(this.template.width - (footer.padding || 100), footer.y - 40);
      this.ctx.stroke();
    }

    // Footer text
    this.ctx.font = `${footer.fontSize || 14}px system-ui`;
    this.ctx.fillStyle = footer.color || '#64748B';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(footer.text, this.template.width / 2, footer.y);

    // Branding
    if (footer.branding) {
      this.ctx.font = `bold ${footer.brandingSize || 18}px system-ui`;
      this.ctx.fillStyle = footer.brandingColor || '#14B8A6';
      this.ctx.fillText(footer.branding, this.template.width / 2, footer.y + 30);
    }
  }

  toDataURL(type: 'image/png' | 'image/jpeg' = 'image/png', quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }

  toBlob(type: 'image/png' | 'image/jpeg' = 'image/png', quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        type,
        quality
      );
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}
```

## 4.4 Share Manager

```typescript
// lib/share/ShareManager.ts

import { ShareConfig, SharePlatform } from './types';

export class ShareManager {
  private config: ShareConfig;
  private imageDataUrl: string | null = null;
  private imageBlob: Blob | null = null;

  constructor(config: ShareConfig) {
    this.config = config;
  }

  setImage(dataUrl: string, blob?: Blob): this {
    this.imageDataUrl = dataUrl;
    this.imageBlob = blob || null;
    return this;
  }

  async share(platformId: string, text?: string): Promise<boolean> {
    const platform = this.config.platforms.find(p => p.id === platformId);
    if (!platform) throw new Error(`Unknown platform: ${platformId}`);

    // Track analytics
    this.trackShare(platformId);

    switch (platformId) {
      case 'download':
        return this.downloadImage();
      case 'copy_link':
        return this.copyLink();
      case 'instagram':
        return this.shareInstagram();
      case 'twitter':
        return this.shareTwitter(text);
      case 'whatsapp':
        return this.shareWhatsApp(text);
      case 'facebook':
        return this.shareFacebook();
      default:
        return this.shareNative(text);
    }
  }

  private downloadImage(): boolean {
    if (!this.imageDataUrl) return false;

    const link = document.createElement('a');
    link.download = `diboas_${Date.now()}.png`;
    link.href = this.imageDataUrl;
    link.click();
    return true;
  }

  private async copyLink(): Promise<boolean> {
    const link = this.buildShareLink();
    await navigator.clipboard.writeText(link);
    return true;
  }

  private shareInstagram(): boolean {
    // Instagram doesn't support direct web sharing
    // Show instructions to save image and share via app
    if (!this.imageDataUrl) return false;
    
    // Download the image
    this.downloadImage();
    
    // Show toast with instructions
    return true;
  }

  private shareTwitter(text?: string): boolean {
    const shareText = text || 'Check out my Dream Mode results! #WhileISlept';
    const shareUrl = this.buildShareLink();
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=450');
    return true;
  }

  private shareWhatsApp(text?: string): boolean {
    const shareText = text || 'Check out my Dream Mode results!';
    const shareUrl = this.buildShareLink();
    
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank');
    return true;
  }

  private shareFacebook(): boolean {
    const shareUrl = this.buildShareLink();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=450');
    return true;
  }

  private async shareNative(text?: string): Promise<boolean> {
    if (!navigator.share) return false;

    const shareData: ShareData = {
      title: 'diBoaS Dream Mode',
      text: text || 'Check out my Dream Mode results!',
      url: this.buildShareLink(),
    };

    // Add image if Web Share API Level 2 is supported
    if (this.imageBlob && navigator.canShare?.({ files: [new File([this.imageBlob], 'dream.png', { type: 'image/png' })] })) {
      shareData.files = [new File([this.imageBlob], 'dream.png', { type: 'image/png' })];
    }

    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return false;
    }
  }

  private buildShareLink(): string {
    let url = 'https://diboas.com';
    
    const params = new URLSearchParams();
    
    if (this.config.referralCode) {
      params.set('ref', this.config.referralCode);
    }
    
    if (this.config.utmParams) {
      Object.entries(this.config.utmParams).forEach(([key, value]) => {
        params.set(key, value);
      });
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  private trackShare(platform: string): void {
    if (!this.config.analytics) return;

    window.dispatchEvent(new CustomEvent(this.config.analytics.eventName, {
      detail: {
        ...this.config.analytics.eventParams,
        platform,
      },
    }));
  }
}
```

## 4.5 Pre-built Templates

### Dream Card Template

```typescript
// lib/share/templates/dreamCard.ts

import { CardTemplate } from '../types';

export const dreamCardTemplate: CardTemplate = {
  id: 'dream_card',
  name: 'Dream Mode Card',
  width: 1200,
  height: 630,
  background: {
    type: 'gradient',
    gradient: {
      start: { x: 0, y: 0 },
      end: { x: 1200, y: 630 },
      stops: [
        { position: 0, color: '#0F172A' },
        { position: 1, color: '#1E293B' },
      ],
    },
  },
  watermark: {
    text: '⚠️ SIMULATION',
    color: '#F59E0B',
    fontSize: 18,
    position: { x: 1160, y: 50 },
    align: 'right',
  },
  elements: [
    {
      type: 'text',
      id: 'headline',
      position: { x: 600, y: 150 },
      style: {
        fontSize: 32,
        color: '#FFFFFF',
        textAlign: 'center',
        fontFamily: 'system-ui',
      },
      content: '💭 In Dream Mode, my money could become',
    },
    {
      type: 'dynamic',
      id: 'amount_transition',
      position: { x: 600, y: 280 },
      style: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#14B8A6',
        textAlign: 'center',
        fontFamily: 'system-ui',
      },
      dataKey: 'amount_display',  // e.g., "€500 → €794.68"
    },
    {
      type: 'text',
      id: 'simulation_overlay',
      position: { x: 600, y: 320 },
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F59E0B',
        textAlign: 'center',
        opacity: 0.3,
      },
      content: 'SIMULATION',
    },
    {
      type: 'dynamic',
      id: 'path_timeframe',
      position: { x: 600, y: 380 },
      style: {
        fontSize: 24,
        color: '#94A3B8',
        textAlign: 'center',
      },
      dataKey: 'path_timeframe',  // e.g., "Balance path • 5 Years"
    },
    {
      type: 'dynamic',
      id: 'bank_comparison',
      position: { x: 600, y: 430 },
      style: {
        fontSize: 20,
        color: '#94A3B8',
        textAlign: 'center',
      },
      dataKey: 'bank_comparison',  // e.g., "My bank would give me: €512.50"
    },
  ],
  footer: {
    y: 530,
    text: 'Based on historical data. Past performance does not guarantee future results.',
    fontSize: 14,
    color: '#64748B',
    branding: 'diboas.com | #WhileISlept',
    brandingColor: '#14B8A6',
    brandingSize: 18,
    showDivider: true,
    dividerColor: '#334155',
    padding: 100,
  },
};
```

### Waitlist Position Card Template

```typescript
// lib/share/templates/waitlistCard.ts

import { CardTemplate } from '../types';

export const waitlistCardTemplate: CardTemplate = {
  id: 'waitlist_card',
  name: 'Waitlist Position Card',
  width: 1200,
  height: 630,
  background: {
    type: 'gradient',
    gradient: {
      start: { x: 0, y: 0 },
      end: { x: 1200, y: 630 },
      stops: [
        { position: 0, color: '#0F172A' },
        { position: 1, color: '#134E4A' },
      ],
    },
  },
  elements: [
    {
      type: 'text',
      id: 'headline',
      position: { x: 600, y: 180 },
      style: {
        fontSize: 36,
        color: '#FFFFFF',
        textAlign: 'center',
        fontFamily: 'system-ui',
      },
      content: "I'm on the diBoaS waitlist",
    },
    {
      type: 'dynamic',
      id: 'position',
      position: { x: 600, y: 320 },
      style: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#14B8A6',
        textAlign: 'center',
        fontFamily: 'system-ui',
      },
      dataKey: 'position_display',  // e.g., "#847"
    },
    {
      type: 'text',
      id: 'cta',
      position: { x: 600, y: 420 },
      style: {
        fontSize: 24,
        color: '#94A3B8',
        textAlign: 'center',
      },
      content: 'Join me and skip the line →',
    },
  ],
  footer: {
    y: 560,
    text: '',
    branding: 'diboas.com | #WhileISlept',
    brandingColor: '#14B8A6',
    brandingSize: 24,
    showDivider: false,
    padding: 100,
  },
};
```

## 4.6 React Components

### ShareableCard Component

```typescript
// components/Share/ShareableCard.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { CardRenderer } from '@/lib/share/CardRenderer';
import { CardTemplate } from '@/lib/share/types';

interface ShareableCardProps {
  template: CardTemplate;
  data: Record<string, any>;
  className?: string;
}

export function ShareableCard({ template, data, className }: ShareableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const renderer = new CardRenderer(template);
    renderer.setData(data).render().then(canvas => {
      setImageUrl(canvas.toDataURL('image/png'));
    });
  }, [template, data]);

  if (!imageUrl) {
    return (
      <div className={`animate-pulse bg-slate-200 ${className}`} 
           style={{ aspectRatio: `${template.width}/${template.height}` }} />
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <img
        src={imageUrl}
        alt="Shareable card"
        className="w-full rounded-xl shadow-xl"
      />
    </div>
  );
}
```

### ShareButtons Component

```typescript
// components/Share/ShareButtons.tsx

'use client';

import { useIntl } from 'react-intl';
import { ShareManager } from '@/lib/share/ShareManager';
import { ShareConfig } from '@/lib/share/types';

interface ShareButtonsProps {
  imageDataUrl: string;
  imageBlob?: Blob;
  config: ShareConfig;
  shareText?: string;
  onShareComplete?: (platform: string, success: boolean) => void;
}

const platformIcons: Record<string, string> = {
  instagram: '📸',
  twitter: '𝕏',
  whatsapp: '💬',
  facebook: '📘',
  download: '⬇️',
  copy_link: '🔗',
};

export function ShareButtons({
  imageDataUrl,
  imageBlob,
  config,
  shareText,
  onShareComplete,
}: ShareButtonsProps) {
  const intl = useIntl();

  const handleShare = async (platformId: string) => {
    const manager = new ShareManager(config);
    manager.setImage(imageDataUrl, imageBlob);
    
    const success = await manager.share(platformId, shareText);
    onShareComplete?.(platformId, success);
  };

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {config.platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => handleShare(platform.id)}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-white transition-all hover:bg-slate-700"
        >
          <span>{platformIcons[platform.id] || '📤'}</span>
          <span>{intl.formatMessage({ id: `share.platform.${platform.id}` })}</span>
        </button>
      ))}
    </div>
  );
}
```

---

# 5. CAL.COM INTEGRATION

## 5.1 Simple Embed (No Custom Code Needed)

```typescript
// components/BookCall/CalEmbed.tsx

'use client';

import { useEffect } from 'react';

interface CalEmbedProps {
  calLink: string;  // e.g., "diboas/discovery-call"
  className?: string;
}

export function CalEmbed({ calLink, className }: CalEmbedProps) {
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className={className}>
      <cal-inline
        calLink={calLink}
        style="width:100%;height:100%;overflow:scroll"
      />
    </div>
  );
}
```

## 5.2 Cal.com Button (Alternative)

```typescript
// components/BookCall/CalButton.tsx

'use client';

import { useEffect } from 'react';
import { useIntl } from 'react-intl';

interface CalButtonProps {
  calLink: string;
  className?: string;
}

export function CalButton({ calLink, className }: CalButtonProps) {
  const intl = useIntl();

  useEffect(() => {
    // Load Cal.com embed script
    (function (C, A, L) {
      let p = function (a: any, ar: any) { a.q.push(ar); };
      let d = C.document;
      (C as any).Cal = (C as any).Cal || function (...args: any[]) {
        let cal = (C as any).Cal;
        if (!cal.q) { cal.q = []; }
        p(cal, args);
      };
    })(window, document, undefined);

    (window as any).Cal('init', { origin: 'https://cal.com' });
  }, []);

  const handleClick = () => {
    (window as any).Cal('modal', {
      calLink,
      config: {
        layout: 'month_view',
      },
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-teal-700 ${className}`}
    >
      {intl.formatMessage({ id: 'book_call.cta' })}
    </button>
  );
}
```

---

# 6. PROJECT STRUCTURE

## New Files to Create

```
apps/web/src/
├── app/
│   └── api/
│       ├── waitlist/
│       │   ├── signup/route.ts          # Waitlist signup endpoint
│       │   ├── position/route.ts        # Get user position
│       │   └── referral/route.ts        # Referral tracking
│       └── webhooks/
│           └── kit/route.ts             # Kit.com webhooks
│
├── components/
│   ├── Waitlist/
│   │   ├── index.ts                     # Barrel export
│   │   ├── WaitlistForm.tsx             # Email capture form
│   │   ├── WaitlistConfirmation.tsx     # Success screen
│   │   ├── WaitlistPosition.tsx         # Position display
│   │   └── ReferralLink.tsx             # Referral link component
│   │
│   ├── Share/
│   │   ├── index.ts                     # Barrel export
│   │   ├── ShareableCard.tsx            # Card preview
│   │   ├── ShareButtons.tsx             # Platform buttons
│   │   └── ShareModal.tsx               # Share modal wrapper
│   │
│   └── BookCall/
│       ├── index.ts                     # Barrel export
│       ├── CalEmbed.tsx                 # Full embed
│       └── CalButton.tsx                # Modal trigger
│
├── lib/
│   ├── waitlist/
│   │   ├── types.ts                     # TypeScript interfaces
│   │   ├── api.ts                       # API client functions
│   │   └── constants.ts                 # Referral config
│   │
│   └── share/
│       ├── types.ts                     # TypeScript interfaces
│       ├── CardRenderer.ts              # Canvas rendering
│       ├── ShareManager.ts              # Share logic
│       └── templates/
│           ├── index.ts                 # Template exports
│           ├── dreamCard.ts             # Dream Mode card
│           └── waitlistCard.ts          # Waitlist card
│
└── messages/
    ├── en/
    │   ├── waitlist.json                # Waitlist translations
    │   └── share.json                   # Share translations
    ├── de/
    │   ├── waitlist.json
    │   └── share.json
    ├── pt-BR/
    │   ├── waitlist.json
    │   └── share.json
    └── es/
        ├── waitlist.json
        └── share.json
```

---

# 7. IMPLEMENTATION PRIORITY

## Updated Timeline

| Day | Task | Components |
|-----|------|------------|
| **Day 1** | Waitlist System | WaitlistForm, Kit.com integration, API routes |
| **Day 1** | Record Founder Video | (Content — no code) |
| **Day 2** | Future You Calculator | (Already spec'd in Dream Mode handoff) |
| **Day 2** | Viral Share System | CardRenderer, ShareManager, templates |
| **Day 3-4** | Dream Mode | (Uses Viral Share System) |
| **Day 5** | Integration | Connect all systems, verify flow |
| **Day 5** | Educational Emails | Configure Kit.com automation |
| **Day 6** | QA + Polish | End-to-end testing |
| **Day 7** | Launch 🚀 | |

## Environment Variables Needed

```env
# Kit.com (ConvertKit)
KIT_API_KEY=your_api_key
KIT_API_SECRET=your_api_secret
KIT_FORM_ID=your_form_id
KIT_WEBHOOK_SECRET=your_webhook_secret

# Cal.com
NEXT_PUBLIC_CAL_LINK=diboas/discovery-call

# Database (for waitlist positions)
DATABASE_URL=your_database_url
```

## Dependencies to Add

```json
{
  "dependencies": {
    // If using a database for positions
    "@prisma/client": "^5.x",
    // or
    "@vercel/kv": "^1.x"
  }
}
```

---

**END OF WAITLIST, EMAIL & VIRAL SHARE HANDOFF**
