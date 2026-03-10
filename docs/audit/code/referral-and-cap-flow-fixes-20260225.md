# Referral & Founding Member Cap Flow Fixes (v2 — CTO Board Reviewed)

**Date:** 2026-02-25
**Branch:** `pre-launch`
**Author:** Claude Code
**Status:** CTO Board reviewed — ready for execution

---

## Context

After tracing the waitlist referral and founding member cap flows end-to-end, the CTO Board identified 6 gaps plus 5 broader observations. The backend logic is correct (tier determination, atomic slot claiming, referral crediting all work). The gaps are in **client-side persistence**, **frontend adaptation**, **dead code**, and **GDPR compliance**.

This is v2 of the plan, incorporating all CTO Board corrections:
- Bug fix: i18n namespace mismatch in Issue 3
- GDPR fix: sessionStorage instead of cookie for referral persistence (Issue 1)
- DRY fix: config map for tier display (Issue 2), shared referral detection (Issue 5)
- Performance fix: move DB query into fire-and-forget chain (Issue 4)
- Standards fix: design tokens in CSS instead of hardcoded values
- Text fix: remove misleading "priority access" claim (Issue 5)
- Coverage fix: add ReferralCapture to both layout groups (Issue 1)
- Cleanup: dead code removal (Issues 6, 7, 8)

---

## Priority Matrix

| # | Priority | Gap | Impact |
|---|----------|-----|--------|
| 1 | P0 | Referral code not persisted on arrival | Referrals lost if user navigates before signup |
| 2 | P1 | Confirmation screen tier-blind for non-founders | Users don't understand their tier status |
| 3 | P1 | Social proof doesn't adapt when cap is full | UX doesn't reflect system state |
| 4 | P1 | Welcome email missing `foundingMemberSpotsRemaining` | Missed urgency signal for referral sharing |
| 5 | P2 | No referred-user visual indicator on form | Missed conversion opportunity |
| 6 | P2 | Dead `POST /api/waitlist/referral` route | Dead code, potential double-credit risk |
| 7 | P2 | Dead `clearReferralCookie` + `setReferralCookie` functions | Dead code after sessionStorage switch |
| 8 | P3 | Dead email drip i18n keys | Ghost keys with no templates |

---

## Issue 1 (P0): Referral Persistence via sessionStorage

### Problem

When a user arrives via `https://diboas.com/?ref=REFABC123`, the `?ref=` param is only read at form submit time by `getReferralCode()` in `useWaitlistForm.ts`. If the user navigates to any other page before signing up, the param is lost.

### Why sessionStorage, not cookies

The CTO Board identified a GDPR compliance risk: `setReferralCookie()` writes a marketing attribution cookie via `document.cookie`. Under GDPR/ePrivacy (DE and ES markets), non-essential cookies require consent before being set. The `CookieConsent` component only manages an `analytics` category — no `marketing` category exists.

`sessionStorage` avoids this entirely:
- Not covered by ePrivacy cookie rules (browser storage, not a cookie)
- Survives navigation within the same tab session (covers the main scenario)
- Dies when the tab closes (acceptable tradeoff for launch)
- No consent required

### Fix: Capture referral on page load into sessionStorage

**Step 1: Replace cookie functions with sessionStorage in helpers.ts**

**Modified file:** `apps/web/src/lib/waitingList/helpers.ts`

Replace `setReferralCookie`, `getReferralFromStorage`, and `clearReferralCookie` with:

```typescript
/**
 * Stores referral code in sessionStorage (survives cross-page navigation within tab).
 * Uses sessionStorage instead of cookies to avoid GDPR/ePrivacy consent requirements.
 */
export const setReferralStorage = (key: string, referralCode: string): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, referralCode);
  } catch {
    // sessionStorage full or unavailable
  }
};

/**
 * Gets referral code from sessionStorage.
 */
export const getReferralFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Clears referral code from sessionStorage.
 */
export const clearReferralStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // sessionStorage unavailable
  }
};
```

Remove `setReferralCookie` and `clearReferralCookie` (dead code — zero call sites confirmed).

Note: `getReferralFromStorage` keeps the same name and signature but changes implementation from `document.cookie` to `sessionStorage`. The only call site is `useWaitlistForm.ts:getReferralCode()`, which already uses it as a fallback after checking the URL. No call site changes needed for this function.

**Step 2: Create ReferralCapture component**

**New file:** `apps/web/src/components/WaitingList/ReferralCapture.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { setReferralStorage, isValidReferralCode } from '@/lib/waitingList/helpers';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';

/**
 * Captures ?ref= parameter from URL on first page load and persists
 * it in sessionStorage so the referral survives cross-page navigation.
 *
 * Rendered in both (landing) and (marketing) layouts — no UI output.
 */
export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref && isValidReferralCode(ref, REFERRAL_CONFIG.codePrefix)) {
      setReferralStorage(
        REFERRAL_CONFIG.referralCookieName,
        ref.toUpperCase()
      );
    }
  }, []);

  return null;
}
```

Note: `REFERRAL_CONFIG.referralCookieName` is reused as the storage key. The name is a legacy artifact — the key works for any storage mechanism. Renaming the config field is cosmetic and out of scope.

**Step 3: Wire into BOTH layout groups**

The CTO Board identified that `(marketing)/layout.tsx` also wraps children in `<WaitingListProvider>`. Referral links to marketing pages (e.g., `/en/about?ref=REFABC123`) must also capture the code.

**Modified file:** `apps/web/src/app/[locale]/(landing)/layout.tsx`

Add `<ReferralCapture />` inside `WaitingListProvider`:

```tsx
<WaitingListProvider>
  <ReferralCapture />
  {/* existing children */}
</WaitingListProvider>
```

**Modified file:** `apps/web/src/app/[locale]/(marketing)/layout.tsx`

Same addition inside `WaitingListProvider`:

```tsx
<WaitingListProvider>
  <ReferralCapture />
  {/* existing children */}
</WaitingListProvider>
```

**Step 4: Update useWaitlistForm.ts getReferralCode()**

The existing `getReferralCode()` function already works because it:
1. Checks URL param first (still works)
2. Falls back to `getReferralFromStorage()` (now reads sessionStorage instead of cookie)

No changes needed in `useWaitlistForm.ts` for the basic flow.

The `hasReferral` boolean is implemented in Issue 5 via `useState` + `useEffect` (not `useRef`, which wouldn't trigger a re-render for the indicator).

### Verification

1. Navigate to `http://localhost:3000/en?ref=REFHWMMRD`
2. Click to About page, then back to home
3. DevTools > Application > Session Storage — confirm key exists with value `REFHWMMRD`
4. Submit the waitlist form — confirm the API receives `referredBy: "REFHWMMRD"`
5. Close tab, reopen same URL without `?ref=` — sessionStorage is gone (expected)

---

## Issue 2 (P1): Tier-Aware Confirmation Screen

### Problem

`WaitlistConfirmation.tsx` only distinguishes `founding_member` (shows badge) from everything else (generic "Your position" text). Other tiers get no context.

### Fix: Config map pattern (Principle 4 — DRY)

The CTO Board correctly flagged that repeated near-identical JSX blocks violate Principle 4. Use a config map instead.

**Modified file:** `apps/web/src/components/WaitingList/WaitlistConfirmation.tsx`

Add a module-level config map:

```typescript
const TIER_CONFIG: Record<string, { badge?: string; explanation?: string }> = {
  founding_member: {
    badge: 'tier.badge.foundingMember',
    explanation: 'tier.explanation.foundingMember',
  },
  early_member: {
    badge: 'tier.badge.earlyMember',
    explanation: 'tier.explanation.earlyMember',
  },
  priority_waitlist: {
    explanation: 'tier.explanation.priorityWaitlist',
  },
};
```

Replace the existing binary tier check with:

```tsx
const config = tier ? TIER_CONFIG[tier] : undefined;

{/* Position card */}
<div className={styles.positionCard}>
  <span className={styles.positionLabel}>
    {config?.badge ? t(config.badge) : t('confirmation.positionIntro')}
  </span>
  <span className={styles.positionNumber}>
    #{formatPosition(animatedPosition, locale)}
  </span>
</div>

{/* Tier explanation (founding, early, priority only — standard gets none) */}
{config?.explanation ? (
  <p className={styles.tierExplanation}>{t(config.explanation)}</p>
) : null}
```

One position card block, one optional explanation. Adding future tiers requires one map entry instead of two JSX branches.

### CSS addition (using design tokens)

**Modified file:** `apps/web/src/components/WaitingList/WaitlistConfirmation.module.css`

```css
.tierExplanation {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 400px;
}
```

### New i18n keys

See consolidated i18n section at end of plan.

### Verification

1. Founding member → badge "You're a Founding Member!" + explanation about 5 invites
2. Early member → badge "You're an Early Member!" + explanation about being invited
3. Priority waitlist → default label "Your position:" + explanation about sharing
4. Standard → default label "Your position:" + no explanation

---

## Issue 3 (P1): Social Proof Adapts When Cap Is Full

### Problem

When `foundingMemberSpotsRemaining` hits 0, the SocialProofSection hides the spots card. No replacement messaging.

### Fix: Show "cap full" card instead of hiding

**BUG FIX from CTO Board:** The original plan used `t('stats.foundingMembersFull')` which would resolve to `landing-b2c.socialProof.stats.foundingMembersFull` due to the namespace prepend in `SocialProofSection`'s `t()` helper. The existing spots card already works around this by calling `intl.formatMessage({ id: 'waitlist.tier.spotsRemaining' })` directly. We follow the same pattern.

**Modified file:** `apps/web/src/components/Sections/SocialProofSection/SocialProofSection.tsx`

Replace the conditional rendering of the founding member spots card:

```tsx
{/* Founding Member Spots Card */}
{stats.foundingMemberSpotsRemaining != null && stats.foundingMemberSpotsRemaining > 0 ? (
  <article className={styles.card}>
    {/* ... existing spots remaining card (unchanged) ... */}
  </article>
) : stats.foundingMemberSpotsRemaining != null && stats.foundingMemberSpotsRemaining === 0 ? (
  <article className={styles.card}>
    <div className={styles.iconWrapper}>
      <Star className={styles.icon} aria-hidden="true" />
    </div>
    <div className={styles.cardContent}>
      <p className={`${styles.statText} ${isLoading ? styles.loading : ''}`}>
        {intl.formatMessage({ id: 'waitlist.stats.foundingMembersFull' })}
      </p>
    </div>
  </article>
) : null}
```

Note: Uses `intl.formatMessage` directly (not `t()`) to address the namespace mismatch. Key lives in `waitlist.json`, consistent with other waitlist keys.

### Verification

1. Spots > 0 → "X founding member spots remaining" card
2. `UPDATE waitlist_counters SET value = 1200 WHERE key = 'founding_member_count'` in Neon → refresh → "All founding member spots claimed" card
3. Card doesn't flash during loading state

---

## Issue 4 (P1): Welcome Email Missing Spots Remaining

### Problem

The template supports `foundingMemberSpotsRemaining` but `sendWelcomeEmail()` never passes it.

### Fix: Fetch inside fire-and-forget chain (not response path)

**CTO Board correction:** The original plan placed `await getFoundingMemberCount()` in the response path before the fire-and-forget call. This adds a DB round-trip to signup latency. Move it inside the `sendWelcomeEmail` promise chain where it runs asynchronously after the response is sent.

**Modified file:** `apps/web/src/app/api/waitlist/signup/route.ts`

Add `getFoundingMemberCount` to the store import:

```typescript
import {
  addEntry,
  exists,
  getByEmail,
  getByReferralCode,
  processReferral,
  getFoundingMemberCount,
  type WaitlistSource,
  type WaitlistTier,
} from '@/lib/waitingList/store';
```

Modify the `sendWelcomeEmail` function to fetch spots inside the async chain:

```typescript
function sendWelcomeEmail(
  email: string,
  data: {
    position: number;
    referralCode: string;
    referralUrl: string;
    locale: string;
    name?: string;
    tier: string;
  }
): void {
  Promise.all([
    import('@diboas/email'),
    getFoundingMemberCount(),
  ]).then(async ([{ createEmailService, sendViaResend }, foundingMember]) => {
    try {
      const spotsRemaining = Math.max(0, foundingMember.cap - foundingMember.count);
      const emailService = createEmailService({ send: sendViaResend });
      const result = await emailService.sendWelcome(email, {
        position: data.position,
        referralCode: data.referralCode,
        referralUrl: data.referralUrl,
        locale: data.locale,
        name: data.name,
        tier: data.tier as 'founding_member' | 'early_member' | 'priority_waitlist' | 'standard',
        foundingMemberSpotsRemaining: spotsRemaining,
      });

      // ... existing logging + delivery logging (unchanged) ...
```

The `getFoundingMemberCount()` runs in parallel with `import('@diboas/email')` inside the fire-and-forget `Promise.all`. Zero impact on signup response latency.

### Verification

1. Sign up as founding member → Resend dashboard → email shows "X founding member spots remaining"
2. Sign up as non-founder → email does NOT show spots (template only renders for `founding_member`)

---

## Issue 5 (P2): Referred User Visual Indicator

### Problem

Referred users see the same form as direct visitors. No visual acknowledgment.

### Fix: Expose referral detection from useWaitlistForm (Principle 4 — DRY)

**CTO Board correction:** Adding a separate `useState` + `useEffect` in WaitlistForm duplicates the URL + storage check already in `useWaitlistForm`'s `getReferralCode()`. Instead, expose a boolean from the hook.

**Modified file:** `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts`

Add referral detection on mount and expose it. Uses `useState(false)` + `useEffect` to avoid
hydration mismatch (server renders `false`, client sets `true` after mount if referral exists):

```typescript
// Inside useWaitlistForm:
const [hasReferral, setHasReferral] = useState(false);

useEffect(() => {
  setHasReferral(getReferralCode() !== null);
}, []);
```

Add `hasReferral` to the return interface and value:

```typescript
interface UseWaitlistFormReturn {
  formState: FormState;
  error: string | null;
  isLoading: boolean;
  hasReferral: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

// In return:
return {
  formState,
  error,
  isLoading,
  hasReferral,
  handleInputChange,
  handleSubmit,
};
```

**Modified file:** `apps/web/src/components/WaitingList/WaitlistForm.tsx`

Use `hasReferral` from the hook (no new imports needed):

```tsx
const { formState, error, isLoading, hasReferral, handleInputChange, handleSubmit } = useWaitlistForm({
  compact,
  onSuccess,
  onError,
  t,
});

{/* Above the form */}
{hasReferral ? (
  <p className={styles.referralIndicator}>
    {t('referral.invitedIndicator')}
  </p>
) : null}
```

### Text correction

**CTO Board correction:** "you'll get priority access" is misleading — users referred by `standard`/`priority_waitlist` tiers get `standard` (lowest tier), not priority. Changed to honest, generic text:

```
"Invited by a friend"
```

No false promises about access level.

### CSS addition (using design tokens)

**Modified file:** `apps/web/src/components/WaitingList/WaitlistForm.module.css`

```css
.referralIndicator {
  font-size: var(--font-size-sm);
  color: var(--color-brand-primary);
  text-align: center;
  margin-bottom: var(--spacing-md);
  font-weight: 500;
}
```

### Verification

1. `http://localhost:3000/en?ref=REFHWMMRD` → "Invited by a friend" above form
2. `http://localhost:3000/en` (no ref) → no indicator
3. Referral link → navigate to About → return → indicator still shows (sessionStorage from Issue 1)

---

## Issue 6 (P2): Remove Dead POST /api/waitlist/referral

### Problem

`POST /api/waitlist/referral` duplicates referral processing from `signup/route.ts`. Zero frontend call sites. Leaks `referrerEmail` in response (security concern).

### Fix: Delete POST handler, keep GET

**Modified file:** `apps/web/src/app/api/waitlist/referral/route.ts`

- Delete the `POST` export function (lines 134-261)
- Delete the `ProcessReferralResponse` interface (lines 49-55)
- Remove unused imports: `getByEmail`, `csrfProtection` (only used by POST)
- Keep the `GET` export and `ReferralLookupResponse` interface

### Note on 405 behavior

Next.js App Router returns 404 (not 405) for undefined HTTP methods on a route. The verification checklist reflects this — POST to the route will return 404, not 405.

### Verification

1. `curl -X POST http://localhost:3000/api/waitlist/referral ...` → 404
2. `curl http://localhost:3000/api/waitlist/referral?code=REFHWMMRD` → `{ success: true, valid: true }`

---

## Issue 7 (P2): Remove Dead Cookie Functions

### Problem

After switching to sessionStorage in Issue 1, `setReferralCookie` and `clearReferralCookie` in `helpers.ts` are dead code (already had zero call sites before this plan).

### Fix

**Modified file:** `apps/web/src/lib/waitingList/helpers.ts`

Delete `setReferralCookie` and `clearReferralCookie` functions. Replace with `setReferralStorage` and `clearReferralStorage` as specified in Issue 1.

Note: `getReferralFromStorage` keeps its name but changes implementation from `document.cookie` to `sessionStorage.getItem`.

---

## Issue 8 (P3): Remove Dead Email Drip i18n Keys

### Problem

`waitlist.json` contains `email1Subject` through `email4Subject` across all 4 locales. No corresponding email templates exist in `packages/email/src/templates/`. No scheduler, no sending logic. These are ghost keys.

### Fix

**Modified files:** All 4 `waitlist.json` locale files.

Remove the `email1Subject`, `email1Preview`, `email2Subject`, `email2Preview`, `email3Subject`, `email3Preview`, `email4Subject`, `email4Preview` keys. If drip emails are built later, keys will be re-added alongside the templates.

---

## File Change Summary

| # | Action | File | Issue |
|---|--------|------|-------|
| 1 | MODIFY | `apps/web/src/lib/waitingList/helpers.ts` | #1, #7 |
| 2 | CREATE | `apps/web/src/components/WaitingList/ReferralCapture.tsx` | #1 |
| 3 | MODIFY | `apps/web/src/app/[locale]/(landing)/layout.tsx` | #1 |
| 4 | MODIFY | `apps/web/src/app/[locale]/(marketing)/layout.tsx` | #1 |
| 5 | MODIFY | `apps/web/src/components/WaitingList/WaitlistConfirmation.tsx` | #2 |
| 6 | MODIFY | `apps/web/src/components/WaitingList/WaitlistConfirmation.module.css` | #2 |
| 7 | MODIFY | `apps/web/src/components/Sections/SocialProofSection/SocialProofSection.tsx` | #3 |
| 8 | MODIFY | `apps/web/src/app/api/waitlist/signup/route.ts` | #4 |
| 9 | MODIFY | `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts` | #5 |
| 10 | MODIFY | `apps/web/src/components/WaitingList/WaitlistForm.tsx` | #5 |
| 11 | MODIFY | `apps/web/src/components/WaitingList/WaitlistForm.module.css` | #5 |
| 12 | MODIFY | `apps/web/src/app/api/waitlist/referral/route.ts` | #6 |
| 13 | MODIFY | `packages/i18n/translations/en/waitlist.json` | #2, #3, #5, #8 |
| 14 | MODIFY | `packages/i18n/translations/pt-BR/waitlist.json` | #2, #3, #5, #8 |
| 15 | MODIFY | `packages/i18n/translations/es/waitlist.json` | #2, #3, #5, #8 |
| 16 | MODIFY | `packages/i18n/translations/de/waitlist.json` | #2, #3, #5, #8 |
| **Total** | **16 files** (1 create, 15 modify) | |

---

## Execution Order

```
Batch 1 (parallel — no dependencies):
  - Issue 1: sessionStorage helpers + ReferralCapture + both layouts
  - Issue 6: Remove dead POST /api/waitlist/referral
  - Issue 7: Remove dead cookie functions (part of Issue 1 helper changes)
  - Issue 8: Remove dead email drip i18n keys
  - i18n: Add all new translation keys across 4 locales

Batch 2 (after Batch 1):
  - Issue 4: Move getFoundingMemberCount into sendWelcomeEmail fire-and-forget
  - Issue 2: Tier-aware confirmation (needs i18n keys)
  - Issue 3: Cap-full social proof messaging (needs i18n keys)
  - Issue 5: Referral indicator on form (needs Issue 1 + i18n keys)
```

---

## Consolidated i18n Changes

### New keys to ADD in `waitlist.json` (all 4 locales)

**English (`en`):**
```json
"tier.badge.earlyMember": "You're an Early Member!",
"tier.explanation.foundingMember": "You're among the first 1,200. Share your link — you have 5 invites to give friends Founding Member status.",
"tier.explanation.earlyMember": "Invited by a Founding Member. Share your link to help friends get early access.",
"tier.explanation.priorityWaitlist": "You're on the priority waitlist. Share your link to move up and help friends join.",
"referral.invitedIndicator": "Invited by a friend",
"stats.foundingMembersFull": "All founding member spots claimed — join the early access waitlist"
```

**Portuguese-BR (`pt-BR`):**
```json
"tier.badge.earlyMember": "Você é um Membro Inicial!",
"tier.explanation.foundingMember": "Você está entre os primeiros 1.200. Compartilhe seu link — você tem 5 convites para dar status de Membro Fundador.",
"tier.explanation.earlyMember": "Convidado por um Membro Fundador. Compartilhe seu link para ajudar amigos a ter acesso antecipado.",
"tier.explanation.priorityWaitlist": "Você está na lista de espera prioritária. Compartilhe seu link para avançar e ajudar amigos.",
"referral.invitedIndicator": "Convidado por um amigo",
"stats.foundingMembersFull": "Todas as vagas de membro fundador foram preenchidas — entre na lista de espera"
```

**Spanish (`es`):**
```json
"tier.badge.earlyMember": "Eres un Miembro Temprano!",
"tier.explanation.foundingMember": "Estás entre los primeros 1.200. Comparte tu enlace — tienes 5 invitaciones para dar estatus de Miembro Fundador.",
"tier.explanation.earlyMember": "Invitado por un Miembro Fundador. Comparte tu enlace para ayudar a amigos a tener acceso anticipado.",
"tier.explanation.priorityWaitlist": "Estás en la lista de espera prioritaria. Comparte tu enlace para avanzar y ayudar a amigos.",
"referral.invitedIndicator": "Invitado por un amigo",
"stats.foundingMembersFull": "Todas las plazas de miembro fundador ocupadas — únete a la lista de espera"
```

**German (`de`):**
```json
"tier.badge.earlyMember": "Du bist ein Early Member!",
"tier.explanation.foundingMember": "Du gehörst zu den ersten 1.200. Teile deinen Link — du hast 5 Einladungen für den Gründungsmitglied-Status.",
"tier.explanation.earlyMember": "Eingeladen von einem Gründungsmitglied. Teile deinen Link, um Freunden frühen Zugang zu ermöglichen.",
"tier.explanation.priorityWaitlist": "Du bist auf der prioritären Warteliste. Teile deinen Link, um aufzusteigen und Freunden zu helfen.",
"referral.invitedIndicator": "Von einem Freund eingeladen",
"stats.foundingMembersFull": "Alle Gründungsmitglied-Plätze vergeben — tritt der Warteliste bei"
```

### Keys to REMOVE from `waitlist.json` (all 4 locales)

```
email1Subject, email1Preview
email2Subject, email2Preview
email3Subject, email3Preview
email4Subject, email4Preview
```

---

## CTO Board Broader Observations (Noted, Not In Scope)

The following were flagged by the CTO Board as valid but not included in this plan:

| # | Observation | Priority | Notes |
|---|------------|----------|-------|
| 1 | Source attribution lost (`body.source` never sent from frontend) | P2 | Each page rendering WaitlistForm should pass a `source` prop |
| 2 | No self-referral protection | P3 | Same user can sign up with 2 emails, one referring the other |
| 3 | `tryClaimFoundingSlot()` executes write query after cap is full | P3 | Read-first guard would avoid unnecessary I/O |
| 4 | B2B has no waitlist | Info | Intentional — B2B uses Cal.com booking instead |
| 5 | Share page and referral URL are disconnected | P3 | Shared links don't get personalized OG images |
| 6 | `_tier` unused in ReferralLink component | P3 | Could adapt share copy per tier |

These are documented here for future planning but will not be implemented in this execution.

---

## Verification Checklist

After all issues are implemented:

- [ ] `pnpm type-check` passes
- [ ] `pnpm build` passes
- [ ] `pnpm validate:translations` passes (key parity across 4 locales)
- [ ] Referral link → navigate away → return → sign up → referral credited (sessionStorage)
- [ ] Sign up as founding member → confirmation shows badge + explanation
- [ ] Sign up as early member → confirmation shows early member badge + explanation
- [ ] Sign up after cap is full → confirmation shows priority waitlist explanation
- [ ] Social proof shows "All spots claimed" when cap is full
- [ ] Referral link → form shows "Invited by a friend" indicator
- [ ] `POST /api/waitlist/referral` returns 404 (Next.js behavior for missing methods)
- [ ] `GET /api/waitlist/referral?code=...` still works
- [ ] Welcome email for founding member shows spots remaining
- [ ] Welcome email for non-founder does NOT show spots remaining
- [ ] Dead email drip keys removed from all 4 locale files
- [ ] No `document.cookie` usage for referral storage

---

## No Migration Required

All changes are application-level. No database schema changes needed.
