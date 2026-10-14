import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { useCoinsApi } from '../api/coins.api.ts';

/** Navbar chip: current coin balance, links to the coins card in Settings. */
export function CoinBalance() {
  const api = useCoinsApi();
  const { data } = useQuery({ queryKey: ['coins'], queryFn: () => api.getMine(), staleTime: 60_000 });
  if (!data) return null;
  return (
    <Link
      to="/settings?section=subscription"
      aria-label={`${data.balance} coins`}
      title="Your coins"
      className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
      style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
    >
      <Coins size={15} aria-hidden="true" />
      {data.balance.toLocaleString()}
    </Link>
  );
}
