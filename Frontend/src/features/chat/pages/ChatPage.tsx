import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Search, Users } from 'lucide-react';
import { useChatApi } from '../api/chat.api';
import { useApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth';
import type { Conversation } from '../types';
import { ConversationList } from '../components/ConversationList';
import { MessageThread } from '../components/MessageThread';
import { Navbar } from '../../../components/layout/Navbar.tsx';

interface UserSearchResult {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export function ChatPage() {
  const chatApi = useChatApi();
  const api = useApi();
  const qc = useQueryClient();

  const user = useAuthStore(s => s.user);
  const myId = user?._id;

  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
    refetchInterval: 30_000,
  });

  const createPrivate = useMutation({
    mutationFn: (recipientId: string) => chatApi.createPrivateChat(recipientId),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConv(conv);
      setShowNewChat(false);
      setSearchQ('');
      setSearchResults([]);
    },
  });

  async function handleSearch(q: string) {
    setSearchQ(q);
    if (q.trim().length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
    <Navbar />
    <div
      className="flex flex-1"
      style={{ height: 'calc(100vh - 64px)', background: 'var(--bg)' }}
    >
      {/* Sidebar */}
      <aside
        className="w-80 flex-shrink-0 flex flex-col"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="font-bold text-base" style={{ color: 'var(--text-h)' }}>Messages</h2>
          </div>
          <button
            onClick={() => setShowNewChat(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)' }}
            title="New chat"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* New chat search */}
        {showNewChat && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)' }}>
              <Search size={14} style={{ color: 'var(--text)' }} />
              <input
                autoFocus
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search users…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-h)' }}
              />
            </div>
            {searching && (
              <p className="text-xs mt-2 px-1" style={{ color: 'var(--text)' }}>Searching…</p>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 flex flex-col gap-0.5">
                {searchResults.map(u => (
                  <button
                    key={u._id}
                    onClick={() => createPrivate.mutate(u._id)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors w-full"
                    style={{ color: 'var(--text-h)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
                    >
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : u.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.display_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>@{u.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!searching && searchQ && searchResults.length === 0 && (
              <p className="text-xs mt-2 px-1" style={{ color: 'var(--text)' }}>No users found</p>
            )}
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoading
            ? <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>Loading…</p>
            : <ConversationList
                conversations={conversations}
                activeId={activeConv?._id}
                onSelect={setActiveConv}
              />
          }
        </div>
      </aside>

      {/* Main thread area */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeConv ? (
          <>
            {/* Thread header */}
            <div
              className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              {activeConv.type === 'group'
                ? <Users size={16} style={{ color: 'var(--color-primary)' }} />
                : null}
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>
                  {activeConv.type === 'group'
                    ? activeConv.name
                    : activeConv.participants.find(p => p._id !== myId)?.display_name
                      ?? activeConv.participants[0]?.display_name}
                </p>
                {activeConv.type === 'group' && (
                  <p className="text-xs" style={{ color: 'var(--text)' }}>
                    {activeConv.participants.length} members
                  </p>
                )}
              </div>
            </div>
            <MessageThread key={activeConv._id} conversation={activeConv} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <MessageSquare size={40} style={{ color: 'var(--border)' }} />
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Select a conversation or start a new one
            </p>
          </div>
        )}
      </main>
    </div>
    </div>
  );
}
