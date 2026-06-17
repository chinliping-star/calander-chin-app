import { cn } from '../../lib/utils.ts';

interface Props {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  style?: React.CSSProperties;
}

export function Skeleton({ className, width, height, rounded = 'lg', style }: Props) {
  return (
    <div
      className={cn('animate-pulse', `rounded-${rounded}`, className)}
      style={{
        background: 'linear-gradient(90deg, var(--color-neutral) 25%, var(--border) 50%, var(--color-neutral) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease-in-out infinite',
        width,
        height,
        ...style,
      }}
    />
  );
}

// Inject keyframe once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-kf')) {
  const s = document.createElement('style');
  s.id = 'skeleton-kf';
  s.textContent = `@keyframes skeletonShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
  document.head.appendChild(s);
}
