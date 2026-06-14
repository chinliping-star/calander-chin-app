import { X, Plus } from 'lucide-react';
import type { InvitableFriend } from '../types.ts';

const AVAILABLE_FRIENDS: InvitableFriend[] = [
  { id: '1', displayName: 'Alex Rivera', username: 'alex.r', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
  { id: '2', displayName: 'Mia Thompson', username: 'mia.t', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
  { id: '3', displayName: 'Leo Sanchez', username: 'leo.s', avatarUrl: 'https://i.pravatar.cc/150?img=8' },
  { id: '4', displayName: 'Sarah Jenkins', username: 'sarah.j', avatarUrl: 'https://i.pravatar.cc/150?img=10' },
  { id: '5', displayName: 'Marcus Wei', username: 'marcus.w', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
];

interface InviteFriendsPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function InviteFriendsPicker({ selected, onChange }: InviteFriendsPickerProps) {
  const selectedFriends = AVAILABLE_FRIENDS.filter((f) => selected.includes(f.id));
  const unselectedFriends = AVAILABLE_FRIENDS.filter((f) => !selected.includes(f.id));

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function selectAll() {
    onChange(AVAILABLE_FRIENDS.map((f) => f.id));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Label + select all */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
          Invite Friends
        </label>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 rounded"
          style={{ color: 'var(--color-primary)' }}
        >
          Select All
        </button>
      </div>

      {/* Selected pills */}
      <div className="flex flex-wrap gap-2" aria-label="Selected friends">
        {selectedFriends.map((friend) => (
          <span
            key={friend.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'rgba(255,127,177,0.12)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(255,127,177,0.3)',
            }}
          >
            {friend.displayName}
            <button
              type="button"
              aria-label={`Remove ${friend.displayName}`}
              onClick={() => toggle(friend.id)}
              className="focus-visible:outline-none focus-visible:ring-1 rounded-full hover:opacity-70"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Add friend dashed pill */}
        <button
          type="button"
          aria-label="Add a friend"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{
            border: '1.5px dashed var(--border)',
            color: 'var(--text)',
            backgroundColor: 'transparent',
          }}
        >
          <Plus size={12} />
          Add Friend
        </button>
      </div>

      {/* Avatar row of available friends */}
      {unselectedFriends.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" aria-label="Available friends to invite">
          {unselectedFriends.map((friend) => (
            <button
              key={friend.id}
              type="button"
              onClick={() => toggle(friend.id)}
              aria-label={`Invite ${friend.displayName}`}
              title={friend.displayName}
              className="relative focus-visible:outline-none focus-visible:ring-2 rounded-full hover:opacity-80 transition-opacity"
            >
              <img
                src={friend.avatarUrl}
                alt={friend.displayName}
                className="h-9 w-9 rounded-full object-cover border-2"
                width={36}
                height={36}
                loading="lazy"
                style={{ borderColor: 'var(--border)' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
