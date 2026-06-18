interface Props {
  online: boolean;
  /** dot diameter in px */
  size?: number;
  /** ring color matching the surface the dot sits on */
  ringColor?: string;
  className?: string;
}

/**
 * Small status dot: green when online, gray when offline.
 * Designed to be absolutely positioned over an avatar's bottom-right.
 */
export function PresenceDot({ online, size = 12, ringColor = 'var(--bg)', className }: Props) {
  return (
    <span
      className={className}
      role="img"
      aria-label={online ? 'Online' : 'Offline'}
      title={online ? 'Online' : 'Offline'}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        background: online ? '#22c55e' : '#9ca3af',
        boxShadow: `0 0 0 2px ${ringColor}`,
        display: 'inline-block',
      }}
    />
  );
}
