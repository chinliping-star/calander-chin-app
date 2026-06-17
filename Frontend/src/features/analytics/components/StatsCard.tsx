interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export function StatsCard({ label, value, sub, icon, accent }: Props) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{
        background: accent ? 'var(--color-primary)' : 'var(--bg)',
        border: accent ? 'none' : '1px solid var(--border)',
      }}
    >
      {icon && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent ? 'rgba(255,255,255,0.2)' : 'var(--accent-bg)' }}>
          <span style={{ color: accent ? '#fff' : 'var(--color-primary)' }}>{icon}</span>
        </div>
      )}
      <p className="text-3xl font-bold" style={{ color: accent ? '#fff' : 'var(--text-h)' }}>
        {value}
      </p>
      <p className="text-sm font-semibold" style={{ color: accent ? 'rgba(255,255,255,0.8)' : 'var(--text-h)' }}>
        {label}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--text)' }}>{sub}</p>
      )}
    </div>
  );
}
