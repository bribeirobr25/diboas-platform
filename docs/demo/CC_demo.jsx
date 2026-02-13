import React, { useState, useEffect } from 'react';

/**
 * diBoaS Interactive Demo v2.0
 * 
 * Professional UI/UX redesign following enterprise fintech patterns:
 * - Inter typography with strict 4-size hierarchy
 * - 8px grid spacing system
 * - Single accent color (teal-500) + neutrals
 * - Skeleton loading states with shimmer
 * - Micro-interactions with 150-300ms ease-out timing
 * - Trust signals and security indicators
 * - Progressive disclosure with expandable sections
 * 
 * Design references: Stripe, Wise, Revolut, Mercury
 */

const DiBoaSDemo = () => {
  // ==================== STATE ====================
  const [step, setStep] = useState('login');
  const [cashBalance, setCashBalance] = useState(0);
  const [investments, setInvestments] = useState({
    assets: {},
    strategies: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [feesExpanded, setFeesExpanded] = useState(false);
  const [sendFeesExpanded, setSendFeesExpanded] = useState(false);
  const [buyFeesExpanded, setBuyFeesExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Gold');
  const [selectedAsset, setSelectedAsset] = useState('XAUT');
  const [investmentsExpanded, setInvestmentsExpanded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({
    deposit: false,
    send: false,
    buy: false,
    goals: false
  });

  // ==================== DATA ====================
  const assetCategories = {
    ETFs: [
      { symbol: 'SPYx', name: 'S&P 500 ETF', price: 592.45 },
      { symbol: 'QQQx', name: 'Nasdaq 100 ETF', price: 518.23 },
      { symbol: 'IWMon', name: 'Russell 2000 ETF', price: 224.67 }
    ],
    Stocks: [
      { symbol: 'TSLAx', name: 'Tesla', price: 248.50 },
      { symbol: 'GOOGLx', name: 'Alphabet', price: 175.30 },
      { symbol: 'NVDAx', name: 'NVIDIA', price: 137.85 }
    ],
    Crypto: [
      { symbol: 'BTC', name: 'Bitcoin', price: 97250.00 },
      { symbol: 'ETH', name: 'Ethereum', price: 2650.00 },
      { symbol: 'SOL', name: 'Solana', price: 195.40 },
      { symbol: 'SUI', name: 'Sui', price: 3.85 }
    ],
    Gold: [
      { symbol: 'XAUT', name: 'Tether Gold', price: 2945.00 }
    ]
  };

  // ==================== CALCULATIONS ====================
  const totalInvestments = Object.values(investments.assets).reduce((sum, asset) => sum + asset.amount, 0) + investments.strategies;
  const totalBalance = cashBalance + totalInvestments;

  // Deposit fees
  const depositGrossTotal = parseFloat(depositAmount) || 0;
  const depositPaymentFee = depositGrossTotal * 0.02;
  const depositDiboasFee = 0;
  const depositTotalFees = depositPaymentFee + depositDiboasFee;
  const depositNetTotal = depositGrossTotal - depositTotalFees;

  // Send fees
  const sendGrossTotal = parseFloat(sendAmount) || 0;
  const sendGasFee = sendGrossTotal * 0.0001;
  const sendDiboasFee = 0;
  const sendTotalFees = sendGasFee + sendDiboasFee;
  const sendNetTotal = sendGrossTotal - sendTotalFees;
  const sendInsufficientFunds = sendGrossTotal > 0 && sendGrossTotal >= cashBalance;

  // Buy fees
  const buyGrossTotal = parseFloat(buyAmount) || 0;
  const buyGasFee = buyGrossTotal * 0.0001;
  const buyThirdPartyFee = buyGrossTotal * 0.0005;
  const buyDiboasFee = 0;
  const buyTotalFees = buyGasFee + buyThirdPartyFee + buyDiboasFee;
  const buyNetTotal = buyGrossTotal - buyTotalFees;
  const buyInsufficientFunds = buyGrossTotal > 0 && buyGrossTotal >= cashBalance;

  // Current asset
  const currentAsset = assetCategories[selectedCategory]?.find(a => a.symbol === selectedAsset) || assetCategories.Gold[0];

  // ==================== UTILITIES ====================
  const formatCurrency = (amount, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  const formatDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ==================== HANDLERS ====================
  const handleProceed = () => {
    setStep('creating-account');
    setTimeout(() => {
      setStep('creating-wallet');
      setTimeout(() => {
        setStep('home');
      }, 2500);
    }, 2500);
  };

  const handleDepositConfirm = () => {
    const netAmount = depositNetTotal;
    setStep('deposit-processing');
    setTimeout(() => {
      setStep('deposit-approved');
      setTimeout(() => {
        setStep('deposit-complete');
        setTimeout(() => {
          setCashBalance(prev => prev + netAmount);
          setTransactions(prev => [{
            id: Date.now(),
            type: 'deposit',
            description: 'Added Money',
            method: 'Credit Card',
            amount: netAmount,
            grossAmount: depositGrossTotal,
            fees: depositTotalFees,
            date: formatDateTime(),
          }, ...prev]);
          setCompletedSteps(prev => ({ ...prev, deposit: true }));
          setDepositAmount('');
          setStep('home');
        }, 1800);
      }, 1500);
    }, 2000);
  };

  const handleSendConfirm = () => {
    const grossAmount = sendGrossTotal;
    const netAmount = sendNetTotal;
    setStep('send-processing');
    setTimeout(() => {
      setStep('send-complete');
      setTimeout(() => {
        setCashBalance(prev => prev - grossAmount);
        setTransactions(prev => [{
          id: Date.now(),
          type: 'send',
          description: 'Sent to @best_friend',
          amount: netAmount,
          grossAmount: grossAmount,
          fees: sendTotalFees,
          date: formatDateTime(),
        }, ...prev]);
        setCompletedSteps(prev => ({ ...prev, send: true }));
        setSendAmount('');
        setStep('home');
      }, 1800);
    }, 2000);
  };

  const handleBuyConfirm = () => {
    const grossAmount = buyGrossTotal;
    const netAmount = buyNetTotal;
    const asset = currentAsset;
    setStep('buy-processing');
    setTimeout(() => {
      setStep('buy-complete');
      setTimeout(() => {
        setCashBalance(prev => prev - grossAmount);
        setInvestments(prev => ({
          ...prev,
          assets: {
            ...prev.assets,
            [asset.symbol]: {
              amount: (prev.assets[asset.symbol]?.amount || 0) + netAmount,
              name: asset.name
            }
          }
        }));
        setTransactions(prev => [{
          id: Date.now(),
          type: 'buy',
          description: `Bought ${asset.name}`,
          symbol: asset.symbol,
          amount: netAmount,
          grossAmount: grossAmount,
          fees: buyTotalFees,
          date: formatDateTime(),
        }, ...prev]);
        setCompletedSteps(prev => ({ ...prev, buy: true }));
        setBuyAmount('');
        setStep('home');
      }, 1800);
    }, 2000);
  };

  // ==================== DESIGN TOKENS ====================
  const tokens = {
    colors: {
      // Primary
      primary: '#0D9488', // teal-600
      primaryHover: '#0F766E', // teal-700
      primaryLight: '#CCFBF1', // teal-100
      primarySubtle: '#F0FDFA', // teal-50
      // Neutrals
      text: '#0F172A', // slate-900
      textSecondary: '#475569', // slate-600
      textMuted: '#94A3B8', // slate-400
      border: '#E2E8F0', // slate-200
      borderLight: '#F1F5F9', // slate-100
      background: '#FFFFFF',
      backgroundSubtle: '#F8FAFC', // slate-50
      // Status
      success: '#22C55E',
      successLight: '#DCFCE7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      info: '#3B82F6',
      infoLight: '#DBEAFE',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
    },
    radius: {
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
      md: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
      lg: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    },
    transition: {
      fast: 'all 150ms cubic-bezier(0, 0, 0.2, 1)',
      normal: 'all 200ms cubic-bezier(0, 0, 0.2, 1)',
      slow: 'all 300ms cubic-bezier(0, 0, 0.2, 1)',
    }
  };

  // ==================== SHIMMER ANIMATION (CSS-in-JS) ====================
  const shimmerKeyframes = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;

  // ==================== REUSABLE COMPONENTS ====================
  
  // Skeleton Loading Block
  const Skeleton = ({ width = '100%', height = '20px', className = '' }) => (
    <div 
      className={`rounded-md ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );

  // Icon Components (SVG)
  const Icons = {
    Lock: ({ size = 16, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    Shield: ({ size = 16, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    Check: ({ size = 16, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    ChevronDown: ({ size = 16, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    ),
    ChevronLeft: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    ),
    Plus: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    ArrowUpRight: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    ),
    Send: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    TrendingUp: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    Target: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    Info: ({ size = 14, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    Wallet: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
      </svg>
    ),
    CreditCard: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    User: ({ size = 20, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    AlertCircle: ({ size = 16, className = '' }) => (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  };

  // Tooltip Component
  const Tooltip = ({ children, text }) => (
    <div className="relative group inline-flex items-center gap-1">
      {children}
      <Icons.Info size={14} className="text-slate-400 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 font-normal">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );

  // Header Component
  const Header = ({ showUser = false }) => (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm tracking-tight">d</span>
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">diBoaS</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[11px] px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium uppercase tracking-wide border border-amber-200/50">
            Demo
          </span>
          {showUser && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
              <span className="text-sm text-slate-600 hidden sm:block">Guest</span>
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <Icons.User size={16} className="text-slate-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // Balance Card Component
  const BalanceCard = ({ compact = false }) => (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl ${compact ? 'p-5' : 'p-6'} text-white shadow-xl relative overflow-hidden`}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1.5">Total Balance</p>
            <h2 className={`${compact ? 'text-3xl' : 'text-4xl'} font-bold tracking-tight tabular-nums`}>
              {formatCurrency(totalBalance)}
            </h2>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Icons.Wallet size={24} className="text-white" />
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <span className="text-base">💵</span>
              </div>
              <span className="text-slate-300 text-sm font-medium">Cash</span>
            </div>
            <span className="font-semibold tabular-nums">{formatCurrency(cashBalance)}</span>
          </div>
          
          <div>
            <button 
              onClick={() => totalInvestments > 0 && setInvestmentsExpanded(!investmentsExpanded)}
              className="w-full flex justify-between items-center group"
              disabled={totalInvestments === 0}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-base">📈</span>
                </div>
                <span className="text-slate-300 text-sm font-medium">Investments</span>
                {totalInvestments > 0 && (
                  <Icons.ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${investmentsExpanded ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
              <span className="font-semibold tabular-nums">{formatCurrency(totalInvestments)}</span>
            </button>
            
            {investmentsExpanded && totalInvestments > 0 && (
              <div className="mt-3 ml-10 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {Object.entries(investments.assets).map(([symbol, data]) => (
                  <div key={symbol} className="flex justify-between text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-slate-500 rounded-full" />
                      {data.name} <span className="text-slate-500">({symbol})</span>
                    </span>
                    <span className="tabular-nums">{formatCurrency(data.amount)}</span>
                  </div>
                ))}
                {investments.strategies > 0 && (
                  <div className="flex justify-between text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-slate-500 rounded-full" />
                      Strategies
                    </span>
                    <span className="tabular-nums">{formatCurrency(investments.strategies)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Button Component
  const Button = ({ 
    children, 
    onClick, 
    disabled = false, 
    variant = 'primary', 
    size = 'lg',
    fullWidth = false,
    className = '' 
  }) => {
    const baseStyles = "font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-sm hover:shadow-md",
      secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:bg-slate-50 disabled:text-slate-300",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200",
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base",
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {children}
      </button>
    );
  };

  // Input Component
  const AmountInput = ({ value, onChange, error, placeholder = "0.00" }) => (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-slate-400">$</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-4 text-2xl font-semibold rounded-xl border-2 transition-all duration-200 outline-none tabular-nums
          ${error 
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
            : 'border-slate-200 bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-100'
          }`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      />
    </div>
  );

  // Quick Amount Buttons
  const QuickAmounts = ({ amounts, onSelect }) => (
    <div className="flex gap-2 mt-3">
      {amounts.map((amount) => (
        <button
          key={amount}
          onClick={() => onSelect(amount.toString())}
          className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all duration-150 border border-slate-200"
        >
          ${amount}
        </button>
      ))}
    </div>
  );

  // Fee Breakdown Component
  const FeeBreakdown = ({ 
    grossTotal, 
    fees, 
    netTotal, 
    expanded, 
    onToggle, 
    netLabel = "Net Total",
    showTooltips = true 
  }) => (
    <div className="bg-slate-50 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        {showTooltips ? (
          <Tooltip text="The amount before fees">
            <span className="text-slate-600 text-sm font-medium">Gross Total</span>
          </Tooltip>
        ) : (
          <span className="text-slate-600 text-sm font-medium">Gross Total</span>
        )}
        <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(grossTotal)}</span>
      </div>
      
      <button 
        onClick={onToggle}
        className="w-full flex justify-between items-center text-sm group"
      >
        {showTooltips ? (
          <Tooltip text="All applicable fees">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              Total Fees
              <Icons.ChevronDown 
                size={16} 
                className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
              />
            </span>
          </Tooltip>
        ) : (
          <span className="text-slate-600 font-medium flex items-center gap-1.5">
            Total Fees
            <Icons.ChevronDown 
              size={16} 
              className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
            />
          </span>
        )}
        <span className="font-medium text-red-600 tabular-nums">−{formatCurrency(fees.total, 4)}</span>
      </button>
      
      {expanded && (
        <div className="pl-4 space-y-2.5 border-l-2 border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
          {fees.items.map((fee, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-slate-500">{fee.label}</span>
              <span className={`tabular-nums ${fee.value === 0 ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                {fee.value === 0 ? 'Free' : `−${formatCurrency(fee.value, 4)}`}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
        {showTooltips ? (
          <Tooltip text="Final amount after fees">
            <span className="font-semibold text-slate-900">{netLabel}</span>
          </Tooltip>
        ) : (
          <span className="font-semibold text-slate-900">{netLabel}</span>
        )}
        <span className="text-xl font-bold text-teal-600 tabular-nums">{formatCurrency(netTotal, 4)}</span>
      </div>
    </div>
  );

  // Processing Screen Component
  const ProcessingScreen = ({ 
    status, // 'processing' | 'success' | 'complete'
    message, 
    submessage,
    color = 'teal' // 'teal' | 'blue' | 'orange' | 'green'
  }) => {
    const colorMap = {
      teal: { bg: 'bg-teal-100', border: 'border-teal-600', text: 'text-teal-600' },
      blue: { bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-600' },
      orange: { bg: 'bg-orange-100', border: 'border-orange-600', text: 'text-orange-600' },
      green: { bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-600' },
    };
    const colors = colorMap[color];
    
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <style>{shimmerKeyframes}</style>
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6 max-w-sm">
            <div className={`w-20 h-20 mx-auto ${colors.bg} rounded-full flex items-center justify-center`}>
              {status === 'processing' ? (
                <div className={`w-10 h-10 border-4 ${colors.border} border-t-transparent rounded-full animate-spin`} />
              ) : (
                <Icons.Check size={40} className={colors.text} />
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">{message}</h1>
              <p className="text-slate-500">{submessage}</p>
            </div>
            
            {/* Security indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Icons.Shield size={16} />
              <span>Secured with 256-bit encryption</span>
            </div>
          </div>
        </main>
      </div>
    );
  };

  // ==================== SCREENS ====================

  // LOGIN SCREEN
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <style>{shimmerKeyframes}</style>
        <Header />
        
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            
            {/* Hero */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Welcome to diBoaS
              </h1>
              <p className="text-slate-500 text-lg">
                Experience the demo — see how easy it is to manage your money.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8 space-y-6">
              
              {/* Social Auth */}
              <div className="space-y-3">
                <p className="text-xs text-slate-400 text-center uppercase tracking-wider font-medium">Continue with</p>
                <div className="flex gap-3">
                  {[
                    { name: 'Google', icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )},
                    { name: 'Apple', icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    )},
                    { name: 'X', icon: (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    )},
                  ].map((provider) => (
                    <button 
                      key={provider.name}
                      disabled 
                      className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2.5 opacity-50 cursor-not-allowed"
                    >
                      {provider.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-xs text-slate-400 uppercase tracking-wider">or with email</span>
                </div>
              </div>

              {/* Email/Password */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value="guest@diboas.com" 
                    disabled 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input 
                    type="password" 
                    value="••••••••" 
                    disabled 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm" 
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-xs text-slate-400 uppercase tracking-wider">or with wallet</span>
                </div>
              </div>

              {/* Web3 Wallets */}
              <div className="flex gap-3">
                {[
                  { name: 'MetaMask', color: 'from-orange-400 to-orange-500' },
                  { name: 'Phantom', color: 'from-purple-400 to-purple-500' },
                  { name: 'Backpack', color: 'from-red-400 to-orange-400' },
                ].map((wallet) => (
                  <button 
                    key={wallet.name}
                    disabled 
                    className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed"
                  >
                    <div className={`w-6 h-6 bg-gradient-to-br ${wallet.color} rounded-lg`} />
                    <span className="text-xs font-medium text-slate-400">{wallet.name}</span>
                  </button>
                ))}
              </div>

              <Button onClick={handleProceed} fullWidth>
                Proceed with Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-slate-400 text-center">
                This is a demo. All authentication methods will be available in the full product.
              </p>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Icons.Shield size={14} />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icons.Lock size={14} />
                  <span>256-bit encryption</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // CREATING ACCOUNT SCREEN
  if (step === 'creating-account') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <style>{shimmerKeyframes}</style>
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-8 max-w-sm">
            {/* Skeleton preview of what's being created */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton width="48px" height="48px" className="rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" height="16px" />
                  <Skeleton width="40%" height="12px" />
                </div>
              </div>
              <Skeleton width="100%" height="80px" className="rounded-xl" />
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Creating your account...</h1>
              <p className="text-slate-500 text-sm">Setting up your secure diBoaS account</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // CREATING WALLET SCREEN
  if (step === 'creating-wallet') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <style>{shimmerKeyframes}</style>
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-8 max-w-sm">
            {/* More complete skeleton preview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Icons.Check size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" height="16px" />
                  <Skeleton width="40%" height="12px" />
                </div>
              </div>
              <Skeleton width="100%" height="80px" className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton width="100%" height="60px" className="rounded-xl" />
                <Skeleton width="100%" height="60px" className="rounded-xl" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-cyan-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Creating your wallet...</h1>
              <p className="text-slate-500 text-sm">Preparing your secure digital wallet</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
              <Icons.Check size={16} />
              <span className="font-medium">Account created</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // PROCESSING SCREENS
  if (step === 'deposit-processing') {
    return <ProcessingScreen 
      status="processing" 
      message="Processing payment..." 
      submessage="Connecting to your payment provider"
      color="blue"
    />;
  }

  if (step === 'deposit-approved') {
    return <ProcessingScreen 
      status="success" 
      message="Payment approved!" 
      submessage="Your payment has been successfully processed"
      color="green"
    />;
  }

  if (step === 'deposit-complete') {
    return <ProcessingScreen 
      status="complete" 
      message="Deposit complete!" 
      submessage={`${formatCurrency(depositNetTotal)} has been added to your wallet`}
      color="teal"
    />;
  }

  if (step === 'send-processing') {
    return <ProcessingScreen 
      status="processing" 
      message={`Sending ${formatCurrency(sendNetTotal)}...`}
      submessage="Processing your transfer to @best_friend"
      color="blue"
    />;
  }

  if (step === 'send-complete') {
    return <ProcessingScreen 
      status="complete" 
      message="Money sent!" 
      submessage={`${formatCurrency(sendNetTotal)} is on its way to @best_friend`}
      color="green"
    />;
  }

  if (step === 'buy-processing') {
    return <ProcessingScreen 
      status="processing" 
      message={`Buying ${currentAsset.name}...`}
      submessage={`Processing your ${formatCurrency(buyNetTotal)} purchase`}
      color="orange"
    />;
  }

  if (step === 'buy-complete') {
    return <ProcessingScreen 
      status="complete" 
      message={`${currentAsset.name} purchased!`}
      submessage={`${formatCurrency(buyNetTotal)} added to your investments`}
      color="green"
    />;
  }

  // DEPOSIT SCREEN
  if (step === 'deposit') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <style>{shimmerKeyframes}</style>
        <Header showUser />
        
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
          {/* Back button */}
          <button 
            onClick={() => setStep('home')} 
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 mb-6 transition-colors duration-150"
          >
            <Icons.ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="space-y-6">
            <BalanceCard compact />

            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button className="flex-1 py-2.5 bg-white text-slate-900 font-medium rounded-lg shadow-sm text-sm">
                Add Money
              </button>
              <button disabled className="flex-1 py-2.5 text-slate-400 font-medium text-sm cursor-not-allowed">
                Withdraw
              </button>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Payment Method</h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">On-Ramp</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Credit Card', icon: <Icons.CreditCard size={20} />, selected: true },
                    { name: 'Bank', icon: '🏦', disabled: true },
                    { name: 'Apple Pay', icon: '', disabled: true },
                  ].map((method, i) => (
                    <button
                      key={i}
                      disabled={method.disabled}
                      className={`p-3.5 rounded-xl flex flex-col items-center gap-2 text-xs font-medium transition-all duration-150
                        ${method.selected 
                          ? 'bg-teal-50 border-2 border-teal-500 text-teal-700' 
                          : 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      {typeof method.icon === 'string' ? (
                        <span className="text-lg opacity-50">{method.icon || '📱'}</span>
                      ) : (
                        <span className={method.selected ? 'text-teal-600' : 'text-slate-300'}>{method.icon}</span>
                      )}
                      <span>{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Amount</h3>
              <AmountInput 
                value={depositAmount} 
                onChange={setDepositAmount}
              />
              <QuickAmounts amounts={[25, 50, 100]} onSelect={setDepositAmount} />
            </div>

            {/* Fee Breakdown & Confirm */}
            {depositGrossTotal > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <FeeBreakdown
                  grossTotal={depositGrossTotal}
                  fees={{
                    total: depositTotalFees,
                    items: [
                      { label: 'Credit card fee (2%)', value: depositPaymentFee },
                      { label: 'diBoaS fee', value: depositDiboasFee },
                    ]
                  }}
                  netTotal={depositNetTotal}
                  expanded={feesExpanded}
                  onToggle={() => setFeesExpanded(!feesExpanded)}
                />

                <Button onClick={handleDepositConfirm} fullWidth disabled={depositNetTotal <= 0}>
                  <Icons.Lock size={16} />
                  Confirm Deposit
                </Button>

                <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1.5">
                  <Icons.Shield size={12} />
                  Your payment is secured with bank-level encryption
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // SEND MONEY SCREEN
  if (step === 'send') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <style>{shimmerKeyframes}</style>
        <Header showUser />
        
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
          <button 
            onClick={() => setStep('home')} 
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 mb-6 transition-colors duration-150"
          >
            <Icons.ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="space-y-6">
            <BalanceCard compact />

            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button className="flex-1 py-2.5 bg-white text-slate-900 font-medium rounded-lg shadow-sm text-sm">
                Send Money
              </button>
              <button disabled className="flex-1 py-2.5 text-slate-400 font-medium text-sm cursor-not-allowed">
                Request
              </button>
              <button disabled className="flex-1 py-2.5 text-slate-400 font-medium text-sm cursor-not-allowed">
                Payment
              </button>
            </div>

            {/* Recipient */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Send To</h3>
              <div className="p-4 bg-teal-50 border-2 border-teal-500 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-teal-200 rounded-full flex items-center justify-center">
                    <Icons.User size={20} className="text-teal-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-teal-900">@best_friend</p>
                    <p className="text-xs text-teal-600">Instant Transfer</p>
                  </div>
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                    <Icons.Check size={14} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Amount</h3>
              <AmountInput 
                value={sendAmount} 
                onChange={setSendAmount}
                error={sendInsufficientFunds}
              />
              {sendInsufficientFunds && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <Icons.AlertCircle size={16} />
                  Insufficient funds. You have {formatCurrency(cashBalance)} available.
                </p>
              )}
              <QuickAmounts amounts={[5, 10, 50]} onSelect={setSendAmount} />
            </div>

            {/* Fee Breakdown & Confirm */}
            {sendGrossTotal > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <FeeBreakdown
                  grossTotal={sendGrossTotal}
                  fees={{
                    total: sendTotalFees,
                    items: [
                      { label: 'Network fee (0.01%)', value: sendGasFee },
                      { label: 'diBoaS fee', value: sendDiboasFee },
                    ]
                  }}
                  netTotal={sendNetTotal}
                  netLabel="They Receive"
                  expanded={sendFeesExpanded}
                  onToggle={() => setSendFeesExpanded(!sendFeesExpanded)}
                />

                <Button 
                  onClick={handleSendConfirm} 
                  fullWidth 
                  disabled={sendNetTotal <= 0 || sendInsufficientFunds}
                >
                  <Icons.Send size={16} />
                  {sendInsufficientFunds ? 'Insufficient Funds' : 'Confirm & Send'}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // BUY ASSETS SCREEN
  if (step === 'buy') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <style>{shimmerKeyframes}</style>
        <Header showUser />
        
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
          <button 
            onClick={() => setStep('home')} 
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 mb-6 transition-colors duration-150"
          >
            <Icons.ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="space-y-6">
            <BalanceCard compact />

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Object.keys(assetCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedAsset(assetCategories[category][0].symbol);
                    setBuyAmount('');
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150
                    ${selectedCategory === category
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Asset List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {assetCategories[selectedCategory].map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => {
                      setSelectedAsset(asset.symbol);
                      setBuyAmount('');
                    }}
                    className={`w-full p-4 flex items-center justify-between transition-all duration-150 text-left
                      ${selectedAsset === asset.symbol 
                        ? 'bg-teal-50' 
                        : 'hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                        ${selectedCategory === 'Gold' ? 'bg-amber-100 text-amber-700' :
                          selectedCategory === 'Crypto' ? 'bg-orange-100 text-orange-700' :
                          selectedCategory === 'Stocks' ? 'bg-blue-100 text-blue-700' : 
                          'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{asset.name}</p>
                        <p className="text-sm text-slate-500">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 tabular-nums">{formatCurrency(asset.price)}</p>
                      {selectedAsset === asset.symbol && (
                        <span className="text-xs font-medium text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Amount to Buy <span className="text-slate-400 font-normal">({currentAsset.symbol})</span>
              </h3>
              <AmountInput 
                value={buyAmount} 
                onChange={setBuyAmount}
                error={buyInsufficientFunds}
              />
              {buyInsufficientFunds && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                  <Icons.AlertCircle size={16} />
                  Insufficient funds. You have {formatCurrency(cashBalance)} available.
                </p>
              )}
              <QuickAmounts amounts={[5, 10, 50]} onSelect={setBuyAmount} />
            </div>

            {/* Fee Breakdown & Confirm */}
            {buyGrossTotal > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <FeeBreakdown
                  grossTotal={buyGrossTotal}
                  fees={{
                    total: buyTotalFees,
                    items: [
                      { label: 'Network fee (0.01%)', value: buyGasFee },
                      { label: 'Exchange fee (0.05%)', value: buyThirdPartyFee },
                      { label: 'diBoaS fee', value: buyDiboasFee },
                    ]
                  }}
                  netTotal={buyNetTotal}
                  netLabel={`You Receive in ${currentAsset.symbol}`}
                  expanded={buyFeesExpanded}
                  onToggle={() => setBuyFeesExpanded(!buyFeesExpanded)}
                />

                <Button 
                  onClick={handleBuyConfirm} 
                  fullWidth 
                  disabled={buyNetTotal <= 0 || buyInsufficientFunds}
                >
                  <Icons.TrendingUp size={16} />
                  {buyInsufficientFunds ? 'Insufficient Funds' : `Buy ${currentAsset.name}`}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // HOME SCREEN
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <style>{shimmerKeyframes}</style>
      <Header showUser />

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
        <div className="space-y-8">
          
          <BalanceCard />

          {/* Actions Grid */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Add Money */}
              <button 
                onClick={() => setStep('deposit')}
                className={`p-5 rounded-2xl text-left transition-all duration-200
                  ${!completedSteps.deposit
                    ? 'bg-white border-2 border-teal-500 shadow-lg shadow-teal-500/10 hover:shadow-xl hover:shadow-teal-500/15'
                    : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  ${!completedSteps.deposit ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <Icons.Plus size={24} className={!completedSteps.deposit ? 'text-emerald-600' : 'text-slate-500'} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">Add Money</h4>
                  {!completedSteps.deposit && (
                    <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">
                      Start here
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">Deposit or withdraw</p>
              </button>

              {/* Send Money */}
              <button 
                onClick={() => completedSteps.deposit && setStep('send')}
                disabled={!completedSteps.deposit}
                className={`p-5 rounded-2xl text-left transition-all duration-200
                  ${completedSteps.deposit && !completedSteps.send
                    ? 'bg-white border-2 border-teal-500 shadow-lg shadow-teal-500/10 hover:shadow-xl'
                    : completedSteps.deposit
                      ? 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer'
                      : 'bg-slate-50 border border-slate-100 opacity-50 cursor-not-allowed'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  ${completedSteps.deposit ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <Icons.Send size={22} className={completedSteps.deposit ? 'text-blue-600' : 'text-slate-400'} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${completedSteps.deposit ? 'text-slate-900' : 'text-slate-400'}`}>Send Money</h4>
                  {completedSteps.deposit && !completedSteps.send && (
                    <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">
                      Next
                    </span>
                  )}
                </div>
                <p className={`text-sm ${completedSteps.deposit ? 'text-slate-500' : 'text-slate-400'}`}>Pay or transfer</p>
              </button>

              {/* Buy Assets */}
              <button 
                onClick={() => completedSteps.send && setStep('buy')}
                disabled={!completedSteps.send}
                className={`p-5 rounded-2xl text-left transition-all duration-200
                  ${completedSteps.send && !completedSteps.buy
                    ? 'bg-white border-2 border-teal-500 shadow-lg shadow-teal-500/10 hover:shadow-xl'
                    : completedSteps.send
                      ? 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer'
                      : 'bg-slate-50 border border-slate-100 opacity-50 cursor-not-allowed'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  ${completedSteps.send ? 'bg-orange-100' : 'bg-slate-100'}`}>
                  <Icons.TrendingUp size={22} className={completedSteps.send ? 'text-orange-600' : 'text-slate-400'} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${completedSteps.send ? 'text-slate-900' : 'text-slate-400'}`}>Buy Assets</h4>
                  {completedSteps.send && !completedSteps.buy && (
                    <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">
                      Next
                    </span>
                  )}
                </div>
                <p className={`text-sm ${completedSteps.send ? 'text-slate-500' : 'text-slate-400'}`}>Invest in crypto & more</p>
              </button>

              {/* Goals & Strategies */}
              <button 
                disabled={!completedSteps.buy}
                className={`p-5 rounded-2xl text-left transition-all duration-200
                  ${completedSteps.buy && !completedSteps.goals
                    ? 'bg-white border-2 border-teal-500 shadow-lg shadow-teal-500/10'
                    : 'bg-slate-50 border border-slate-100 opacity-50 cursor-not-allowed'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  ${completedSteps.buy ? 'bg-teal-100' : 'bg-slate-100'}`}>
                  <Icons.Target size={22} className={completedSteps.buy ? 'text-teal-600' : 'text-slate-400'} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${completedSteps.buy ? 'text-slate-900' : 'text-slate-400'}`}>Strategies</h4>
                  {completedSteps.buy && !completedSteps.goals && (
                    <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">
                      Next
                    </span>
                  )}
                </div>
                <p className={`text-sm ${completedSteps.buy ? 'text-slate-500' : 'text-slate-400'}`}>Grow automatically</p>
              </button>
            </div>
          </section>

          {/* Transactions */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h3>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icons.Wallet size={28} className="text-slate-400" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">No transactions yet</h4>
                  <p className="text-sm text-slate-500 mb-4">Add money to get started</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setStep('deposit')}
                  >
                    <Icons.Plus size={16} />
                    Add Money
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-150">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${tx.type === 'deposit' ? 'bg-emerald-100' : 
                            tx.type === 'buy' ? 'bg-orange-100' : 'bg-red-100'
                          }`}
                        >
                          {tx.type === 'deposit' && <Icons.Plus size={18} className="text-emerald-600" />}
                          {tx.type === 'send' && <Icons.ArrowUpRight size={18} className="text-red-600" />}
                          {tx.type === 'buy' && <Icons.TrendingUp size={18} className="text-orange-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{tx.description}</p>
                          <p className="text-xs text-slate-500">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold tabular-nums text-sm
                          ${tx.type === 'deposit' ? 'text-emerald-600' : 
                            tx.type === 'buy' ? 'text-orange-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'deposit' ? '+' : '−'}{formatCurrency(tx.type === 'deposit' ? tx.amount : tx.grossAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-100 bg-white">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© 2026 diBoaS. Your money, your control.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Icons.Shield size={12} />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.Lock size={12} />
              <span>256-bit encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DiBoaSDemo;
