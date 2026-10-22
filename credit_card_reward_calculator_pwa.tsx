import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  CreditCard, 
  Plane, 
  Smartphone, 
  Cat, 
  CheckCircle2, 
  RotateCcw, 
  Info, 
  X, 
  Download, 
  ShieldCheck, 
  Store, 
  Sparkles,
  TrendingUp,
  Coins,
  SmartphoneNfc,
  Share,
  PlusSquare
} from 'lucide-react';

// Unified Group Brand List Modal Content
const UNIFIED_BRANDS = [
  "7-ELEVEN (統一超商)", "康是美 (Cosmed)", "統一時代百貨 (台北店/高雄店)", "夢時代購物中心",
  "DREAM PLAZA", "UNIKCY", "BEING spa / BEING sport", "星巴克 (Starbucks)",
  "21Plus (21風味館)", "Mister Donut", "COLD STONE", "聖娜 (SENO) 麵包",
  "Mia C'bon", "博客來", "聖德科斯", "統一生機", "速邁樂加油站",
  "foodomo 外送", "黑貓宅急便", "ibon 售票系統", "台北 W 飯店", "台北時代寓所"
];

// Kumamoto Designated Stores List Content
const KUMAMOTO_STORES = [
  { category: "交通與儲值", items: ["日本交通卡加值 (Suica / PASMO / ICOCA)", "JR 鐵路官網系統訂票"] },
  { category: "人氣餐飲美食", items: ["一蘭拉麵", "勝烈亭豬排", "敘敘苑燒肉", "牛角燒肉", "Shake Shack", "鳥貴族", "松屋", "SUKIYA", "壽司郎", "藏壽司"] },
  { category: "藥妝/家電/連鎖賣場", items: ["Bic Camera (必買家電)", "Yodobashi (友都八喜)", "松本清 (Matsumotokiyoshi)", "唐吉訶德 (Don Quijote)", "大國藥妝", "無印良品 (MUJI)", "三井 OUTLET (MITSUI)", "UNIQLO", "GU", "Mont-bell"] }
];

export default function App() {
  const [currentCard, setCurrentCard] = useState('ctbc-uniopen');
  const [inputAmount, setInputAmount] = useState('10000');
  const [jpyRate, setJpyRate] = useState('0.215');
  const [uniCurr, setUniCurr] = useState('JPY'); // 'JPY' | 'TWD'
  
  // CTBC Options
  const [uniIsForeign, setUniIsForeign] = useState(true);
  const [uniIsUnified, setUniIsUnified] = useState(false);
  const [uniStamp, setUniStamp] = useState(1);
  const [uniIsIcash, setUniIsIcash] = useState(false);
  
  // Esun Option
  const [esunIsSpecial, setEsunIsSpecial] = useState(true);

  // Modals & PWA Prompts
  const [activeModal, setActiveModal] = useState(null); // 'unified' | 'kumamoto' | 'pwa-guide' | null
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Cumulative Tracking State per Card
  const [accumulated, setAccumulated] = useState(() => {
    const saved = localStorage.getItem('card_reward_accumulated');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      'ctbc-uniopen': { reward: 0, fee: 0, icashUsed: 0, unifiedUsed: 0, extraUsed: 0 },
      'fubon-j': { reward: 0, fee: 0, fubonUsed: 0 },
      'esun-kumamoto-pay': { reward: 0, fee: 0, payUsed: 0 },
      'esun-kumamoto-card': { reward: 0, fee: 0, cardUsed: 0 }
    };
  });

  useEffect(() => {
    localStorage.setItem('card_reward_accumulated', JSON.stringify(accumulated));
  }, [accumulated]);

  useEffect(() => {
    // Detect iOS Device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check Standalone Mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true);
    }

    // Capture PWA Install Prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('Service Worker skipped/failed:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      setActiveModal('pwa-guide');
    }
  };

  const rawAmt = parseFloat(inputAmount) || 0;
  const rate = parseFloat(jpyRate) || 0.215;

  let twdAmt = 0;
  if (currentCard === 'ctbc-uniopen') {
    twdAmt = uniCurr === 'TWD' ? rawAmt : Math.round(rawAmt * rate);
  } else if (currentCard === 'esun-kumamoto-pay') {
    twdAmt = rawAmt;
  } else {
    twdAmt = Math.round(rawAmt * rate);
  }

  let isWaivedFee = (currentCard === 'esun-kumamoto-pay') || (currentCard === 'ctbc-uniopen' && uniCurr === 'TWD' && !uniIsForeign);
  let feeAmount = isWaivedFee ? 0 : Math.round(twdAmt * 0.015);

  let breakDownList = [];
  let currentRewards = 0;
  let tempDetails = {};

  const currentAcc = accumulated[currentCard] || {};

  if (currentCard === 'ctbc-uniopen') {
    if (uniIsForeign) {
      const base = Math.round(twdAmt * 0.03);
      breakDownList.push({ label: '國外實體 3% (無上限)', val: base });
      currentRewards += base;

      const remainingExtra = Math.max(0, 500 - (currentAcc.extraUsed || 0));
      const extra8 = Math.min(Math.round(twdAmt * 0.08), remainingExtra);
      breakDownList.push({ label: `國外加碼 8% (餘額上限: ${remainingExtra}點)`, val: extra8 });
      currentRewards += extra8;
      tempDetails.extra = extra8;
    } else {
      const base = Math.round(twdAmt * 0.01);
      breakDownList.push({ label: '國內基本 1% (無上限)', val: base });
      currentRewards += base;
    }

    if (uniIsUnified && !uniIsForeign) {
      const remainingUnified = Math.max(0, 500 - (currentAcc.unifiedUsed || 0));
      const uni2 = Math.min(Math.round(twdAmt * 0.02), remainingUnified);
      breakDownList.push({ label: `統一集團加碼 2% (餘額上限: ${remainingUnified}點)`, val: uni2 });
      currentRewards += uni2;
      tempDetails.unified = uni2;
    }

    if (uniStamp >= 2 && twdAmt >= 199) {
      const stampRate = (uniStamp - 1) * 0.01;
      const remainingStampCap = Math.max(0, 500 - (currentAcc.extraUsed || 0) - (tempDetails.extra || 0));
      const stampBonus = Math.min(Math.round(twdAmt * stampRate), remainingStampCap);
      breakDownList.push({ label: `踩點任務加碼 (+${stampRate * 100}%)`, val: stampBonus });
      currentRewards += stampBonus;
      tempDetails.stamp = stampBonus;
    }

    if (uniIsIcash && twdAmt >= 199) {
      const remainingIcash = Math.max(0, 150 - (currentAcc.icashUsed || 0));
      const icash4 = Math.min(Math.round(twdAmt * 0.04), remainingIcash);
      breakDownList.push({ label: `icash Pay 加碼 4% (餘額上限: ${remainingIcash}點)`, val: icash4 });
      currentRewards += icash4;
      tempDetails.icash = icash4;
    }
  } else if (currentCard === 'fubon-j') {
    const base = Math.round(twdAmt * 0.03);
    breakDownList.push({ label: '日本消費 3% (無上限)', val: base });
    currentRewards += base;

    if (twdAmt >= 1000) {
      const remainingFubon = Math.max(0, 1000 - (currentAcc.fubonUsed || 0));
      const fubonExtra = Math.min(Math.round(twdAmt * 0.03), remainingFubon);
      breakDownList.push({ label: `單筆滿1,000加碼 3% (餘額上限: $${remainingFubon})`, val: fubonExtra });
      currentRewards += fubonExtra;
      tempDetails.fubon = fubonExtra;
    }
  } else if (currentCard === 'esun-kumamoto-pay') {
    const remainingPay = Math.max(0, 100 - (currentAcc.payUsed || 0));
    const payBonus = Math.min(Math.round(twdAmt * 0.035), remainingPay);
    breakDownList.push({ label: `日本 PayPay 3.5% (每季餘額上限: $${remainingPay})`, val: payBonus });
    currentRewards += payBonus;
    tempDetails.pay = payBonus;
  } else if (currentCard === 'esun-kumamoto-card') {
    const base = Math.round(twdAmt * 0.025);
    breakDownList.push({ label: '日本一般消費 2.5% (無上限)', val: base });
    currentRewards += base;

    if (esunIsSpecial) {
      const remainingCard = Math.max(0, 500 - (currentAcc.cardUsed || 0));
      const cardExtra = Math.min(Math.round(twdAmt * 0.06), remainingCard);
      breakDownList.push({ label: `指定日本商店加碼 6% (每期餘額上限: $${remainingCard})`, val: cardExtra });
      currentRewards += cardExtra;
      tempDetails.card = cardExtra;
    }
  }

  const handleConfirmRecord = () => {
    setAccumulated(prev => {
      const cardData = prev[currentCard] || {};
      const newCardData = { ...cardData };

      newCardData.reward = (newCardData.reward || 0) + currentRewards;
      newCardData.fee = (newCardData.fee || 0) + feeAmount;

      if (currentCard === 'ctbc-uniopen') {
        if (tempDetails.icash) newCardData.icashUsed = Math.min(150, (newCardData.icashUsed || 0) + tempDetails.icash);
        if (tempDetails.unified) newCardData.unifiedUsed = Math.min(500, (newCardData.unifiedUsed || 0) + tempDetails.unified);
        if (tempDetails.extra) newCardData.extraUsed = Math.min(500, (newCardData.extraUsed || 0) + tempDetails.extra);
        if (tempDetails.stamp) newCardData.extraUsed = Math.min(500, (newCardData.extraUsed || 0) + tempDetails.stamp);
      } else if (currentCard === 'fubon-j') {
        if (tempDetails.fubon) newCardData.fubonUsed = Math.min(1000, (newCardData.fubonUsed || 0) + tempDetails.fubon);
      } else if (currentCard === 'esun-kumamoto-pay') {
        if (tempDetails.pay) newCardData.payUsed = Math.min(100, (newCardData.payUsed || 0) + tempDetails.pay);
      } else if (currentCard === 'esun-kumamoto-card') {
        if (tempDetails.card) newCardData.cardUsed = Math.min(500, (newCardData.cardUsed || 0) + tempDetails.card);
      }

      return { ...prev, [currentCard]: newCardData };
    });
  };

  const handleResetAll = () => {
    if (window.confirm("確定要將所有信用卡的回饋與手續費紀錄歸零重置嗎？")) {
      setAccumulated({
        'ctbc-uniopen': { reward: 0, fee: 0, icashUsed: 0, unifiedUsed: 0, extraUsed: 0 },
        'fubon-j': { reward: 0, fee: 0, fubonUsed: 0 },
        'esun-kumamoto-pay': { reward: 0, fee: 0, payUsed: 0 },
        'esun-kumamoto-card': { reward: 0, fee: 0, cardUsed: 0 }
      });
    }
  };

  let totalAllReward = 0;
  let totalAllFee = 0;
  Object.keys(accumulated).forEach(k => {
    totalAllReward += accumulated[k].reward || 0;
    totalAllFee += accumulated[k].fee || 0;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2620] pb-16 font-sans select-none">
      {/* Top Header */}
      <header className="bg-white/90 border-b border-rose-100 sticky top-0 z-30 backdrop-blur-md px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wide text-slate-800">信用卡回饋算算看</h1>
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                <span>日本旅遊 & 國內精算 PWA App</span>
              </p>
            </div>
          </div>

          {!isStandalone && (
            <button
              onClick={handleInstallPWA}
              className="flex items-center gap-1 bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-600 active:scale-95 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>安裝 App</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* Card Selector Tabs */}
        <div className="bg-white rounded-2xl p-2 border border-rose-100 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrentCard('ctbc-uniopen')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentCard === 'ctbc-uniopen'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-rose-50/50 text-slate-600 hover:bg-rose-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>中信 uniopen</span>
            </button>

            <button
              onClick={() => setCurrentCard('fubon-j')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentCard === 'fubon-j'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-rose-50/50 text-slate-600 hover:bg-rose-100'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>富邦 J 卡</span>
            </button>

            <button
              onClick={() => setCurrentCard('esun-kumamoto-pay')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentCard === 'esun-kumamoto-pay'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-rose-50/50 text-slate-600 hover:bg-rose-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>玉山 Wallet</span>
            </button>

            <button
              onClick={() => setCurrentCard('esun-kumamoto-card')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentCard === 'esun-kumamoto-card'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-rose-50/50 text-slate-600 hover:bg-rose-100'
              }`}
            >
              <Cat className="w-4 h-4" />
              <span>玉山熊本熊</span>
            </button>
          </div>
        </div>

        {/* Input Panel Card */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">
                  {currentCard === 'ctbc-uniopen'
                    ? (uniCurr === 'TWD' ? '消費金額 (台幣 TWD)' : '消費金額 (日幣 JPY)')
                    : (currentCard === 'esun-kumamoto-pay' ? '消費金額 (台幣 TWD)' : '消費金額 (日幣 JPY)')}
                </label>

                {currentCard === 'ctbc-uniopen' && (
                  <div className="flex items-center bg-rose-50 rounded-lg p-0.5 border border-rose-200">
                    <button
                      type="button"
                      onClick={() => setUniCurr('JPY')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${uniCurr === 'JPY' ? 'bg-rose-500 text-white' : 'text-slate-600'}`}
                    >
                      日幣
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniCurr('TWD')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${uniCurr === 'TWD' ? 'bg-rose-500 text-white' : 'text-slate-600'}`}
                    >
                      台幣
                    </button>
                  </div>
                )}
              </div>

              {(currentCard !== 'ctbc-uniopen' || uniCurr !== 'TWD') && currentCard !== 'esun-kumamoto-pay' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">匯率:</span>
                  <input
                    type="number"
                    value={jpyRate}
                    onChange={(e) => setJpyRate(e.target.value)}
                    step="0.001"
                    className="w-16 bg-rose-50/50 border border-rose-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-rose-600 text-center"
                  />
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400 font-extrabold text-lg">
                {(currentCard === 'ctbc-uniopen' && uniCurr === 'TWD') || currentCard === 'esun-kumamoto-pay' ? 'NT$' : '¥'}
              </span>
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-rose-50/30 border border-rose-200 rounded-xl pl-12 pr-3 py-3 text-2xl font-extrabold text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
              />
            </div>

            <div className="mt-2 text-xs text-slate-500 font-medium flex justify-between">
              <span>折合台幣約：<strong className="text-rose-600 font-bold">NT$ {twdAmt.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Controls per card */}
          <div className="border-t border-rose-100 pt-3 space-y-3">
            {currentCard === 'ctbc-uniopen' && (
              <>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/40 border border-rose-100">
                  <span className="text-xs font-bold text-slate-800">國外實體商店 (3% + 8%)</span>
                  <input
                    type="checkbox"
                    checked={uniIsForeign}
                    onChange={(e) => setUniIsForeign(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">統一集團通路 (加碼 2%)</span>
                    <input
                      type="checkbox"
                      checked={uniIsUnified}
                      onChange={(e) => setUniIsUnified(e.target.checked)}
                      className="w-4 h-4 accent-rose-500 rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal('unified')}
                    className="text-[11px] text-rose-600 font-bold underline flex items-center gap-1 hover:text-rose-700"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>查看 32+ 統一集團適用品牌</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100 space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">踩點任務品牌數 (單筆滿 NT$199)</label>
                  <select
                    value={uniStamp}
                    onChange={(e) => setUniStamp(parseInt(e.target.value))}
                    className="w-full bg-white border border-rose-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-rose-400"
                  >
                    <option value={1}>1 家品牌 (+0%)</option>
                    <option value={2}>2 家品牌 (+1%)</option>
                    <option value={3}>3 家品牌 (+2%)</option>
                    <option value={4}>4 家品牌 (+3%)</option>
                    <option value={5}>5 家以上品牌 (+4%)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/40 border border-rose-100">
                  <span className="text-xs font-bold text-slate-800">icash Pay 支付 (滿 NT$199 加碼 4%)</span>
                  <input
                    type="checkbox"
                    checked={uniIsIcash}
                    onChange={(e) => setUniIsIcash(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded"
                  />
                </div>
              </>
            )}

            {currentCard === 'fubon-j' && (
              <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-100 text-xs space-y-1">
                <p className="font-bold text-slate-800">日本消費 3% 回饋無上限</p>
                <p className="text-[11px] text-slate-500">單筆滿 NT$1,000 元，加碼 3%（每季上限 NT$1,000）</p>
              </div>
            )}

            {currentCard === 'esun-kumamoto-pay' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>免收 1.5% 國外交易服務費</span>
                </p>
                <p className="text-[11px] text-emerald-600">日本 PayPay 通路 3.5% 回饋（每季上限 NT$100）</p>
              </div>
            )}

            {currentCard === 'esun-kumamoto-card' && (
              <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">指定日本商店加碼 6%</span>
                  <input
                    type="checkbox"
                    checked={esunIsSpecial}
                    onChange={(e) => setEsunIsSpecial(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('kumamoto')}
                  className="text-[11px] text-rose-600 font-bold underline flex items-center gap-1 hover:text-rose-700"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>查看熊本熊指定商店清單</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-md shadow-rose-200 space-y-4">
          <div className="flex justify-between items-center text-xs opacity-90 font-medium">
            <span>試算結果</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              {currentCard === 'ctbc-uniopen' && '中國信託 uniopen 卡'}
              {currentCard === 'fubon-j' && '台北富邦 J 卡'}
              {currentCard === 'esun-kumamoto-pay' && '玉山 Wallet (熊本熊)'}
              {currentCard === 'esun-kumamoto-card' && '玉山熊本熊卡 (實體)'}
            </span>
          </div>

          <div className="text-center py-1 border-b border-white/20 space-y-2">
            <div>
              <p className="text-[11px] tracking-wider opacity-80 uppercase font-semibold">本筆預估回饋金額 / 點數</p>
              <div className="text-3xl font-extrabold mt-0.5 tracking-tight">
                NT$ {currentRewards.toLocaleString()}
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-2.5 flex justify-between items-center text-xs">
              <span className="flex items-center gap-1">
                <span>國外交易手續費 (1.5%)：</span>
                {isWaivedFee && <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">免收</span>}
              </span>
              <span className="font-extrabold text-rose-100">NT$ {feeAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            {breakDownList.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center opacity-95">
                <span>{item.label}</span>
                <span className="font-bold">+NT$ {item.val.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirmRecord}
            className="w-full bg-white text-rose-600 font-extrabold py-2.5 rounded-xl shadow-md hover:bg-rose-50 transition flex items-center justify-center gap-1.5 text-xs active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>確認輸入（記入本期累積）</span>
          </button>
        </div>

        {/* Dashboard Cumulative Panel */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-rose-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>累積統計看板</span>
            </h3>
            <button
              onClick={handleResetAll}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>歸零重置</span>
            </button>
          </div>

          <div className="bg-rose-50/50 p-3 rounded-xl space-y-2 border border-rose-100">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-rose-500" />
              <span>當前卡片累積與上限進度</span>
            </p>

            <div className="flex justify-between text-slate-700">
              <span>累積獲得回饋：</span>
              <span className="font-extrabold text-rose-600">NT$ {(currentAcc.reward || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>累積手續費：</span>
              <span className="font-bold text-slate-700">NT$ {(currentAcc.fee || 0).toLocaleString()}</span>
            </div>

            <div className="border-t border-rose-200/60 pt-2 space-y-2 mt-1">
              {currentCard === 'ctbc-uniopen' && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>icash Pay 加碼 (上限150點)</span>
                      <span className="font-bold">{currentAcc.icashUsed || 0} / 150</span>
                    </div>
                    <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((currentAcc.icashUsed || 0) / 150) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>統一集團加碼 (上限500點)</span>
                      <span className="font-bold">{currentAcc.unifiedUsed || 0} / 500</span>
                    </div>
                    <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((currentAcc.unifiedUsed || 0) / 500) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>國外/踩點加碼 (上限500點)</span>
                      <span className="font-bold">{currentAcc.extraUsed || 0} / 500</span>
                    </div>
                    <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((currentAcc.extraUsed || 0) / 500) * 100)}%` }}></div>
                    </div>
                  </div>
                </>
              )}

              {currentCard === 'fubon-j' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>每季滿千加碼 (上限 NT$1,000)</span>
                    <span className="font-bold">${currentAcc.fubonUsed || 0} / $1,000</span>
                  </div>
                  <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((currentAcc.fubonUsed || 0) / 1000) * 100)}%` }}></div>
                  </div>
                </div>
              )}

              {currentCard === 'esun-kumamoto-pay' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>每季 PayPay 加碼 (上限 NT$100)</span>
                    <span className="font-bold">${currentAcc.payUsed || 0} / $100</span>
                  </div>
                  <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((currentAcc.payUsed || 0) / 100) * 100)}%` }}></div>
                  </div>
                </div>
              )}

              {currentCard === 'esun-kumamoto-card' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>每期指定商店加碼 (上限 NT$500)</span>
                    <span className="font-bold">${currentAcc.cardUsed || 0} / $500</span>
                  </div>
                  <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((currentAcc.cardUsed || 0) / 500) * 100)}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-slate-700 border border-slate-200">
            <p className="font-bold text-slate-800">【全卡總計】</p>
            <div className="flex justify-between">
              <span>全部信用卡總累積回饋：</span>
              <span className="font-extrabold text-rose-600">NT$ {totalAllReward.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>全部信用卡總累積手續費：</span>
              <span className="font-bold text-slate-700">NT$ {totalAllFee.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm text-xs space-y-2">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Info className="w-4 h-4 text-rose-500" />
            <span>卡片權益重點整理</span>
          </h3>

          <div className="text-slate-600 space-y-1 leading-relaxed text-[11px]">
            {currentCard === 'ctbc-uniopen' && (
              <>
                <p>1. 國內消費 1% 無上限 | icash Pay 單筆滿 NT$199 加碼 4% (月上限 150 點)</p>
                <p>2. 統一集團通路加碼 2% (月上限 500 點) | 踩點任務品牌數加碼 1%~4% (月上限 500 點)</p>
                <p>3. 國外實體 3% 無上限 + 8% 加碼 (月上限 500 點)</p>
              </>
            )}
            {currentCard === 'fubon-j' && (
              <>
                <p>1. 日本地區消費享 3% 回饋無上限。</p>
                <p>2. 日本地區消費單筆滿 NT$1,000 元加碼 3%（每季上限 NT$1,000 元）。</p>
              </>
            )}
            {currentCard === 'esun-kumamoto-pay' && (
              <>
                <p>1. 玉山熊本熊卡綁定玉山 Wallet 電子支付於日本 PayPay 通路消費。</p>
                <p>2. 享 3.5% 回饋（每季上限 NT$100 元）。</p>
                <p className="text-emerald-600 font-bold">3. 免收 1.5% 國外交易服務費。</p>
              </>
            )}
            {currentCard === 'esun-kumamoto-card' && (
              <>
                <p>1. 日本一般消費 2.5% 回饋無上限。</p>
                <p>2. 指定日本商店加碼 6%（每期上限 NT$500 元）。</p>
              </>
            )}
          </div>
        </div>
      </main>

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 max-h-[80vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-rose-100 pb-2">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>
                  {activeModal === 'unified' && '統一集團 32+ 適用品牌'}
                  {activeModal === 'kumamoto' && '熊本熊指定日本加碼商店'}
                  {activeModal === 'pwa-guide' && '如何安裝至手機主畫面 (App)'}
                </span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed overflow-y-auto space-y-2 pr-1">
              {activeModal === 'unified' && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {UNIFIED_BRANDS.map((item, i) => (
                    <div key={i} className="bg-rose-50/50 p-2 rounded-lg border border-rose-100/60 font-medium text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'kumamoto' && (
                <div className="space-y-3 text-[11px]">
                  {KUMAMOTO_STORES.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <p className="font-bold text-rose-600 border-b border-rose-100 pb-0.5">{cat.category}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cat.items.map((item, j) => (
                          <span key={j} className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal === 'pwa-guide' && (
                <div className="space-y-3 text-[12px] text-slate-700">
                  {isIOS ? (
                    <div className="space-y-2">
                      <p className="font-bold text-rose-600">iOS (Safari) 安裝步驟：</p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>點擊 Safari 下方的 <Share className="w-3.5 h-3.5 inline text-rose-500" /> <strong>「分享」</strong> 按鈕</li>
                        <li>向下滾動並選擇 <PlusSquare className="w-3.5 h-3.5 inline text-rose-500" /> <strong>「加入主畫面」</strong></li>
                        <li>點擊右上角的 <strong>「新增」</strong> 即可在桌面生成 App!</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-rose-600">Android (Chrome) 安裝步驟：</p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>點擊瀏覽器右上角的 <strong>「...」</strong> 選單</li>
                        <li>選擇 <strong>「加到主畫面」</strong> 或 <strong>「安裝應用程式」</strong></li>
                        <li>確認後即可像一般 App 一樣使用！</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}