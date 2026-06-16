export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex gap-1 items-center px-3 py-2 rounded-2xl" style={{ background: 'var(--color-tertiary)' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              background: 'var(--color-primary)',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
