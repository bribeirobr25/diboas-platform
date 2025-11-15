# Routing Restructure - Required Fixes

## Critical Blockers (Must Fix Before Deployment)

### Fix #1: TypeScript Syntax Error in benefitsCards-pages.ts

**Error:** Line 162 uses invalid bracket notation in translation keys
```typescript
// CURRENT (WRONG)
title: 'marketing.pages['why-diboas'].benefitsCards.title',
```

**Why it's wrong:** The single quotes around the string contain unescaped brackets, breaking TypeScript parsing

**Solution:**
Since translation JSON uses `"why-diboas"` (hyphenated), the config should use it as-is or convert to camelCase.

Option A: Use hyphenated keys in dot notation (RECOMMENDED)
```typescript
// IF translation uses "why-diboas" at root level:
title: 'marketing.pages[\'why-diboas\'].benefitsCards.title',

// OR BETTER - use proper property access if JSON structure is:
// "pages": { "whyDiboas": { ... } }
title: 'marketing.pages.whyDiboas.benefitsCards.title',
```

**Action Items:**
1. Check translation JSON structure: Is it `"why-diboas"` or `"whyDiboas"`?
2. Run: `pnpm run type-check` to see exact error location
3. Fix all 45+ instances in 'why-diboas' config entry
4. Verify no bracket notation in string literals for any keys

**Affected Code:**
- File: `/apps/web/src/config/benefitsCards-pages.ts`
- Lines: 162-207 (entire 'why-diboas' config)
- All translation key strings starting with `marketing.pages[`

---

### Fix #2: Config Key Mismatch in Personal Pages

**Error:** Page components reference wrong config keys

```typescript
// personal/account/page.tsx line 66
config={HERO_PAGE_CONFIGS.account}

// But hero-pages.ts defines
'personal-account': { ... }
```

**Solution:**
Update all personal page files to use correct config keys

**Files to Update:**
1. `personal/account/page.tsx` - Line 51, 66
   - Change: `getVariantForPageConfig('account')` → `getVariantForPageConfig('personal-account')`
   - Change: `HERO_PAGE_CONFIGS.account` → `HERO_PAGE_CONFIGS['personal-account']`

2. `personal/banking/page.tsx` - Similar changes for banking
3. `personal/investing/page.tsx` - Similar changes for investing
4. `personal/cryptocurrency/page.tsx`
5. `personal/defi-strategies/page.tsx`
6. `personal/credit/page.tsx`

**Check List:**
```typescript
// For each personal page, verify:
getVariantForPageConfig('personal-{page}')
HERO_PAGE_CONFIGS['personal-{page}']
FAQ_ACCORDION_PAGE_CONFIGS.personal{Page}
STICKY_FEATURES_NAV_PAGE_CONFIGS['personal-{page}']
FEATURE_SHOWCASE_PAGE_CONFIGS['personal-{page}']
```

---

### Fix #3: Verify Translation Key Format Consistency

**Issue:** Hero config uses hyphenated keys but JSON structure needs verification

**Current References (hero-pages.ts):**
```typescript
title: 'marketing.pages.why-diboas.hero.title'      // Hyphenated
title: 'marketing.pages.personal.account.hero.title' // Dot notation
title: 'marketing.pages.learn.overview.hero.title'   // Dot notation
```

**Action Steps:**
1. Verify exact JSON structure:
```bash
cd /Users/simonekugler/Desktop/diboas-platform
python3 -c "import json; f=open('packages/i18n/translations/en/marketing.json'); data=json.load(f); print(list(data['pages'].keys()))"
```

2. If "why-diboas" appears with hyphens, confirm it's correct:
   - Should be hyphenated in JSON key names: `"why-diboas": {...}`
   - Should use hyphenated in dot notation: `marketing.pages.why-diboas.hero.title`

3. Check all 4 locale files have same structure:
   - `packages/i18n/translations/pt-BR/marketing.json`
   - `packages/i18n/translations/es/marketing.json`
   - `packages/i18n/translations/de/marketing.json`

---

## Step-by-Step Fix Process

### Step 1: Identify Exact Issue (5 minutes)
```bash
cd /Users/simonekugler/Desktop/diboas-platform/apps/web
pnpm run type-check 2>&1 | grep "benefitsCards-pages.ts" | head -5
```

### Step 2: Fix benefitsCards-pages.ts (30 minutes)
```bash
# Open the file in your editor
# Find all lines with marketing.pages['why-diboas']
# Replace with marketing.pages.whyDiboas
# (if JSON uses camelCase) OR
# Replace with escaped quotes for hyphenated keys
```

### Step 3: Fix Personal Page Components (20 minutes)
For each file in `apps/web/src/app/[locale]/(marketing)/personal/*/page.tsx`:
1. Update variant key references
2. Update config property access
3. Check all config references are consistent

### Step 4: Test the Fixes (10 minutes)
```bash
cd /Users/simonekugler/Desktop/diboas-platform
pnpm run type-check      # Should pass without errors
pnpm run build          # Should complete successfully
pnpm run dev:web        # Should start successfully
```

### Step 5: Manual Testing (15 minutes)
```
□ http://localhost:3000/en/why-diboas - Loads with hero section
□ http://localhost:3000/en/personal/account - Loads correctly
□ http://localhost:3000/en/personal/banking - Loads correctly
□ http://localhost:3000/en/learn/overview - Loads correctly
□ Navigation menu shows all items
□ All CTAs working
□ SEO metadata present (inspect HTML head)
```

---

## Translation Key Reference

### Current Translation JSON Structure (Verified)
```json
{
  "pages": {
    "why-diboas": {           // Hyphenated key
      "hero": { "title": "..." },
      "benefitsCards": { ... },
      ...
    },
    "personal": {
      "account": { ... },
      "banking": { ... },
      ...
    },
    "learn": {
      "overview": { ... }
    },
    "business": {
      "advantages": { ... }
    },
    "rewards": {
      "overview": { ... }
    },
    "security": {
      "protection": { ... }
    }
  }
}
```

### How to Reference These in Code

**Option A: Hyphenated keys (like "why-diboas")**
```typescript
// Must escape in dot notation or use bracket notation
'marketing.pages[\'why-diboas\'].hero.title'
```

**Option B: CamelCase conversion (recommended)**
If JSON is auto-converted or if you want consistency:
```typescript
'marketing.pages.whyDiboas.hero.title'
// But JSON must use "whyDiboas" not "why-diboas"
```

**Current Project Pattern:** Uses hyphenated keys in JSON, but inconsistent in code

---

## Validation Script

Run this to identify all remaining issues:

```bash
#!/bin/bash
echo "=== Checking for bracket notation in translation keys ==="
grep -r "marketing\.pages\['" apps/web/src/config/ || echo "✅ No bracket notation found"

echo ""
echo "=== Checking for config key mismatches ==="
grep -r "getVariantForPageConfig\|HERO_PAGE_CONFIGS\|FAQ_ACCORDION" apps/web/src/app/ | grep -E "account|banking|investing" || echo "✅ Config references OK"

echo ""
echo "=== Type check ==="
cd apps/web && pnpm run type-check
```

---

## Success Criteria

The fix is complete when:

1. ✅ `pnpm run type-check` passes with zero errors
2. ✅ `pnpm run build` completes successfully
3. ✅ `pnpm run dev:web` starts without errors
4. ✅ All personal/* routes load correctly
5. ✅ No missing translation warnings in console
6. ✅ SEO metadata visible in page source
7. ✅ Navigation menus display correctly
8. ✅ All internal links work

---

## Estimated Timeline

- **Investigation & Fix:** 1-2 hours
- **Testing:** 30 minutes
- **Documentation Update:** 20 minutes
- **Total:** 2-2.5 hours

---

## Prevention for Future Changes

To prevent similar issues in future restructures:

1. **Create a config validation script** that runs on build
2. **Add TypeScript strict mode** to catch syntax errors earlier
3. **Use automated key generation** from translation files
4. **Add config key type safety** with enums/unions
5. **Create PR template** requiring config/routing checklist

