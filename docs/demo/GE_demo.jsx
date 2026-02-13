import React, { useState, useEffect } from 'react';

// ==================== ICONS (Lucide Style) ====================
const Icons = {
  ArrowRight: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
  ArrowUpRight: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10" /></svg>,
  ArrowDownLeft: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 7L7 17M17 17H7V7" /></svg>,
  Plus: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  CreditCard: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
  Wallet: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>,
  Send: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  TrendingUp: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  Target: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Check: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  ChevronLeft: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>,
  Home: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Info: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  Lock: ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
};

// ==================== UI COMPONENTS ====================

const Card = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200 transition-all duration-200' : ''} ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = "", disabled, onClick, ...props }) => {
  const baseStyles = "relative w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:shadow-teal-600/30",
    secondary: "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800",
    outline: "bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
    ghost: "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`}></div>
);

const Tooltip = ({ children, text }) => (
  <div className="relative group flex items-center">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

// Sparkline Graph SVG
const Sparkline = () => (
  <svg className="w-full h-12 text-teal-500 opacity-20" preserveAspectRatio="none" viewBox="0 0 100 40">
    <path d="M0 35 Q 20 35, 30 20 T 60 15 T 100 5 L 100 40 L 0 40 Z" fill="currentColor" />
    <path d="M0 35 Q 20 35, 30 20 T 60 15 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const DiBoaSDemo = () => {
  // State
  const [step, setStep] = useState('login');
  const [loadingState, setLoadingState] = useState(''); // For granular loading text

  const [cashBalance, setCashBalance] = useState(0);
  const [investments, setInvestments] = useState({ assets: {}, strategies: 0 });
  const [transactions, setTransactions] = useState([]);

  // Forms & Inputs
  const [depositAmount, setDepositAmount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  // UI Toggles
  const [feesExpanded, setFeesExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Gold');
  const [selectedAsset, setSelectedAsset] = useState('XAUT');
  const [completedSteps, setCompletedSteps] = useState({
    deposit: false,
    send: false,
    buy: false,
    goals: false
  });

  // ==================== DATA & CALCULATIONS ====================

  const assetCategories = {
    ETFs: [
      { symbol: 'SPYx', name: 'S&P 500 ETF', price: 592.45, change: '+1.2%' },
      { symbol: 'QQQx', name: 'Nasdaq 100', price: 518.23, change: '+0.8%' },
    ],
    Stocks: [
      { symbol: 'TSLA', name: 'Tesla Inc', price: 248.50, change: '-2.4%' },
      { symbol: 'NVDA', name: 'NVIDIA', price: 137.85, change: '+3.1%' },
    ],
    Crypto: [
      { symbol: 'BTC', name: 'Bitcoin', price: 97250.00, change: '+5.4%' },
      { symbol: 'ETH', name: 'Ethereum', price: 2650.00, change: '+1.2%' },
    ],
    Gold: [
      { symbol: 'XAUT', name: 'Tether Gold', price: 2945.00, change: '+0.1%' }
    ]
  };

  const currentAsset = assetCategories[selectedCategory]?.find(a => a.symbol === selectedAsset) || assetCategories.Gold[0];
  const totalInvestments = Object.values(investments.assets).reduce((sum, asset) => sum + asset.amount, 0) + investments.strategies;
  const totalBalance = cashBalance + totalInvestments;

  // Fee Calculations
  const calculateFees = (amount, type) => {
    const gross = parseFloat(amount) || 0;
    if (type === 'deposit') {
      const paymentFee = gross * 0.02;
      return { gross, paymentFee, diboasFee: 0, totalFees: paymentFee, net: gross - paymentFee };
    }
    if (type === 'send') {
      const gasFee = gross * 0.0001;
      return { gross, gasFee, diboasFee: 0, totalFees: gasFee, net: gross - gasFee };
    }
    if (type === 'buy') {
      const gasFee = gross * 0.0001;
      const thirdPartyFee = gross * 0.0005;
      return { gross, gasFee, thirdPartyFee, diboasFee: 0, totalFees: gasFee + thirdPartyFee, net: gross - (gasFee + thirdPartyFee) };
    }
    return { gross: 0, net: 0, totalFees: 0 };
  };

  const depositData = calculateFees(depositAmount, 'deposit');
  const sendData = calculateFees(sendAmount, 'send');
  const buyData = calculateFees(buyAmount, 'buy');

  // Formatters
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDateTime = () => new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ==================== ACTIONS ====================

  const simulateLoading = (nextStep, ms = 2000, stages = []) => {
    // If stages provided, cycle through them
    if (stages.length > 0) {
      let currentStage = 0;
      setLoadingState(stages[0]);

      const interval = setInterval(() => {
        currentStage++;
        if (currentStage < stages.length) {
          setLoadingState(stages[currentStage]);
        }
      }, ms / stages.length);

      setTimeout(() => {
        clearInterval(interval);
        setStep(nextStep);
      }, ms);
    } else {
      setTimeout(() => setStep(nextStep), ms);
    }
  };

  const handleProceed = () => {
    setStep('creating-account');
    simulateLoading('home', 4000, ['Creating secure ID...', 'Generating wallet keys...', 'Encrypting storage...', 'Finalizing setup...']);
  };

  const handleDepositConfirm = () => {
    setStep('processing');
    simulateLoading('deposit-success', 2500, ['Contacting Bank...', 'Verifying funds...', 'Confirming transaction...']);
    setTimeout(() => {
      setCashBalance(prev => prev + depositData.net);
      setTransactions(prev => [{
        id: Date.now(), type: 'deposit', title: 'Deposit via Card',
        amount: depositData.net, date: formatDateTime()
      }, ...prev]);
      setCompletedSteps(prev => ({ ...prev, deposit: true }));
    }, 2500);
  };

  const handleSendConfirm = () => {
    setStep('processing');
    simulateLoading('send-success', 2500, ['Locating recipient...', 'Calculating gas...', 'Broadcasting to chain...']);
    setTimeout(() => {
      setCashBalance(prev => prev - sendData.gross);
      setTransactions(prev => [{
        id: Date.now(), type: 'send', title: 'Sent to @best_friend',
        amount: sendData.net, date: formatDateTime()
      }, ...prev]);
      setCompletedSteps(prev => ({ ...prev, send: true }));
    }, 2500);
  };

  const handleBuyConfirm = () => {
    setStep('processing');
    simulateLoading('buy-success', 2500, ['Routing order...', 'Securing price...', 'Swapping assets...']);
    setTimeout(() => {
      setCashBalance(prev => prev - buyData.gross);
      setInvestments(prev => ({
        ...prev, assets: { ...prev.assets, [currentAsset.symbol]: { amount: (prev.assets[currentAsset.symbol]?.amount || 0) + buyData.net, name: currentAsset.name } }
      }));
      setTransactions(prev => [{
        id: Date.now(), type: 'buy', title: `Bought ${currentAsset.symbol}`,
        amount: buyData.net, date: formatDateTime()
      }, ...prev]);
      setCompletedSteps(prev => ({ ...prev, buy: true }));
    }, 2500);
  };

  // ==================== SHARED LAYOUTS ====================

  const Header = ({ backTo }) => (
    <div className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {backTo ? (
          <button onClick={() => setStep(backTo)} className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            d
          </div>
        )}
        <span className="font-bold text-slate-800 tracking-tight text-lg">diBoaS</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-block px-2 py-1 bg-amber-100/50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-200">
          Demo Environment
        </span>
        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center border border-teal-200">
          <span className="text-teal-700 font-semibold text-xs">G</span>
        </div>
      </div>
    </div>
  );

  const SuccessScreen = ({ title, amount, subtitle, onDone }) => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-scaleIn">
        <Icons.Check className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">{formatCurrency(amount)}</p>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">{subtitle}</p>
      <div className="w-full max-w-xs">
        <Button onClick={onDone} variant="secondary">Done</Button>
      </div>
    </div>
  );

  const ProcessingScreen = ({ text }) => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2 animate-pulse">{text}</h2>
      <p className="text-sm text-slate-400">Secured by 256-bit encryption</p>
    </div>
  );

  // ==================== SCREENS ====================

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-6 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-teal-50 to-transparent"></div>

        <div className="w-full max-w-sm mx-auto z-10">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg mx-auto mb-6">
              d
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome back</h1>
            <p className="text-slate-500">Secure, transparent financial management.</p>
          </div>

          <div className="space-y-4 mb-8">
            <Card className="p-1">
              <div className="p-3 border-b border-slate-50 flex items-center gap-3">
                <div className="w-5 flex justify-center"><Icons.Wallet className="w-4 h-4 text-slate-400" /></div>
                <input type="email" value="guest@diboas.com" disabled className="bg-transparent w-full text-slate-600 outline-none text-sm font-medium cursor-not-allowed" />
              </div>
              <div className="p-3 flex items-center gap-3">
                <div className="w-5 flex justify-center"><Icons.Lock className="w-4 h-4 text-slate-400" /></div>
                <input type="password" value="••••••••" disabled className="bg-transparent w-full text-slate-600 outline-none text-sm font-medium cursor-not-allowed" />
              </div>
            </Card>
          </div>

          <Button onClick={handleProceed} variant="secondary">
            Sign In with Demo Account
            <Icons.ArrowRight className="w-4 h-4" />
          </Button>

          <div className="mt-8 flex items-center gap-4 justify-center grayscale opacity-60">
            <span className="text-xs font-semibold text-slate-400">TRUSTED BY</span>
            <div className="h-4 w-12 bg-slate-300 rounded"></div>
            <div className="h-4 w-12 bg-slate-300 rounded"></div>
            <div className="h-4 w-12 bg-slate-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'creating-account') return <ProcessingScreen text={loadingState} />;
  if (step === 'processing') return <ProcessingScreen text={loadingState} />;

  if (step === 'deposit-success') return <SuccessScreen title="Deposit Successful" amount={depositData.net} subtitle="Funds have been added to your cash balance." onDone={() => { setDepositAmount(''); setStep('home'); }} />;
  if (step === 'send-success') return <SuccessScreen title="Money Sent" amount={sendData.net} subtitle="Your transaction has been processed securely." onDone={() => { setSendAmount(''); setStep('home'); }} />;
  if (step === 'buy-success') return <SuccessScreen title="Purchase Complete" amount={buyData.net} subtitle={`${currentAsset.name} has been added to your portfolio.`} onDone={() => { setBuyAmount(''); setStep('home'); }} />;

  // ==================== HOME (DASHBOARD) ====================
  if (step === 'home') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <Header />

        <main className="px-4 py-6 max-w-lg mx-auto space-y-6">

          {/* Main Balance Card (Bento Block A) */}
          <Card className="relative bg-slate-900 text-white border-none p-6 overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icons.TrendingUp className="w-32 h-32 text-teal-400" />
            </div>
            <div className="relative z-10">
              <span className="text-slate-400 text-sm font-medium mb-1 block">Total Balance</span>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{formatCurrency(totalBalance)}</h1>
              <div className="flex items-center gap-2 text-sm text-teal-400 font-medium">
                <span className="px-1.5 py-0.5 bg-teal-500/20 rounded text-xs">+2.4%</span>
                <span>today</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Cash</span>
                <span className="font-semibold">{formatCurrency(cashBalance)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">Invested</span>
                <span className="font-semibold">{formatCurrency(totalInvestments)}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions (Bento Grid) */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 px-1">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => setStep('deposit')} className="flex flex-col items-center gap-2 group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm border ${!completedSteps.deposit ? 'bg-teal-500 text-white border-teal-600 shadow-teal-200' : 'bg-white text-slate-600 border-slate-200 group-hover:border-teal-500 group-hover:text-teal-600'
                  }`}>
                  <Icons.Plus className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-600">Add</span>
              </button>

              <button
                onClick={() => completedSteps.deposit && setStep('send')}
                disabled={!completedSteps.deposit}
                className="flex flex-col items-center gap-2 group disabled:opacity-40"
              >
                <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:border-teal-500 group-hover:text-teal-600 transition-all duration-200">
                  <Icons.Send className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-600">Send</span>
              </button>

              <button
                onClick={() => completedSteps.send && setStep('buy')}
                disabled={!completedSteps.send}
                className="flex flex-col items-center gap-2 group disabled:opacity-40"
              >
                <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm group-hover:border-teal-500 group-hover:text-teal-600 transition-all duration-200">
                  <Icons.ArrowUpRight className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-600">Trade</span>
              </button>

              <button className="flex flex-col items-center gap-2 group disabled:opacity-40" disabled>
                <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                  <Icons.Target className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-600">Goals</span>
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
              <button className="text-xs text-teal-600 font-medium hover:underline">View All</button>
            </div>

            <Card className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Icons.Info className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-500">No transactions yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Start by adding money to your wallet.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-100 text-green-700' :
                          tx.type === 'send' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {tx.type === 'deposit' ? <Icons.ArrowDownLeft className="w-5 h-5" /> :
                          tx.type === 'send' ? <Icons.Send className="w-4 h-4" /> : <Icons.ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                        <p className="text-xs text-slate-500">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-slate-900'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // ==================== DEPOSIT SCREEN ====================
  if (step === 'deposit') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header backTo="home" />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Money</h2>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
              <Card className="p-4 flex items-center justify-between cursor-pointer border-teal-500 bg-teal-50/30 ring-1 ring-teal-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
                    <Icons.CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Visa ending in 4242</p>
                    <p className="text-xs text-slate-500">Instant • 2% Fee</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-700 px-2 py-1 bg-teal-100 rounded">Selected</span>
              </Card>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-light text-slate-400">$</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-6 pl-10 pr-4 text-4xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 mt-3">
                {[50, 100, 200].map(amt => (
                  <button key={amt} onClick={() => setDepositAmount(amt.toString())} className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Fee Calculation (Progressive Disclosure) */}
            <div className={`transition-all duration-300 overflow-hidden ${depositData.gross > 0 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fee (2.0%)</span>
                  <span className="text-slate-900 font-medium">-{formatCurrency(depositData.paymentFee)}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">You Receive</span>
                  <span className="text-lg font-bold text-teal-600">{formatCurrency(depositData.net)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <Button onClick={handleDepositConfirm} disabled={!depositData.net || depositData.net <= 0}>
              Confirm Deposit
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ==================== SEND SCREEN ====================
  if (step === 'send') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header backTo="home" />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Send Money</h2>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Recipient</label>
              <Card className="p-3 flex items-center gap-3 bg-white border border-slate-200">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-slate-500">BF</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">@best_friend</p>
                  <p className="text-xs text-slate-400 font-mono">0x71C...9A2</p>
                </div>
              </Card>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-light text-slate-400">$</span>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-6 pl-10 pr-4 text-4xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="0"
                  autoFocus
                />
              </div>
              {sendAmount > cashBalance && (
                <p className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                  Insufficient balance ({formatCurrency(cashBalance)} available)
                </p>
              )}
            </div>

            {/* Transaction Details */}
            <div className={`transition-all duration-300 ${sendData.gross > 0 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-sm cursor-help group" onClick={() => setFeesExpanded(!feesExpanded)}>
                  <div className="flex items-center gap-1 text-slate-500 border-b border-dashed border-slate-300">
                    Network Fee
                    <Icons.Info className="w-3 h-3" />
                  </div>
                  <span className="text-slate-900 font-medium">-{formatCurrency(sendData.gasFee)}</span>
                </div>

                {feesExpanded && (
                  <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded">
                    Breakdown: Gas (0.0001) + Platform ($0.00)
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Deducted</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(sendData.gross)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <Button onClick={handleSendConfirm} disabled={!sendData.net || sendData.net <= 0 || sendAmount > cashBalance}>
              Send Now
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ==================== BUY SCREEN ====================
  if (step === 'buy') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header backTo="home" />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Trade Assets</h2>

          {/* Asset Selector (Horizontal Scroll) */}
          <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2">
              {Object.keys(assetCategories).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSelectedAsset(assetCategories[cat][0].symbol); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Asset List */}
          <div className="space-y-3 mb-6">
            {assetCategories[selectedCategory].map(asset => (
              <Card
                key={asset.symbol}
                onClick={() => { setSelectedAsset(asset.symbol); setBuyAmount(''); }}
                className={`p-4 flex items-center justify-between border-2 transition-all ${selectedAsset === asset.symbol ? 'border-teal-500 bg-teal-50/20' : 'border-transparent hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full border border-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shadow-sm">
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm">{formatCurrency(asset.price)}</p>
                  <p className={`text-xs font-medium ${asset.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{asset.change}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Buy Input */}
          <div className="bg-white rounded-t-3xl border-t border-slate-200 p-6 shadow-up">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Buy Amount</label>
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-light text-slate-400">$</span>
              <input
                type="number"
                value={buyAmount}
                onChange={e => setBuyAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-10 pr-4 text-3xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="0.00"
              />
            </div>

            {buyData.gross > 0 && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-500">
                <div className="flex justify-between">
                  <span>Market Price</span>
                  <span>{formatCurrency(currentAsset.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Fees</span>
                  <span>{formatCurrency(buyData.totalFees)}</span>
                </div>
              </div>
            )}

            <Button onClick={handleBuyConfirm} disabled={!buyData.net || buyData.net <= 0}>
              Buy {currentAsset.symbol}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default DiBoaSDemo;