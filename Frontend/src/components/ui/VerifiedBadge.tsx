import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <BadgeCheck
      size={size}
      style={{ color: '#3b82f6', flexShrink: 0 }}
      aria-label="Verified"
    />
  );
}
