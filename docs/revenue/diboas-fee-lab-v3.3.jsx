import { useState, useMemo } from "react";

// ============================================================
// diBoaS Fee Lab v3.3 — Canonical Edition (Final)
// Per-step rates: 0.48% ramp, 0.39% exec, free
// Feature timeline: 14 revenue streams activating M3→M18
// v3.1: sensitivity showFeatures, EUR→USD, TxRev/YieldRev split,
//   batching buy-only, Phantom (est.)
// v3.2: Buy Batching UI label, directShare unit docs
// v3.3: sig cost × freq fix, MW capture floor removed,
//   weighted competitor avg, header version corrected
// ============================================================

const SCENARIOS = {
  conservative: { label: "Conservative", color: "#f87171", churn: 12, growth: 10, fundedPct: 40, attach: { add: 45, send: 10, withdraw: 5, buy: 40, sell: 15, swap: 15, bridge: 5, start: 8, stop: 4 } },
  base: { label: "Base", color: "#fbbf24", churn: 8, growth: 12, fundedPct: 55, attach: { add: 60, send: 20, withdraw: 12, buy: 65, sell: 30, swap: 35, bridge: 15, start: 20, stop: 10 } },
  bull: { label: "Bull", color: "#4ade80", churn: 5, growth: 18, fundedPct: 65, attach: { add: 80, send: 30, withdraw: 18, buy: 75, sell: 40, swap: 50, bridge: 25, start: 30, stop: 15 } },
};

// Per-step fee configuration — canonical rates confirmed by CEO
// Ramp steps: 0.48% (Add, Withdraw) — no floor/cap
// Exec steps: 0.39% with floor/cap (Buy, Sell, Stop)
// Free steps: Send, Swap, Bridge, Start
const STEPS = [
  { key:"add",n:1,label:"Add (On-Ramp)",shortLabel:"Add",cat:"Banking",catColor:"#22c55e",defaultFreq:1.2,avg:350,sigs:0,feeType:"ramp",feePct:0.48,color:"#34d399",attachDefault:60 },
  { key:"send",n:2,label:"Send (P2P)",shortLabel:"Send",cat:"Banking",catColor:"#22c55e",defaultFreq:0.3,avg:200,sigs:1,feeType:"free",feePct:0,color:"#64748b",attachDefault:20 },
  { key:"withdraw",n:3,label:"Withdraw (Off-Ramp)",shortLabel:"Withdraw",cat:"Banking",catColor:"#22c55e",defaultFreq:0.2,avg:500,sigs:0,feeType:"ramp",feePct:0.48,color:"#fb923c",attachDefault:12 },
  { key:"buy",n:4,label:"Buy (DCA/DEX)",shortLabel:"Buy/DCA",cat:"Investing",catColor:"#3b82f6",defaultFreq:4.0,avg:75,sigs:2.5,feeType:"exec",feePct:0.39,color:"#60a5fa",attachDefault:65 },
  { key:"sell",n:5,label:"Sell (DEX)",shortLabel:"Sell",cat:"Investing",catColor:"#3b82f6",defaultFreq:0.5,avg:200,sigs:2.5,feeType:"exec",feePct:0.39,color:"#a78bfa",attachDefault:30 },
  { key:"swap",n:6,label:"Swap (Token→Token)",shortLabel:"Swap",cat:"DeFi",catColor:"#06b6d4",defaultFreq:1.2,avg:300,sigs:2.5,feeType:"free",feePct:0,color:"#22d3ee",attachDefault:35 },
  { key:"bridge",n:7,label:"Bridge (Cross-Chain)",shortLabel:"Bridge",cat:"DeFi",catColor:"#06b6d4",defaultFreq:0.4,avg:400,sigs:3,feeType:"free",feePct:0,color:"#f472b6",attachDefault:15 },
  { key:"start",n:8,label:"Start Strategy",shortLabel:"Start",cat:"Yield",catColor:"#eab308",defaultFreq:0.4,avg:500,sigs:4,feeType:"free",feePct:0,color:"#facc15",attachDefault:20 },
  { key:"stop",n:9,label:"Stop Strategy",shortLabel:"Stop",cat:"Yield",catColor:"#eab308",defaultFreq:0.15,avg:400,sigs:3,feeType:"exec",feePct:0.39,color:"#f87171",attachDefault:10 },
];

// Competitor benchmark rates (retail/simple interfaces, not pro order books)
const COMPETITORS = {
  coinbase: { name: "Coinbase", rate: 2.0, color: "#2563eb" },
  metamask: { name: "MetaMask", rate: 0.875, color: "#f6851b" },
  revolut: { name: "Revolut", rate: 1.49, color: "#0075eb" },
  phantom: { name: "Phantom (est.)", rate: 0.85, color: "#ab9ff2" },
  binance: { name: "Binance", rate: 0.10, color: "#f0b90b" },
};

const DEFAULT_PERSONAS = [
  { id: "small", name: "Small DCA", icon: "🌱", color: "#86efac",
    desc: "$25–75 weekly DCA, rarely swaps",
    steps: { add: { freq: 1, avg: 100 }, buy: { freq: 4, avg: 50 }, send: { freq: 0.2, avg: 30 }, withdraw: { freq: 0, avg: 0 }, sell: { freq: 0.2, avg: 80 }, swap: { freq: 0.3, avg: 60 }, bridge: { freq: 0, avg: 0 }, start: { freq: 0, avg: 0 }, stop: { freq: 0, avg: 0 } },
    pctOfBase: 35 },
  { id: "medium", name: "Active Investor", icon: "📊", color: "#fbbf24",
    desc: "$100–300 DCA, regular swaps, some yield",
    steps: { add: { freq: 1.5, avg: 350 }, buy: { freq: 4, avg: 100 }, send: { freq: 0.5, avg: 200 }, withdraw: { freq: 0.2, avg: 400 }, sell: { freq: 0.5, avg: 250 }, swap: { freq: 2, avg: 300 }, bridge: { freq: 0.3, avg: 300 }, start: { freq: 0.3, avg: 500 }, stop: { freq: 0.1, avg: 400 } },
    pctOfBase: 40 },
  { id: "power", name: "Power User", icon: "⚡", color: "#60a5fa",
    desc: "Heavy DCA, cross-chain, active yield strategies",
    steps: { add: { freq: 2, avg: 800 }, buy: { freq: 8, avg: 200 }, send: { freq: 1, avg: 500 }, withdraw: { freq: 0.5, avg: 1000 }, sell: { freq: 1, avg: 500 }, swap: { freq: 3, avg: 600 }, bridge: { freq: 1, avg: 800 }, start: { freq: 1, avg: 1500 }, stop: { freq: 0.3, avg: 1000 } },
    pctOfBase: 20 },
  { id: "whale", name: "Whale", icon: "🐋", color: "#c084fc",
    desc: "Large positions, infrequent but high-value",
    steps: { add: { freq: 1, avg: 5000 }, buy: { freq: 2, avg: 5000 }, send: { freq: 0.5, avg: 3000 }, withdraw: { freq: 0.5, avg: 8000 }, sell: { freq: 1, avg: 5000 }, swap: { freq: 1, avg: 10000 }, bridge: { freq: 0.5, avg: 5000 }, start: { freq: 0.5, avg: 10000 }, stop: { freq: 0.2, avg: 8000 } },
    pctOfBase: 5 },
];

// ============================================================
// FEATURE TIMELINE — revenue streams activating at specific months
// ============================================================
const FEATURE_TIMELINE = [
  { month: 3, id: "b2b_sends", label: "B2B Sends", desc: "Free B2B transfers (engagement, no revenue)" },
  { month: 6, id: "b2b_treasury", label: "B2B Treasury", desc: "Free entry, 0.39% exit fee" },
  { month: 6, id: "b2b_cashflow", label: "B2B Cashflow", desc: "Goal-based treasury variant (included in B2B Treasury model)" },
  { month: 9, id: "usdt_tron", label: "USDT/Tron", desc: "+12.5% volume on all steps" },
  { month: 9, id: "pro_b2c", label: "Pro Sub (B2C)", desc: "$8.59/mo (€7.99 equiv.), 6% of funded users" },
  { month: 9, id: "pro_b2b", label: "Pro Sub (B2B)", desc: "$13.99/mo (€12.99 equiv.) per B2B client" },
  { month: 12, id: "adelaide_enterprise", label: "Adelaide Enterprise", desc: "Tiered: $299/$799/custom" },
  { month: 12, id: "analytics_api", label: "Analytics API", desc: "Tiered: $99/$299/custom" },
  { month: 15, id: "creator_royalties", label: "Creator Royalties", desc: "12% of subscriber payments" },
  { month: 15, id: "creator_sponsorship", label: "Creator Sponsorships", desc: "12% of sponsorship deals" },
  { month: 15, id: "influencer_match", label: "Influencer Match", desc: "$93/mo from companies" },
  { month: 18, id: "p2p_marketplace", label: "P2P Marketplace", desc: "1.2% per transaction" },
  { month: 18, id: "p2p_startup", label: "P2P Startup Invest", desc: "1.2% per deal" },
  { month: 18, id: "swap_center", label: "Swap Center", desc: "0.39% per swap" },
];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Fee calculation with per-step rates and blended route share
function calcFee(avg, feeType, feePct, feeFloor, feeCap, directShare = 1, middlewareBps = 25) {
  if (feeType === "free") return { full: 0, blended: 0 };
  if (feeType === "ramp") { const f = avg * (feePct / 100); return { full: f, blended: f }; }
  // Exec type: apply floor/cap to user fee, then blend with middleware capture
  const raw = avg * (feePct / 100);
  const fullFee = clamp(raw, feeFloor, feeCap);
  const mwCapturePct = Math.max(0, feePct - (middlewareBps / 100));
  const mwRaw = avg * (mwCapturePct / 100);
  const mwFee = Math.min(mwRaw, fullFee); // platform capture: no floor, capped at user fee
  const blended = directShare * fullFee + (1 - directShare) * mwFee;
  return { full: fullFee, blended };
}

// DCA batching: batch small buys to hit above floor breakpoint
function batchedFee(freq, avg, feePct, feeFloor, feeCap) {
  const floorBreak = feeFloor / (feePct / 100);
  if (avg >= floorBreak || freq === 0) return { batchedFreq: freq, batchedAvg: avg };
  const batchSize = Math.ceil(floorBreak / avg);
  return { batchedFreq: freq / batchSize, batchedAvg: avg * batchSize };
}

function walletTierCost(mauApp) {
  if (mauApp <= 1000) return 0;
  if (mauApp <= 5000) return 250;
  if (mauApp <= 25000) return 500;
  return 1500;
}

// Feature revenue calculator for a given month
function featureRevenue(month, mauApp, mauFunded) {
  let rev = 0;
  const b2bClients = Math.round(mauApp * 0.015); // 1.5% of total MAU
  const volumeBoost = month >= 9 ? 1.125 : 1.0; // USDT/Tron +12.5%

  // M6: B2B Treasury + Cashflow (0.39% exit fee, modeled as avg $2000 AUM, 10% exit/mo)
  if (month >= 6) {
    const b2bExitVol = b2bClients * 0.10 * 2000; // 10% of clients exit per month × avg $2000
    rev += b2bExitVol * 0.0039; // 0.39% exit fee
  }
  // M9: Pro B2C subscription
  if (month >= 9) {
    const proSubs = Math.round(mauFunded * 0.06); // 6% of funded users
    rev += proSubs * 8.59; // $8.59 ≈ €7.99 at ~1.075 EUR/USD
  }
  // M9: Pro B2B subscription
  if (month >= 9) {
    rev += b2bClients * 13.99; // $13.99 ≈ €12.99 at ~1.075 EUR/USD
  }
  // M12: Adelaide Enterprise (assume 5 Basic + 2 Pro clients, growing with B2B base)
  if (month >= 12) {
    const entClients = Math.max(2, Math.round(b2bClients * 0.05));
    const basicClients = Math.round(entClients * 0.7);
    const proClients = entClients - basicClients;
    rev += basicClients * 299 + proClients * 799;
  }
  // M12: Analytics API (assume 8 Starter + 3 Pro clients, growing)
  if (month >= 12) {
    const apiClients = Math.max(3, Math.round(b2bClients * 0.08));
    const starterClients = Math.round(apiClients * 0.7);
    const proApiClients = apiClients - starterClients;
    rev += starterClients * 99 + proApiClients * 299;
  }
  // M15: Creator Economy
  if (month >= 15) {
    const proSubs = Math.round(mauFunded * 0.06);
    const creatorsActive = Math.max(5, Math.round(proSubs * 0.03)); // 3% of pro subs are creators
    const avgSubPayment = 8.59;
    const subsPerCreator = Math.max(10, Math.round(proSubs / Math.max(creatorsActive, 1)));
    rev += creatorsActive * subsPerCreator * avgSubPayment * 0.12; // 12% royalties
    rev += creatorsActive * 2 * 200 * 0.12; // 12% of ~2 sponsorship deals/creator at $200 avg
    const companiesMatched = Math.max(3, Math.round(b2bClients * 0.02));
    rev += companiesMatched * 93; // Influencer Match
  }
  // M18: Marketplace + Swap Center
  if (month >= 18) {
    const marketplaceUsers = Math.round(mauFunded * 0.05); // 5% engage
    const marketplaceVol = marketplaceUsers * 150; // avg $150/mo per active user
    rev += marketplaceVol * 0.012; // 1.2% fee
    const startupDeals = Math.max(1, Math.round(mauFunded * 0.001)); // 0.1% do startup deals
    rev += startupDeals * 2000 * 0.012; // avg $2000 deal × 1.2%
    const swapUsers = Math.round(mauFunded * 0.08); // 8% use swap center
    rev += swapUsers * 50 * 0.0039; // avg $50 swap × 0.39%
  }
  return { rev, volumeBoost, b2bClients };
}

function fmt(n) {
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}
function fd(n) { return "$" + n.toFixed(2); }
function pc(n) { return n.toFixed(1) + "%"; }
function nm(n) { return n.toLocaleString(); }

const B = { bg: "#08080e", card: "#0f1117", card2: "#151821", border: "#1e2230", t1: "#f1f5f9", t2: "#94a3b8", t3: "#475569", pos: "#4ade80", neg: "#f87171", accent: "#3b82f6", warn: "#f59e0b" };
const M = { fontFamily: "'JetBrains Mono', monospace" };
const ST = {
  page: { background: B.bg, color: B.t1, minHeight: "100vh", fontFamily: "'DM Sans', -apple-system, sans-serif" },
  wrap: { maxWidth: 1020, margin: "0 auto", padding: "20px 16px" },
  card: { background: B.card, borderRadius: 14, padding: 16, border: "1px solid " + B.border },
  label: { fontSize: 10, color: B.t3, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600, marginBottom: 4 },
  tab: (a) => ({ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: a ? B.accent : B.card2, color: a ? "#fff" : B.t2, transition: "all 0.15s" }),
  th: { fontSize: 10, color: B.t3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", padding: "6px 8px", borderBottom: "1px solid " + B.border },
  td: { padding: "5px 8px", fontSize: 12, borderBottom: "1px solid " + B.border + "60" },
};

function NumInput({ value, onChange, width = 55, color = B.t1 }) {
  return <input type="number" value={value} onChange={e => onChange(+e.target.value || 0)}
    style={{ width, background: B.card2, border: "1px solid " + B.border, borderRadius: 4, color, fontSize: 12, ...M, fontWeight: 600, padding: "2px 4px", textAlign: "right", outline: "none" }} />;
}

// Run a break-even simulation with given params
function runSim(params) {
  const { burn, growth, startMAU, fundedPct, churn, ox0xPlan, maxMonths, attach, feeFloor, feeCap, directShare, middlewareBps, iB, sC, stratAUM, yAPY, yPerf, showFeatures = true } = params;
  const stepsWithAttach = STEPS.map(s => ({ ...s, attachRate: attach[s.key] || s.attachDefault }));
  const stepCalcs = stepsWithAttach.map(s => {
    const { blended } = calcFee(s.avg, s.feeType, s.feePct, feeFloor, feeCap, directShare, middlewareBps);
    return { ...s, perUser: s.defaultFreq * blended, sigCostPerUser: s.defaultFreq * s.sigs * sC };
  });
  let cum = 0, prevMAU = startMAU, newUsers = Math.round(startMAU * (growth / 100));
  let beMonth = null, peakLoss = 0;
  for (let m = 1; m <= maxMonths; m++) {
    let mauApp = m === 1 ? startMAU : Math.round(prevMAU * (1 - churn / 100) + newUsers);
    if (m > 1) newUsers = Math.round(newUsers * (1 + growth / 100));
    prevMAU = mauApp;
    const mauFunded = Math.round(mauApp * (fundedPct / 100));
    const feat = showFeatures ? featureRevenue(m, mauApp, mauFunded) : { rev: 0, volumeBoost: 1, b2bClients: 0 };
    let totalRev = 0, totalSigCost = 0;
    stepCalcs.forEach(sc => {
      const att = Math.round(mauFunded * (sc.attachRate / 100));
      totalRev += att * sc.perUser * feat.volumeBoost;
      totalSigCost += att * sc.sigCostPerUser;
    });
    const stratUsers = Math.round(mauFunded * ((attach.start || 20) / 100));
    totalRev += stratUsers * ((stratAUM * (yAPY / 100)) / 12) * (yPerf / 100);
    totalRev += feat.rev;
    const fixedC = burn + walletTierCost(mauApp) + iB + ox0xPlan;
    const profit = totalRev - fixedC - totalSigCost;
    cum += profit;
    if (cum < peakLoss) peakLoss = cum;
    if (beMonth === null && profit >= 0) beMonth = m;
  }
  return { beMonth, peakLoss };
}

export default function App() {
  const [scenario, setScenario] = useState("base");
  const [burn, setBurn] = useState(56000);
  const [growth, setGrowth] = useState(12);
  const [startMAU, setStartMAU] = useState(800);
  const [fundedPct, setFundedPct] = useState(55);
  const [churn, setChurn] = useState(8);
  const [ox0xPlan, set0xPlan] = useState(0);
  const [selM, setSelM] = useState(12);
  const [maxMonths, setMaxMonths] = useState(60);
  const [feeFloor, setFeeFloor] = useState(0.25);
  const [feeCap, setFeeCap] = useState(25);
  const [directShare, setDirectShare] = useState(85);
  const [middlewareBps, setMiddlewareBps] = useState(25);
  const [batchingEnabled, setBatchingEnabled] = useState(false);
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS);
  const [editingPersona, setEditingPersona] = useState(null);
  const [view, setView] = useState("fairness");
  const [showFeatures, setShowFeatures] = useState(true);

  const sC = 0.01, iB = 500, stratAUM = 1500, yAPY = 6, yPerf = 10;
  const ds = directShare / 100;

  function applyScenario(key) {
    const sc = SCENARIOS[key]; setScenario(key); setChurn(sc.churn); setGrowth(sc.growth); setFundedPct(sc.fundedPct);
  }
  const currentAttach = SCENARIOS[scenario].attach;

  // ========== PERSONA CALCULATIONS (per-step fees + blended route + batching) ==========
  const personaCalcs = useMemo(() => {
    return personas.map(p => {
      let totalFeePaid = 0, totalPlatformRev = 0, totalVolume = 0, txCount = 0, floorHits = 0, floorHitTxCount = 0;
      const stepDetails = STEPS.map(s => {
        const ps = p.steps[s.key];
        if (!ps || ps.freq === 0) return { ...s, freq: 0, avg: 0, userFee: 0, platformRev: 0, vol: 0, totalUserFee: 0, totalPlatformRev: 0, floorHit: false, capHit: false };
        let useFreq = ps.freq, useAvg = ps.avg;
        if (batchingEnabled && s.feeType === "exec" && s.key === "buy") {
          const b = batchedFee(ps.freq, ps.avg, s.feePct, feeFloor, feeCap);
          useFreq = b.batchedFreq; useAvg = b.batchedAvg;
        }
        const userFeePerTx = s.feeType === "free" ? 0 : s.feeType === "ramp" ? useAvg * (s.feePct / 100) : clamp(useAvg * (s.feePct / 100), feeFloor, feeCap);
        const { blended } = calcFee(useAvg, s.feeType, s.feePct, feeFloor, feeCap, ds, middlewareBps);
        const vol = useFreq * useAvg;
        const tUserFee = useFreq * userFeePerTx;
        const tPlatformRev = useFreq * blended;
        totalFeePaid += tUserFee; totalPlatformRev += tPlatformRev; totalVolume += vol; txCount += useFreq;
        const rawExec = useAvg * (s.feePct / 100);
        const fh = s.feeType === "exec" && useAvg > 0 && rawExec < feeFloor;
        const ch = s.feeType === "exec" && useAvg > 0 && rawExec > feeCap;
        if (fh) { floorHits++; floorHitTxCount += useFreq; }
        return { ...s, freq: useFreq, avg: useAvg, userFee: userFeePerTx, platformRev: blended, vol, totalUserFee: tUserFee, totalPlatformRev: tPlatformRev, floorHit: fh, capHit: ch };
      });
      const effectiveRate = totalVolume > 0 ? (totalFeePaid / totalVolume) * 100 : 0;
      return { ...p, stepDetails, totalFeePaid, totalPlatformRev, totalVolume, txCount, effectiveRate, floorHits, floorHitTxCount };
    });
  }, [personas, feeFloor, feeCap, ds, middlewareBps, batchingEnabled]);

  const blendedRPU = useMemo(() => {
    const totalPct = personas.reduce((a, p) => a + p.pctOfBase, 0);
    if (totalPct === 0) return 0;
    return personas.reduce((a, p, i) => a + (personaCalcs[i].totalPlatformRev * (p.pctOfBase / totalPct)), 0);
  }, [personaCalcs, personas]);

  // ========== PROJECTION SIMULATION (with feature timeline) ==========
  const sim = useMemo(() => {
    const stepsWithAttach = STEPS.map(s => ({ ...s, attachRate: currentAttach[s.key] || s.attachDefault }));
    const stepCalcs = stepsWithAttach.map(s => {
      const { full, blended } = calcFee(s.avg, s.feeType, s.feePct, feeFloor, feeCap, ds, middlewareBps);
      const perUser = s.defaultFreq * blended;
      const sigCostPerUser = s.defaultFreq * s.sigs * sC;
      return { ...s, perTx: full, perTxBlended: blended, perUser, sigCostPerUser, netPerUser: perUser - sigCostPerUser };
    });
    const months = [];
    let cum = 0, prevMAU = startMAU, newUsers = Math.round(startMAU * (growth / 100));
    for (let m = 1; m <= maxMonths; m++) {
      let mauApp = m === 1 ? startMAU : Math.round(prevMAU * (1 - churn / 100) + newUsers);
      if (m > 1) newUsers = Math.round(newUsers * (1 + growth / 100));
      prevMAU = mauApp;
      const mauFunded = Math.round(mauApp * (fundedPct / 100));
      const wB = walletTierCost(mauApp);
      const feat = showFeatures ? featureRevenue(m, mauApp, mauFunded) : { rev: 0, volumeBoost: 1, b2bClients: 0 };
      let totalRev = 0, totalSigCost = 0, totalVol = 0;
      const perStep = stepCalcs.map(sc => {
        const attached = Math.round(mauFunded * (sc.attachRate / 100));
        const rev = attached * sc.perUser * feat.volumeBoost;
        const sigC = attached * sc.sigCostPerUser;
        const vol = attached * sc.defaultFreq * sc.avg * feat.volumeBoost;
        totalRev += rev; totalSigCost += sigC; totalVol += vol;
        return { ...sc, attached, stepRev: rev, stepSigCost: sigC, stepVol: vol };
      });
      const stratUsers = Math.round(mauFunded * ((currentAttach.start || 20) / 100));
      const yieldRev = stratUsers * ((stratAUM * (yAPY / 100)) / 12) * (yPerf / 100);
      totalRev += yieldRev;
      totalRev += feat.rev;
      const feeBearing = Math.min(mauFunded, Math.round(mauFunded * (1 - stepsWithAttach.reduce((prod, s) => s.feeType === "free" ? prod : prod * (1 - (s.attachRate / 100)), 1))));
      const fixedC = burn + wB + iB + ox0xPlan;
      const totalC = fixedC + totalSigCost;
      const profit = totalRev - totalC;
      const margin = totalRev > 0 ? (profit / totalRev) * 100 : -100;
      cum += profit;
      const revPerFunded = mauFunded > 0 ? totalRev / mauFunded : 0;
      months.push({ m, mauApp, mauFunded, feeBearing, perStep, yieldRev, featRev: feat.rev, b2bClients: feat.b2bClients, totalRev, totalSigCost, fixedC, totalC, profit, margin, cum, totalVol, revPerFunded, wB });
    }
    const be = months.find(x => x.profit >= 0);
    const peakLoss = Math.min(...months.map(x => x.cum));
    return { months, be: be ? be.m : null, stepCalcs, peakLoss };
  }, [burn, growth, startMAU, fundedPct, churn, ox0xPlan, scenario, maxMonths, currentAttach, feeFloor, feeCap, ds, middlewareBps, showFeatures]);

  // ========== SENSITIVITY (churn ±3%, directShare ±15%, funded ±10%) ==========
  const sensitivity = useMemo(() => {
    const base = { burn, growth, startMAU, fundedPct, churn, ox0xPlan, maxMonths, attach: currentAttach, feeFloor, feeCap, directShare: ds, middlewareBps, iB, sC, stratAUM, yAPY, yPerf, showFeatures };
    return {
      churnLow: runSim({ ...base, churn: Math.max(0, churn - 3) }),
      churnHigh: runSim({ ...base, churn: churn + 3 }),
      dsLow: runSim({ ...base, directShare: Math.max(0, ds - 0.15) }),
      dsHigh: runSim({ ...base, directShare: Math.min(1, ds + 0.15) }),
      fundedLow: runSim({ ...base, fundedPct: Math.max(20, fundedPct - 10) }),
      fundedHigh: runSim({ ...base, fundedPct: Math.min(80, fundedPct + 10) }),
    };
  }, [burn, growth, startMAU, fundedPct, churn, ox0xPlan, maxMonths, currentAttach, feeFloor, feeCap, ds, middlewareBps, showFeatures]);

  const s = sim.months[Math.min(selM - 1, sim.months.length - 1)];
  const mLast = sim.months[sim.months.length - 1];
  const mxP = Math.max(...sim.months.map(x => Math.abs(x.profit)), 1);

  function updatePersonaStep(pIdx, stepKey, field, val) {
    setPersonas(prev => prev.map((p, i) => i !== pIdx ? p : { ...p, steps: { ...p.steps, [stepKey]: { ...p.steps[stepKey], [field]: val } } }));
  }
  function updatePersonaMix(pIdx, val) {
    setPersonas(prev => prev.map((p, i) => i === pIdx ? { ...p, pctOfBase: val } : p));
  }

  function verdict(rate) {
    if (rate <= 0.35) return { emoji: "✅", label: "Fair", color: B.pos };
    if (rate <= 0.50) return { emoji: "⚠️", label: "Acceptable", color: B.warn };
    return { emoji: "🚨", label: "High", color: B.neg };
  }

  const allFair = personaCalcs.every(p => p.effectiveRate <= 0.50);
  const sustainable = !!sim.be;

  // Active features at selected month
  const activeFeatures = FEATURE_TIMELINE.filter(f => f.month <= selM);

  // ============ RENDER ============
  return (
    <div style={ST.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={ST.wrap}>

        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
            diBoaS Fee Lab <span style={{ fontSize: 13, color: B.t3, fontWeight: 500 }}>v3.3 · Canonical Edition</span>
          </h1>
          <p style={{ fontSize: 12, color: B.t3, margin: "4px 0 0" }}>Two questions. Clear answers. Per-step fees + feature timeline. Change any parameter — everything recalculates.</p>
        </div>

        {/* ===================================================================
            LAYER 1 — THE VERDICTS
            =================================================================== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>

          {/* VERDICT 1: IS IT FAIR? */}
          <div style={{ ...ST.card, borderColor: allFair ? B.pos + "40" : B.warn + "40" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: B.t3, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.8px" }}>Question 1</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Is diBoaS fair for users?</div>
              </div>
              <div style={{ fontSize: 32 }}>{allFair ? "✅" : "⚠️"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
              {personaCalcs.map((p, i) => {
                const v = verdict(p.effectiveRate);
                return (
                  <div key={i} style={{ background: B.card2, borderRadius: 8, padding: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 16 }}>{p.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: p.color, marginTop: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: v.color, ...M, marginTop: 4 }}>{pc(p.effectiveRate)}</div>
                    <div style={{ fontSize: 11, ...M, color: B.t2 }}>{fd(p.totalFeePaid)}/mo</div>
                    <div style={{ fontSize: 8, marginTop: 2 }}>{v.emoji} {v.label}</div>
                    {p.floorHits > 0 && <div style={{ fontSize: 8, color: B.warn, marginTop: 2 }}>⚡ {p.floorHitTxCount.toFixed(1)} floor-hit tx/mo ({p.floorHits} step{p.floorHits > 1 ? "s" : ""})</div>}
                  </div>
                );
              })}
            </div>
            {/* Fee structure summary */}
            <div style={{ background: B.bg, borderRadius: 8, padding: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Canonical Fee Structure</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, fontSize: 9 }}>
                <div><span style={{ color: "#22c55e" }}>●</span> <span style={{ color: B.t2 }}>Ramp 0.48%:</span> <span style={{ color: B.t3 }}>Add, Withdraw</span></div>
                <div><span style={{ color: "#3b82f6" }}>●</span> <span style={{ color: B.t2 }}>Exec 0.39%:</span> <span style={{ color: B.t3 }}>Buy, Sell, Stop</span></div>
                <div><span style={{ color: "#64748b" }}>●</span> <span style={{ color: B.t2 }}>Free:</span> <span style={{ color: B.t3 }}>Send, Swap, Bridge, Start</span></div>
              </div>
            </div>
            {/* Competitor comparison */}
            <div style={{ background: B.bg, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>vs competitors (retail interfaces)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                {Object.values(COMPETITORS).map(c => {
                  const totalPct = personas.reduce((a, p) => a + p.pctOfBase, 0);
                  const avgDiboasRate = personaCalcs.reduce((a, p, i) => a + p.effectiveRate * (personas[i].pctOfBase / totalPct), 0);
                  const mult = c.rate / Math.max(avgDiboasRate, 0.01);
                  const cheaper = mult > 1;
                  return (
                    <div key={c.name} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: c.color, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 9, color: B.t3 }}>{c.rate}%</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: cheaper ? B.pos : B.neg, ...M }}>
                        {cheaper ? mult.toFixed(1) + "×" : "—"}
                      </div>
                      <div style={{ fontSize: 8, color: B.t3 }}>{cheaper ? "cheaper" : "they win"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VERDICT 2: IS IT SUSTAINABLE? */}
          <div style={{ ...ST.card, borderColor: sustainable ? B.pos + "40" : B.neg + "40" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: B.t3, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.8px" }}>Question 2</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Is diBoaS sustainable?</div>
              </div>
              <div style={{ fontSize: 32 }}>{sustainable ? "✅" : "🚨"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              <div style={{ background: B.card2, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase" }}>Break-Even</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: sim.be ? B.pos : B.neg, ...M }}>{sim.be ? "M" + sim.be : maxMonths + "+"}</div>
              </div>
              <div style={{ background: B.card2, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase" }}>Seed Needed</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: B.neg, ...M }}>{fmt(Math.abs(sim.peakLoss))}</div>
              </div>
              <div style={{ background: B.card2, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase" }}>Blended RPU</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: B.pos, ...M }}>{fd(blendedRPU)}</div>
              </div>
            </div>
            {/* Mini P&L sparkline */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 0, height: 36, marginBottom: 8, background: B.card2, borderRadius: 8, padding: "4px 2px", overflow: "hidden" }}>
              {sim.months.filter((_, i) => i % 2 === 0).map((mo, i) => {
                const h = (Math.abs(mo.profit) / mxP) * 28;
                return <div key={i} style={{ flex: 1, height: Math.max(h, 1), background: mo.profit >= 0 ? B.pos : B.neg, opacity: 0.6, borderRadius: 1 }} />;
              })}
            </div>
            {/* Feature timeline indicator */}
            {showFeatures && (
              <div style={{ background: B.bg, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Feature Revenue Timeline</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[3, 6, 9, 12, 15, 18].map(m => {
                    const feats = FEATURE_TIMELINE.filter(f => f.month === m);
                    const active = selM >= m;
                    return (
                      <div key={m} style={{ background: active ? B.pos + "15" : B.card2, border: "1px solid " + (active ? B.pos + "40" : B.border), borderRadius: 6, padding: "3px 6px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: active ? B.pos : B.t3, ...M }}>M{m}</div>
                        <div style={{ fontSize: 8, color: active ? B.t2 : B.t3 }}>{feats.length} stream{feats.length > 1 ? "s" : ""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Sensitivity */}
            <div style={{ background: B.bg, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Sensitivity — what moves break-even</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[
                  { label: "Churn", current: churn + "%", low: (churn - 3) + "%", high: (churn + 3) + "%", beLow: sensitivity.churnLow.beMonth, beHigh: sensitivity.churnHigh.beMonth, icon: "📉" },
                  { label: "Direct Routes", current: directShare + "%", low: Math.max(0, directShare - 15) + "%", high: Math.min(100, directShare + 15) + "%", beLow: sensitivity.dsHigh.beMonth, beHigh: sensitivity.dsLow.beMonth, icon: "🔀" },
                  { label: "Funded Rate", current: fundedPct + "%", low: Math.max(20, fundedPct - 10) + "%", high: Math.min(80, fundedPct + 10) + "%", beLow: sensitivity.fundedHigh.beMonth, beHigh: sensitivity.fundedLow.beMonth, icon: "👥" },
                ].map((sv, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: B.t3 }}>{sv.icon} {sv.label}</div>
                    <div style={{ fontSize: 10, color: B.t2, ...M }}>{sv.current}</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: B.pos, ...M }}>M{sv.beLow || "60+"}</span>
                      <span style={{ fontSize: 8, color: B.t3 }}>↔</span>
                      <span style={{ fontSize: 10, color: B.neg, ...M }}>M{sv.beHigh || "60+"}</span>
                    </div>
                    <div style={{ fontSize: 8, color: B.t3 }}>{sv.low} ↔ {sv.high}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            LAYER 2 — THE KNOBS
            =================================================================== */}
        <div style={{ ...ST.card, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ ...ST.label, marginBottom: 0, fontSize: 11, color: B.warn }}>Fee & Route Parameters</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setShowFeatures(!showFeatures)}
                style={{ ...ST.tab(showFeatures), fontSize: 10, padding: "3px 10px", background: showFeatures ? "#a855f720" : B.card2, color: showFeatures ? "#a855f7" : B.t3, border: showFeatures ? "1px solid #a855f740" : "1px solid " + B.border }}>
                {showFeatures ? "✓ " : ""}Features
              </button>
              <button onClick={() => setBatchingEnabled(!batchingEnabled)}
                style={{ ...ST.tab(batchingEnabled), fontSize: 10, padding: "3px 10px", background: batchingEnabled ? "#22c55e20" : B.card2, color: batchingEnabled ? B.pos : B.t3, border: batchingEnabled ? "1px solid " + B.pos + "40" : "1px solid " + B.border }}>
                {batchingEnabled ? "✓ " : ""}Buy Batching
              </button>
              <button onClick={() => { setFeeFloor(0.25); setFeeCap(25); setDirectShare(85); setMiddlewareBps(25); setBatchingEnabled(false); setShowFeatures(true); }}
                style={{ ...ST.tab(false), fontSize: 10, padding: "3px 10px", color: B.t3 }}>Reset</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Fee Floor", val: feeFloor, set: setFeeFloor, min: 0, max: 1.00, step: 0.05, disp: "$" + feeFloor.toFixed(2), ac: "#f59e0b" },
              { label: "Fee Cap", val: feeCap, set: setFeeCap, min: 5, max: 100, step: 1, disp: "$" + feeCap, ac: "#ef4444" },
              { label: "Direct Routes", val: directShare, set: setDirectShare, min: 50, max: 100, step: 5, disp: directShare + "%", ac: "#38bdf8" },
              { label: "MW Fee (bps)", val: middlewareBps, set: setMiddlewareBps, min: 0, max: 50, step: 5, disp: middlewareBps + " bps", ac: "#a78bfa" },
            ].map((c, i) => (
              <div key={i}>
                <div style={ST.label}>{c.label}</div>
                <input type="range" min={c.min} max={c.max} step={c.step} value={c.val} onChange={e => c.set(+e.target.value)} style={{ width: "100%", accentColor: c.ac, height: 3 }} />
                <div style={{ fontSize: 13, ...M, fontWeight: 700, color: c.ac }}>{c.disp}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scenario + Growth */}
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: B.t3, textTransform: "uppercase", fontWeight: 700, alignSelf: "center", marginRight: 4 }}>Scenario:</span>
          {Object.entries(SCENARIOS).map(([key, sc]) => (
            <button key={key} onClick={() => applyScenario(key)}
              style={{ padding: "4px 10px", borderRadius: 8, border: scenario === key ? "2px solid " + sc.color : "1px solid " + B.border, cursor: "pointer", fontSize: 11, fontWeight: 700, background: scenario === key ? sc.color + "18" : B.card2, color: scenario === key ? sc.color : B.t2 }}>
              {sc.label}
            </button>
          ))}
        </div>
        <div style={{ ...ST.card, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12, padding: 10 }}>
          {[
            { label: "Monthly Burn", val: burn, set: setBurn, min: 25000, max: 150000, step: 1000, disp: fmt(burn), ac: "#3b82f6" },
            { label: "Acq. Growth (MoM)", val: growth, set: setGrowth, min: 5, max: 35, step: 1, disp: growth + "%", ac: "#22c55e" },
            { label: "Monthly Churn", val: churn, set: setChurn, min: 0, max: 20, step: 1, disp: churn + "%", ac: "#ef4444" },
            { label: "Starting MAU", val: startMAU, set: setStartMAU, min: 100, max: 10000, step: 50, disp: nm(startMAU), ac: "#a855f7" },
            { label: "App → Funded", val: fundedPct, set: setFundedPct, min: 20, max: 80, step: 5, disp: fundedPct + "%", ac: "#f97316" },
          ].map((c, i) => (
            <div key={i}>
              <div style={ST.label}>{c.label}</div>
              <input type="range" min={c.min} max={c.max} step={c.step} value={c.val} onChange={e => c.set(+e.target.value)} style={{ width: "100%", accentColor: c.ac, height: 3 }} />
              <span style={{ fontSize: 12, ...M, fontWeight: 700, color: c.ac }}>{c.disp}</span>
            </div>
          ))}
          <div>
            <div style={ST.label}>Options</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button onClick={() => set0xPlan(ox0xPlan === 0 ? 1000 : 0)} style={{ ...ST.tab(ox0xPlan > 0), fontSize: 10, padding: "3px 8px" }}>0x: {ox0xPlan === 0 ? "Free" : "$1K"}</button>
              {[36, 48, 60].map(h => <button key={h} onClick={() => { setMaxMonths(h); if (selM > h) setSelM(h); }} style={{ ...ST.tab(maxMonths === h), fontSize: 10, padding: "3px 8px" }}>{h}mo</button>)}
            </div>
          </div>
        </div>

        {/* ===================================================================
            LAYER 3 — DEEP DIVES (tabs)
            =================================================================== */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {[
            { id: "fairness", label: "Fairness Details" },
            { id: "pertx", label: "Per-Tx Fees" },
            { id: "steps", label: "9-Step Revenue" },
            { id: "pnl", label: "P&L Chart" },
            { id: "table", label: "Full Table" },
            { id: "features", label: "Feature Timeline" },
          ].map(t => <button key={t.id} onClick={() => setView(t.id)} style={ST.tab(view === t.id)}>{t.label}</button>)}
        </div>

        {/* ====== FAIRNESS DETAILS ====== */}
        {view === "fairness" && (
          <div style={{ ...ST.card, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: B.t1, margin: 0 }}>Persona Deep Dive</h2>
                <p style={{ fontSize: 11, color: B.t3, margin: "2px 0 0" }}>Click a persona to edit transaction patterns. {batchingEnabled ? "Buy Batching ON — small DCA buys are grouped." : ""}</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
              {personaCalcs.map((p, i) => {
                const v = verdict(p.effectiveRate);
                const isEd = editingPersona === i;
                return (
                  <div key={p.id} onClick={() => setEditingPersona(isEd ? null : i)}
                    style={{ ...ST.card, padding: 10, cursor: "pointer", border: isEd ? "2px solid " + p.color : "1px solid " + B.border, background: isEd ? B.card2 : B.card }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: B.t3 }}>Mix:</span>
                        <NumInput value={p.pctOfBase} onChange={v => updatePersonaMix(i, clamp(v, 0, 100))} width={30} color={p.color} />
                        <span style={{ fontSize: 9, color: B.t3 }}>%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginTop: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: B.t3, marginTop: 2 }}>{p.desc}</div>
                    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <div style={{ background: B.bg, borderRadius: 6, padding: 5, textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: B.t3, textTransform: "uppercase" }}>User Pays</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: B.t1, ...M }}>{fd(p.totalFeePaid)}</div>
                      </div>
                      <div style={{ background: B.bg, borderRadius: 6, padding: 5, textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: B.t3, textTransform: "uppercase" }}>diBoaS Earns</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: B.pos, ...M }}>{fd(p.totalPlatformRev)}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 4, background: B.bg, borderRadius: 6, padding: 5, textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: B.t3, textTransform: "uppercase" }}>Eff. Rate</div>
                      <div style={{ fontSize: 12, fontWeight: 700, ...M }}><span style={{ color: v.color }}>{pc(p.effectiveRate)}</span> <span style={{ color: B.t3 }}>·</span> <span style={{ color: B.t2 }}>{fmt(p.totalVolume)}</span></div>
                    </div>
                    <div style={{ fontSize: 8, color: B.t3, textAlign: "center", marginTop: 3 }}>{v.emoji} {v.label} · {p.txCount.toFixed(1)} tx/mo</div>
                  </div>
                );
              })}
            </div>

            {/* Persona editor */}
            {editingPersona !== null && (() => {
              const pIdx = editingPersona;
              const p = personaCalcs[pIdx];
              return (
                <div style={{ ...ST.card, background: B.card2, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.icon} {p.name} — Transaction Details</div>
                    <button onClick={() => setEditingPersona(null)} style={{ ...ST.tab(false), fontSize: 10, padding: "3px 10px" }}>Close</button>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr>
                        {["#", "Step", "Rate", "Freq/Mo", "Avg $", "Fee/Tx", "User Pays/Mo", "diBoaS/Mo", "Vol/Mo", "Eff %"].map(h =>
                          <th key={h} style={{ ...ST.th, textAlign: ["#","Step","Rate"].includes(h) ? "left" : "right" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {p.stepDetails.map((sd, j) => (
                          <tr key={j} style={{ background: j % 2 === 0 ? "transparent" : B.card + "60" }}>
                            <td style={{ ...ST.td, ...M, fontWeight: 700, color: sd.color }}>{sd.n}</td>
                            <td style={{ ...ST.td, fontWeight: 600, color: B.t1, fontSize: 11 }}>{sd.shortLabel || sd.label}</td>
                            <td style={{ ...ST.td, fontSize: 10, color: sd.feeType === "free" ? B.t3 : sd.feeType === "ramp" ? "#22c55e" : "#3b82f6" }}>
                              {sd.feeType === "free" ? "FREE" : sd.feePct + "%"}
                            </td>
                            <td style={{ ...ST.td, textAlign: "right" }}>
                              <NumInput value={parseFloat(personas[pIdx].steps[sd.key]?.freq || 0)} onChange={v => updatePersonaStep(pIdx, sd.key, "freq", Math.max(0, v))} width={45} />
                            </td>
                            <td style={{ ...ST.td, textAlign: "right" }}>
                              <NumInput value={personas[pIdx].steps[sd.key]?.avg || 0} onChange={v => updatePersonaStep(pIdx, sd.key, "avg", Math.max(0, v))} width={55} />
                            </td>
                            <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: sd.userFee > 0 ? B.t1 : B.t3, fontSize: 11 }}>
                              {sd.feeType === "free" ? "FREE" : fd(sd.userFee)}
                              {sd.floorHit && <span style={{ fontSize: 7, color: B.warn, marginLeft: 2 }}>FLR</span>}
                              {sd.capHit && <span style={{ fontSize: 7, color: B.neg, marginLeft: 2 }}>CAP</span>}
                            </td>
                            <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: sd.totalUserFee > 0 ? B.t1 : B.t3 }}>{fd(sd.totalUserFee)}</td>
                            <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: sd.totalPlatformRev > 0 ? B.pos : B.t3 }}>{fd(sd.totalPlatformRev)}</td>
                            <td style={{ ...ST.td, textAlign: "right", ...M, color: B.t2, fontSize: 11 }}>{sd.vol > 0 ? fmt(sd.vol) : "—"}</td>
                            <td style={{ ...ST.td, textAlign: "right", ...M, fontSize: 11, color: sd.vol > 0 && (sd.totalUserFee / sd.vol) * 100 > 0.50 ? B.warn : B.t3 }}>
                              {sd.vol > 0 ? pc((sd.totalUserFee / sd.vol) * 100) : "—"}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: "2px solid " + B.border }}>
                          <td colSpan={3} style={{ ...ST.td, fontWeight: 700, color: p.color }}>Total</td>
                          <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 600 }}>{p.txCount.toFixed(1)}</td>
                          <td style={ST.td} />
                          <td style={ST.td} />
                          <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 800, color: B.t1 }}>{fd(p.totalFeePaid)}</td>
                          <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 800, color: B.pos }}>{fd(p.totalPlatformRev)}</td>
                          <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: B.t2 }}>{fmt(p.totalVolume)}</td>
                          <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: verdict(p.effectiveRate).color }}>{pc(p.effectiveRate)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {ds < 1 && (
                    <div style={{ marginTop: 8, fontSize: 10, color: B.t3, padding: "6px 8px", background: B.bg, borderRadius: 6 }}>
                      Revenue gap: user pays {fd(p.totalFeePaid)} but diBoaS captures {fd(p.totalPlatformRev)} ({pc(p.totalPlatformRev > 0 ? (p.totalPlatformRev / p.totalFeePaid) * 100 : 0)} capture rate) — {(100 - directShare)}% of exec routes lose margin to middleware ({middlewareBps} bps).
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Comparison bars */}
            <div style={{ ...ST.card, background: B.card2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: B.t1, marginBottom: 10 }}>User Cost vs Platform Revenue (weighted by mix)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>What User Pays</div>
                  {personaCalcs.map((p, i) => {
                    const mx = Math.max(...personaCalcs.map(x => x.totalFeePaid), 1);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <div style={{ width: 80, fontSize: 10, color: p.color, fontWeight: 600 }}>{p.icon} {p.name}</div>
                        <div style={{ flex: 1, background: B.bg, borderRadius: 6, height: 20, position: "relative", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 6, width: (p.totalFeePaid / mx * 100) + "%", background: p.color, opacity: 0.4 }} />
                          <span style={{ position: "absolute", right: 4, top: 2, fontSize: 10, ...M, fontWeight: 700, color: B.t1 }}>{fd(p.totalFeePaid)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>diBoaS Captures (x mix %)</div>
                  {personaCalcs.map((p, i) => {
                    const w = p.totalPlatformRev * (p.pctOfBase / 100);
                    const mx = Math.max(...personaCalcs.map(x => x.totalPlatformRev * (x.pctOfBase / 100)), 1);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <div style={{ width: 80, fontSize: 10, color: p.color, fontWeight: 600 }}>{p.pctOfBase}% mix</div>
                        <div style={{ flex: 1, background: B.bg, borderRadius: 6, height: 20, position: "relative", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 6, width: (w / mx * 100) + "%", background: B.pos, opacity: 0.4 }} />
                          <span style={{ position: "absolute", right: 4, top: 2, fontSize: 10, ...M, fontWeight: 700, color: B.t1 }}>{fd(w)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid " + B.border, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: B.t2, fontWeight: 600 }}>Blended RPU</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: B.pos, ...M }}>{fd(blendedRPU)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== PER-TX ====== */}
        {view === "pertx" && (
          <div style={{ ...ST.card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: B.t1, margin: "0 0 4px" }}>Per-Transaction Economics</h2>
            <p style={{ fontSize: 11, color: B.t3, margin: "0 0 10px" }}>Per-step rates · {directShare}% direct · {100 - directShare}% middleware ({middlewareBps} bps MW fee)</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  {["#", "Step", "Rate", "Avg $", "Type", "Full Fee", "Blended", "Sigs", "Sig$", "Net/Tx", "Freq", "Rev/User"].map(h =>
                    <th key={h} style={{ ...ST.th, textAlign: ["#","Step","Type","Rate"].includes(h) ? "left" : "right" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {sim.stepCalcs.map((sc, j) => (
                    <tr key={j} style={{ background: j % 2 === 0 ? "transparent" : B.card2 }}>
                      <td style={{ ...ST.td, ...M, fontWeight: 700, color: sc.color }}>{sc.n}</td>
                      <td style={{ ...ST.td, fontWeight: 600, color: B.t1, fontSize: 11 }}>{sc.label}</td>
                      <td style={{ ...ST.td, fontSize: 10, color: sc.feeType === "free" ? B.t3 : sc.feeType === "ramp" ? "#22c55e" : "#3b82f6" }}>
                        {sc.feeType === "free" ? "FREE" : sc.feePct + "%"}
                      </td>
                      <td style={{ ...ST.td, textAlign: "right", ...M }}>{fmt(sc.avg)}</td>
                      <td style={{ ...ST.td, color: sc.feeType === "free" ? B.t3 : sc.feeType === "ramp" ? "#22c55e" : "#3b82f6", fontSize: 10 }}>{sc.feeType}</td>
                      <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: sc.perTx > 0 ? B.t1 : B.t3 }}>{sc.perTx > 0 ? fd(sc.perTx) : "FREE"}</td>
                      <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: sc.perTxBlended > 0 ? B.pos : B.t3 }}>{sc.perTxBlended > 0 ? fd(sc.perTxBlended) : "FREE"}</td>
                      <td style={{ ...ST.td, textAlign: "right", ...M, color: B.t2, fontSize: 11 }}>{sc.sigs}</td>
                      <td style={{ ...ST.td, textAlign: "right", ...M, color: B.neg + "90", fontSize: 11 }}>{fd(sc.sigCostPerUser)}</td>
                      <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: sc.netPerUser >= 0 ? B.pos : B.neg }}>{fd(sc.netPerUser)}</td>
                      <td style={{ ...ST.td, textAlign: "right", ...M, color: B.t2 }}>{sc.defaultFreq}</td>
                      <td style={{ ...ST.td, textAlign: "right", ...M, fontWeight: 700, color: sc.perUser > 0 ? B.pos : B.t3 }}>{fd(sc.perUser)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== 9-STEP REVENUE ====== */}
        {view === "steps" && (
          <div style={{ ...ST.card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: B.t1, margin: "0 0 4px" }}>Month {selM} — Step Revenue Breakdown ({SCENARIOS[scenario].label})</h2>
            <p style={{ fontSize: 11, color: B.t3, margin: "0 0 10px" }}>{nm(s.mauFunded)} funded users · {nm(s.feeBearing)} fee-bearing{s.featRev > 0 ? " · Feature rev: " + fmt(s.featRev) : ""}</p>
            <input type="range" min={1} max={maxMonths} value={selM} onChange={e => setSelM(+e.target.value)}
              style={{ width: "100%", accentColor: B.accent, height: 4, marginBottom: 8 }} />
            {(() => {
              const mxRev = Math.max(...s.perStep.map(x => x.stepRev), 1);
              return s.perStep.map((sc, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 110, fontSize: 10, fontWeight: 600, color: sc.color, display: "flex", gap: 4 }}>
                    <span style={{ ...M, fontWeight: 700, width: 14 }}>{sc.n}</span>
                    {sc.shortLabel || sc.label}
                  </div>
                  <div style={{ flex: 1, background: B.card2, borderRadius: 6, height: 20, position: "relative", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 6, width: (sc.stepRev / mxRev * 100) + "%", background: sc.color, opacity: 0.5 }} />
                    <span style={{ position: "absolute", right: 4, top: 2, fontSize: 10, ...M, fontWeight: 700, color: B.t1 }}>
                      {sc.stepRev > 0 ? fmt(sc.stepRev) : "FREE"}
                    </span>
                  </div>
                  <div style={{ width: 45, fontSize: 9, color: B.t3, textAlign: "right", ...M }}>{nm(sc.attached)}</div>
                </div>
              ));
            })()}
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {[
                { l: "Tx Revenue", v: fmt(s.totalRev - s.yieldRev - (s.featRev || 0)), c: B.pos },
                { l: "Yield Rev", v: fmt(s.yieldRev), c: "#eab308" },
                { l: "Feature Rev", v: fmt(s.featRev || 0), c: "#a855f7" },
                { l: "Profit", v: fmt(s.profit), c: s.profit >= 0 ? B.pos : B.neg },
                { l: "Cumulative", v: fmt(s.cum), c: s.cum >= 0 ? B.pos : B.neg },
              ].map((x, i) => (
                <div key={i} style={{ background: B.card2, borderRadius: 6, padding: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: B.t3, textTransform: "uppercase", fontWeight: 600 }}>{x.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: x.c, ...M }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== P&L CHART ====== */}
        {view === "pnl" && (
          <div style={{ ...ST.card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: B.t1, margin: "0 0 10px" }}>Monthly P&L — {maxMonths} Months ({SCENARIOS[scenario].label}){showFeatures ? " + Features" : ""}</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 150 }}>
              {sim.months.map((mo, i) => {
                const h = (Math.abs(mo.profit) / mxP) * 135;
                return (
                  <div key={i} onClick={() => setSelM(i + 1)} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", cursor: "pointer", height: "100%" }}>
                    <div style={{ width: "100%", borderRadius: "2px 2px 0 0", height: Math.max(h, 2), background: mo.profit >= 0 ? B.pos : B.neg, opacity: selM === i + 1 ? 1 : 0.5 }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: B.t3, marginTop: 3 }}>
              {Array.from({ length: 7 }, (_, i) => { const m = Math.round((i / 6) * (maxMonths - 1)) + 1; return <span key={m}>M{m}</span>; })}
            </div>
            {/* Cumulative P&L overlay */}
            <div style={{ marginTop: 8, background: B.card2, borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 9, color: B.t3, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Cumulative Cash Flow</div>
              <div style={{ display: "flex", alignItems: "center", gap: 1, height: 40, overflow: "hidden" }}>
                {sim.months.map((mo, i) => {
                  const maxCum = Math.max(...sim.months.map(x => Math.abs(x.cum)), 1);
                  const h = (Math.abs(mo.cum) / maxCum) * 32;
                  return <div key={i} style={{ flex: 1, height: Math.max(h, 1), background: mo.cum >= 0 ? B.pos : B.neg, opacity: 0.5, borderRadius: 1, alignSelf: mo.cum >= 0 ? "flex-end" : "flex-start" }} />;
                })}
              </div>
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[
                { l: "Month " + selM, v: nm(s.mauApp) + " MAU", v2: nm(s.feeBearing) + " fee-bearing" },
                { l: "Revenue", v: fmt(s.totalRev), v2: "RPU: " + fd(s.revPerFunded) },
                { l: "Profit", v: fmt(s.profit), v2: pc(s.margin) + " margin" },
                { l: "Cumulative", v: fmt(s.cum), v2: s.cum >= 0 ? "Recovered" : "Peak: " + fmt(Math.abs(sim.peakLoss)) },
              ].map((x, i) => (
                <div key={i} style={{ background: B.card2, borderRadius: 6, padding: 8 }}>
                  <div style={{ fontSize: 9, color: B.t3 }}>{x.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: B.t1, ...M }}>{x.v}</div>
                  <div style={{ fontSize: 9, color: B.t3 }}>{x.v2}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== FULL TABLE ====== */}
        {view === "table" && (
          <div style={{ ...ST.card, marginBottom: 16, overflowX: "auto" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: B.t1, margin: "0 0 8px" }}>{maxMonths}-Month Projection ({SCENARIOS[scenario].label}, {directShare}% direct){showFeatures ? " + Features" : ""}</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["Mo", "MAU", "Funded", "B2B", "Volume", "TxRev", "YieldRev", "FeatRev", "TotalRev", "Costs", "Profit", "Cumul.", "Margin"].map(h =>
                  <th key={h} style={{ ...ST.th, textAlign: h === "Mo" ? "left" : "right" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {sim.months.map(mo => (
                  <tr key={mo.m} onClick={() => { setSelM(mo.m); setView("steps"); }} style={{ cursor: "pointer", background: selM === mo.m ? B.card2 : "transparent" }}>
                    <td style={{ ...ST.td, ...M, fontWeight: 600, fontSize: 11 }}>{mo.m}</td>
                    <td style={{ ...ST.td, textAlign: "right", fontSize: 11 }}>{nm(mo.mauApp)}</td>
                    <td style={{ ...ST.td, textAlign: "right", fontSize: 11 }}>{nm(mo.mauFunded)}</td>
                    <td style={{ ...ST.td, textAlign: "right", fontSize: 11, color: "#a855f7" }}>{nm(mo.b2bClients)}</td>
                    <td style={{ ...ST.td, textAlign: "right", fontSize: 11 }}>{fmt(mo.totalVol)}</td>
                    <td style={{ ...ST.td, textAlign: "right", color: B.pos, fontSize: 11 }}>{fmt(mo.totalRev - mo.yieldRev - (mo.featRev || 0))}</td>
                    <td style={{ ...ST.td, textAlign: "right", color: "#eab308", fontSize: 11 }}>{mo.yieldRev > 0 ? fmt(mo.yieldRev) : "—"}</td>
                    <td style={{ ...ST.td, textAlign: "right", color: "#a855f7", fontSize: 11 }}>{mo.featRev > 0 ? fmt(mo.featRev) : "—"}</td>
                    <td style={{ ...ST.td, textAlign: "right", color: B.pos, fontSize: 11, fontWeight: 700 }}>{fmt(mo.totalRev)}</td>
                    <td style={{ ...ST.td, textAlign: "right", color: B.neg + "90", fontSize: 11 }}>{fmt(mo.totalC)}</td>
                    <td style={{ ...ST.td, textAlign: "right", fontWeight: 700, color: mo.profit >= 0 ? B.pos : B.neg, fontSize: 11 }}>{fmt(mo.profit)}</td>
                    <td style={{ ...ST.td, textAlign: "right", color: mo.cum >= 0 ? "#86efac" : "#fca5a5", fontSize: 11 }}>{fmt(mo.cum)}</td>
                    <td style={{ ...ST.td, textAlign: "right", color: B.t3, fontSize: 11 }}>{pc(mo.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ====== FEATURE TIMELINE ====== */}
        {view === "features" && (
          <div style={{ ...ST.card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: B.t1, margin: "0 0 4px" }}>Feature Revenue Timeline</h2>
            <p style={{ fontSize: 11, color: B.t3, margin: "0 0 12px" }}>14 revenue streams activating across 6 milestones. Toggle Features button to see impact on P&L.</p>
            {[3, 6, 9, 12, 15, 18].map(milestone => {
              const feats = FEATURE_TIMELINE.filter(f => f.month === milestone);
              const active = true;
              const mData = sim.months[Math.min(milestone - 1, sim.months.length - 1)];
              return (
                <div key={milestone} style={{ ...ST.card, background: B.card2, marginBottom: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: B.pos, ...M }}>M{milestone}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: B.t1 }}>{feats.length} stream{feats.length > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ fontSize: 10, color: B.t3, ...M }}>
                      MAU: {nm(mData.mauApp)} · Funded: {nm(mData.mauFunded)}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                    {feats.map(f => (
                      <div key={f.id} style={{ background: B.bg, borderRadius: 8, padding: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#a855f7" }}>{f.label}</div>
                        <div style={{ fontSize: 10, color: B.t3, marginTop: 2 }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ ...ST.card, background: B.bg, borderColor: B.border, fontSize: 9, color: B.t3 }}>
          <div style={{ fontWeight: 700, color: B.t2, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px", fontSize: 9 }}>diBoaS Fee Lab v3.3 · Canonical Edition (Final)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 14px" }}>
            <span><b style={{ color: B.t2 }}>Fees:</b> Ramp 0.48% (Add/Withdraw) · Exec 0.39% (Buy/Sell/Stop) · Free (Send/Swap/Bridge/Start)</span>
            <span><b style={{ color: B.t2 }}>Floor/Cap:</b> ${feeFloor.toFixed(2)} floor · ${feeCap} cap (exec only)</span>
            <span><b style={{ color: B.t2 }}>Routes:</b> {directShare}% direct · {100 - directShare}% middleware ({middlewareBps} bps MW fee)</span>
            <span><b style={{ color: B.t2 }}>Scenario:</b> {SCENARIOS[scenario].label} · {churn}% churn · {growth}% growth · {fundedPct}% funded</span>
            <span><b style={{ color: B.t2 }}>Features:</b> {showFeatures ? "ON — 14 streams (M3→M18)" : "OFF — tx fees only"}</span>
            <span><b style={{ color: B.t2 }}>Blended RPU:</b> {fd(blendedRPU)}/funded user/mo (tx fees only)</span>
          </div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid " + B.border + "40", fontSize: 8, color: B.t3 + "a0" }}>
            This model covers fee economics + feature revenue timeline. Execution quality (slippage, reverts, MEV) is a separate concern. Competitor benchmarks use retail interfaces, not pro order books; rates are snapshots as of Feb 2026. Phantom rate is estimated from third-party sources. Growth model compounds newUsers at MoM rate — no plateau cap. Feature revenue uses conservative adoption assumptions. Subscription prices converted from EUR to USD at ~1.075 rate. DCA Buy Batching applies to Buy step only. Signature costs include transaction frequency (freq × sigs × $0.01). Middleware capture uses no floor — platform take can drop to $0 at high middleware bps. Competitor comparison uses mix-weighted effective rate. On-ramp 0.48% is platform fee; partner costs not modeled. USDT/Tron volume boost represents ticket size uplift, not increased frequency. Fee-bearing user count assumes independent attach rates.
          </div>
        </div>
      </div>
    </div>
  );
}
