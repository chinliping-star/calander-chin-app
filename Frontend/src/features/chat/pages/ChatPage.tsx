import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search, Users, Calendar, CalendarClock, SquarePen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChatApi } from '../api/chat.api';
import { useApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth';
import type { Conversation } from '../types';
import { ConversationList } from '../components/ConversationList';
import { MessageThread } from '../components/MessageThread';
import { ChatDetailsPanel } from '../components/ChatDetailsPanel';
import { PresenceDot } from '../components/PresenceDot';
import { usePresenceContext } from '../context/presence';
import { getPeer } from '../utils';
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

  const { onlineUsers } = usePresenceContext();

  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [filterText, setFilterText] = useState('');

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

  // Filter conversations by the search text.
  const visibleConvs = conversations.filter(c => {
    const peer = getPeer(c, user);
    const name = c.type === 'group'
      ? (c.name ?? '')
      : (peer?.display_name ?? peer?.username ?? '');
    return name.toLowerCase().includes(filterText.toLowerCase());
  });

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg)' }}>
    {/* Hide nav on mobile when a chat thread is open (full-screen conversation) */}
    <div className={activeConv ? 'hidden md:contents' : 'contents'}>
      <Navbar />
    </div>
    <div
      className="flex flex-1 min-h-0"
      style={{ background: 'var(--bg)' }}
    >
      {/* Sidebar (full-width on mobile; hidden on mobile once a chat is open) */}
      <aside
        className={`${activeConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col min-h-0`}
        style={{ borderRight: '1px solid var(--border)' }}
      >
        {/* Title + new chat */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>Messages</h1>
          <button
            onClick={() => setShowNewChat(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--color-primary)' }}
            title="New chat"
          >
            <SquarePen size={18} />
          </button>
        </div>

        {/* Filter search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)' }}>
            <Search size={15} style={{ color: 'var(--text)' }} />
            <input
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search friends or messages"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-h)' }}
            />
          </div>
        </div>

        {/* Desktop section nav */}
        <nav
          className="hidden md:grid grid-cols-4 px-2 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
          aria-label="Sections"
        >
          {[
            { to: user?.username ? `/${user.username}/calendar` : '/chat', Icon: Calendar, label: 'CAL', active: false },
            { to: '/meetups/new', Icon: CalendarClock, label: 'EVENTS', active: false },
            { to: '/friends', Icon: Users, label: 'FRIENDS', active: false },
            { to: '/chat', Icon: MessageSquare, label: 'CHATS', active: true },
          ].map(({ to, Icon, label, active }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
              style={{ color: active ? 'var(--color-primary)' : 'var(--text)' }}
            >
              <Icon size={20} strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>

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
          {isLoading ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>Loading…</p>
          ) : (
            <ConversationList
              conversations={visibleConvs}
              activeId={activeConv?._id}
              onSelect={setActiveConv}
              onlineUsers={onlineUsers}
            />
          )}
        </div>
      </aside>

      {/* Main thread area (full-screen on mobile; hidden on mobile when no chat) */}
      <main className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 min-h-0`}>
        {activeConv ? (
          <>
            {/* Thread header */}
            <div
              className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              {(() => {
                const isGroup = activeConv.type === 'group';
                const peer = getPeer(activeConv, user);
                const name = isGroup ? activeConv.name : (peer?.display_name ?? peer?.username);
                const avatar = isGroup ? activeConv.avatar_url : peer?.avatar_url;
                const online = !isGroup && !!peer && onlineUsers.has(peer._id);
                return (
                  <>
                    {/* Back (mobile only) */}
                    <button
                      onClick={() => setActiveConv(null)}
                      className="md:hidden -ml-1 mr-0.5 flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ color: 'var(--text-h)' }}
                      aria-label="Back to chats"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
                      >
                        {isGroup
                          ? <Users size={16} style={{ color: 'var(--color-primary)' }} />
                          : avatar
                            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                            : (name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      {!isGroup && (
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <PresenceDot online={online} size={11} />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: 'var(--text-h)' }}>{name}</p>
                      {isGroup ? (
                        <p className="text-xs" style={{ color: 'var(--text)' }}>
                          {activeConv.participants.length} members
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: 'var(--text)' }}>
                          {online
                            ? <span style={{ color: '#16a34a' }}>● Online</span>
                            : `It's ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} for your connection`}
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <MessageThread conversation={activeConv} />
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

      {/* Details panel */}
      {activeConv && (
        <ChatDetailsPanel conversation={activeConv} onlineUsers={onlineUsers} />
      )}
    </div>
    </div>
  );
}
