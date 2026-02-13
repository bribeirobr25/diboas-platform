import React, { useState } from 'react';

const DiBoaSDemo = () => {
  const [step, setStep] = useState('login');

  const [cashBalance, setCashBalance] = useState(0);
  const [investments, setInvestments] = useState({
    assets: {},  // { 'XAUT': { amount: 49.97, name: 'Gold' } }
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

  // Asset data
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

  // Calculate total investment value
  const totalInvestments = Object.values(investments.assets).reduce((sum, asset) => sum + asset.amount, 0) + investments.strategies;
  const totalBalance = cashBalance + totalInvestments;

  // Calculate deposit fees
  const depositGrossTotal = parseFloat(depositAmount) || 0;
  const depositPaymentFee = depositGrossTotal * 0.02;
  const depositDiboasFee = 0;
  const depositTotalFees = depositPaymentFee + depositDiboasFee;
  const depositNetTotal = depositGrossTotal - depositTotalFees;

  // Calculate send fees
  const sendGrossTotal = parseFloat(sendAmount) || 0;
  const sendGasFee = sendGrossTotal * 0.0001;
  const sendDiboasFee = 0;
  const sendTotalFees = sendGasFee + sendDiboasFee;
  const sendNetTotal = sendGrossTotal - sendTotalFees;
  const sendInsufficientFunds = sendGrossTotal > 0 && sendGrossTotal >= cashBalance;

  // Calculate buy fees
  const buyGrossTotal = parseFloat(buyAmount) || 0;
  const buyGasFee = buyGrossTotal * 0.0001;
  const buyThirdPartyFee = buyGrossTotal * 0.0005;
  const buyDiboasFee = 0;
  const buyTotalFees = buyGasFee + buyThirdPartyFee + buyDiboasFee;
  const buyNetTotal = buyGrossTotal - buyTotalFees;
  const buyInsufficientFunds = buyGrossTotal > 0 && buyGrossTotal >= cashBalance;

  // Get current asset info
  const currentAsset = assetCategories[selectedCategory]?.find(a => a.symbol === selectedAsset) || assetCategories.Gold[0];

  // Format currency
  const formatCurrency = (amount, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  // Format date/time
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

  // Handle proceed from login
  const handleProceed = () => {
    setStep('creating-account');
    setTimeout(() => {
      setStep('creating-wallet');
      setTimeout(() => {
        setStep('home');
      }, 3000);
    }, 3000);
  };

  // Handle deposit confirmation
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
            description: 'Added Money (Credit Card)',
            amount: netAmount,
            grossAmount: depositGrossTotal,
            fees: depositTotalFees,
            date: formatDateTime(),
          }, ...prev]);
          setCompletedSteps(prev => ({ ...prev, deposit: true }));
          setDepositAmount('');
          setStep('home');
        }, 2000);
      }, 2000);
    }, 2000);
  };

  // Handle send confirmation
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
      }, 2000);
    }, 2000);
  };

  // Handle buy confirmation
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
          description: `Bought ${asset.name} (${asset.symbol})`,
          amount: netAmount,
          grossAmount: grossAmount,
          fees: buyTotalFees,
          asset: asset.symbol,
          date: formatDateTime(),
        }, ...prev]);
        setCompletedSteps(prev => ({ ...prev, buy: true }));
        setBuyAmount('');
        setStep('home');
      }, 2000);
    }, 2000);
  };

  // ==================== TOOLTIP COMPONENT ====================
  const Tooltip = ({ children, text }) => (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10 shadow-lg">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  // ==================== HEADER COMPONENT ====================
  const Header = ({ showUser = false, onBack }) => (
    <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="Go back">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">d</span>
          </div>
          <span className="text-xl font-semibold text-slate-900">diBoaS</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full font-medium shadow-sm">DEMO MODE</span>
        {showUser && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Hello, Guest!</span>
            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center ring-1 ring-teal-200">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </header>
  );

  // ==================== BALANCE CARD COMPONENT ====================
  const BalanceCard = ({ compact = false }) => (
    <div className={`bg-gradient-to-br from-teal-600 to-cyan-500 rounded-3xl ${compact ? 'p-4' : 'p-8'} text-white shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:shadow-2xl`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-teal-100 text-sm font-medium mb-2 tracking-wide">Total Balance</p>
          <h2 className={`${compact ? 'text-3xl' : 'text-5xl'} font-bold tracking-tight`}>{formatCurrency(totalBalance)}</h2>
        </div>
        <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm`}>
          <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-3">
            <span className="text-lg">💵</span>
            <span className="text-teal-100 font-medium">Cash</span>
          </div>
          <span className="font-semibold">{formatCurrency(cashBalance)}</span>
        </div>

        <div>
          <button
            onClick={() => setInvestmentsExpanded(!investmentsExpanded)}
            className="w-full flex justify-between items-center text-sm transition-colors hover:text-teal-50"
            aria-expanded={investmentsExpanded}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📈</span>
              <span className="text-teal-100 font-medium">Investments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatCurrency(totalInvestments)}</span>
              {totalInvestments > 0 && (
                <svg className={`w-4 h-4 text-teal-200 transition-transform duration-300 ${investmentsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </button>

          {investmentsExpanded && totalInvestments > 0 && (
            <div className="mt-3 ml-8 space-y-2 text-sm animate-fadeIn">
              {Object.entries(investments.assets).map(([symbol, data]) => (
                <div key={symbol} className="flex justify-between text-teal-100">
                  <span className="flex items-center gap-1">└─ {data.name} <span className="text-teal-200">({symbol})</span></span>
                  <span>{formatCurrency(data.amount)}</span>
                </div>
              ))}
              {investments.strategies > 0 && (
                <div className="flex justify-between text-teal-100">
                  <span className="flex items-center gap-1">└─ Strategies</span>
                  <span>{formatCurrency(investments.strategies)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ==================== PROCESSING SCREEN COMPONENT ====================
  const ProcessingScreen = ({ title, subtitle, iconColor = 'text-blue-500', duration }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md w-full">
        <div className="w-24 h-24 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center animate-pulse">
          <svg className={`w-12 h-12 ${iconColor} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-600">{subtitle}</p>
      </div>
    </div>
  );

  // ==================== SUCCESS SCREEN COMPONENT ====================
  const SuccessScreen = ({ title, subtitle, iconColor = 'text-green-500' }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md w-full animate-fadeIn">
        <div className="w-24 h-24 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg className={`w-12 h-12 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-600">{subtitle}</p>
      </div>
    </div>
  );

  // ==================== LOGIN SCREEN ====================
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to diBoaS</h1>
              <p className="text-slate-600 text-sm">Experience the future of finance. Simple, secure, and seamless.</p>
            </div>

            {/* Social Auth */}
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center uppercase tracking-wider font-medium">Sign in with</p>
              <div className="grid grid-cols-3 gap-3">
                <button disabled className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center opacity-60 cursor-not-allowed hover:shadow-sm transition-shadow">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </button>
                <button disabled className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center opacity-60 cursor-not-allowed hover:shadow-sm transition-shadow">
                  <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                </button>
                <button disabled className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center opacity-60 cursor-not-allowed hover:shadow-sm transition-shadow">
                  <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wide">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Email/Password */}
            <div className="space-y-4">
              <input
                type="email"
                value="guest@diboas.com"
                disabled
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 cursor-not-allowed"
              />
              <input
                type="password"
                value="123456"
                disabled
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* Web3 Wallets */}
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center uppercase tracking-wider font-medium">Connect wallet</p>
              <div className="grid grid-cols-3 gap-3">
                <button disabled className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center opacity-60 cursor-not-allowed hover:shadow-sm transition-shadow">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <path fill="#FF6900" d="M3 3h18v18H3z" />
                    <path fill="#FFF" d="M5.25 5.25h13.5v13.5H5.25z" />
                    <path fill="#000" d="M12 8.25c-2.07 0-3.75 1.68-3.75 3.75s1.68 3.75 3.75 3.75 3.75-1.68 3.75-3.75-1.68-3.75-3.75-3.75zm0 6c-1.24 0-2.25-1.01-2.25-2.25s1.01-2.25 2.25-2.25 2.25 1.01 2.25 2.25-1.01 2.25-2.25 2.25z" />
                  </svg>
                </button>
                <button disabled className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center opacity-60 cursor-not-allowed hover:shadow-sm transition-shadow">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <path fill="#000" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.29-9.81c-.18-2.08-1.66-3.87-4.1-3.87-2.46 0-3.94 1.8-4.1 3.87h.57c.16-1.8 1.4-3.3 3.53-3.3 2.12 0 3.36 1.5 3.53 3.3h-7.06v.57h1.47c-.09.72-.5 1.27-1.15 1.47v.57h1.95v-.57c-.65-.2-1.06-.75-1.15-1.47h3.19c-.09.72-.5 1.27-1.15 1.47v.57h1.95v-.57c-.65-.2-1.06-.75-1.15-1.47h1.47v-.57h6.44z" />
                  </svg>
                </button>
                <button disabled className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center opacity-60 cursor-not-allowed hover:shadow-sm transition-shadow">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <path fill="#000" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2V9zm0 4h2v6h-2v-6z" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">This is a demo. All options will be available in the full product.</p>

            <button
              onClick={handleProceed}
              className="w-full py-4 bg-teal-600 text-white font-semibold rounded-2xl hover:bg-teal-700 transition-colors shadow-md"
            >
              Proceed with Demo
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==================== CREATING ACCOUNT SCREEN ====================
  if (step === 'creating-account') {
    return <ProcessingScreen title="Creating your account..." subtitle="Setting up your secure diBoaS account" iconColor="text-teal-500" />;
  }

  // ==================== CREATING WALLET SCREEN ====================
  if (step === 'creating-wallet') {
    return (
      <ProcessingScreen
        title="Creating your wallet..."
        subtitle="Preparing your secure digital wallet"
        iconColor="text-teal-500"
      />
    );
  }

  // ==================== DEPOSIT SCREEN ====================
  if (step === 'deposit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser onBack={() => setStep('home')} />
        <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full space-y-8">
          <h1 className="text-2xl font-bold text-slate-900">Add Money</h1>

          <BalanceCard compact />

          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            {/* Toggle */}
            <div className="flex bg-slate-100 rounded-full p-1">
              <button className="flex-1 py-3 px-6 bg-white rounded-full shadow-sm font-medium text-slate-900">Add Money</button>
              <button disabled className="flex-1 py-3 px-6 text-slate-500 opacity-60">Withdraw</button>
            </div>

            {/* Payment Methods - On-Ramp */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Payment Methods</p>
              <div className="space-y-3">
                <button className="w-full p-4 bg-white border-2 border-teal-500 rounded-2xl flex items-center justify-between shadow-sm">
                  <span className="font-medium text-slate-900">Credit Card</span>
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                {['Bank', 'Apple/Google Pay', 'PayPal', 'Stripe'].map(method => (
                  <button key={method} disabled className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 opacity-60 cursor-not-allowed">
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods - On-Chain */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">On-Chain Transfer</p>
              <button disabled className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 opacity-60 cursor-not-allowed">
                External Wallet
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Amount</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">$</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 pl-8 bg-white border border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-none"
                />
              </div>
              <div className="flex gap-3 mt-3">
                {[25, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(amt.toString())}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-medium text-slate-700 transition shadow-sm"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Confirmation Area */}
          {depositGrossTotal > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between text-sm">
                <Tooltip text="The amount you're adding before fees">
                  <span className="text-slate-600 font-medium border-b border-dashed border-slate-400 cursor-help">Gross Total</span>
                </Tooltip>
                <span className="font-semibold text-slate-900">{formatCurrency(depositGrossTotal)}</span>
              </div>

              <div>
                <button
                  onClick={() => setFeesExpanded(!feesExpanded)}
                  className="w-full flex justify-between text-sm transition-colors hover:text-slate-900"
                >
                  <Tooltip text="Breakdown of all applicable fees">
                    <span className="text-slate-600 font-medium flex items-center gap-2 border-b border-dashed border-slate-400 cursor-help">
                      Total Fees
                      <svg className={`w-4 h-4 transition-transform duration-300 ${feesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </Tooltip>
                  <span className="font-semibold text-red-600">-{formatCurrency(depositTotalFees, 4)}</span>
                </button>

                {feesExpanded && (
                  <div className="mt-3 space-y-2 text-xs text-slate-600 border-l-2 border-slate-200 pl-4 animate-fadeIn">
                    <div className="flex justify-between">
                      <Tooltip text="Credit card processing fee (2%)">
                        <span className="border-b border-dashed border-slate-300 cursor-help">Payment method fee (2%)</span>
                      </Tooltip>
                      <span>-{formatCurrency(depositPaymentFee, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <Tooltip text="diBoaS charges no fees on deposits">
                        <span className="border-b border-dashed border-slate-300 cursor-help">diBoaS fee</span>
                      </Tooltip>
                      <span className="text-green-600">{formatCurrency(depositDiboasFee)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-between">
                <Tooltip text="The final amount added to your cash balance">
                  <span className="font-semibold text-slate-900 border-b border-dashed border-slate-400 cursor-help">Net Total</span>
                </Tooltip>
                <span className="font-bold text-xl text-teal-600">{formatCurrency(depositNetTotal)}</span>
              </div>

              <button
                onClick={handleDepositConfirm}
                disabled={depositNetTotal <= 0}
                className="w-full py-4 bg-teal-600 text-white font-semibold rounded-2xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-md"
              >
                Confirm Deposit
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== DEPOSIT PROCESSING SCREENS ====================
  if (step === 'deposit-processing') {
    return <ProcessingScreen title="Connecting to your Credit Card..." subtitle="Please wait while we process your payment" />;
  }
  if (step === 'deposit-approved') {
    return <SuccessScreen title="Approved!" subtitle="Your payment has been approved" />;
  }
  if (step === 'deposit-complete') {
    return <SuccessScreen title="Deposit Complete!" subtitle={`${formatCurrency(depositNetTotal)} has been added to your wallet`} iconColor="text-teal-500" />;
  }

  // ==================== SEND SCREEN ====================
  if (step === 'send') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser onBack={() => setStep('home')} />
        <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full space-y-8">
          <h1 className="text-2xl font-bold text-slate-900">Send Money</h1>

          <BalanceCard compact />

          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            {/* Toggle */}
            <div className="flex bg-slate-100 rounded-full p-1">
              <button className="flex-1 py-3 px-6 bg-white rounded-full shadow-sm font-medium text-slate-900">Send Money</button>
              <button disabled className="flex-1 py-3 px-6 text-slate-500 opacity-60">Request</button>
              <button disabled className="flex-1 py-3 px-6 text-slate-500 opacity-60">Payment</button>
            </div>

            {/* Send To */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Send To</p>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">@best_friend</p>
                    <p className="text-xs text-slate-500">On-Chain Transfer</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Amount</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">$</span>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 pl-8 bg-white border border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-none"
                />
              </div>
              {sendInsufficientFunds && (
                <p className="mt-2 text-xs text-red-600 animate-fadeIn">Insufficient funds. Your cash balance is {formatCurrency(cashBalance)}</p>
              )}
              <div className="flex gap-3 mt-3">
                {[5, 10, 50].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setSendAmount(amt.toString())}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-medium text-slate-700 transition shadow-sm"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Confirmation Area */}
          {sendGrossTotal > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between text-sm">
                <Tooltip text="The amount you're sending before fees">
                  <span className="text-slate-600 font-medium border-b border-dashed border-slate-400 cursor-help">Gross Total</span>
                </Tooltip>
                <span className="font-semibold text-slate-900">{formatCurrency(sendGrossTotal)}</span>
              </div>

              <div>
                <button
                  onClick={() => setSendFeesExpanded(!sendFeesExpanded)}
                  className="w-full flex justify-between text-sm transition-colors hover:text-slate-900"
                >
                  <Tooltip text="Breakdown of all applicable fees">
                    <span className="text-slate-600 font-medium flex items-center gap-2 border-b border-dashed border-slate-400 cursor-help">
                      Total Fees
                      <svg className={`w-4 h-4 transition-transform duration-300 ${sendFeesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </Tooltip>
                  <span className="font-semibold text-red-600">-{formatCurrency(sendTotalFees, 4)}</span>
                </button>

                {sendFeesExpanded && (
                  <div className="mt-3 space-y-2 text-xs text-slate-600 border-l-2 border-slate-200 pl-4 animate-fadeIn">
                    <div className="flex justify-between">
                      <Tooltip text="Blockchain network fee (0.01%)">
                        <span className="border-b border-dashed border-slate-300 cursor-help">Gas fee (0.01%)</span>
                      </Tooltip>
                      <span>-{formatCurrency(sendGasFee, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <Tooltip text="diBoaS charges no fees on sends">
                        <span className="border-b border-dashed border-slate-300 cursor-help">diBoaS fee</span>
                      </Tooltip>
                      <span className="text-green-600">{formatCurrency(sendDiboasFee)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-between">
                <Tooltip text="The amount the recipient will receive">
                  <span className="font-semibold text-slate-900 border-b border-dashed border-slate-400 cursor-help">They Receive</span>
                </Tooltip>
                <span className="font-bold text-xl text-teal-600">{formatCurrency(sendNetTotal)}</span>
              </div>

              <button
                onClick={handleSendConfirm}
                disabled={sendNetTotal <= 0 || sendInsufficientFunds}
                className="w-full py-4 bg-teal-600 text-white font-semibold rounded-2xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-md"
              >
                {sendInsufficientFunds ? 'Insufficient Funds' : 'Confirm Send'}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== SEND PROCESSING SCREENS ====================
  if (step === 'send-processing') {
    return <ProcessingScreen title={`Sending ${formatCurrency(sendNetTotal)} to @best_friend...`} subtitle="Processing your transaction" iconColor="text-blue-500" />;
  }
  if (step === 'send-complete') {
    return <SuccessScreen title={`${formatCurrency(sendNetTotal)} Sent!`} subtitle="Your money is on its way to @best_friend" />;
  }

  // ==================== BUY SCREEN ====================
  if (step === 'buy') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser onBack={() => setStep('home')} />
        <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full space-y-8">
          <h1 className="text-2xl font-bold text-slate-900">Buy Assets</h1>

          <BalanceCard compact />

          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            {/* Asset Categories Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-2 -mx-6 px-6 scrollbar-hidden">
              {Object.keys(assetCategories).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedAsset(assetCategories[category][0].symbol);
                  }}
                  className={`py-2 px-4 rounded-full text-sm font-medium transition ${selectedCategory === category
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Asset List */}
            <div className="space-y-3">
              {assetCategories[selectedCategory].map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition ${selectedAsset === asset.symbol
                      ? 'bg-teal-50 border-2 border-teal-500 shadow-sm'
                      : 'bg-white border border-slate-200 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-600">{asset.symbol[0]}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      <p className="text-xs text-slate-500">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatCurrency(asset.price)}</p>
                    <div className="flex gap-2 mt-1">
                      <button className="px-3 py-1 bg-teal-600 text-white text-xs font-medium rounded-full hover:bg-teal-700 transition">
                        Buy
                      </button>
                      <button disabled className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full opacity-60">
                        Sell
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Amount</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">$</span>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={e => setBuyAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 pl-8 bg-white border border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-none"
                />
              </div>
              {buyInsufficientFunds && (
                <p className="mt-2 text-xs text-red-600 animate-fadeIn">Insufficient funds. Your cash balance is {formatCurrency(cashBalance)}</p>
              )}
              <div className="flex gap-3 mt-3">
                {[5, 10, 50].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setBuyAmount(amt.toString())}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-medium text-slate-700 transition shadow-sm"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Confirmation Area */}
          {buyGrossTotal > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between text-sm">
                <Tooltip text="The amount you're spending before fees">
                  <span className="text-slate-600 font-medium border-b border-dashed border-slate-400 cursor-help">Gross Total</span>
                </Tooltip>
                <span className="font-semibold text-slate-900">{formatCurrency(buyGrossTotal)}</span>
              </div>

              <div>
                <button
                  onClick={() => setBuyFeesExpanded(!buyFeesExpanded)}
                  className="w-full flex justify-between text-sm transition-colors hover:text-slate-900"
                >
                  <Tooltip text="Breakdown of all applicable fees">
                    <span className="text-slate-600 font-medium flex items-center gap-2 border-b border-dashed border-slate-400 cursor-help">
                      Total Fees
                      <svg className={`w-4 h-4 transition-transform duration-300 ${buyFeesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </Tooltip>
                  <span className="font-semibold text-red-600">-{formatCurrency(buyTotalFees, 4)}</span>
                </button>

                {buyFeesExpanded && (
                  <div className="mt-3 space-y-2 text-xs text-slate-600 border-l-2 border-slate-200 pl-4 animate-fadeIn">
                    <div className="flex justify-between">
                      <Tooltip text="Blockchain network fee (0.01%)">
                        <span className="border-b border-dashed border-slate-300 cursor-help">Gas fee (0.01%)</span>
                      </Tooltip>
                      <span>-{formatCurrency(buyGasFee, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <Tooltip text="Exchange/tokenization provider fee (0.05%)">
                        <span className="border-b border-dashed border-slate-300 cursor-help">3rd party fee (0.05%)</span>
                      </Tooltip>
                      <span>-{formatCurrency(buyThirdPartyFee, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <Tooltip text="diBoaS charges no fees on asset purchases">
                        <span className="border-b border-dashed border-slate-300 cursor-help">diBoaS fee</span>
                      </Tooltip>
                      <span className="text-green-600">{formatCurrency(buyDiboasFee)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-between">
                <Tooltip text={`The value of ${currentAsset.name} you'll receive`}>
                  <span className="font-semibold text-slate-900 border-b border-dashed border-slate-400 cursor-help">You Receive</span>
                </Tooltip>
                <span className="font-bold text-xl text-teal-600">{formatCurrency(buyNetTotal, 4)} in {currentAsset.symbol}</span>
              </div>

              <button
                onClick={handleBuyConfirm}
                disabled={buyNetTotal <= 0 || buyInsufficientFunds}
                className="w-full py-4 bg-teal-600 text-white font-semibold rounded-2xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-md"
              >
                {buyInsufficientFunds ? 'Insufficient Funds' : `Buy ${currentAsset.name}`}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== BUY PROCESSING SCREENS ====================
  if (step === 'buy-processing') {
    return <ProcessingScreen title={`Buying ${formatCurrency(buyNetTotal)} in ${currentAsset.name}...`} subtitle="Processing your purchase" iconColor="text-orange-500" />;
  }
  if (step === 'buy-complete') {
    return <SuccessScreen title={`${currentAsset.name} Bought!`} subtitle={`${formatCurrency(buyNetTotal)} added to your investments`} />;
  }

  // ==================== HOME SCREEN ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
      <Header showUser={true} />

      <main className="flex-1 px-6 py-8 max-w-md mx-auto w-full space-y-8">
        <BalanceCard />

        <section>
          <h3 className="text-xl font-semibold text-slate-900 mb-4">What would you like to do?</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              onClick={() => setStep('deposit')}
              className={`p-6 rounded-3xl text-left transition-shadow hover:shadow-md ${!completedSteps.deposit
                  ? 'bg-white border-2 border-teal-500 shadow-lg'
                  : 'bg-white border border-slate-200'
                }`}
            >
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-lg font-semibold text-slate-900">Add / Withdraw Money</h4>
                {!completedSteps.deposit && <span className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">Start here</span>}
              </div>
              <p className="text-sm text-slate-600">Deposit or cash out funds</p>
            </button>

            <button
              onClick={() => completedSteps.deposit && setStep('send')}
              disabled={!completedSteps.deposit}
              className={`p-6 rounded-3xl text-left transition-shadow ${completedSteps.deposit && !completedSteps.send
                  ? 'bg-white border-2 border-teal-500 shadow-lg cursor-pointer'
                  : completedSteps.deposit
                    ? 'bg-white border border-slate-200 hover:shadow-md cursor-pointer'
                    : 'bg-slate-50 border border-slate-200 opacity-50 cursor-not-allowed'
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${completedSteps.deposit ? 'bg-blue-50' : 'bg-slate-100'}`}>
                <svg className={`w-6 h-6 ${completedSteps.deposit ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-lg font-semibold ${completedSteps.deposit ? 'text-slate-900' : 'text-slate-400'}`}>Payment / Send / Request</h4>
                {completedSteps.deposit && !completedSteps.send && <span className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">Next</span>}
              </div>
              <p className={`text-sm ${completedSteps.deposit ? 'text-slate-600' : 'text-slate-400'}`}>Transfer money securely</p>
            </button>

            <button
              onClick={() => completedSteps.send && setStep('buy')}
              disabled={!completedSteps.send}
              className={`p-6 rounded-3xl text-left transition-shadow ${completedSteps.send && !completedSteps.buy
                  ? 'bg-white border-2 border-teal-500 shadow-lg cursor-pointer'
                  : completedSteps.send
                    ? 'bg-white border border-slate-200 hover:shadow-md cursor-pointer'
                    : 'bg-slate-50 border border-slate-200 opacity-50 cursor-not-allowed'
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${completedSteps.send ? 'bg-orange-50' : 'bg-slate-100'}`}>
                <svg className={`w-6 h-6 ${completedSteps.send ? 'text-orange-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-lg font-semibold ${completedSteps.send ? 'text-slate-900' : 'text-slate-400'}`}>Buy / Sell Assets</h4>
                {completedSteps.send && !completedSteps.buy && <span className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">Next</span>}
              </div>
              <p className={`text-sm ${completedSteps.send ? 'text-slate-600' : 'text-slate-400'}`}>Invest in assets easily</p>
            </button>

            <button
              disabled={!completedSteps.buy}
              className={`p-6 rounded-3xl text-left transition-shadow ${completedSteps.buy && !completedSteps.goals
                  ? 'bg-white border-2 border-teal-500 shadow-lg'
                  : completedSteps.buy
                    ? 'bg-white border border-slate-200 hover:shadow-md'
                    : 'bg-slate-50 border border-slate-200 opacity-50 cursor-not-allowed'
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${completedSteps.buy ? 'bg-teal-50' : 'bg-slate-100'}`}>
                <svg className={`w-6 h-6 ${completedSteps.buy ? 'text-teal-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-lg font-semibold ${completedSteps.buy ? 'text-slate-900' : 'text-slate-400'}`}>My Goals & Strategies</h4>
                {completedSteps.buy && !completedSteps.goals && <span className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">Next</span>}
              </div>
              <p className={`text-sm ${completedSteps.buy ? 'text-slate-600' : 'text-slate-400'}`}>Achieve your financial goals</p>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Transactions</h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {transactions.length === 0 ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-slate-900">No transactions yet</h4>
                <p className="text-sm text-slate-600">Your history will appear here as you explore</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${tx.type === 'deposit' ? 'bg-green-50' :
                          tx.type === 'buy' ? 'bg-orange-50' : 'bg-red-50'
                        }`}>
                        <svg className={`w-5 h-5 ${tx.type === 'deposit' ? 'text-green-600' :
                            tx.type === 'buy' ? 'text-orange-600' : 'text-red-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            tx.type === 'deposit' ? 'M12 6v12m-6-6h12' :
                              tx.type === 'buy' ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' :
                                'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                          } />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{tx.description}</p>
                        <p className="text-sm text-slate-500">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`block font-semibold ${tx.type === 'deposit' ? 'text-green-600' :
                          tx.type === 'buy' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.type === 'deposit' ? tx.amount : tx.grossAmount)}
                      </span>
                      <button className="text-xs text-teal-600 hover:underline transition">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="px-6 py-4 text-center text-sm text-slate-500 border-t border-slate-100 bg-white/95 backdrop-blur-md">
        © 2026 diBoaS. Empowering your financial journey.
      </footer>
    </div>
  );
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  .scrollbar-hidden::-webkit-scrollbar {
    display: none;
  }
`;
document.head.append(style);

export default DiBoaSDemo;