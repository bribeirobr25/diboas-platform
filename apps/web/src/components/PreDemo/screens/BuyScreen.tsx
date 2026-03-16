'use client';

import { useMemo, useCallback } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import { DemoHeader } from '../components/DemoHeader';
import { DemoFooter } from '../components/DemoFooter';
import { BalanceCard } from '../components/BalanceCard';
import { FeeBreakdown } from '../components/FeeBreakdown';
import {
  ASSET_CATEGORIES,
  BUY_QUICK_AMOUNTS,
  calculateBuyFees,
  checkInsufficientFunds,
  isAssetEnabled,
  formatCurrency,
  type AssetCategory,
  type Asset,
} from '@/lib/pre-demo';
import { CRYPTO_COLORS } from '@/lib/constants/crypto-colors';
import { useLocale } from '@/components/Providers';
import { getCurrencyForLocale, getCurrencySymbol } from '@/config/formats';
import { analyticsService } from '@/lib/analytics';
import styles from '../PreDemo.module.css';

const CATEGORY_LIST: AssetCategory[] = ['ETFs', 'Stocks', 'Crypto', 'Gold'];

const CATEGORY_I18N: Record<AssetCategory, string> = {
  ETFs: 'preDemo.buy.categoryETFs',
  Stocks: 'preDemo.buy.categoryStocks',
  Crypto: 'preDemo.buy.categoryCrypto',
  Gold: 'preDemo.buy.categoryGold',
};

/** Branded icons for enabled crypto assets, 2-letter fallback for others */
function AssetIcon({ symbol }: { symbol: string }) {
  // BTC — orange circle with white B
  if (symbol === 'BTC') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.BTC }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" d="M15.3 10.5c.2-1.2-.7-1.8-2-2.2l.4-1.6-1-.3-.4 1.5c-.3-.1-.5-.1-.8-.2l.4-1.5-1-.3-.4 1.6c-.2-.1-.4-.1-.6-.2l-1.4-.3-.3 1.1s.7.2.7.2c.4.1.5.4.5.6l-.5 2.1c0 0 .1 0 .1 0l-.1 0-.7 2.9c-.1.2-.2.4-.6.3 0 0-.7-.2-.7-.2l-.5 1.2 1.3.3c.2.1.5.1.7.2l-.4 1.6 1 .3.4-1.6c.3.1.5.2.8.2l-.4 1.6 1 .3.4-1.6c1.7.3 2.9.2 3.4-1.3.4-1.2 0-1.9-.9-2.4.7-.2 1.2-.6 1.3-1.5zm-2.3 3.3c-.3 1.2-2.3.6-3 .4l.5-2.1c.7.2 2.8.5 2.5 1.7zm.3-3.3c-.3 1.1-1.9.5-2.5.4l.5-1.9c.6.1 2.3.4 2 1.5z" />
        </svg>
      </div>
    );
  }

  // XAUT — gold circle with ingot shape
  if (symbol === 'XAUT') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.XAUT }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
          <rect x="7" y="8" width="10" height="8" rx="1" />
          <rect x="9" y="6" width="6" height="3" rx="0.5" />
        </svg>
      </div>
    );
  }

  // ETH — blue circle with diamond
  if (symbol === 'ETH') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.ETH }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" fillOpacity="0.6" d="M12 4v6l5 2.5z" />
          <path fill="white" d="M12 4l-5 8.5 5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M12 15.5v4.5l5-7z" />
          <path fill="white" d="M12 15.5l-5-2.5 5 7z" />
          <path fill="white" fillOpacity="0.2" d="M12 14.5l5-2.5-5-2.5z" />
          <path fill="white" fillOpacity="0.6" d="M7 12l5 2.5v-5z" />
        </svg>
      </div>
    );
  }

  // SOL — gradient circle with Solana icon
  if (symbol === 'SOL') {
    return (
      <div className={styles.assetIcon} style={{ background: `linear-gradient(135deg, ${CRYPTO_COLORS.SOL}, #14F195)` }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" d="M4.5 16.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5zm2.3-5.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5l-2.3 2.3c-.1.1-.3.2-.4.2H4.7c-.3 0-.4-.3-.2-.5l2.3-2.3zm12.5-4l-2.3 2.3c-.1.1-.3.2-.4.2H4.3c-.3 0-.4-.3-.2-.5l2.3-2.3c.1-.1.3-.2.4-.2h12.3c.3 0 .4.3.2.5z" />
        </svg>
      </div>
    );
  }

  // SUI — blue circle with droplet
  if (symbol === 'SUI') {
    return (
      <div className={styles.assetIcon} style={{ background: CRYPTO_COLORS.SUI }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" d="M12 6c-2.5 0-4.5 2-4.5 4.5 0 1.5.7 2.8 1.8 3.6l2.2 2.2c.3.3.7.3 1 0l2.2-2.2c1.1-.8 1.8-2.1 1.8-3.6C16.5 8 14.5 6 12 6zm0 7c-1.4 0-2.5-1.1-2.5-2.5S10.6 8 12 8s2.5 1.1 2.5 2.5S13.4 13 12 13z" />
        </svg>
      </div>
    );
  }

  // Fallback: 2-letter colored icon
  const letters = symbol.slice(0, 2);
  const colorMap: Record<string, string> = {
    SP: '#1a73e8',
    QQ: '#e91e63',
    IW: '#2196f3',
    AP: '#333',
    GO: '#4caf50',
    TS: '#f44336',
    NV: '#76b900',
    MS: '#00a1f1',
  };
  const color = colorMap[letters] || '#64748b';

  return (
    <div className={styles.assetIcon} style={{ background: color }}>
      {letters}
    </div>
  );
}

export function BuyScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();

  const { locale } = useLocale();
  const currencySymbol = getCurrencySymbol(getCurrencyForLocale(locale));

  const t = (key: string) => intl.formatMessage({ id: key });

  const amount = parseFloat(state.buyAmount) || 0;
  const selectedAssets = ASSET_CATEGORIES[state.selectedCategory];
  const currentAsset = selectedAssets.find((a) => a.symbol === state.selectedAsset) || selectedAssets[0];

  const fees = useMemo(
    () => calculateBuyFees(amount, currentAsset?.symbol || 'BTC'),
    [amount, currentAsset?.symbol],
  );

  const insufficientFunds = checkInsufficientFunds(
    amount, fees.totalFees, fees.feeItems.diboas.amount, state.cashBalance, state.solBalance,
  );

  // Calculate crypto quantity from net amount
  const cryptoQuantity = useMemo(() => {
    if (fees.netAmount <= 0 || !currentAsset?.price) return 0;
    return fees.netAmount / currentAsset.price;
  }, [fees.netAmount, currentAsset?.price]);

  const handleCategoryChange = useCallback(
    (category: AssetCategory) => {
      analyticsService.track({ name: 'pre_demo_buy_category_change', parameters: { category } });
      dispatch({ type: 'SET_SELECTED_CATEGORY', category });
      const assets = ASSET_CATEGORIES[category];
      const enabledAsset = assets.find((a) => isAssetEnabled(a.symbol));
      dispatch({ type: 'SET_SELECTED_ASSET', asset: enabledAsset?.symbol || assets[0].symbol });
    },
    [dispatch],
  );

  const handleAssetSelect = useCallback(
    (asset: Asset) => {
      if (!isAssetEnabled(asset.symbol)) return;
      analyticsService.track({ name: 'pre_demo_buy_asset_select', parameters: { asset: asset.symbol } });
      dispatch({ type: 'SET_SELECTED_ASSET', asset: asset.symbol });
    },
    [dispatch],
  );

  const handleAmountChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^0-9.]/g, '');
      dispatch({ type: 'SET_BUY_AMOUNT', amount: sanitized });
    },
    [dispatch],
  );

  const handleQuickAmount = useCallback(
    (quickAmount: string) => {
      analyticsService.track({ name: 'pre_demo_buy_quick_amount', parameters: { amount: quickAmount } });
      dispatch({ type: 'SET_BUY_AMOUNT', amount: quickAmount });
    },
    [dispatch],
  );

  const handleProceed = useCallback(() => {
    if (amount <= 0 || insufficientFunds || !isAssetEnabled(currentAsset.symbol)) return;

    dispatch({
      type: 'SET_PENDING_TRANSACTION',
      transaction: {
        type: 'buy',
        grossAmount: amount,
        netAmount: fees.netAmount,
        totalFees: fees.totalFees,
        fees: fees.feeItems,
        asset: {
          symbol: currentAsset.symbol,
          name: currentAsset.name,
          price: currentAsset.price,
        },
      },
    });

    setScreen('buy-confirm');
  }, [amount, insufficientFunds, currentAsset, fees, dispatch, setScreen]);

  return (
    <div className={styles.screen}>
      <DemoHeader />

      <div className={styles.screenContent}>
        {/* Back button */}
        <button
          onClick={() => setScreen('home')}
          className={styles.backButton}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('preDemo.common.back')}
        </button>

        {/* Compact balance card */}
        <div className={styles.compactCard}>
          <BalanceCard compact showTapToView={false} />
        </div>

        {/* Category label */}
        <div className={styles.fieldLabel}>
          {t('preDemo.buy.categoryLabel')}
        </div>

        {/* Category tabs */}
        <div className={styles.categoryTabs}>
          {CATEGORY_LIST.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`${styles.categoryTab} ${
                state.selectedCategory === category ? styles.categoryTabActive : ''
              }`}
            >
              {t(CATEGORY_I18N[category])}
            </button>
          ))}
        </div>

        {/* Select Asset label */}
        <div className={styles.fieldLabel}>
          {t('preDemo.buy.selectAsset')}
        </div>

        {/* Asset list */}
        <div className={styles.assetList}>
          {selectedAssets.map((asset) => {
            const enabled = isAssetEnabled(asset.symbol);
            const selected = state.selectedAsset === asset.symbol;

            return (
              <button
                key={asset.symbol}
                onClick={() => handleAssetSelect(asset)}
                disabled={!enabled}
                className={`${styles.assetItem} ${
                  selected ? styles.assetItemSelected : ''
                } ${!enabled ? styles.assetItemDisabled : ''}`}
              >
                <div className={styles.assetInfoRow}>
                  <AssetIcon symbol={asset.symbol} />
                  <div className={styles.assetInfo}>
                    <span className={styles.assetSymbol}>{asset.symbol}</span>
                    <span className={styles.assetName}>{asset.name}</span>
                  </div>
                </div>
                <div className={styles.assetPrice}>
                  {enabled ? (
                    formatCurrency(asset.price, 2, locale)
                  ) : (
                    <span className={styles.comingSoon}>
                      {t('preDemo.buy.comingSoon')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Amount input */}
        {isAssetEnabled(currentAsset.symbol) && (
          <>
            {/* Amount to Buy label */}
            <div className={styles.fieldLabel}>
              {t('preDemo.buy.amountLabel')}
            </div>

            <div className={styles.amountInputContainer}>
              <span className={styles.amountPrefix}>{currencySymbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={state.buyAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className={styles.amountInput}
                aria-label={t('preDemo.buy.amountLabel')}
              />
            </div>

            {/* Insufficient funds warning */}
            {insufficientFunds && amount > 0 && (
              <div className={styles.warningBanner}>
                {t('preDemo.buy.insufficientFunds')}
              </div>
            )}

            {/* Quick amounts */}
            <div className={styles.quickAmounts}>
              {BUY_QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa}
                  onClick={() => handleQuickAmount(qa)}
                  className={`${styles.quickAmountButton} ${
                    state.buyAmount === qa ? styles.quickAmountActive : ''
                  }`}
                >
                  {currencySymbol}{qa}
                </button>
              ))}
            </div>

            {/* Fee breakdown */}
            {amount > 0 && !insufficientFunds && (
              <FeeBreakdown feeItems={fees.feeItems} totalFees={fees.totalFees} />
            )}

            {/* You'll receive — crypto format */}
            {amount > 0 && !insufficientFunds && cryptoQuantity > 0 && (
              <div className={styles.receiveRow}>
                <span className={styles.receiveLabel}>{t('preDemo.transaction.youllReceive')}</span>
                <div style={{ textAlign: 'right' }}>
                  <span className={styles.receiveAmount}>
                    {cryptoQuantity.toFixed(8)} {currentAsset.symbol}
                  </span>
                  <br />
                  <span className={styles.receiveAmountSub}>
                    {t('preDemo.transaction.approximate')} {formatCurrency(fees.netAmount, 2, locale)}
                  </span>
                </div>
              </div>
            )}

            {/* Proceed button */}
            <button
              onClick={handleProceed}
              disabled={amount <= 0 || insufficientFunds}
              className={styles.primaryButton}
            >
              {t('preDemo.buy.proceed')}
            </button>
          </>
        )}
      </div>

      <DemoFooter />
    </div>
  );
}
