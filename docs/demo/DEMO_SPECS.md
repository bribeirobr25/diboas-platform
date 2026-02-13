# diBoaS Interactive Demo Specification

> **Version:** 1.0  
> **Last Updated:** February 2026  
> **Status:** Implementation Ready (Steps 1-12 Complete)

## Overview

This document specifies the interactive demo for the diBoaS platform, designed to showcase core capabilities to prospective users. The demo simulates the complete user journey from signup through key financial operations without requiring real authentication or financial connections.

### Purpose

- **B2C Landing Page**: Allow potential users to experience the platform before signup
- **B2B Landing Page**: Demonstrate platform capabilities to business prospects
- **Sales Enablement**: Provide a guided tour of features for demos and presentations

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **No Crypto Jargon** | Use familiar terms: "wallet" not "address", "Add Money" not "deposit" |
| **Progressive Disclosure** | Features unlock as user completes each step |
| **Transparency** | All fees shown with expandable breakdowns and tooltips |
| **Fintech Aesthetic** | Clean, professional design inspired by Wise, Revolut |
| **Mobile-First** | Responsive design that works on all devices |

---

## User Flow Summary

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Login     │ -> │   Deposit    │ -> │    Send     │ -> │     Buy      │ -> │  Strategies │
│  (Simulated)│    │  Add Money   │    │   Payment   │    │    Assets    │    │   (Goals)   │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘    └─────────────┘
     Step 1-3          Step 4-6           Step 7-9          Step 10-12         Step 13+
```

---

## Balance Structure

The demo uses a dual-balance system to clearly separate liquid funds from investments:

### Balance Card Display

```
┌─────────────────────────────────────────────┐
│  Total Balance                    $147.00   │
│  ─────────────────────────────────────────  │
│  💵 Cash              $98.00                │
│  📈 Investments       $49.00                │
│     ├─ Gold (XAUT)    $49.00                │
│     └─ Strategies     $0.00                 │
└─────────────────────────────────────────────┘
```

| Balance | Description | Affected By |
|---------|-------------|-------------|
| **Cash** | Liquid money available to spend/send/invest | Add/Withdraw, Send/Request, Buy (deducts), Sell (adds) |
| **Investments** | Value of assets + active strategies | Buy (adds), Sell (deducts), Start/Stop Strategies |
| **Total** | Cash + Investments | All operations |

---

## Detailed Step Specifications

### Step 1: Authentication/Signup (Simulated)

**Screen:** Login Screen

**Purpose:** Demonstrate all available authentication options without actual authentication.

**UI Elements:**
- **Social Auth Buttons** (all disabled, greyed out):
  - Google
  - Apple  
  - X (Twitter)
- **Email/Password Fields** (disabled, pre-filled):
  - Email: `guest@diboas.com`
  - Password: `123456` (masked)
- **Web3 Wallet Buttons** (all disabled, greyed out):
  - MetaMask
  - Phantom
  - Backpack
- **Proceed Button** (enabled, primary action)
- **Helper Text:** "This is a demo. All options shown above will be available in the full product."

**User Action:** Click "Proceed with Demo"

---

### Step 2: Account Creation Simulation

**Screens:** Two sequential loading screens

**Screen 2a - Creating Account:**
- Spinner animation
- Message: "Creating your account..."
- Subtext: "Setting up your secure diBoaS account"
- Duration: 3 seconds

**Screen 2b - Creating Wallet:**
- Spinner animation
- Message: "Creating your wallet..."
- Subtext: "Preparing your secure digital wallet"
- Checkmark: "Account created" (shows previous step completed)
- Duration: 3 seconds

**Auto-transition:** Proceeds to Home screen after completion

---

### Step 3: App Home (Initial State)

**Screen:** Home/Dashboard

**UI Elements:**
- **Header:**
  - Logo + "diBoaS" branding
  - "DEMO MODE" badge (amber)
  - "Hello, Guest!" + user avatar
  
- **Balance Card:**
  - Total Balance: $0.00
  - Cash: $0.00
  - Investments: $0.00
  
- **Transaction Options Grid (2x2):**
  | Option | State | Badge |
  |--------|-------|-------|
  | Add / Withdraw Money | ✅ Enabled | "Start here" |
  | Payment / Send / Request | ❌ Disabled | - |
  | Buy / Sell Assets | ❌ Disabled | - |
  | My Goals & Strategies | ❌ Disabled | - |

- **Transaction History:**
  - Empty state with placeholder message
  - "No transactions yet - Your transaction history will appear here"

**User Action:** Click "Add / Withdraw Money"

---

### Step 4: Deposit Screen

**Screen:** Add Money

**UI Elements:**
- **Back Button:** Returns to Home
- **Balance Card:** Compact version showing current balances
- **Toggle:** Add Money (selected) | Withdraw (disabled)

- **Payment Methods - On-Ramp:**
  | Method | State |
  |--------|-------|
  | Credit Card | ✅ Selected |
  | Bank | ❌ Disabled |
  | Apple/Google Pay | ❌ Disabled |
  | PayPal | ❌ Disabled |
  | Stripe | ❌ Disabled |

- **Payment Methods - On-Chain:**
  | Method | State |
  |--------|-------|
  | External Wallet | ❌ Disabled |

- **Amount Input:**
  - Free-form number input with $ prefix
  - Quick buttons: $25, $50, $100
  
- **Confirmation Area** (appears when amount > 0):
  - Gross Total (with tooltip)
  - Total Fees (expandable):
    - Payment method fee: 2% of Gross Total
    - diBoaS fee: $0
  - Net Total = Gross Total - Total Fees
  - "Confirm Deposit" button

**User Action:** Enter amount, click "Confirm Deposit"

---

### Step 5: Deposit Simulation

**Screens:** Three sequential confirmation screens

**Screen 5a - Processing:**
- Blue spinner
- Message: "Connecting to your Credit Card..."
- Subtext: "Please wait while we process your payment"
- Duration: 2 seconds

**Screen 5b - Approved:**
- Green checkmark
- Message: "Approved!"
- Subtext: "Your payment has been approved"
- Duration: 2 seconds

**Screen 5c - Complete:**
- Teal checkmark
- Message: "Deposit Complete!"
- Subtext: "[Net Total] has been added to your wallet"
- Duration: 2 seconds

**State Updates:**
- Cash Balance += Net Total
- Transaction added to history

---

### Step 6: App Home (Post-Deposit)

**Screen:** Home/Dashboard

**Changes from Initial State:**
- **Balance Card:** Shows updated Cash balance
- **Transaction Options:**
  - Add / Withdraw Money: ✅ Enabled (no badge)
  - Payment / Send / Request: ✅ Enabled + "Next" badge
  - Buy / Sell Assets: ❌ Disabled
  - My Goals & Strategies: ❌ Disabled
- **Transaction History:** Shows deposit transaction

**User Action:** Click "Payment / Send / Request"

---

### Step 7: Payment/Send/Request Money Screen

**Screen:** Send Money

**UI Elements:**
- **Toggle:** Send Money (selected) | Request (disabled) | Payment (disabled)

- **Send To Field:**
  - Pre-filled username: `@best_friend`
  - "On-Chain Transfer" label
  - Not editable
  - Checkmark indicating selection

- **Amount Input:**
  - Free-form number input with $ prefix
  - Quick buttons: $5, $10, $50
  - **Validation:** Amount must be < Cash Balance
  - **Error State:** "Insufficient funds. Your cash balance is [amount]"

- **Confirmation Area** (appears when amount > 0):
  - Gross Total (with tooltip)
  - Total Fees (expandable):
    - Gas fee: 0.01% of Gross Total
    - diBoaS fee: $0
  - Net Total = Gross Total - Total Fees (labeled "They Receive")
  - "Confirm Send" button (disabled if insufficient funds)

**User Action:** Enter amount, click "Confirm Send"

---

### Step 8: Send Money Simulation

**Screens:** Two sequential confirmation screens

**Screen 8a - Processing:**
- Blue spinner
- Message: "Sending [Net Total] to @best_friend..."
- Subtext: "Processing your transaction"
- Duration: 2 seconds

**Screen 8b - Complete:**
- Green checkmark
- Message: "[Net Total] Sent!"
- Subtext: "Your money is on its way to @best_friend"
- Duration: 2 seconds

**State Updates:**
- Cash Balance -= Gross Total
- Transaction added to history

---

### Step 9: App Home (Post-Send)

**Screen:** Home/Dashboard

**Changes:**
- **Balance Card:** Shows updated Cash balance
- **Transaction Options:**
  - Buy / Sell Assets: ✅ Enabled + "Next" badge
  - My Goals & Strategies: ❌ Disabled
- **Transaction History:** Shows send transaction (1st) + deposit (2nd)

**User Action:** Click "Buy / Sell Assets"

---

### Step 10: Buy/Sell Assets Screen

**Screen:** Buy/Sell Assets

**UI Elements:**
- **Asset Categories (Tabs):**
  | Category | Assets |
  |----------|--------|
  | ETFs | SPYx, QQQx, IWMon |
  | Stocks | TSLAx, GOOGLx, NVDAx |
  | Crypto | BTC, ETH, SOL, SUI |
  | Gold | XAUT (default selected) |

- **Asset List:**
  - Each asset shows:
    - Icon/Symbol avatar
    - Asset name + symbol
    - Current price in USD
    - Buy button (enabled)
    - Sell button (disabled/greyed)

- **Mock Prices:**
  | Asset | Price |
  |-------|-------|
  | SPYx | $592.45 |
  | QQQx | $518.23 |
  | IWMon | $224.67 |
  | TSLAx | $248.50 |
  | GOOGLx | $175.30 |
  | NVDAx | $137.85 |
  | BTC | $97,250.00 |
  | ETH | $2,650.00 |
  | SOL | $195.40 |
  | SUI | $3.85 |
  | XAUT | $2,945.00 |

- **Amount Input:**
  - Free-form number input with $ prefix
  - Quick buttons: $5, $10, $50
  - **Validation:** Amount must be < Cash Balance

- **Confirmation Area** (appears when amount > 0):
  - Gross Total
  - Total Fees (expandable):
    - Gas fee: 0.01% of Gross Total
    - 3rd party fee: 0.05% of Gross Total
    - diBoaS fee: $0
  - Net Total (labeled "You Receive: [amount] in [symbol]")
  - "Buy [Asset Name]" button

**User Action:** Select asset, enter amount, click "Buy [Asset]"

---

### Step 11: Buy Asset Simulation

**Screens:** Two sequential confirmation screens

**Screen 11a - Processing:**
- Orange spinner
- Message: "Buying [Net Total] in [Asset Name]..."
- Subtext: "Processing your purchase"
- Duration: 2 seconds

**Screen 11b - Complete:**
- Green checkmark
- Message: "[Asset Name] Bought!"
- Subtext: "[Net Total] added to your investments"
- Duration: 2 seconds

**State Updates:**
- Cash Balance -= Gross Total
- Investments.assets[symbol] += Net Total
- Transaction added to history

---

### Step 12: App Home (Post-Buy)

**Screen:** Home/Dashboard

**Changes:**
- **Balance Card:**
  - Cash: Reduced by Gross Total
  - Investments: Shows purchased asset value
  - Expandable to see asset breakdown
- **Transaction Options:**
  - My Goals & Strategies: ✅ Enabled + "Next" badge
- **Transaction History:** Shows buy (1st) + send (2nd) + deposit (3rd)

**User Action:** Click "My Goals & Strategies"

---

## Fee Structure Reference

### Deposit Fees
| Fee Type | Rate | Paid To |
|----------|------|---------|
| Payment Method | 2% | Credit card processor |
| diBoaS | $0 | - |
| **Total** | **2%** | |

### Send Money Fees
| Fee Type | Rate | Paid To |
|----------|------|---------|
| Gas | 0.01% | Blockchain network |
| diBoaS | $0 | - |
| **Total** | **0.01%** | |

### Buy Asset Fees
| Fee Type | Rate | Paid To |
|----------|------|---------|
| Gas | 0.01% | Blockchain network |
| 3rd Party | 0.05% | Exchange/tokenization provider |
| diBoaS | $0 | - |
| **Total** | **0.06%** | |

---

## Technical Implementation

### React Component Structure

```
DiBoaSDemo/
├── State Management
│   ├── step (current screen)
│   ├── cashBalance (liquid funds)
│   ├── investments { assets: {}, strategies: 0 }
│   ├── transactions []
│   ├── completedSteps { deposit, send, buy, goals }
│   └── form states (amounts, expanded sections)
├── Reusable Components
│   ├── Header (logo, demo badge, user greeting)
│   ├── BalanceCard (dual balance with expandable investments)
│   └── Tooltip (hover explanations)
└── Screens
    ├── Login
    ├── Creating Account / Creating Wallet
    ├── Home
    ├── Deposit + Processing Screens
    ├── Send + Processing Screens
    ├── Buy + Processing Screens
    └── [Future] Strategies + Processing Screens
```

### State Flow

```javascript
// Initial state
cashBalance: 0
investments: { assets: {}, strategies: 0 }
completedSteps: { deposit: false, send: false, buy: false, goals: false }

// After $100 deposit (2% fee = $2)
cashBalance: 98
completedSteps: { deposit: true, ... }

// After $10 send (0.01% fee = $0.001)
cashBalance: 88 // (98 - 10)
completedSteps: { deposit: true, send: true, ... }

// After $50 Gold buy (0.06% fee = $0.03)
cashBalance: 38 // (88 - 50)
investments: { assets: { XAUT: { amount: 49.97, name: 'Gold' } }, strategies: 0 }
completedSteps: { deposit: true, send: true, buy: true, ... }
```

---

## Future Steps (Not Yet Implemented)

### Step 13+: My Goals & Investment Strategies

**Planned Features:**
- Strategy selection (Beat Inflation, Yield Hunter, etc.)
- Goal setting (amount, timeline)
- Start/Stop strategy simulation
- Portfolio visualization

---

## Files

| File | Description |
|------|-------------|
| `demo.jsx` | Main React component with full demo implementation |
| `DEMO_SPECS.md` | This specification document |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial specification (Steps 1-12) |
