import { Globe, Users, Lock } from 'lucide-react';
import type { PostPrivacy } from '../types';

const CONFIG: Record<PostPrivacy, { Icon: React.ElementType; label: string; color: string }> = {
  public:  { Icon: Globe,  label: 'Public',       color: '#16a34a' },
  friends: { Icon: Users,  label: 'Friends',       color: 'var(--color-primary)' },
  private: { Icon: Lock,   label: 'Private',       color: 'var(--text)' },
};

export function PostPrivacyBadge({ privacy }: { privacy: PostPrivacy }) {
  const { Icon, label, color } = CONFIG[privacy];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Icon size={11} />
      {label}
    </span>
  );
}
