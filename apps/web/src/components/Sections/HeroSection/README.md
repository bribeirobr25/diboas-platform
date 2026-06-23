# HeroSection Variant Architecture

## 🏗️ **Improved Architecture Overview**

The new HeroSection architecture follows the **Component Composition Pattern** for maximum scalability, maintainability, and reusability.

### **Architecture Benefits:**

✅ **Scalability**: Easy to add unlimited variants without touching existing code  
✅ **Maintenance**: Each variant is isolated with its own CSS and logic  
✅ **Performance**: Dynamic imports for non-critical variants (bundle splitting)  
✅ **Security**: Centralized validation and error handling  
✅ **Reusability**: Shared design tokens and utilities across variants  
✅ **Testing**: Each variant can be tested in isolation

---

## 📁 **File Structure**

```
HeroSection/
├── HeroSectionFactory.tsx          # Main component (single entry point)
├── variants/
│   ├── types.ts                    # Shared TypeScript interfaces
│   ├── registry.ts                 # Variant registry and dynamic loading
│   ├── HeroDefault/
│   │   ├── HeroDefault.tsx         # Default variant component
│   │   └── HeroDefault.module.css  # Isolated CSS for default variant
│   ├── HeroFullBackground/
│   │   ├── HeroFullBackground.tsx  # Full background variant
│   │   └── HeroFullBackground.module.css
│   ├── HeroCinematic/             # Cinematic (GSAP + Three.js) variant — the redesign hero
│   └── [future variants...]       # Easy to add new variants
└── index.ts                        # Barrel export
```

---

## 🚀 **Usage Examples**

### **1. Basic Usage (Same API)**

```tsx
import { HeroSection } from '@/components/Sections/HeroSection';

// Default variant
<HeroSection />

// Existing variants (no breaking changes)
<HeroSection variant="fullBackground" />

// Cinematic variant (GSAP + Three.js) — the redesign landing hero
<HeroSection variant="cinematic" />
```

### **2. Custom Configuration**

{% raw %}

```tsx
<HeroSection
  variant="fullBackground"
  config={{
    content: {
      title: 'Custom Title',
      description: 'Custom description',
      ctaText: 'Custom CTA',
      ctaHref: '/custom-link',
    },
  }}
  backgroundColor="#f0f9ff"
  enableAnalytics={true}
/>
```

{% endraw %}

### **3. Page-Specific Implementations**

**Homepage (Default Variant):**

```tsx
// app/[locale]/page.tsx
<HeroSection
  variant="default"
  priority={true} // Above fold optimization
/>
```

**Secondary page (Full Background):**

```tsx
<HeroSection variant="fullBackground" config={PAGE_HERO_CONFIG} />
```

---

## ➕ **Adding New Variants (Super Easy!)**

### **Step 1: Create Variant Component**

```tsx
// variants/HeroVideo/HeroVideo.tsx
export function HeroVideo({ config, onCTAClick }: HeroVariantProps) {
  return (
    <section>
      <video autoPlay muted loop>
        <source src={config.videoAssets.src} type="video/mp4" />
      </video>
      {/* Rest of component */}
    </section>
  );
}
```

### **Step 2: Create Variant Styles**

```css
/* variants/HeroVideo/HeroVideo.module.css */
.section {
  position: relative;
  overflow: hidden;
}

.video {
  width: 100%;
  height: 100vh;
  object-fit: cover;
}
```

### **Step 3: Register Variant**

```tsx
// variants/registry.ts
// Above-the-fold hero variants are STATICALLY imported (no dynamic()) so the
// LCP hero isn't gated on a lazy chunk. (The heavy WebGL scene inside
// HeroCinematic is what's lazy-loaded — via useWebGLScene — not the variant.)
import { HeroVideo } from './HeroVideo/HeroVideo';

export const HERO_VARIANT_REGISTRY = {
  default: HeroDefault,
  fullBackground: HeroFullBackground,
  cinematic: HeroCinematic,
  video: HeroVideo, // ← Just add this line!
};
```

### **Step 4: Use Immediately**

```tsx
<HeroSection variant="video" /> // ← Works immediately!
```

---

## 🔄 **Migration Path**

### **Phase 1: Gradual Migration (No Breaking Changes)**

- Keep existing HeroSection.tsx as-is
- Import HeroSectionFactory as HeroSectionNew
- Test new architecture in parallel
- Gradually migrate pages to use new variants

### **Phase 2: Switch Implementation**

- Replace HeroSection.tsx with HeroSectionFactory.tsx
- All existing usage continues to work (same API)
- Old CSS can be gradually removed as variants are isolated

### **Phase 3: Clean Up**

- Remove old monolithic CSS
- Clean up unused code
- Optimize bundle splitting

---

## 📊 **Current vs. New Comparison**

| Aspect               | Current Approach              | New Architecture             |
| -------------------- | ----------------------------- | ---------------------------- |
| **Adding Variants**  | Edit CSS + Component + Config | Create new folder + Register |
| **CSS Organization** | One large file                | Isolated per variant         |
| **Bundle Size**      | All variants loaded           | Dynamic loading              |
| **Testing**          | Hard to isolate               | Easy per-variant testing     |
| **Maintenance**      | Touch multiple files          | Isolated changes             |
| **Type Safety**      | Limited                       | Full TypeScript support      |
| **Performance**      | Monolithic CSS                | Optimized per variant        |

---

## 🎯 **Best Practices**

### **1. Variant Naming Convention**

- Use descriptive names: `minimal`, `fullBackground`, `video`, `split`
- Avoid generic names: `variant1`, `type2`, `version3`

### **2. Design Token Usage**

- Always use design tokens from centralized system
- Never hardcode values in variant CSS
- Reuse tokens across variants when possible

### **3. Performance Optimization**

- Critical variants (above-fold): Static import
- Non-critical variants: Dynamic import
- Use priority prop for above-fold content

### **4. Error Handling**

- Always provide fallback to default variant
- Validate configurations in development
- Handle image loading errors gracefully

---

## 🚀 **Benefits Summary**

This architecture provides **unlimited scalability** for HeroSection variations while maintaining:

- **Zero breaking changes** to existing usage
- **Isolated maintenance** per variant
- **Optimized performance** with code splitting
- **Enhanced security** with centralized validation
- **Better developer experience** with TypeScript support

The approach follows all 13 architectural principles and provides a foundation for scaling to any number of hero variants needed for the platform.
