import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UpgradeCTA({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), #a855f7)', color: '#fff', textDecoration: 'none' }}
      >
        <Sparkles size={14} />
        Upgrade
      </Link>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
      style={{ background: 'linear-gradient(135deg, var(--accent-bg), #f5f3ff)', border: '1px solid var(--accent-border)' }}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
        <Sparkles size={22} color="#fff" />
      </div>
      <h3 className="font-bold text-lg" style={{ color: 'var(--text-h)' }}>Go Premium</h3>
      <p className="text-sm" style={{ color: 'var(--text)' }}>
        Unlock memory photos, full analytics, profile viewers, and more.
      </p>
      <Link
        to="/pricing"
        className="font-bold px-6 py-2.5 rounded-xl transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-primary)', color: '#fff', textDecoration: 'none' }}
      >
        See Plans
      </Link>
    </div>
  );
}
