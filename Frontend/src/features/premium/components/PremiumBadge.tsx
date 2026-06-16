export function PremiumBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className="inline-flex items-center gap-1 font-bold rounded-full"
      style={{
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#fff',
        fontSize: size === 'sm' ? 10 : 12,
        padding: size === 'sm' ? '2px 7px' : '3px 10px',
        letterSpacing: '0.03em',
      }}
    >
      ✦ Premium
    </span>
  );
}
