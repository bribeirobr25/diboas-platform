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
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );

  // ==================== HEADER COMPONENT ====================
  const Header = ({ showUser = false }) => (
    <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">d</span>
        </div>
        <span className="text-xl font-semibold text-slate-800">diBoaS</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
          DEMO MODE
        </span>
        {showUser && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Hello, Guest!</span>
            <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center">
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
    <div className={`bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl ${compact ? 'p-4' : 'p-6'} text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-teal-100 text-sm font-medium mb-1">Total Balance</p>
          <h2 className={`${compact ? 'text-2xl' : 'text-4xl'} font-bold`}>{formatCurrency(totalBalance)}</h2>
        </div>
        <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-white/20 rounded-full flex items-center justify-center`}>
          <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>
      
      <div className="border-t border-white/20 pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">💵</span>
            <span className="text-teal-100 text-sm">Cash</span>
          </div>
          <span className="font-semibold">{formatCurrency(cashBalance)}</span>
        </div>
        
        <div>
          <button 
            onClick={() => setInvestmentsExpanded(!investmentsExpanded)}
            className="w-full flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <span className="text-teal-100 text-sm">Investments</span>
              {totalInvestments > 0 && (
                <svg className={`w-4 h-4 text-teal-200 transition-transform ${investmentsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
            <span className="font-semibold">{formatCurrency(totalInvestments)}</span>
          </button>
          
          {investmentsExpanded && totalInvestments > 0 && (
            <div className="mt-2 ml-8 space-y-1 text-sm">
              {Object.entries(investments.assets).map(([symbol, data]) => (
                <div key={symbol} className="flex justify-between text-teal-100">
                  <span>└─ {data.name} ({symbol})</span>
                  <span>{formatCurrency(data.amount)}</span>
                </div>
              ))}
              {investments.strategies > 0 && (
                <div className="flex justify-between text-teal-100">
                  <span>└─ Strategies</span>
                  <span>{formatCurrency(investments.strategies)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ==================== LOGIN SCREEN ====================
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-6">
            
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-slate-800">Welcome to diBoaS</h1>
              <p className="text-slate-600">Experience the demo — see how easy it is to manage your money.</p>
            </div>

            {/* Social Auth */}
            <div className="space-y-3">
              <p className="text-xs text-slate-500 text-center uppercase tracking-wide">Sign in with</p>
              <div className="flex gap-3">
                <button disabled className="flex-1 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-slate-500">Google</span>
                </button>
                <button disabled className="flex-1 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                  <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span className="text-sm font-medium text-slate-500">Apple</span>
                </button>
                <button disabled className="flex-1 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                  <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-sm font-medium text-slate-500">X</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-slate-50 to-cyan-50 text-slate-500">or with email</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" value="guest@diboas.com" disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input type="password" value="123456" disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-slate-50 to-cyan-50 text-slate-500">or with Web3 wallet</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button disabled className="flex-1 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
                  <path d="M35.1 3L21.6 13.1l2.5-5.9L35.1 3z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.9 3l13.4 10.2-2.4-6L4.9 3zM30.2 27.7l-3.6 5.5 7.7 2.1 2.2-7.5-6.3-.1zM3.6 27.8l2.2 7.5 7.7-2.1-3.6-5.5-6.3.1z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium text-slate-500">MetaMask</span>
              </button>
              <button disabled className="flex-1 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <div className="w-5 h-5 bg-purple-400 rounded-full"></div>
                <span className="text-sm font-medium text-slate-500">Phantom</span>
              </button>
              <button disabled className="flex-1 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-orange-500 rounded-md"></div>
                <span className="text-sm font-medium text-slate-500">Backpack</span>
              </button>
            </div>

            <button onClick={handleProceed} className="w-full py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition shadow-lg shadow-teal-600/20">
              Proceed with Demo
            </button>

            <p className="text-xs text-slate-500 text-center">
              This is a demo. All options shown above will be available in the full product.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ==================== CREATING ACCOUNT SCREEN ====================
  if (step === 'creating-account') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Creating your account...</h1>
              <p className="text-slate-600">Setting up your secure diBoaS account</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==================== CREATING WALLET SCREEN ====================
  if (step === 'creating-wallet') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-cyan-100 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Creating your wallet...</h1>
              <p className="text-slate-600">Preparing your secure digital wallet</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-teal-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Account created</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==================== DEPOSIT PROCESSING SCREENS ====================
  if (step === 'deposit-processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Connecting to your Credit Card...</h1>
              <p className="text-slate-600">Please wait while we process your payment</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'deposit-approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Approved!</h1>
              <p className="text-slate-600">Your payment has been approved</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'deposit-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Deposit Complete!</h1>
              <p className="text-slate-600">{formatCurrency(depositNetTotal)} has been added to your wallet</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==================== SEND PROCESSING SCREENS ====================
  if (step === 'send-processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Sending {formatCurrency(sendNetTotal)} to @best_friend...</h1>
              <p className="text-slate-600">Processing your transaction</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'send-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">{formatCurrency(sendNetTotal)} Sent!</h1>
              <p className="text-slate-600">Your money is on its way to @best_friend</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==================== BUY PROCESSING SCREENS ====================
  if (step === 'buy-processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Buying {formatCurrency(buyNetTotal)} in {currentAsset.name}...</h1>
              <p className="text-slate-600">Processing your purchase</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'buy-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex flex-col">
        <Header showUser />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">{currentAsset.name} Bought!</h1>
              <p className="text-slate-600">{formatCurrency(buyNetTotal)} added to your investments</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==================== DEPOSIT SCREEN ====================
  if (step === 'deposit') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header showUser />
        
        <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full overflow-y-auto">
          <button onClick={() => setStep('home')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <BalanceCard compact />

          <div className="mt-6 flex gap-2">
            <button className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-xl">Add Money</button>
            <button disabled className="flex-1 py-3 bg-slate-100 text-slate-400 font-medium rounded-xl cursor-not-allowed">Withdraw</button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Payment Method</h3>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide">On-Ramp</p>
              <div className="grid grid-cols-3 gap-2">
                <button className="p-3 bg-teal-50 border-2 border-teal-500 rounded-xl flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-xs font-medium text-teal-700">Credit Card</span>
                </button>
                <button disabled className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs font-medium text-slate-400">Bank</span>
                </button>
                <button disabled className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-400">Apple/Google</span>
                </button>
                <button disabled className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                  <span className="text-lg font-bold text-slate-400">P</span>
                  <span className="text-xs font-medium text-slate-400">PayPal</span>
                </button>
                <button disabled className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                  <span className="text-lg font-bold text-slate-400">S</span>
                  <span className="text-xs font-medium text-slate-400">Stripe</span>
                </button>
              </div>
              
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-4">On-Chain</p>
              <div className="grid grid-cols-3 gap-2">
                <button disabled className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-xs font-medium text-slate-400">External Wallet</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Amount</h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">$</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setDepositAmount('25')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$25</button>
              <button onClick={() => setDepositAmount('50')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$50</button>
              <button onClick={() => setDepositAmount('100')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$100</button>
            </div>
          </div>

          {depositGrossTotal > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <Tooltip text="The amount you're adding before fees">
                    <span className="text-slate-600 border-b border-dashed border-slate-400 cursor-help">Gross Total</span>
                  </Tooltip>
                  <span className="font-medium text-slate-800">{formatCurrency(depositGrossTotal)}</span>
                </div>
                
                <div>
                  <button onClick={() => setFeesExpanded(!feesExpanded)} className="w-full flex justify-between items-center text-sm">
                    <Tooltip text="Fees charged by payment provider and diBoaS">
                      <span className="text-slate-600 flex items-center gap-1 border-b border-dashed border-slate-400 cursor-help">
                        Total Fees
                        <svg className={`w-4 h-4 transition-transform ${feesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </Tooltip>
                    <span className="font-medium text-red-600">-{formatCurrency(depositTotalFees)}</span>
                  </button>
                  
                  {feesExpanded && (
                    <div className="mt-2 ml-4 space-y-2 text-xs text-slate-500 border-l-2 border-slate-100 pl-3">
                      <div className="flex justify-between items-center">
                        <Tooltip text="Fee charged by credit card processor (2%)">
                          <span className="border-b border-dashed border-slate-300 cursor-help">Payment method fee (2%)</span>
                        </Tooltip>
                        <span>-{formatCurrency(depositPaymentFee)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Tooltip text="diBoaS charges no fees on deposits">
                          <span className="border-b border-dashed border-slate-300 cursor-help">diBoaS fee</span>
                        </Tooltip>
                        <span className="text-green-600">{formatCurrency(depositDiboasFee)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <Tooltip text="The amount that will be added to your wallet">
                    <span className="font-semibold text-slate-800 border-b border-dashed border-slate-400 cursor-help">Net Total</span>
                  </Tooltip>
                  <span className="font-bold text-lg text-teal-600">{formatCurrency(depositNetTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleDepositConfirm}
                disabled={depositNetTotal <= 0}
                className="w-full mt-4 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                Confirm Deposit
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== SEND MONEY SCREEN ====================
  if (step === 'send') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header showUser />
        
        <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full overflow-y-auto">
          <button onClick={() => setStep('home')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <BalanceCard compact />

          <div className="mt-6 flex gap-2">
            <button className="flex-1 py-3 bg-teal-600 text-white font-medium rounded-xl">Send Money</button>
            <button disabled className="flex-1 py-3 bg-slate-100 text-slate-400 font-medium rounded-xl cursor-not-allowed">Request</button>
            <button disabled className="flex-1 py-3 bg-slate-100 text-slate-400 font-medium rounded-xl cursor-not-allowed">Payment</button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Send To</h3>
            <div className="p-4 bg-teal-50 border-2 border-teal-500 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <input type="text" value="@best_friend" disabled className="w-full bg-transparent text-lg font-semibold text-teal-800 cursor-not-allowed outline-none" />
                  <p className="text-xs text-teal-600">On-Chain Transfer</p>
                </div>
                <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Amount</h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">$</span>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-10 pr-4 py-4 text-2xl font-semibold border rounded-xl focus:ring-2 outline-none ${
                  sendInsufficientFunds ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'
                }`}
              />
            </div>
            {sendInsufficientFunds && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Insufficient funds. Your cash balance is {formatCurrency(cashBalance)}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setSendAmount('5')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$5</button>
              <button onClick={() => setSendAmount('10')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$10</button>
              <button onClick={() => setSendAmount('50')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$50</button>
            </div>
          </div>

          {sendGrossTotal > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <Tooltip text="The amount you're sending">
                    <span className="text-slate-600 border-b border-dashed border-slate-400 cursor-help">Gross Total</span>
                  </Tooltip>
                  <span className="font-medium text-slate-800">{formatCurrency(sendGrossTotal)}</span>
                </div>
                
                <div>
                  <button onClick={() => setSendFeesExpanded(!sendFeesExpanded)} className="w-full flex justify-between items-center text-sm">
                    <Tooltip text="Network gas fees and diBoaS fees">
                      <span className="text-slate-600 flex items-center gap-1 border-b border-dashed border-slate-400 cursor-help">
                        Total Fees
                        <svg className={`w-4 h-4 transition-transform ${sendFeesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </Tooltip>
                    <span className="font-medium text-red-600">-{formatCurrency(sendTotalFees, 4)}</span>
                  </button>
                  
                  {sendFeesExpanded && (
                    <div className="mt-2 ml-4 space-y-2 text-xs text-slate-500 border-l-2 border-slate-100 pl-3">
                      <div className="flex justify-between items-center">
                        <Tooltip text="Blockchain network fee (0.01%)">
                          <span className="border-b border-dashed border-slate-300 cursor-help">Gas fee (0.01%)</span>
                        </Tooltip>
                        <span>-{formatCurrency(sendGasFee, 4)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Tooltip text="diBoaS charges no fees on sends to other users">
                          <span className="border-b border-dashed border-slate-300 cursor-help">diBoaS fee</span>
                        </Tooltip>
                        <span className="text-green-600">{formatCurrency(sendDiboasFee)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <Tooltip text="The amount @best_friend will receive">
                    <span className="font-semibold text-slate-800 border-b border-dashed border-slate-400 cursor-help">They Receive</span>
                  </Tooltip>
                  <span className="font-bold text-lg text-teal-600">{formatCurrency(sendNetTotal, 4)}</span>
                </div>
              </div>

              <button
                onClick={handleSendConfirm}
                disabled={sendNetTotal <= 0 || sendInsufficientFunds}
                className="w-full mt-4 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                {sendInsufficientFunds ? 'Insufficient Funds' : 'Confirm Send'}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== BUY/SELL ASSETS SCREEN ====================
  if (step === 'buy') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header showUser />
        
        <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full overflow-y-auto">
          <button onClick={() => setStep('home')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <BalanceCard compact />

          {/* Asset Categories */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Asset Category</h3>
            <div className="flex gap-2">
              {Object.keys(assetCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedAsset(assetCategories[category][0].symbol);
                    setBuyAmount('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                    selectedCategory === category
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Assets List */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Select Asset</h3>
            <div className="space-y-2">
              {assetCategories[selectedCategory].map((asset) => (
                <div
                  key={asset.symbol}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                    selectedAsset === asset.symbol
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => {
                    setSelectedAsset(asset.symbol);
                    setBuyAmount('');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedCategory === 'Gold' ? 'bg-yellow-100' :
                        selectedCategory === 'Crypto' ? 'bg-orange-100' :
                        selectedCategory === 'Stocks' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <span className="font-bold text-sm">
                          {asset.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{asset.name}</p>
                        <p className="text-sm text-slate-500">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{formatCurrency(asset.price)}</p>
                      <div className="flex gap-2 mt-1">
                        <button 
                          className={`px-3 py-1 text-xs font-medium rounded-lg ${
                            selectedAsset === asset.symbol
                              ? 'bg-teal-600 text-white'
                              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                          }`}
                        >
                          Buy
                        </button>
                        <button 
                          disabled
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Amount to Buy</h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-slate-400">$</span>
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-10 pr-4 py-4 text-2xl font-semibold border rounded-xl focus:ring-2 outline-none ${
                  buyInsufficientFunds ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'
                }`}
              />
            </div>
            {buyInsufficientFunds && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Insufficient funds. Your cash balance is {formatCurrency(cashBalance)}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setBuyAmount('5')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$5</button>
              <button onClick={() => setBuyAmount('10')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$10</button>
              <button onClick={() => setBuyAmount('50')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition">$50</button>
            </div>
          </div>

          {/* Confirmation Area */}
          {buyGrossTotal > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <Tooltip text="The amount you're spending">
                    <span className="text-slate-600 border-b border-dashed border-slate-400 cursor-help">Gross Total</span>
                  </Tooltip>
                  <span className="font-medium text-slate-800">{formatCurrency(buyGrossTotal)}</span>
                </div>
                
                <div>
                  <button onClick={() => setBuyFeesExpanded(!buyFeesExpanded)} className="w-full flex justify-between items-center text-sm">
                    <Tooltip text="Network gas fees, 3rd party fees, and diBoaS fees">
                      <span className="text-slate-600 flex items-center gap-1 border-b border-dashed border-slate-400 cursor-help">
                        Total Fees
                        <svg className={`w-4 h-4 transition-transform ${buyFeesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </Tooltip>
                    <span className="font-medium text-red-600">-{formatCurrency(buyTotalFees, 4)}</span>
                  </button>
                  
                  {buyFeesExpanded && (
                    <div className="mt-2 ml-4 space-y-2 text-xs text-slate-500 border-l-2 border-slate-100 pl-3">
                      <div className="flex justify-between items-center">
                        <Tooltip text="Blockchain network fee (0.01%)">
                          <span className="border-b border-dashed border-slate-300 cursor-help">Gas fee (0.01%)</span>
                        </Tooltip>
                        <span>-{formatCurrency(buyGasFee, 4)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Tooltip text="Exchange/tokenization provider fee (0.05%)">
                          <span className="border-b border-dashed border-slate-300 cursor-help">3rd party fee (0.05%)</span>
                        </Tooltip>
                        <span>-{formatCurrency(buyThirdPartyFee, 4)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Tooltip text="diBoaS charges no fees on asset purchases">
                          <span className="border-b border-dashed border-slate-300 cursor-help">diBoaS fee</span>
                        </Tooltip>
                        <span className="text-green-600">{formatCurrency(buyDiboasFee)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <Tooltip text={`The value of ${currentAsset.name} you'll receive`}>
                    <span className="font-semibold text-slate-800 border-b border-dashed border-slate-400 cursor-help">You Receive</span>
                  </Tooltip>
                  <span className="font-bold text-lg text-teal-600">{formatCurrency(buyNetTotal, 4)} in {currentAsset.symbol}</span>
                </div>
              </div>

              <button
                onClick={handleBuyConfirm}
                disabled={buyNetTotal <= 0 || buyInsufficientFunds}
                className="w-full mt-4 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                {buyInsufficientFunds ? 'Insufficient Funds' : `Buy ${currentAsset.name}`}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== HOME SCREEN ====================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header showUser />

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        
        <BalanceCard />

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">What would you like to do?</h3>
          <div className="grid grid-cols-2 gap-4">
            
            <button 
              onClick={() => setStep('deposit')}
              className={`p-5 rounded-xl border text-left transition ${
                !completedSteps.deposit
                  ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20 hover:shadow-lg'
                  : 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-md'
              }`}
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-800">Add / Withdraw Money</h4>
                {!completedSteps.deposit && <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Start here</span>}
              </div>
              <p className="text-sm text-slate-500 mt-1">Deposit or cash out</p>
            </button>

            <button 
              onClick={() => completedSteps.deposit && setStep('send')}
              disabled={!completedSteps.deposit}
              className={`p-5 rounded-xl border text-left transition ${
                completedSteps.deposit && !completedSteps.send
                  ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20 hover:shadow-lg cursor-pointer'
                  : completedSteps.deposit
                    ? 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer'
                    : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${completedSteps.deposit ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <svg className={`w-6 h-6 ${completedSteps.deposit ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${completedSteps.deposit ? 'text-slate-800' : 'text-slate-400'}`}>Payment / Send / Request</h4>
                {completedSteps.deposit && !completedSteps.send && <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Next</span>}
              </div>
              <p className={`text-sm mt-1 ${completedSteps.deposit ? 'text-slate-500' : 'text-slate-400'}`}>Pay, send or request money</p>
            </button>

            <button 
              onClick={() => completedSteps.send && setStep('buy')}
              disabled={!completedSteps.send}
              className={`p-5 rounded-xl border text-left transition ${
                completedSteps.send && !completedSteps.buy
                  ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20 hover:shadow-lg cursor-pointer'
                  : completedSteps.send
                    ? 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer'
                    : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${completedSteps.send ? 'bg-orange-100' : 'bg-slate-100'}`}>
                <svg className={`w-6 h-6 ${completedSteps.send ? 'text-orange-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${completedSteps.send ? 'text-slate-800' : 'text-slate-400'}`}>Buy / Sell Assets</h4>
                {completedSteps.send && !completedSteps.buy && <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Next</span>}
              </div>
              <p className={`text-sm mt-1 ${completedSteps.send ? 'text-slate-500' : 'text-slate-400'}`}>Trade crypto & tokenized assets</p>
            </button>

            <button 
              disabled={!completedSteps.buy}
              className={`p-5 rounded-xl border text-left transition ${
                completedSteps.buy && !completedSteps.goals
                  ? 'bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20 hover:shadow-lg'
                  : completedSteps.buy
                    ? 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-md'
                    : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${completedSteps.buy ? 'bg-teal-100' : 'bg-slate-100'}`}>
                <svg className={`w-6 h-6 ${completedSteps.buy ? 'text-teal-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${completedSteps.buy ? 'text-slate-800' : 'text-slate-400'}`}>My Goals & Strategies</h4>
                {completedSteps.buy && !completedSteps.goals && <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Next</span>}
              </div>
              <p className={`text-sm mt-1 ${completedSteps.buy ? 'text-slate-500' : 'text-slate-400'}`}>Grow your money automatically</p>
            </button>

          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Transactions</h3>
          <div className="bg-white rounded-xl border border-slate-200">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">No transactions yet</h4>
                <p className="text-sm text-slate-500">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-100' : 
                        tx.type === 'buy' ? 'bg-orange-100' : 'bg-red-100'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          tx.type === 'deposit' ? 'text-green-600' : 
                          tx.type === 'buy' ? 'text-orange-600' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {tx.type === 'deposit' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
                          ) : tx.type === 'buy' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{tx.description}</p>
                        <p className="text-sm text-slate-500">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${
                        tx.type === 'deposit' ? 'text-green-600' : 
                        tx.type === 'buy' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.type === 'deposit' ? tx.amount : tx.grossAmount)}
                      </span>
                      <button className="block text-xs text-teal-600 hover:underline mt-1">
                        View details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>

      <footer className="px-6 py-4 text-center text-sm text-slate-500 border-t border-slate-200">
        <p>© 2026 diBoaS. Your money, your control.</p>
      </footer>
    </div>
  );
};

export default DiBoaSDemo;
