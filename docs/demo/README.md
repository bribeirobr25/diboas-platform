# diBoaS Interactive Demo

This folder contains the interactive demo for the diBoaS platform, designed to showcase core capabilities to prospective users.

## Files

| File | Description |
|------|-------------|
| `demo.jsx` | Main React component - self-contained demo with all screens |
| `DEMO_SPECS.md` | Complete specification document with user flows and requirements |

## Quick Start

### Option 1: Use in Storybook

```jsx
// In your Storybook story file
import DiBoaSDemo from './demo';

export default {
  title: 'Demo/Interactive Demo',
  component: DiBoaSDemo,
};

export const Default = () => <DiBoaSDemo />;
```

### Option 2: Use as Standalone Page

```jsx
// In your Next.js page (e.g., app/demo/page.tsx)
import DiBoaSDemo from '@/docs/demo/demo';

export default function DemoPage() {
  return <DiBoaSDemo />;
}
```

### Option 3: Preview in React Playground

Copy the contents of `demo.jsx` into any React playground (CodeSandbox, StackBlitz, etc.) to preview.

## Features Demonstrated

| Step | Feature | Status |
|------|---------|--------|
| 1-3 | Login & Account Creation | ✅ Complete |
| 4-6 | Add Money (Deposit) | ✅ Complete |
| 7-9 | Send Money | ✅ Complete |
| 10-12 | Buy/Sell Assets | ✅ Complete |
| 13+ | Goals & Strategies | 🔜 Planned |

## Dependencies

The demo requires:
- React 18+
- Tailwind CSS (for utility classes)

No other external dependencies are needed - the component is fully self-contained.

## Design Principles

1. **No Crypto Jargon** - Uses familiar financial terms
2. **Progressive Disclosure** - Features unlock sequentially
3. **Transparency** - All fees shown with expandable breakdowns
4. **Fintech Aesthetic** - Clean, professional design
5. **Mobile-First** - Responsive layout

## Customization

### Modify Asset Prices

Edit the `assetCategories` object in `demo.jsx`:

```jsx
const assetCategories = {
  Gold: [
    { symbol: 'XAUT', name: 'Tether Gold', price: 2945.00 }
  ],
  // ... other categories
};
```

### Modify Fee Structure

Edit the fee calculation constants:

```jsx
// Deposit fees
const depositPaymentFee = depositGrossTotal * 0.02; // 2%

// Send fees  
const sendGasFee = sendGrossTotal * 0.0001; // 0.01%

// Buy fees
const buyGasFee = buyGrossTotal * 0.0001;      // 0.01%
const buyThirdPartyFee = buyGrossTotal * 0.0005; // 0.05%
```

## Future Enhancements

- [ ] Add "My Goals & Strategies" flow (Steps 13+)
- [ ] Add Sell functionality
- [ ] Add Withdraw flow
- [ ] Add Request Money flow
- [ ] Add Payment flow
- [ ] Add transaction details modal
- [ ] Add portfolio visualization
- [ ] Add multi-language support

## Related Documentation

- [DEMO_SPECS.md](./DEMO_SPECS.md) - Full specification
- [UI/UX Onboarding](../ui-ux-onboarding.md) - Design guidelines
- [Fee Structure](../fees.md) - Platform fee documentation
