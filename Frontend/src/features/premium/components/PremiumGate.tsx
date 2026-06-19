import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { effectivePremium } from '../../../lib/featureFlags.ts';

interface Props {
  isPremium: boolean;
  children: React.ReactNode;
  message?: string;
}

export function PremiumGate({ isPremium, children, message = 'This feature is available for Premium members.' }: Props) {
  if (effectivePremium(isPremium)) return <>{children}</>;

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(2px)' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-bg)' }}>
          <Lock size={20} style={{ color: 'var(--color-primary)' }} />
        </div>
        <p className="text-sm text-center font-semibold" style={{ color: 'var(--text-h)' }}>{message}</p>
        <Link
          to="/pricing"
          className="text-sm font-bold px-5 py-2 rounded-xl"
          style={{ background: 'var(--color-primary)', color: '#fff', textDecoration: 'none' }}
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  );
}
