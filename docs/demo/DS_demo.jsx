import React, { useState, useEffect } from 'react';

const DiBoaSDemo = () => {
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
  const [selectedCategory, setSelectedCategory] = useState('Gold');
  const [selectedAsset, setSelectedAsset] = useState('XAUT');
  const [completedSteps, setCompletedSteps] = useState({
    deposit: false,
    send: false,
    buy: false,
    goals: false
  });
  const [timeOfDay, setTimeOfDay] = useState('');

  // Enhanced asset data with categories and performance
  const assetCategories = {
    ETFs: [
      { symbol: 'SPYx', name: 'S&P 500 ETF', price: 592.45, change: 0.8, icon: '📊' },
      { symbol: 'QQQx', name: 'Nasdaq 100 ETF', price: 518.23, change: 1.2, icon: '📈' },
      { symbol: 'IWMon', name: 'Russell 2000 ETF', price: 224.67, change: -0.3, icon: '📉' }
    ],
    Stocks: [
      { symbol: 'TSLAx', name: 'Tesla', price: 248.50, change: 2.1, icon: '🚗' },
      { symbol: 'GOOGLx', name: 'Alphabet', price: 175.30, change: 0.5, icon: '🔍' },
      { symbol: 'NVDAx', name: 'NVIDIA', price: 137.85, change: 3.2, icon: '💻' }
    ],
    Crypto: [
      { symbol: 'BTC', name: 'Bitcoin', price: 97250.00, change: 1.8, icon: '₿' },
      { symbol: 'ETH', name: 'Ethereum', price: 2650.00, change: 0.9, icon: 'Ξ' },
      { symbol: 'SOL', name: 'Solana', price: 195.40, change: 2.4, icon: '◎' },
      { symbol: 'SUI', name: 'Sui', price: 3.85, change: -1.2, icon: '💎' }
    ],
    Gold: [
      { symbol: 'XAUT', name: 'Tether Gold', price: 2945.00, change: 0.3, icon: '🪙' }
    ]
  };

  // Time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  // Enhanced balance calculations
  const totalInvestments = Object.values(investments.assets).reduce((sum, asset) => sum + asset.amount, 0) + investments.strategies;
  const totalBalance = cashBalance + totalInvestments;

  // Fee calculations with enhanced transparency
  const calculateDepositFees = (amount) => {
    const gross = parseFloat(amount) || 0;
    const paymentFee = gross * 0.02;
    const diboasFee = 0;
    const totalFees = paymentFee + diboasFee;
    const net = gross - totalFees;
    return { gross, paymentFee, diboasFee, totalFees, net };
  };

  const calculateSendFees = (amount) => {
    const gross = parseFloat(amount) || 0;
    const gasFee = gross * 0.0001;
    const diboasFee = 0;
    const totalFees = gasFee + diboasFee;
    const net = gross - totalFees;
    const insufficientFunds = gross > 0 && gross > cashBalance;
    return { gross, gasFee, diboasFee, totalFees, net, insufficientFunds };
  };

  const calculateBuyFees = (amount) => {
    const gross = parseFloat(amount) || 0;
    const gasFee = gross * 0.0001;
    const thirdPartyFee = gross * 0.0005;
    const diboasFee = 0;
    const totalFees = gasFee + thirdPartyFee + diboasFee;
    const net = gross - totalFees;
    const insufficientFunds = gross > 0 && gross > cashBalance;
    return { gross, gasFee, thirdPartyFee, diboasFee, totalFees, net, insufficientFunds };
  };

  const depositFees = calculateDepositFees(depositAmount);
  const sendFees = calculateSendFees(sendAmount);
  const buyFees = calculateBuyFees(buyAmount);
  const currentAsset = assetCategories[selectedCategory]?.find(a => a.symbol === selectedAsset) || assetCategories.Gold[0];

  // Formatting utilities
  const formatCurrency = (amount, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  const formatDateTime = () => {
    return new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Flow handlers
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
    setStep('deposit-processing');
    setTimeout(() => {
      setStep('deposit-approved');
      setTimeout(() => {
        setStep('deposit-complete');
        setTimeout(() => {
          setCashBalance(prev => prev + depositFees.net);
          setTransactions(prev => [{
            id: Date.now(),
            type: 'deposit',
            description: 'Added Money (Credit Card)',
            amount: depositFees.net,
            grossAmount: depositFees.gross,
            fees: depositFees.totalFees,
            date: formatDateTime(),
            status: 'completed'
          }, ...prev]);
          setCompletedSteps(prev => ({ ...prev, deposit: true }));
          setDepositAmount('');
          setStep('home');
        }, 1500);
      }, 1500);
    }, 2000);
  };

  const handleSendConfirm = () => {
    setStep('send-processing');
    setTimeout(() => {
      setStep('send-complete');
      setTimeout(() => {
        setCashBalance(prev => prev - sendFees.gross);
        setTransactions(prev => [{
          id: Date.now(),
          type: 'send',
          description: 'Sent to @best_friend',
          amount: sendFees.net,
          grossAmount: sendFees.gross,
          fees: sendFees.totalFees,
          date: formatDateTime(),
          status: 'completed'
        }, ...prev]);
        setCompletedSteps(prev => ({ ...prev, send: true }));
        setSendAmount('');
        setStep('home');
      }, 1500);
    }, 2000);
  };

  const handleBuyConfirm = () => {
    setStep('buy-processing');
    setTimeout(() => {
      setStep('buy-complete');
      setTimeout(() => {
        setCashBalance(prev => prev - buyFees.gross);
        setInvestments(prev => ({
          ...prev,
          assets: {
            ...prev.assets,
            [currentAsset.symbol]: {
              amount: (prev.assets[currentAsset.symbol]?.amount || 0) + buyFees.net,
              name: currentAsset.name,
              icon: currentAsset.icon
            }
          }
        }));
        setTransactions(prev => [{
          id: Date.now(),
          type: 'buy',
          description: `Bought ${currentAsset.name}`,
          amount: buyFees.net,
          grossAmount: buyFees.gross,
          fees: buyFees.totalFees,
          asset: currentAsset.symbol,
          date: formatDateTime(),
          status: 'completed'
        }, ...prev]);
        setCompletedSteps(prev => ({ ...prev, buy: true }));
        setBuyAmount('');
        setStep('home');
      }, 1500);
    }, 2000);
  };

  // ==================== REUSABLE COMPONENTS ====================

  const Tooltip = ({ children, text, position = 'top' }) => (
    <div className="relative inline-block group">
      {children}
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg`}>
        {text}
        <div className={`absolute ${position === 'top' ? 'top-full' : 'bottom-full'} left-1/2 transform -translate-x-1/2 border-4 border-transparent ${position === 'top' ? 'border-t-gray-900' : 'border-b-gray-900'}`}></div>
      </div>
    </div>
  );

  const StatusBadge = ({ status, text }) => {
    const colors = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status] || colors.pending}`}>
        {text}
      </span>
    );
  };

  const ProcessScreen = ({ icon, title, subtitle, color = 'emerald' }) => {
    const colors = {
      emerald: 'bg-emerald-50 text-emerald-600',
      blue: 'bg-blue-50 text-blue-600',
      orange: 'bg-orange-50 text-orange-600'
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-8 max-w-sm">
            <div className={`w-24 h-24 mx-auto ${colors[color]} rounded-2xl flex items-center justify-center`}>
              {icon}
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              <p className="text-gray-600">{subtitle}</p>
            </div>
            <div className="pt-4">
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  const FeeBreakdown = ({ fees, type, expanded: initiallyExpanded }) => {
    const [expanded, setExpanded] = useState(initiallyExpanded);

    const feeConfigs = {
      deposit: [
        { label: 'Payment method fee (2%)', value: fees.paymentFee, tooltip: 'Charged by credit card processor' },
        { label: 'diBoaS fee', value: fees.diboasFee, tooltip: 'No fees on deposits', positive: true }
      ],
      send: [
        { label: 'Gas fee (0.01%)', value: fees.gasFee, tooltip: 'Blockchain network fee' },
        { label: 'diBoaS fee', value: fees.diboasFee, tooltip: 'No fees on sends', positive: true }
      ],
      buy: [
        { label: 'Gas fee (0.01%)', value: fees.gasFee, tooltip: 'Blockchain network fee' },
        { label: '3rd party fee (0.05%)', value: fees.thirdPartyFee, tooltip: 'Exchange/tokenization provider' },
        { label: 'diBoaS fee', value: fees.diboasFee, tooltip: 'No fees on purchases', positive: true }
      ]
    };

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Fee Breakdown</span>
            <span className="text-xs text-gray-500">({fees.totalFees > 0 ? `-${formatCurrency(fees.totalFees, 4)}` : 'No fees'})</span>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-4 py-3 bg-white space-y-2 border-t border-gray-200">
            {feeConfigs[type].map((fee, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <Tooltip text={fee.tooltip}>
                  <span className="text-gray-600 hover:text-gray-900 transition-colors cursor-help">
                    {fee.label}
                  </span>
                </Tooltip>
                <span className={`font-medium ${fee.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fee.positive ? '+' : '-'}{formatCurrency(fee.value, fee.value < 0.01 ? 4 : 2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==================== HEADER ====================
  const Header = ({ showUser = false }) => {
    const greeting = `Good ${timeOfDay}`;
    const contextualMessage = transactions.length > 0
      ? `Your balance is ${formatCurrency(totalBalance)}`
      : 'Welcome to your financial hub';

    return (
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">dB</span>
          </div>
          <div>
            <span className="text-xl font-semibold text-gray-900 tracking-tight">diBoaS</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
              DEMO MODE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showUser && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{greeting}</p>
                <p className="text-xs text-gray-500">{contextualMessage}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center border border-gray-200">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  };

  // ==================== BALANCE CARD ====================
  const BalanceCard = ({ compact = false }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl ${compact ? 'p-6' : 'p-8'} text-white shadow-xl overflow-hidden relative`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 2.5%)`,
          backgroundSize: '50px 50px'
        }}></div>

        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2 tracking-wide">TOTAL BALANCE</p>
              <h2 className={`font-semibold tracking-tight ${compact ? 'text-3xl' : 'text-4xl md:text-5xl'}`}>
                {formatCurrency(totalBalance)}
              </h2>
            </div>
            <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center`}>
              <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">💵</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Cash</p>
                  <p className="text-emerald-400 text-xs">Available to spend</p>
                </div>
              </div>
              <span className="font-semibold">{formatCurrency(cashBalance)}</span>
            </div>

            <div>
              <button
                onClick={() => totalInvestments > 0 && setExpanded(!expanded)}
                className="w-full flex justify-between items-center"
                disabled={totalInvestments === 0}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📈</span>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Investments</p>
                    <p className="text-blue-400 text-xs">Market value</p>
                  </div>
                  {totalInvestments > 0 && (
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
                <span className="font-semibold">{formatCurrency(totalInvestments)}</span>
              </button>

              {expanded && totalInvestments > 0 && (
                <div className="mt-3 ml-12 space-y-2">
                  {Object.entries(investments.assets).map(([symbol, data]) => (
                    <div key={symbol} className="flex justify-between items-center text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{data.icon || '📊'}</span>
                        <span className="text-sm">{data.name}</span>
                        <span className="text-xs text-gray-400">({symbol})</span>
                      </div>
                      <span className="text-sm">{formatCurrency(data.amount)}</span>
                    </div>
                  ))}
                  {investments.strategies > 0 && (
                    <div className="flex justify-between items-center text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span className="text-sm">Automated Strategies</span>
                      </div>
                      <span className="text-sm">{formatCurrency(investments.strategies)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== SCREENS ====================

  // Login Screen
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">dB</span>
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Welcome to diBoaS</h1>
                <p className="text-gray-600 mt-2">Experience financial control reimagined</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                <input
                  type="email"
                  value="guest@diboas.com"
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value="123456"
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-500 text-center uppercase tracking-wider">Or continue with</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Google', 'Apple', 'X'].map((provider) => (
                    <button key={provider} disabled className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                      <span className="text-sm font-medium text-gray-400">{provider}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProceed}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Proceed with Demo
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center px-4">
              This interactive demo simulates the complete diBoaS experience. All authentication methods will be available in production.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Process Screens
  if (step === 'creating-account') {
    return <ProcessScreen
      icon={<div className="w-10 h-10 border-3 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>}
      title="Creating your account"
      subtitle="Setting up your secure diBoaS profile"
      color="emerald"
    />;
  }

  if (step === 'creating-wallet') {
    return <ProcessScreen
      icon={<div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>}
      title="Securing your wallet"
      subtitle="Generating encrypted keys and security protocols"
      color="blue"
    />;
  }

  if (step === 'deposit-processing') {
    return <ProcessScreen
      icon={<div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>}
      title="Processing payment"
      subtitle={`Adding ${formatCurrency(depositFees.net)} to your wallet`}
      color="blue"
    />;
  }

  if (step === 'deposit-approved') {
    return <ProcessScreen
      icon={
        <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      }
      title="Payment approved"
      subtitle="Funds are being transferred to your account"
      color="emerald"
    />;
  }

  if (step === 'deposit-complete') {
    return <ProcessScreen
      icon={
        <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="Deposit complete"
      subtitle={`${formatCurrency(depositFees.net)} available in your wallet`}
      color="emerald"
    />;
  }

  if (step === 'send-processing') {
    return <ProcessScreen
      icon={<div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>}
      title="Sending funds"
      subtitle={`Transferring ${formatCurrency(sendFees.net)} to @best_friend`}
      color="blue"
    />;
  }

  if (step === 'send-complete') {
    return <ProcessScreen
      icon={
        <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      }
      title="Transfer complete"
      subtitle={`${formatCurrency(sendFees.net)} sent to @best_friend`}
      color="emerald"
    />;
  }

  if (step === 'buy-processing') {
    return <ProcessScreen
      icon={<div className="w-10 h-10 border-3 border-gray-200 border-t-orange-600 rounded-full animate-spin"></div>}
      title="Processing purchase"
      subtitle={`Buying ${currentAsset.name} (${currentAsset.symbol})`}
      color="orange"
    />;
  }

  if (step === 'buy-complete') {
    return <ProcessScreen
      icon={
        <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      }
      title="Purchase complete"
      subtitle={`${formatCurrency(buyFees.net)} of ${currentAsset.name} added to portfolio`}
      color="emerald"
    />;
  }

  // Deposit Screen
  if (step === 'deposit') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUser />

        <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
          <button
            onClick={() => setStep('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to dashboard</span>
          </button>

          <BalanceCard compact />

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Money</h3>
              <div className="grid grid-cols-3 gap-3">
                {['Credit Card', 'Bank Transfer', 'Wallet'].map((method, idx) => (
                  <button
                    key={method}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${idx === 0
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    disabled={idx > 0}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${idx === 0 ? 'bg-emerald-500' : 'bg-gray-100'
                      }`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${idx === 0 ? 'text-emerald-700' : 'text-gray-700'
                      }`}>{method}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount</h3>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 text-2xl font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                />
              </div>
              <div className="flex gap-2 mt-3">
                {[25, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount.toString())}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {depositFees.gross > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">You're adding</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatCurrency(depositFees.gross)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">You'll receive</p>
                      <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(depositFees.net)}</p>
                    </div>
                  </div>

                  <FeeBreakdown fees={depositFees} type="deposit" expanded={true} />
                </div>

                <button
                  onClick={handleDepositConfirm}
                  disabled={depositFees.net <= 0}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Confirm Deposit
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Funds are typically available instantly. Review our fee policy for complete details.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Send Screen
  if (step === 'send') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUser />

        <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
          <button
            onClick={() => setStep('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to dashboard</span>
          </button>

          <BalanceCard compact />

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send to</h3>
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value="@best_friend"
                      disabled
                      className="w-full bg-transparent text-lg font-semibold text-gray-900 cursor-not-allowed outline-none"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">diBoaS user</span>
                      <span className="text-xs text-gray-500">• Instant transfer</span>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount</h3>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-12 pr-4 py-4 text-2xl font-semibold border rounded-xl focus:ring-2 outline-none bg-white ${sendFees.insufficientFunds
                      ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                      : 'border-gray-300 focus:ring-emerald-500 focus:border-transparent'
                    }`}
                />
              </div>
              {sendFees.insufficientFunds && (
                <div className="mt-2 flex items-center gap-2 text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Insufficient funds. Available: {formatCurrency(cashBalance)}</span>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {[5, 10, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSendAmount(amount.toString())}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {sendFees.gross > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">You send</p>
                      <p className="text-xl font-semibold text-gray-900">{formatCurrency(sendFees.gross)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">They receive</p>
                      <p className="text-xl font-semibold text-emerald-600">{formatCurrency(sendFees.net, 4)}</p>
                    </div>
                  </div>

                  <FeeBreakdown fees={sendFees} type="send" expanded={true} />

                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-blue-700">
                        Transfers between diBoaS users are instant and free. External transfers may incur network fees.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSendConfirm}
                  disabled={sendFees.net <= 0 || sendFees.insufficientFunds}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {sendFees.insufficientFunds ? 'Insufficient Funds' : 'Confirm Transfer'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Buy Screen
  if (step === 'buy') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUser />

        <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
          <button
            onClick={() => setStep('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to dashboard</span>
          </button>

          <BalanceCard compact />

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Categories</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Object.keys(assetCategories).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedAsset(assetCategories[category][0].symbol);
                      setBuyAmount('');
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === category
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Assets</h3>
              <div className="space-y-3">
                {assetCategories[selectedCategory].map((asset) => (
                  <div
                    key={asset.symbol}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedAsset === asset.symbol
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    onClick={() => {
                      setSelectedAsset(asset.symbol);
                      setBuyAmount('');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${selectedCategory === 'Gold' ? 'bg-amber-100 text-amber-700' :
                            selectedCategory === 'Crypto' ? 'bg-orange-100 text-orange-700' :
                              selectedCategory === 'Stocks' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                          {asset.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{asset.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{asset.symbol}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${asset.change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {asset.change >= 0 ? '+' : ''}{asset.change}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(asset.price)}</p>
                        <p className="text-xs text-gray-500 mt-1">per unit</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Amount</h3>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-12 pr-4 py-4 text-2xl font-semibold border rounded-xl focus:ring-2 outline-none bg-white ${buyFees.insufficientFunds
                      ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                      : 'border-gray-300 focus:ring-emerald-500 focus:border-transparent'
                    }`}
                />
              </div>
              {buyFees.insufficientFunds && (
                <div className="mt-2 flex items-center gap-2 text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Insufficient funds. Available: {formatCurrency(cashBalance)}</span>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {[5, 10, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBuyAmount(amount.toString())}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {buyFees.gross > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">You pay</p>
                      <p className="text-xl font-semibold text-gray-900">{formatCurrency(buyFees.gross)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">You receive</p>
                      <p className="text-xl font-semibold text-emerald-600">{formatCurrency(buyFees.net, 4)}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">Asset</span>
                      <span className="font-medium text-gray-900">{currentAsset.name} ({currentAsset.symbol})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Current price</span>
                      <span className="font-medium text-gray-900">{formatCurrency(currentAsset.price)}</span>
                    </div>
                  </div>

                  <FeeBreakdown fees={buyFees} type="buy" expanded={true} />

                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-blue-700">
                        {selectedCategory === 'Gold'
                          ? 'Gold can serve as a hedge against inflation and currency fluctuations.'
                          : 'Prices update in real-time. All assets are held in secure, regulated custody.'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBuyConfirm}
                  disabled={buyFees.net <= 0 || buyFees.insufficientFunds}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {buyFees.insufficientFunds ? 'Insufficient Funds' : `Buy ${currentAsset.name}`}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ==================== HOME SCREEN ====================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUser />

      <main className="flex-1 px-4 py-8 max-w-6xl mx-auto w-full">
        <BalanceCard />

        <div className="mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">What would you like to do?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Add / Withdraw Money',
                description: 'Deposit funds or cash out to your bank',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ),
                color: 'emerald',
                step: 'deposit',
                requiredStep: null,
                completed: completedSteps.deposit,
                badge: !completedSteps.deposit ? 'Start here' : null
              },
              {
                title: 'Payment / Send / Request',
                description: 'Transfer money or request payments',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                ),
                color: 'blue',
                step: 'send',
                requiredStep: 'deposit',
                completed: completedSteps.send,
                badge: completedSteps.deposit && !completedSteps.send ? 'Next' : null
              },
              {
                title: 'Buy / Sell Assets',
                description: 'Trade crypto & tokenized assets',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                color: 'orange',
                step: 'buy',
                requiredStep: 'send',
                completed: completedSteps.buy,
                badge: completedSteps.send && !completedSteps.buy ? 'Next' : null
              },
              {
                title: 'My Goals & Strategies',
                description: 'Grow your money automatically',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                color: 'purple',
                step: null,
                requiredStep: 'buy',
                completed: completedSteps.goals,
                badge: completedSteps.buy && !completedSteps.goals ? 'Next' : null
              }
            ].map((item, index) => {
              const isEnabled = !item.requiredStep || completedSteps[item.requiredStep];
              const isNextStep = item.badge === 'Next';

              return (
                <button
                  key={index}
                  onClick={() => isEnabled && item.step && setStep(item.step)}
                  disabled={!isEnabled}
                  className={`p-6 rounded-2xl border text-left transition-all group ${isEnabled
                      ? isNextStep
                        ? 'bg-white border-emerald-500 shadow-lg ring-2 ring-emerald-500/20 hover:shadow-xl hover:border-emerald-600'
                        : 'bg-white border-gray-200 hover:border-emerald-500 hover:shadow-lg'
                      : 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                        item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          item.color === 'orange' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                      {item.icon}
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${item.badge === 'Start here'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h4 className={`font-semibold mb-2 ${isEnabled ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                    {item.title}
                  </h4>
                  <p className={`text-sm ${isEnabled ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                    {item.description}
                  </p>
                  {isEnabled && item.step && (
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center text-sm text-emerald-600 font-medium">
                        Get started
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
            {transactions.length > 0 && (
              <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                View all
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No transactions yet</h4>
                <p className="text-gray-500 text-sm">Complete your first transaction to see your history here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-100' :
                            tx.type === 'buy' ? 'bg-orange-100' : 'bg-blue-100'
                          }`}>
                          {tx.type === 'deposit' ? (
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
                            </svg>
                          ) : tx.type === 'buy' ? (
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{tx.date}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <StatusBadge status={tx.status} text={tx.status} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${tx.type === 'deposit' ? 'text-emerald-600' :
                            tx.type === 'buy' ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                          {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.type === 'deposit' ? tx.amount : tx.grossAmount)}
                        </div>
                        <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1">
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">dB</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">diBoaS</span>
            </div>
            <p className="text-sm text-gray-600">© 2026 diBoaS. Your money, your control.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">DEMO MODE</span>
              <button className="text-xs text-gray-500 hover:text-gray-700">Privacy</button>
              <button className="text-xs text-gray-500 hover:text-gray-700">Terms</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DiBoaSDemo;