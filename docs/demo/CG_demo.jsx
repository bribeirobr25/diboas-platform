import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * diBoaS Interactive Demo (UI/UX polish edition)
 * - Still self-contained (React + Tailwind only)
 * - Same flows / steps 1–12 from DEMO_SPECS.md
 * - More consistent layout, accessible interactions, and “this could ship” polish
 */

const DiBoaSDemo = () => {
  // -------------------------
  // Core demo state
  // -------------------------
  const [step, setStep] = useState('login');

  const [cashBalance, setCashBalance] = useState(0);
  const [investments, setInvestments] = useState({
    assets: {}, // { 'XAUT': { name, symbol, valueUSD, units, priceUSD } }
    strategies: 0,
  });

  const [transactions, setTransactions] = useState([]);

  const [depositAmount, setDepositAmount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('Gold');
  const [selectedAsset, setSelectedAsset] = useState('XAUT');

  const [investmentsExpanded, setInvestmentsExpanded] = useState(false);
  const [txnDetail, setTxnDetail] = useState(null); // transaction object for modal

  const [completedSteps, setCompletedSteps] = useState({
    deposit: false,
    send: false,
    buy: false,
    goals: false,
  });

  // -------------------------
  // Constants (spec-aligned)
  // -------------------------
  const assetCategories = useMemo(() => ({
    ETFs: [
      { symbol: 'SPYx', name: 'S&P 500 ETF', price: 592.45 },
      { symbol: 'QQQx', name: 'Nasdaq 100 ETF', price: 518.23 },
      { symbol: 'IWMon', name: 'Russell 2000 ETF', price: 224.67 },
    ],
    Stocks: [
      { symbol: 'TSLAx', name: 'Tesla', price: 248.50 },
      { symbol: 'GOOGLx', name: 'Alphabet', price: 175.30 },
      { symbol: 'NVDAx', name: 'NVIDIA', price: 137.85 },
    ],
    Crypto: [
      { symbol: 'BTC', name: 'Bitcoin', price: 97250.00 },
      { symbol: 'ETH', name: 'Ethereum', price: 2650.00 },
      { symbol: 'SOL', name: 'Solana', price: 195.40 },
      { symbol: 'SUI', name: 'Sui', price: 3.85 },
    ],
    Gold: [{ symbol: 'XAUT', name: 'Tether Gold', price: 2945.00 }],
  }), []);

  // Ensure selectedAsset always exists within selectedCategory
  useEffect(() => {
    const first = assetCategories[selectedCategory]?.[0]?.symbol;
    if (!first) return;
    const exists = assetCategories[selectedCategory].some(a => a.symbol === selectedAsset);
    if (!exists) setSelectedAsset(first);
  }, [selectedCategory, selectedAsset, assetCategories]);

  const selectedAssetObj = useMemo(() => {
    const list = assetCategories[selectedCategory] || [];
    return list.find(a => a.symbol === selectedAsset) || list[0];
  }, [assetCategories, selectedCategory, selectedAsset]);

  const totalInvestmentsUSD = useMemo(() => {
    return Object.values(investments.assets).reduce((sum, a) => sum + (a?.valueUSD || 0), 0);
  }, [investments.assets]);

  const totalBalance = cashBalance + totalInvestmentsUSD;

  // -------------------------
  // Formatting helpers
  // -------------------------
  const formatCurrency = (amount, decimals = 2) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number.isFinite(amount) ? amount : 0);

  const formatNumber = (amount, decimals = 2) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number.isFinite(amount) ? amount : 0);

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

  const parseAmount = (raw) => {
    const cleaned = String(raw ?? '')
      .replace(/[^\d.]/g, '')
      .replace(/^(\.)+/, '0.')
      .replace(/(\..*)\./g, '$1'); // keep first dot
    const num = Number.parseFloat(cleaned);
    if (!Number.isFinite(num) || num <= 0) return { cleaned, value: 0 };
    // Clamp to 2 decimals for display in fiat inputs
    const fixed = Math.floor(num * 100) / 100;
    return { cleaned, value: fixed };
  };

  // -------------------------
  // Fee calculations (spec-aligned)
  // -------------------------
  const deposit = useMemo(() => {
    const { value } = parseAmount(depositAmount);
    const gross = value;
    const paymentFee = gross * 0.02;
    const diboasFee = 0;
    const totalFees = paymentFee + diboasFee;
    const net = Math.max(0, gross - totalFees);
    return {
      gross,
      net,
      totalFees,
      breakdown: { paymentFee, diboasFee },
    };
  }, [depositAmount]);

  const send = useMemo(() => {
    const { value } = parseAmount(sendAmount);
    const gross = value;
    const gasFee = gross * 0.0001;
    const diboasFee = 0;
    const totalFees = gasFee + diboasFee;
    const net = Math.max(0, gross - totalFees);
    const insufficient = gross > 0 && gross >= cashBalance; // spec: amount must be < cash balance
    return {
      gross,
      net,
      totalFees,
      insufficient,
      breakdown: { gasFee, diboasFee },
    };
  }, [sendAmount, cashBalance]);

  const buy = useMemo(() => {
    const { value } = parseAmount(buyAmount);
    const gross = value;
    const gasFee = gross * 0.0001;
    const thirdPartyFee = gross * 0.0005;
    const diboasFee = 0;
    const totalFees = gasFee + thirdPartyFee + diboasFee;
    const net = Math.max(0, gross - totalFees);
    const insufficient = gross > 0 && gross >= cashBalance; // spec: amount must be < cash balance
    const price = selectedAssetObj?.price || 0;
    const estUnits = price > 0 ? net / price : 0;
    return {
      gross,
      net,
      totalFees,
      insufficient,
      breakdown: { gasFee, thirdPartyFee, diboasFee },
      estUnits,
    };
  }, [buyAmount, cashBalance, selectedAssetObj]);

  // -------------------------
  // Processing orchestration
  // -------------------------
  const pendingRef = useRef(null); // { kind, commit() }
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    clearTimers();

    const schedule = (fn, ms) => {
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
    };

    // Step 2: account creation simulation
    if (step === 'creating-account') schedule(() => setStep('creating-wallet'), 3000);
    if (step === 'creating-wallet') schedule(() => setStep('home'), 3000);

    // Step 5: deposit simulation (2s each)
    if (step === 'deposit-processing') schedule(() => setStep('deposit-approved'), 2000);
    if (step === 'deposit-approved') schedule(() => setStep('deposit-complete'), 2000);
    if (step === 'deposit-complete') {
      schedule(() => {
        if (pendingRef.current?.kind === 'deposit') pendingRef.current.commit();
        pendingRef.current = null;
        setStep('home');
      }, 2000);
    }

    // Step 8: send simulation (2s each)
    if (step === 'send-processing') schedule(() => setStep('send-complete'), 2000);
    if (step === 'send-complete') {
      schedule(() => {
        if (pendingRef.current?.kind === 'send') pendingRef.current.commit();
        pendingRef.current = null;
        setStep('home');
      }, 2000);
    }

    // Step 11: buy simulation (2s each)
    if (step === 'buy-processing') schedule(() => setStep('buy-complete'), 2000);
    if (step === 'buy-complete') {
      schedule(() => {
        if (pendingRef.current?.kind === 'buy') pendingRef.current.commit();
        pendingRef.current = null;
        setStep('home');
      }, 2000);
    }
  }, [step]);

  // -------------------------
  // Actions
  // -------------------------
  const proceedFromLogin = () => setStep('creating-account');

  const startDeposit = () => {
    if (deposit.gross <= 0) return;

    const payload = {
      kind: 'deposit',
      gross: deposit.gross,
      net: deposit.net,
      fees: deposit.totalFees,
      feeBreakdown: deposit.breakdown,
      method: 'Credit Card',
      commit: () => {
        setCashBalance(prev => prev + deposit.net);
        setTransactions(prev => [{
          id: Date.now(),
          type: 'deposit',
          description: 'Added Money (Credit Card)',
          amount: deposit.net,
          grossAmount: deposit.gross,
          fees: deposit.totalFees,
          feeBreakdown: deposit.breakdown,
          date: formatDateTime(),
        }, ...prev]);
        setCompletedSteps(prev => ({ ...prev, deposit: true }));
        setDepositAmount('');
      },
    };

    pendingRef.current = payload;
    setStep('deposit-processing');
  };

  const startSend = () => {
    if (send.gross <= 0 || send.insufficient) return;

    const payload = {
      kind: 'send',
      gross: send.gross,
      net: send.net,
      fees: send.totalFees,
      feeBreakdown: send.breakdown,
      to: '@best_friend',
      commit: () => {
        setCashBalance(prev => Math.max(0, prev - send.gross));
        setTransactions(prev => [{
          id: Date.now(),
          type: 'send',
          description: 'Sent to @best_friend',
          amount: send.net,
          grossAmount: send.gross,
          fees: send.totalFees,
          feeBreakdown: send.breakdown,
          to: '@best_friend',
          date: formatDateTime(),
        }, ...prev]);
        setCompletedSteps(prev => ({ ...prev, send: true }));
        setSendAmount('');
      },
    };

    pendingRef.current = payload;
    setStep('send-processing');
  };

  const startBuy = () => {
    if (buy.gross <= 0 || buy.insufficient) return;

    const asset = selectedAssetObj;
    const price = asset?.price || 0;
    const estUnits = price > 0 ? buy.net / price : 0;

    const payload = {
      kind: 'buy',
      gross: buy.gross,
      net: buy.net,
      fees: buy.totalFees,
      feeBreakdown: buy.breakdown,
      asset: { symbol: asset.symbol, name: asset.name, price },
      estUnits,
      commit: () => {
        setCashBalance(prev => Math.max(0, prev - buy.gross));
        setInvestments(prev => {
          const existing = prev.assets[asset.symbol];
          const nextValue = (existing?.valueUSD || 0) + buy.net;
          const nextUnits = (existing?.units || 0) + estUnits;

          return {
            ...prev,
            assets: {
              ...prev.assets,
              [asset.symbol]: {
                name: asset.name,
                symbol: asset.symbol,
                valueUSD: nextValue,
                units: nextUnits,
                priceUSD: price,
              },
            },
          };
        });

        setTransactions(prev => [{
          id: Date.now(),
          type: 'buy',
          description: `Bought ${asset.name} (${asset.symbol})`,
          amount: buy.net,
          grossAmount: buy.gross,
          fees: buy.totalFees,
          feeBreakdown: buy.breakdown,
          asset: asset.symbol,
          assetName: asset.name,
          assetPrice: price,
          estUnits,
          date: formatDateTime(),
        }, ...prev]);

        setCompletedSteps(prev => ({ ...prev, buy: true }));
        setBuyAmount('');
      },
    };

    pendingRef.current = payload;
    setStep('buy-processing');
  };

  // -------------------------
  // UI tokens (tiny “design system”)
  // -------------------------
  const ui = {
    page: 'min-h-screen bg-slate-50 text-slate-900',
    container: 'mx-auto w-full max-w-2xl px-4 sm:px-6',
    card: 'rounded-2xl border border-slate-200 bg-white shadow-sm',
    cardPad: 'p-5 sm:p-6',
    subtleText: 'text-slate-600',
    heading: 'text-lg font-semibold text-slate-900',
    divider: 'border-t border-slate-200',
    focusRing:
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
  };

  // -------------------------
  // Reusable UI bits
  // -------------------------
  const Icon = ({ name, className = '' }) => {
    const base = `w-5 h-5 ${className}`;
    switch (name) {
      case 'logo':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'wallet':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 7.5A3.5 3.5 0 0 1 6.5 4h11A3.5 3.5 0 0 1 21 7.5v9A3.5 3.5 0 0 1 17.5 20h-11A3.5 3.5 0 0 1 3 16.5v-9Z" stroke="currentColor" strokeWidth="2" />
            <path d="M15 12h6v4h-6a2 2 0 0 1 0-4Z" stroke="currentColor" strokeWidth="2" />
            <path d="M7 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'cash':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 8h18v10H3V8Z" stroke="currentColor" strokeWidth="2" />
            <path d="M7 12a2 2 0 1 0 0.001 0Z" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10c2 0 3-1 3-2m15 2c-2 0-3-1-3-2m0 10c0-1 1-2 3-2M6 18c0-1-1-2-3-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'trend':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 16l6-6 4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 8h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'plus':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'send':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22 2 11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        );
      case 'buy':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2v20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 6h7a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'target':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 6a6 6 0 1 0 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 10a2 2 0 1 0 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'chevRight':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'info':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 17v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case 'x':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'check':
        return (
          <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'spinner':
        return (
          <svg className={`${base} animate-spin motion-reduce:animate-none`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const Badge = ({ tone = 'neutral', children }) => {
    const tones = {
      neutral: 'bg-slate-100 text-slate-700 border-slate-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tones[tone] || tones.neutral}`}>
        {children}
      </span>
    );
  };

  const Button = ({ variant = 'primary', size = 'md', className = '', disabled, children, ...props }) => {
    const base =
      `inline-flex items-center justify-center gap-2 rounded-xl font-semibold ` +
      `transition motion-reduce:transition-none ` +
      `active:translate-y-px motion-reduce:active:translate-y-0 ` +
      `${ui.focusRing}`;

    const sizes = {
      md: 'px-4 py-2.5 text-sm',
      sm: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-sm',
    };

    const variants = {
      primary:
        'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed',
      secondary:
        'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed',
    };

    return (
      <button
        type="button"
        className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  };

  const Input = ({ label, prefix, hint, error, right, ...props }) => {
    const id = props.id || `input_${label?.toLowerCase().replace(/\s+/g, '_') || 'field'}`;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <span className="text-sm font-semibold">{prefix}</span>
            </div>
          )}
          <input
            id={id}
            className={[
              'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
              prefix ? 'pl-9' : '',
              right ? 'pr-10' : '',
              error ? 'border-rose-300 focus-visible:ring-rose-500' : 'border-slate-200',
              ui.focusRing,
            ].join(' ')}
            aria-invalid={!!error}
            aria-describedby={hint || error ? `${id}_help` : undefined}
            {...props}
          />
          {right && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{right}</div>}
        </div>
        {(hint || error) && (
          <p id={`${id}_help`} className={`text-xs ${error ? 'text-rose-600' : 'text-slate-500'}`}>
            {error || hint}
          </p>
        )}
      </div>
    );
  };

  const Section = ({ title, description, children, right }) => (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={ui.heading}>{title}</h2>
          {description && <p className={`mt-1 text-sm ${ui.subtleText}`}>{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );

  const Segmented = ({ options, value, onChange, disabledKeys = [] }) => (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
      {options.map((opt) => {
        const disabled = disabledKeys.includes(opt.value);
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={[
              'min-w-[110px] rounded-lg px-3 py-2 text-sm font-semibold',
              'transition motion-reduce:transition-none',
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
              disabled ? 'opacity-40 cursor-not-allowed hover:text-slate-600' : '',
              ui.focusRing,
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const Tabs = ({ tabs, value, onChange }) => (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={[
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold',
              'transition motion-reduce:transition-none',
              active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
              ui.focusRing,
            ].join(' ')}
          >
            {t}
          </button>
        );
      })}
    </div>
  );

  const InfoPopover = ({ label, children }) => {
    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const onKey = (e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          btnRef.current?.focus?.();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
      <div className="relative inline-flex">
        <button
          type="button"
          ref={btnRef}
          className={`rounded-lg p-1 text-slate-500 hover:text-slate-700 ${ui.focusRing}`}
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <Icon name="info" className="w-4 h-4" />
        </button>

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 cursor-default"
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-label={label}
              className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg"
            >
              {children}
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const FeeDetails = ({ title, totalFees, children }) => (
    <details className={`${ui.card} overflow-hidden`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(totalFees, 4)}</span>
        </div>
        <span className="text-sm font-semibold text-teal-700">View</span>
      </summary>
      <div className={`${ui.divider} px-5 py-4`}>
        <div className="space-y-2 text-sm text-slate-700">
          {children}
        </div>
      </div>
    </details>
  );

  const Stepper = () => {
    const items = [
      { key: 'login', label: 'Login', done: step !== 'login' && step !== 'creating-account' && step !== 'creating-wallet' },
      { key: 'deposit', label: 'Add money', done: completedSteps.deposit },
      { key: 'send', label: 'Send', done: completedSteps.send },
      { key: 'buy', label: 'Buy', done: completedSteps.buy },
      { key: 'goals', label: 'Goals', done: false },
    ];

    const currentIndex = (() => {
      if (step === 'login' || step === 'creating-account' || step === 'creating-wallet') return 0;
      if (step.startsWith('deposit')) return 1;
      if (step.startsWith('send')) return 2;
      if (step.startsWith('buy')) return 3;
      if (step === 'goals') return 4;
      // home: highlight next step
      if (!completedSteps.deposit) return 1;
      if (!completedSteps.send) return 2;
      if (!completedSteps.buy) return 3;
      return 4;
    })();

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          {items.map((it, i) => {
            const isCurrent = i === currentIndex;
            return (
              <div key={it.key} className="flex flex-1 items-center gap-2">
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold',
                    it.done ? 'bg-teal-600 text-white border-teal-600' : isCurrent ? 'bg-white text-teal-700 border-teal-300' : 'bg-white text-slate-500 border-slate-200',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {it.done ? <Icon name="check" className="w-4 h-4" /> : i + 1}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}>{it.label}</p>
                </div>
                {i < items.length - 1 && <div className="mx-2 h-px flex-1 bg-slate-200" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Header = ({ showUser }) => (
    <header className="border-b border-slate-200 bg-white">
      <div className={`${ui.container} py-4`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-sm">
              <span className="text-sm font-black">d</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">diBoaS</p>
              <p className="text-xs text-slate-500">Interactive demo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone="amber">DEMO MODE</Badge>
            {showUser && (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-slate-600 sm:block">Hello, Guest</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                  <span className="text-sm font-bold">G</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stepper sits under header for in-product steps */}
        {step !== 'login' && <Stepper />}
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="border-t border-slate-200 bg-white">
      <div className={`${ui.container} py-4 text-center`}>
        <p className="text-xs text-slate-500">© 2026 diBoaS. Your money, your control.</p>
      </div>
    </footer>
  );

  const BalanceCard = ({ compact = false }) => (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-sm">
      <div className={`${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-white/80">Total balance</p>
            <p className={`${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'} mt-1 font-black`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Icon name="wallet" className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/12 p-3">
            <div className="flex items-center gap-2">
              <Icon name="cash" className="w-4 h-4 text-white/90" />
              <p className="text-xs font-semibold text-white/80">Cash</p>
            </div>
            <p className="mt-1 text-lg font-bold">{formatCurrency(cashBalance)}</p>
          </div>

          <div className="rounded-2xl bg-white/12 p-3">
            <div className="flex items-center gap-2">
              <Icon name="trend" className="w-4 h-4 text-white/90" />
              <p className="text-xs font-semibold text-white/80">Investments</p>
            </div>
            <p className="mt-1 text-lg font-bold">{formatCurrency(totalInvestmentsUSD)}</p>
          </div>
        </div>

        {totalInvestmentsUSD > 0 && !compact && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setInvestmentsExpanded(v => !v)}
              className={`flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/15 ${ui.focusRing}`}
            >
              <span>Investment breakdown</span>
              <span className="text-white/90">{investmentsExpanded ? 'Hide' : 'View'}</span>
            </button>

            {investmentsExpanded && (
              <div className="mt-2 rounded-2xl bg-white/10 p-3">
                <div className="space-y-2">
                  {Object.values(investments.assets).map((a) => (
                    <div key={a.symbol} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{a.name} <span className="text-white/80">({a.symbol})</span></p>
                        <p className="text-xs text-white/75">
                          ≈ {formatNumber(a.units, a.symbol === 'BTC' || a.symbol === 'ETH' ? 6 : 4)} {a.symbol}
                        </p>
                      </div>
                      <p className="font-bold">{formatCurrency(a.valueUSD)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const ActionTile = ({ title, subtitle, icon, badge, enabled, onClick }) => (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      className={[
        ui.card,
        'p-4 text-left transition motion-reduce:transition-none',
        enabled ? 'hover:shadow-md' : 'opacity-55 cursor-not-allowed',
        ui.focusRing,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${enabled ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
            <Icon name={icon} className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>
          </div>
        </div>
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
      </div>
    </button>
  );

  const TxnRow = ({ tx }) => {
    const tone = tx.type === 'deposit' ? 'text-emerald-700' : tx.type === 'send' ? 'text-rose-700' : 'text-slate-900';
    const sign = tx.type === 'deposit' ? '+' : '-';
    const icon = tx.type === 'deposit' ? 'plus' : tx.type === 'send' ? 'send' : 'buy';
    return (
      <div className="flex items-start justify-between gap-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon name={icon} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{tx.description}</p>
            <p className="mt-0.5 text-xs text-slate-500">{tx.date}</p>
            <button
              type="button"
              onClick={() => setTxnDetail(tx)}
              className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 ${ui.focusRing}`}
            >
              View details <Icon name="chevRight" className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-black ${tone}`}>{sign}{formatCurrency(tx.grossAmount)}</p>
          <p className="mt-0.5 text-xs text-slate-500">Net: {formatCurrency(tx.amount)}</p>
        </div>
      </div>
    );
  };

  const Modal = ({ open, title, onClose, children }) => {
    const closeRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const onKey = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', onKey);
      // Focus close button
      setTimeout(() => closeRef.current?.focus?.(), 0);
      // prevent body scroll
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/40"
          aria-label="Close dialog"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white shadow-xl sm:rounded-3xl"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-black text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">Demo transaction details</p>
            </div>
            <button
              type="button"
              ref={closeRef}
              className={`rounded-xl p-2 text-slate-500 hover:bg-slate-100 ${ui.focusRing}`}
              onClick={onClose}
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto p-5">
            {children}
          </div>
          <div className="border-t border-slate-200 p-4">
            <Button variant="primary" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------
  // Screens
  // -------------------------
  const ScreenWrapper = ({ children, showUser = false, wide = false, mutedBg = false }) => (
    <div className={`${ui.page} ${mutedBg ? 'bg-gradient-to-br from-slate-50 to-teal-50/40' : ''}`}>
      <Header showUser={showUser} />
      <main className="py-8">
        <div className={`${ui.container} ${wide ? 'max-w-4xl' : ''}`}>
          {children}
        </div>
      </main>
      <Footer />
      <Modal
        open={!!txnDetail}
        title={txnDetail ? txnDetail.description : 'Transaction'}
        onClose={() => setTxnDetail(null)}
      >
        {txnDetail && (
          <div className="space-y-5">
            <div className={`${ui.card} ${ui.cardPad}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700">Status</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">Completed</p>
                  <p className="mt-1 text-sm text-slate-500">{txnDetail.date}</p>
                </div>
                <Badge tone="teal">{txnDetail.type.toUpperCase()}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">Gross</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(txnDetail.grossAmount)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">Net</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(txnDetail.amount)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">Fees</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatCurrency(txnDetail.fees, 4)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">ID</p>
                  <p className="mt-1 truncate text-sm font-black text-slate-900">{txnDetail.id}</p>
                </div>
              </div>

              {(txnDetail.type === 'send' || txnDetail.to) && (
                <div className="mt-4 rounded-2xl bg-teal-50 p-3">
                  <p className="text-xs font-semibold text-teal-800">Recipient</p>
                  <p className="mt-1 text-sm font-black text-teal-900">{txnDetail.to || '@best_friend'}</p>
                </div>
              )}

              {txnDetail.type === 'buy' && (
                <div className="mt-4 rounded-2xl bg-teal-50 p-3">
                  <p className="text-xs font-semibold text-teal-800">Asset</p>
                  <p className="mt-1 text-sm font-black text-teal-900">
                    {txnDetail.assetName} ({txnDetail.asset})
                  </p>
                  <p className="mt-1 text-xs text-teal-900/80">
                    ≈ {formatNumber(txnDetail.estUnits || 0, (txnDetail.asset === 'BTC' || txnDetail.asset === 'ETH') ? 6 : 4)} {txnDetail.asset}
                  </p>
                </div>
              )}
            </div>

            <div className={`${ui.card} ${ui.cardPad}`}>
              <p className="text-sm font-black text-slate-900">Fee breakdown</p>
              <p className="mt-1 text-xs text-slate-500">Transparent fees. No surprises. No drama.</p>

              <div className="mt-4 space-y-2 text-sm">
                {txnDetail.feeBreakdown?.paymentFee != null && (
                  <Row label="Payment method fee" value={formatCurrency(txnDetail.feeBreakdown.paymentFee, 4)} />
                )}
                {txnDetail.feeBreakdown?.gasFee != null && (
                  <Row label="Gas fee" value={formatCurrency(txnDetail.feeBreakdown.gasFee, 4)} />
                )}
                {txnDetail.feeBreakdown?.thirdPartyFee != null && (
                  <Row label="3rd party fee" value={formatCurrency(txnDetail.feeBreakdown.thirdPartyFee, 4)} />
                )}
                <Row label="diBoaS fee" value={formatCurrency(txnDetail.feeBreakdown?.diboasFee ?? 0, 4)} />
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm font-black text-slate-900">
                    <span>Total fees</span>
                    <span>{formatCurrency(txnDetail.fees, 4)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );

  const Row = ({ label, value, hint }) => (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-slate-700">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <p className="shrink-0 font-semibold text-slate-900">{value}</p>
    </div>
  );

  const LoginScreen = () => (
    <ScreenWrapper mutedBg>
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900">Welcome to diBoaS</h1>
          <p className="text-sm text-slate-600">
            Experience the demo. All options below will exist in the full product.
          </p>
        </div>

        <div className={`${ui.card} ${ui.cardPad}`}>
          <Section title="Continue with" description="Social sign-in (disabled in demo)">
            <div className="grid grid-cols-1 gap-2">
              {['Google', 'Apple', 'X (Twitter)'].map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
                >
                  <span>{t}</span>
                  <span className="text-xs font-bold">Unavailable</span>
                </button>
              ))}
            </div>
          </Section>

          <div className="my-5 border-t border-slate-200" />

          <Section title="Email" description="Email and password (disabled in demo)">
            <div className="space-y-3">
              <Input
                label="Email"
                value="guest@diboas.com"
                disabled
                hint="Demo credentials are pre-filled."
              />
              <Input
                label="Password"
                value="123456"
                disabled
                type="password"
              />
            </div>
          </Section>

          <div className="my-5 border-t border-slate-200" />

          <Section title="Wallet" description="Connect wallet (disabled in demo)">
            <div className="grid grid-cols-1 gap-2">
              {['MetaMask', 'Phantom', 'Backpack'].map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
                >
                  <span>{t}</span>
                  <span className="text-xs font-bold">Unavailable</span>
                </button>
              ))}
            </div>
          </Section>

          <div className="mt-6">
            <Button className="w-full" onClick={proceedFromLogin}>
              Proceed with demo
              <Icon name="chevRight" className="w-5 h-5" />
            </Button>
            <p className="mt-3 text-xs text-slate-500">
              This is a demo. No real authentication or financial connections are performed.
            </p>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );

  const LoadingScreen = ({ title, subtitle, showDoneLabel }) => (
    <ScreenWrapper showUser={false} mutedBg>
      <div className="mx-auto w-full max-w-md">
        <div className={`${ui.card} ${ui.cardPad} text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Icon name="spinner" className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

          {showDoneLabel && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              <Icon name="check" className="w-4 h-4" />
              Account created
            </div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );

  const StatusScreen = ({ tone = 'teal', title, subtitle }) => {
    const toneMap = {
      teal: 'bg-teal-50 text-teal-700',
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-emerald-50 text-emerald-700',
      orange: 'bg-orange-50 text-orange-700',
    };

    return (
      <ScreenWrapper showUser mutedBg={false}>
        <div className="mx-auto w-full max-w-md">
          <div className={`${ui.card} ${ui.cardPad} text-center`}>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${toneMap[tone] || toneMap.teal}`}>
              {tone === 'green' ? <Icon name="check" className="w-7 h-7" /> : <Icon name="spinner" className="w-7 h-7" />}
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
      </ScreenWrapper>
    );
  };

  const HomeScreen = () => {
    const canSend = completedSteps.deposit;
    const canBuy = completedSteps.send;
    const canGoals = completedSteps.buy;

    const badgeFor = (key) => {
      if (key === 'deposit' && !completedSteps.deposit) return { tone: 'teal', text: 'Start here' };
      if (key === 'send' && completedSteps.deposit && !completedSteps.send) return { tone: 'blue', text: 'Next' };
      if (key === 'buy' && completedSteps.send && !completedSteps.buy) return { tone: 'blue', text: 'Next' };
      if (key === 'goals' && completedSteps.buy) return { tone: 'blue', text: 'Next' };
      return null;
    };

    return (
      <ScreenWrapper showUser>
        <div className="space-y-6">
          <BalanceCard />

          <div className={`${ui.card} ${ui.cardPad}`}>
            <Section
              title="Quick actions"
              description="Features unlock as you go. Like a tutorial, but less annoying."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ActionTile
                  title="Add / Withdraw money"
                  subtitle="Fund your wallet (withdraw disabled)"
                  icon="plus"
                  badge={badgeFor('deposit') && { ...badgeFor('deposit') }}
                  enabled={true}
                  onClick={() => setStep('deposit')}
                />
                <ActionTile
                  title="Payment / Send / Request"
                  subtitle="Send money on-chain (request/payment disabled)"
                  icon="send"
                  badge={badgeFor('send') && { ...badgeFor('send') }}
                  enabled={canSend}
                  onClick={() => setStep('send')}
                />
                <ActionTile
                  title="Buy / Sell assets"
                  subtitle="Buy tokenized assets (sell disabled)"
                  icon="buy"
                  badge={badgeFor('buy') && { ...badgeFor('buy') }}
                  enabled={canBuy}
                  onClick={() => setStep('buy')}
                />
                <ActionTile
                  title="My goals & strategies"
                  subtitle="Planned feature (demo preview)"
                  icon="target"
                  badge={badgeFor('goals') && { ...badgeFor('goals') }}
                  enabled={canGoals}
                  onClick={() => setStep('goals')}
                />
              </div>
            </Section>
          </div>

          <div className={`${ui.card} ${ui.cardPad}`}>
            <Section title="Transaction history" description="Your recent activity appears here.">
              {transactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-800">No transactions yet</p>
                  <p className="mt-1 text-sm text-slate-600">Your transaction history will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {transactions.map((tx) => (
                    <TxnRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </ScreenWrapper>
    );
  };

  const DepositScreen = () => (
    <ScreenWrapper showUser>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep('home')}>
            Back
          </Button>
          <Badge tone="teal">Add money</Badge>
        </div>

        <BalanceCard compact />

        <div className={`${ui.card} ${ui.cardPad} space-y-5`}>
          <Section
            title="Add or withdraw"
            description="Withdraw is disabled in the demo."
            right={
              <Segmented
                value="add"
                onChange={() => {}}
                options={[
                  { value: 'add', label: 'Add money' },
                  { value: 'withdraw', label: 'Withdraw' },
                ]}
                disabledKeys={['withdraw']}
              />
            }
          />

          <Section title="Payment method" description="Only credit card is enabled in the demo.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { label: 'Credit Card', enabled: true, selected: true },
                { label: 'Bank', enabled: false },
                { label: 'Apple/Google Pay', enabled: false },
                { label: 'PayPal', enabled: false },
                { label: 'Stripe', enabled: false },
              ].map((m) => (
                <button
                  key={m.label}
                  type="button"
                  disabled={!m.enabled}
                  className={[
                    'flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold',
                    m.enabled ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed',
                    ui.focusRing,
                  ].join(' ')}
                >
                  <span>{m.label}</span>
                  {m.selected ? <Badge tone="teal">Selected</Badge> : <span className="text-xs font-bold">{m.enabled ? '' : 'Disabled'}</span>}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">On-chain</p>
              <p className="mt-1 text-sm text-slate-600">External wallet (disabled in demo)</p>
              <div className="mt-3">
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
                >
                  <span>External wallet</span>
                  <span className="text-xs font-bold">Disabled</span>
                </button>
              </div>
            </div>
          </Section>

          <Section title="Amount" description="Enter an amount and review fees before confirming.">
            <div className="space-y-3">
              <Input
                label="Deposit amount"
                prefix="$"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseAmount(e.target.value).cleaned)}
                inputMode="decimal"
                placeholder="0.00"
                hint="Quick picks below set the amount."
              />
              <div className="flex flex-wrap gap-2">
                {[25, 50, 100].map((amt) => (
                  <Button key={amt} variant="secondary" size="sm" onClick={() => setDepositAmount(String(amt))}>
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>
          </Section>

          {deposit.gross > 0 && (
            <div className="space-y-3">
              <div className={`${ui.card} overflow-hidden`}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">Gross total</p>
                        <InfoPopover label="Gross total info">
                          <p className="text-sm font-semibold text-slate-900">Gross total</p>
                          <p className="mt-1 text-sm text-slate-600">
                            This is the amount charged to your selected payment method before fees.
                          </p>
                        </InfoPopover>
                      </div>
                      <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(deposit.gross)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">Net total</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(deposit.net)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Added to your wallet</p>
                    </div>
                  </div>
                </div>

                <div className={`${ui.divider} px-5 py-4`}>
                  <FeeDetails title="Total fees" totalFees={deposit.totalFees}>
                    <Row
                      label="Payment method fee"
                      hint="2% of gross total"
                      value={formatCurrency(deposit.breakdown.paymentFee, 4)}
                    />
                    <Row label="diBoaS fee" value={formatCurrency(0, 4)} />
                  </FeeDetails>
                </div>
              </div>

              <Button className="w-full" onClick={startDeposit}>
                Confirm deposit
              </Button>
            </div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );

  const SendScreen = () => (
    <ScreenWrapper showUser>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep('home')}>
            Back
          </Button>
          <Badge tone="teal">Send money</Badge>
        </div>

        <BalanceCard compact />

        <div className={`${ui.card} ${ui.cardPad} space-y-5`}>
          <Section
            title="Send / Request / Payment"
            description="Request and payment are disabled in the demo."
            right={
              <Segmented
                value="send"
                onChange={() => {}}
                options={[
                  { value: 'send', label: 'Send' },
                  { value: 'request', label: 'Request' },
                  { value: 'payment', label: 'Payment' },
                ]}
                disabledKeys={['request', 'payment']}
              />
            }
          />

          <Section title="Send to" description="Pre-filled for the demo. On-chain transfer.">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">@best_friend</p>
                  <p className="mt-0.5 text-xs text-slate-500">On-chain transfer</p>
                </div>
                <Badge tone="green">
                  <Icon name="check" className="w-3.5 h-3.5" />
                  Selected
                </Badge>
              </div>
            </div>
          </Section>

          <Section title="Amount" description="Amount must be less than your cash balance.">
            <div className="space-y-3">
              <Input
                label="Send amount"
                prefix="$"
                value={sendAmount}
                onChange={(e) => setSendAmount(parseAmount(e.target.value).cleaned)}
                inputMode="decimal"
                placeholder="0.00"
                error={send.insufficient ? `Insufficient funds. Your cash balance is ${formatCurrency(cashBalance)}.` : ''}
              />
              <div className="flex flex-wrap gap-2">
                {[5, 10, 50].map((amt) => (
                  <Button key={amt} variant="secondary" size="sm" onClick={() => setSendAmount(String(amt))}>
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>
          </Section>

          {send.gross > 0 && (
            <div className="space-y-3">
              <div className={`${ui.card} overflow-hidden`}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">Gross total</p>
                        <InfoPopover label="Gross total info">
                          <p className="text-sm font-semibold text-slate-900">Gross total</p>
                          <p className="mt-1 text-sm text-slate-600">
                            This is the amount deducted from your cash balance.
                          </p>
                        </InfoPopover>
                      </div>
                      <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(send.gross)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">They receive</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(send.net, 4)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">After fees</p>
                    </div>
                  </div>
                </div>

                <div className={`${ui.divider} px-5 py-4`}>
                  <FeeDetails title="Total fees" totalFees={send.totalFees}>
                    <Row label="Gas fee" hint="0.01% of gross total" value={formatCurrency(send.breakdown.gasFee, 4)} />
                    <Row label="diBoaS fee" value={formatCurrency(0, 4)} />
                  </FeeDetails>
                </div>
              </div>

              <Button className="w-full" onClick={startSend} disabled={send.insufficient}>
                Confirm send
              </Button>
            </div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );

  const BuyScreen = () => {
    const categories = Object.keys(assetCategories);

    return (
      <ScreenWrapper showUser wide>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setStep('home')}>
              Back
            </Button>
            <Badge tone="teal">Buy assets</Badge>
          </div>

          <BalanceCard compact />

          <div className={`${ui.card} ${ui.cardPad} space-y-5`}>
            <Section title="Categories" description="Sell is disabled in the demo.">
              <Tabs tabs={categories} value={selectedCategory} onChange={setSelectedCategory} />
            </Section>

            <Section title="Assets" description="Mock prices for demo purposes.">
              <div className="space-y-2">
                {(assetCategories[selectedCategory] || []).map((a) => {
                  const active = a.symbol === selectedAsset;
                  return (
                    <div
                      key={a.symbol}
                      className={[
                        'flex items-center justify-between gap-3 rounded-2xl border p-4',
                        active ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedAsset(a.symbol)}
                        className={`flex min-w-0 items-center gap-3 text-left ${ui.focusRing} rounded-xl px-2 py-2`}
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-white text-teal-700' : 'bg-slate-100 text-slate-700'}`}>
                          <span className="text-sm font-black">{a.symbol.slice(0, 3)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{a.name}</p>
                          <p className="mt-0.5 text-xs text-slate-600">{a.symbol} · {formatCurrency(a.price)}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <Button variant="primary" size="sm" onClick={() => setSelectedAsset(a.symbol)}>
                          Buy
                        </Button>
                        <Button variant="secondary" size="sm" disabled>
                          Sell
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Amount" description="Amount must be less than your cash balance.">
              <div className="space-y-3">
                <Input
                  label="Buy amount (USD)"
                  prefix="$"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(parseAmount(e.target.value).cleaned)}
                  inputMode="decimal"
                  placeholder="0.00"
                  error={buy.insufficient ? `Insufficient funds. Your cash balance is ${formatCurrency(cashBalance)}.` : ''}
                />
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 50].map((amt) => (
                    <Button key={amt} variant="secondary" size="sm" onClick={() => setBuyAmount(String(amt))}>
                      ${amt}
                    </Button>
                  ))}
                </div>
              </div>
            </Section>

            {buy.gross > 0 && selectedAssetObj && (
              <div className="space-y-3">
                <div className={`${ui.card} overflow-hidden`}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Gross total</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(buy.gross)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">You receive (estimated)</p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {formatCurrency(buy.net, 4)} <span className="text-slate-600">worth of</span> {selectedAssetObj.symbol}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          ≈ {formatNumber(buy.estUnits, (selectedAssetObj.symbol === 'BTC' || selectedAssetObj.symbol === 'ETH') ? 6 : 4)} {selectedAssetObj.symbol}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${ui.divider} px-5 py-4`}>
                    <FeeDetails title="Total fees" totalFees={buy.totalFees}>
                      <Row label="Gas fee" hint="0.01% of gross total" value={formatCurrency(buy.breakdown.gasFee, 4)} />
                      <Row label="3rd party fee" hint="0.05% of gross total" value={formatCurrency(buy.breakdown.thirdPartyFee, 4)} />
                      <Row label="diBoaS fee" value={formatCurrency(0, 4)} />
                    </FeeDetails>
                  </div>
                </div>

                <Button className="w-full" onClick={startBuy} disabled={buy.insufficient}>
                  Buy {selectedAssetObj.name}
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScreenWrapper>
    );
  };

  const GoalsScreen = () => (
    <ScreenWrapper showUser>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep('home')}>
            Back
          </Button>
          <Badge tone="blue">Planned</Badge>
        </div>

        <div className={`${ui.card} ${ui.cardPad}`}>
          <h1 className="text-2xl font-black text-slate-900">My Goals & Strategies</h1>
          <p className="mt-2 text-sm text-slate-600">
            This section is planned (Steps 13+). In a full build, you’d pick strategies like “Beat Inflation”
            and diBoaS would automate your allocations. In this demo, you get a preview instead of a half-implemented mess.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            {[
              { title: 'Beat Inflation', desc: 'Maintain purchasing power with diversified exposure.' },
              { title: 'Build an Emergency Fund', desc: 'Gradually allocate into liquid, low-volatility assets.' },
              { title: 'Long-Term Growth', desc: 'Automate monthly buys across indices and blue chips.' },
            ].map((g) => (
              <div key={g.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">{g.title}</p>
                <p className="mt-1 text-sm text-slate-600">{g.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button className="w-full" onClick={() => setStep('home')}>
              Return to dashboard
            </Button>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );

  // -------------------------
  // Render router (string steps)
  // -------------------------
  if (step === 'login') return <LoginScreen />;

  if (step === 'creating-account') {
    return (
      <LoadingScreen
        title="Creating your account…"
        subtitle="Setting up your secure diBoaS account"
        showDoneLabel={false}
      />
    );
  }

  if (step === 'creating-wallet') {
    return (
      <LoadingScreen
        title="Creating your wallet…"
        subtitle="Preparing your secure digital wallet"
        showDoneLabel
      />
    );
  }

  if (step === 'home') return <HomeScreen />;

  if (step === 'deposit') return <DepositScreen />;
  if (step === 'deposit-processing') {
    return (
      <StatusScreen
        tone="blue"
        title="Connecting to your Credit Card…"
        subtitle="Please wait while we process your payment"
      />
    );
  }
  if (step === 'deposit-approved') {
    return <StatusScreen tone="green" title="Approved!" subtitle="Your payment has been approved" />;
  }
  if (step === 'deposit-complete') {
    return (
      <StatusScreen
        tone="teal"
        title="Deposit complete!"
        subtitle={`${formatCurrency(pendingRef.current?.net || deposit.net)} has been added to your wallet`}
      />
    );
  }

  if (step === 'send') return <SendScreen />;
  if (step === 'send-processing') {
    const net = pendingRef.current?.net ?? send.net;
    return <StatusScreen tone="blue" title={`Sending ${formatCurrency(net, 4)} to @best_friend…`} subtitle="Processing your transaction" />;
  }
  if (step === 'send-complete') {
    const net = pendingRef.current?.net ?? send.net;
    return <StatusScreen tone="green" title={`${formatCurrency(net, 4)} sent!`} subtitle="Your money is on its way to @best_friend" />;
  }

  if (step === 'buy') return <BuyScreen />;
  if (step === 'buy-processing') {
    const asset = pendingRef.current?.asset ?? selectedAssetObj;
    const net = pendingRef.current?.net ?? buy.net;
    return <StatusScreen tone="orange" title={`Buying ${formatCurrency(net, 4)} worth of ${asset?.name || 'asset'}…`} subtitle="Processing your purchase" />;
  }
  if (step === 'buy-complete') {
    const asset = pendingRef.current?.asset ?? selectedAssetObj;
    const net = pendingRef.current?.net ?? buy.net;
    return <StatusScreen tone="green" title={`${asset?.name || 'Asset'} bought!`} subtitle={`${formatCurrency(net, 4)} added to your investments`} />;
  }

  if (step === 'goals') return <GoalsScreen />;

  // Fallback
  return <HomeScreen />;
};

export default DiBoaSDemo;
