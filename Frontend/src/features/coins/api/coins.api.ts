import { useApi } from '../../../lib/api.ts';

export type CoinRewardId = 'premium_month';

export interface CoinTx {
  _id: string;
  amount: number;
  reason: 'friend_added' | 'post_created' | 'post_photo' | 'memory_photo' | 'redeem_premium' | 'admin_adjust';
  note?: string;
  created_at: string;
}

export interface CoinsSummary {
  balance: number;
  premium_until: string | null;
  rules: Record<'friend_added' | 'post_created' | 'post_photo' | 'memory_photo', number>;
  daily_cap: number;
  rewards: Record<CoinRewardId, { cost: number; days: number; label: string }>;
  history: CoinTx[];
}

export function useCoinsApi() {
  const api = useApi();
  return {
    getMine: () => api.get<CoinsSummary>('/coins/me'),
    redeem: (reward: CoinRewardId) =>
      api.post<{ balance: number; premium_until: string }>('/coins/redeem', { reward }),
  };
}

export const REASON_LABEL: Record<CoinTx['reason'], string> = {
  friend_added: 'New friend',
  post_created: 'Diary post',
  post_photo: 'Post with a picture',
  memory_photo: 'Memory photo',
  redeem_premium: 'Bought Premium',
  admin_adjust: 'Adjusted by Friendiary',
};
