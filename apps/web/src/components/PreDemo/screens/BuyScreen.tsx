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
  processBuy,
  isAssetEnabled,
  formatCurrency,
  type AssetCategory,
  type Asset,
} from '@/lib/pre-demo';
import { useLocale } from '@/components/Providers';
import { getCurrencyForLocale, getCurrencySymbol } from '@/config/formats';
import { analyticsService } from '@/lib/analytics';
import { AssetIcon } from './AssetIcon';
import styles from '../PreDemo.module.css';

const CATEGORY_LIST: AssetCategory[] = ['ETFs', 'Stocks', 'Crypto', 'Gold'];

const CATEGORY_I18N: Record<AssetCategory, string> = {
  ETFs: 'preDemo.buy.categoryETFs',
  Stocks: 'preDemo.buy.categoryStocks',
  Crypto: 'preDemo.buy.categoryCrypto',
  Gold: 'preDemo.buy.categoryGold',
};

export function BuyScreen() {
  const intl = useTranslation();
  const { state, dispatch, setScreen } = usePreDemo();

  const { locale } = useLocale();
  const currencySymbol = getCurrencySymbol(getCurrencyForLocale(locale));

  const t = (key: string) => intl.formatMessage({ id: key });

  const amount = parseFloat(state.buyAmount) || 0;
  const selectedAssets = ASSET_CATEGORIES[state.selectedCategory];
  const currentAsset = selectedAssets.find((a) => a.symbol === state.selectedAsset) || selectedAssets[0];

  const buyResult = useMemo(
    () => processBuy(amount, currentAsset, state.cashBalance, state.solBalance),
    [amount, currentAsset, state.cashBalance, state.solBalance],
  );
  const insufficientFunds = buyResult.errorCode === 'INSUFFICIENT_FUNDS';

  // Calculate crypto quantity from net amount
  const cryptoQuantity = useMemo(() => {
    if (buyResult.pending.netAmount <= 0 || !currentAsset?.price) return 0;
    return buyResult.pending.netAmount / currentAsset.price;
  }, [buyResult.pending.netAmount, currentAsset?.price]);

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
    if (!buyResult.isValid) return;

    dispatch({
      type: 'SET_PENDING_TRANSACTION',
      transaction: buyResult.pending,
    });

    setScreen('buy-confirm');
  }, [buyResult, dispatch, setScreen]);

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
              <FeeBreakdown feeItems={buyResult.pending.fees} totalFees={buyResult.pending.totalFees} />
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
                    {t('preDemo.transaction.approximate')} {formatCurrency(buyResult.pending.netAmount, 2, locale)}
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
