import { X } from 'lucide-react';
import type { InvitableFriend } from '../types.ts';

const ALL_FRIENDS: InvitableFriend[] = [
  { id: '1', displayName: 'Alex Rivera', username: 'alex.r', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
  { id: '2', displayName: 'Sarah Chen', username: 'sarah.chen', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
  { id: '3', displayName: 'Jordan Smith', username: 'jord.smith', avatarUrl: 'https://i.pravatar.cc/150?img=8' },
  { id: '4', displayName: 'Elena Rodriguez', username: 'elena_rod', avatarUrl: 'https://i.pravatar.cc/150?img=25' },
];

interface FriendSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function FriendSelector({ selected, onChange }: FriendSelectorProps) {
  const selectedFriends = ALL_FRIENDS.filter((f) => selected.includes(f.id));
  const unselectedFriends = ALL_FRIENDS.filter((f) => !selected.includes(f.id));

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <section aria-labelledby="with-whom-heading">
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 id="with-whom-heading" className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
            👥 With Whom?
          </h3>
          {selectedFriends.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
              aria-live="polite"
              aria-label={`${selectedFriends.length} friends selected`}
            >
              {selectedFriends.length} Selected
            </span>
          )}
        </div>

        {/* Selected pills */}
        {selectedFriends.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4" aria-label="Selected friends">
            {selectedFriends.map((friend) => (
              <span
                key={friend.id}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <img
                  src={friend.avatarUrl}
                  alt=""
                  className="h-4 w-4 rounded-full object-cover"
                  width={16}
                  height={16}
                  aria-hidden="true"
                />
                {friend.displayName}
                <button
                  type="button"
                  aria-label={`Remove ${friend.displayName}`}
                  onClick={() => toggle(friend.id)}
                  className="hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 rounded-full"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Unselected list */}
        {unselectedFriends.length > 0 && (
          <ul className="flex flex-col gap-1" role="list" aria-label="Friends you can invite">
            {unselectedFriends.map((friend) => (
              <li key={friend.id}>
                <button
                  type="button"
                  onClick={() => toggle(friend.id)}
                  aria-label={`Add ${friend.displayName}`}
                  className="w-full flex items-center justify-between gap-3 px-2 py-2.5 rounded-xl hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={friend.avatarUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                      width={36}
                      height={36}
                      loading="lazy"
                      aria-hidden="true"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
                        {friend.displayName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                  {/* Circle checkbox */}
                  <span
                    className="h-5 w-5 rounded-full flex-shrink-0 border-2"
                    style={{ borderColor: 'var(--border)' }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
