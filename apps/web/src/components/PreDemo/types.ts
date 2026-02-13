/**
 * PreDemo Component Types
 *
 * State management types for the interactive demo flow
 */

import type {
  PreDemoScreen,
  AssetCategory,
  PendingTransaction,
  Transaction,
  CompletedSteps,
  Investments,
} from '@/lib/pre-demo';

/** PreDemo component state */
export interface PreDemoState {
  screen: PreDemoScreen;
  cashBalance: number;
  solBalance: number;
  investments: Investments;
  transactions: Transaction[];
  completedSteps: CompletedSteps;
  pendingTransaction: PendingTransaction | null;
  termsAccepted: boolean;
  // Deposit state
  depositAmount: string;
  // Send state
  sendAmount: string;
  selectedRecipient: string;
  // Buy state
  buyAmount: string;
  selectedCategory: AssetCategory;
  selectedAsset: string;
  // Fee expansion toggles
  feesExpanded: boolean;
  // Wallet state
  copiedAddress: string | null;
}

/** PreDemo reducer actions */
export type PreDemoAction =
  | { type: 'SET_SCREEN'; screen: PreDemoScreen }
  | { type: 'SET_DEPOSIT_AMOUNT'; amount: string }
  | { type: 'SET_SEND_AMOUNT'; amount: string }
  | { type: 'SET_SELECTED_RECIPIENT'; recipient: string }
  | { type: 'SET_BUY_AMOUNT'; amount: string }
  | { type: 'SET_SELECTED_CATEGORY'; category: AssetCategory }
  | { type: 'SET_SELECTED_ASSET'; asset: string }
  | { type: 'SET_PENDING_TRANSACTION'; transaction: PendingTransaction }
  | { type: 'SET_TERMS_ACCEPTED'; accepted: boolean }
  | { type: 'TOGGLE_FEES_EXPANDED' }
  | { type: 'COMPLETE_DEPOSIT'; netAmount: number; grossAmount: number; totalFees: number; feeDetails: Record<string, import('@/lib/pre-demo').FeeItem> }
  | { type: 'COMPLETE_SEND'; grossAmount: number; netAmount: number; totalFees: number; recipient: string; feeDetails: Record<string, import('@/lib/pre-demo').FeeItem> }
  | { type: 'COMPLETE_BUY'; grossAmount: number; netAmount: number; totalFees: number; asset: { symbol: string; name: string }; feeDetails: Record<string, import('@/lib/pre-demo').FeeItem> }
  | { type: 'SET_COPIED_ADDRESS'; chain: string | null }
  | { type: 'CLEAR_PENDING' };

/** PreDemo context value */
export interface PreDemoContextValue {
  state: PreDemoState;
  dispatch: React.Dispatch<PreDemoAction>;
  setScreen: (screen: PreDemoScreen) => void;
  onExit?: () => void;
}
