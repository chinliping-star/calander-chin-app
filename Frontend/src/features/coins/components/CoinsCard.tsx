import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, Loader2, UserPlus, PenLine, ImageIcon, Camera } from 'lucide-react';
import { useCoinsApi, REASON_LABEL, type CoinRewardId } from '../api/coins.api.ts';
import { useAuthStore } from '../../../store/auth.ts';

/** Settings → Subscription: coin balance, how to earn, buy Premium with coins. */
export function CoinsCard() {
  const api = useCoinsApi();
  const qc = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);
  const { data, isLoading, isError } = useQuery({ queryKey: ['coins'], queryFn: () => api.getMine(), staleTime: 15_000 });

  const redeem = useMutation({
    mutationFn: (r: CoinRewardId) => api.redeem(r),
    onSuccess: () => {
      updateUser({ is_premium: true });
      qc.invalidateQueries({ queryKey: ['coins'] });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>;
  }
  if (isError || !data) {
    return <p className="text-sm" style={{ color: 'var(--text)' }}>Could not load your coins right now.</p>;
  }

  const earn = [
    { icon: <UserPlus size={15} />, label: 'Make a new friend', coins: data.rules.friend_added, note: 'you both get coins' },
    { icon: <PenLine size={15} />, label: 'Write a diary post', coins: data.rules.post_created },
    { icon: <ImageIcon size={15} />, label: 'Post a picture', coins: data.rules.post_photo },
    { icon: <Camera size={15} />, label: 'Add a memory photo', coins: data.rules.memory_photo },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#f59e0b' }}>
          <Coins size={20} color="#fff" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-black leading-none" style={{ color: '#78350f' }}>{data.balance.toLocaleString()}</p>
          <p className="text-xs font-semibold" style={{ color: '#92400e' }}>coins</p>
        </div>
        {data.premium_until && (
          <p className="ml-auto text-xs text-right" style={{ color: '#92400e' }}>
            Premium (coins) until<br /><strong>{new Date(data.premium_until).toLocaleDateString()}</strong>
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text)' }}>How to earn</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {earn.map(e => (
            <li key={e.label} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}>
              <span style={{ color: 'var(--color-primary)' }} aria-hidden="true">{e.icon}</span>
              <span className="flex-1">{e.label}{e.note && <span className="block text-[10px]" style={{ color: 'var(--text)' }}>{e.note}</span>}</span>
              <span className="font-bold" style={{ color: '#b45309' }}>+{e.coins}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] mt-2" style={{ color: 'var(--text)' }}>
          Posts and photos earn coins up to {data.daily_cap} times a day each.
        </p>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text)' }}>Spend coins</p>
        {(Object.entries(data.rewards) as [CoinRewardId, { cost: number; label: string }][]).map(([id, r]) => {
          const short = data.balance < r.cost;
          return (
            <div key={id} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ background: 'var(--color-neutral)', border: '1px solid var(--border)' }}>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{r.label}</p>
                <p className="text-xs" style={{ color: 'var(--text)' }}>
                  {r.cost} coins{short ? ` · ${r.cost - data.balance} more to go` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => redeem.mutate(id)}
                disabled={short || redeem.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
              >
                {redeem.isPending ? 'Buying…' : 'Buy'}
              </button>
            </div>
          );
        })}
        {redeem.isError && <p role="alert" className="text-sm mt-2" style={{ color: '#dc2626' }}>{(redeem.error as Error).message}</p>}
        {redeem.isSuccess && <p role="status" className="text-sm mt-2" style={{ color: '#059669' }}>Premium unlocked — enjoy!</p>}
      </div>

      {data.history.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text)' }}>Recent</p>
          <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
            {data.history.slice(0, 10).map(t => (
              <li key={t._id} className="flex items-center justify-between py-2 text-sm">
                <span style={{ color: 'var(--text-h)' }}>
                  {REASON_LABEL[t.reason]}{t.note && t.reason === 'admin_adjust' ? ` — ${t.note}` : ''}
                  <span className="block text-[11px]" style={{ color: 'var(--text)' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                </span>
                <span className="font-bold" style={{ color: t.amount > 0 ? '#059669' : '#dc2626' }}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
