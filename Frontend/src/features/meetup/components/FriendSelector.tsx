import { useQuery } from '@tanstack/react-query';
import { useFriendsApi } from '../../friends/api/friends.api.ts';

interface FriendSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function FriendSelector({ selected, onChange }: FriendSelectorProps) {
  const friendsApi = useFriendsApi();
  const { data: apiFriends = [], isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => friendsApi.getFriends(),
    staleTime: 60_000,
  });

  const friends = apiFriends.map(f => ({
    id: f.friend._id,
    displayName: f.friend.display_name || f.friend.username,
    username: f.friend.username,
    avatarUrl: f.friend.avatar_url || `https://i.pravatar.cc/150?u=${f.friend.username}`,
  }));

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <section aria-labelledby="with-whom-heading">
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="with-whom-heading" className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
            👥 With Whom?
          </h3>
          {selected.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
            >
              {selected.length} selected
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5 animate-pulse">
                <div className="h-9 w-9 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-neutral)' }} />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 rounded" style={{ backgroundColor: 'var(--color-neutral)', width: '60%' }} />
                  <div className="h-2.5 rounded" style={{ backgroundColor: 'var(--color-neutral)', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>Add friends first to invite them.</p>
        ) : (
          <ul className="flex flex-col gap-1" role="list">
            {friends.map(friend => {
              const isSelected = selected.includes(friend.id);
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => toggle(friend.id)}
                    aria-label={isSelected ? `Remove ${friend.displayName}` : `Add ${friend.displayName}`}
                    aria-pressed={isSelected}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-bg)' : 'transparent',
                      border: isSelected ? '1.5px solid var(--color-primary-light)' : '1.5px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.avatarUrl}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                        width={36} height={36}
                        loading="lazy"
                        aria-hidden="true"
                      />
                      <div className="text-left">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{friend.displayName}</p>
                        <p className="text-xs" style={{ color: 'var(--text)' }}>@{friend.username}</p>
                      </div>
                    </div>
                    {/* Checkbox */}
                    <span
                      className="h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                      style={isSelected
                        ? { backgroundColor: 'var(--color-primary)', border: '2px solid var(--color-primary)' }
                        : { backgroundColor: 'transparent', border: '2px solid var(--border)' }
                      }
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
