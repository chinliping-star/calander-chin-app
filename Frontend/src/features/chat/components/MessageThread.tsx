import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { useChatApi } from '../api/chat.api';
import { useChat } from '../hooks/useChat';
import { useAuthStore } from '../../../store/auth';
import type { Message, Conversation } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { isSameDay, isToday, isYesterday, format } from 'date-fns';

interface Props {
  conversation: Conversation;
}

function DateDivider({ date }: { date: string }) {
  const d = new Date(date);
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d, yyyy');
  return (
    <div className="flex justify-center my-1">
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: 'var(--color-neutral)', color: 'var(--text)', border: '1px solid var(--border)' }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

export function MessageThread({ conversation }: Props) {
  const chatApi = useChatApi();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const myId = user?._id;

  const bottomRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [editState, setEditState] = useState<{ messageId: string; content: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const markSeenRef = useRef<((convId: string, msgId: string) => void) | null>(null);

  const convId = conversation._id;

  // Reset transient per-conversation UI state when switching chats (no remount).
  useEffect(() => {
    setTypingUsers(new Set());
    setEditState(null);
    setSendError(null);
  }, [convId]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', convId],
    queryFn: () => chatApi.getMessages(convId),
    enabled: !!convId,
    staleTime: 0,
  });

  // Opening a conversation marks it read server-side — refresh the unread badge
  // and conversation list so they sync immediately.
  useEffect(() => {
    if (isLoading) return;
    qc.invalidateQueries({ queryKey: ['chat-unread'] });
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }, [convId, isLoading, qc]);

  const {
    isConnected,
    connectError,
    joinConversation,
    leaveConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    markSeen,
    sendTyping,
  } = useChat({
    onMessage: useCallback((msg: Message) => {
      if (msg.conversation_id !== convId) return;
      qc.setQueryData<Message[]>(['messages', convId], old => [...(old ?? []), msg]);
      if (document.hasFocus() && markSeenRef.current) {
        markSeenRef.current(convId, msg._id);
      }
    }, [convId, qc]),

    onMessageEdited: useCallback((msg: Message) => {
      if (msg.conversation_id !== convId) return;
      qc.setQueryData<Message[]>(['messages', convId], old =>
        (old ?? []).map(m => m._id === msg._id ? msg : m));
    }, [convId, qc]),

    onMessageDeleted: useCallback(({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      if (conversationId !== convId) return;
      qc.setQueryData<Message[]>(['messages', convId], old =>
        (old ?? []).filter(m => m._id !== messageId));
    }, [convId, qc]),

    onTyping: useCallback(({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (conversationId !== convId || userId === user?.clerk_id) return;
      setTypingUsers(prev => new Set([...prev, userId]));
      const existing = typingTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      typingTimers.current.set(userId, setTimeout(() => {
        setTypingUsers(set => { const n = new Set(set); n.delete(userId); return n; });
      }, 3000));
    }, [convId, user?.clerk_id]),

    onSeen: useCallback(({ conversationId }: { messageId: string; conversationId: string; seenBy: string }) => {
      if (conversationId !== convId) return;
      qc.setQueryData<Message[]>(['messages', convId], old => old ? [...old] : []);
    }, [convId, qc]),
  });

  markSeenRef.current = markSeen;

  // Join once connected. isConnected in deps so we re-join after a (re)connect —
  // otherwise a join emitted before the socket is ready is silently dropped and
  // the sender never receives its own message:new (needed a refresh).
  useEffect(() => {
    if (!isConnected) return;
    joinConversation(convId);
    return () => leaveConversation(convId);
  }, [convId, isConnected, joinConversation, leaveConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Grace-delay the offline banner so brief reconnects (e.g. switching chats)
  // don't flash a scary error for a few milliseconds.
  const [showOffline, setShowOffline] = useState(false);
  useEffect(() => {
    const offline = !isConnected || !!connectError;
    if (!offline) { setShowOffline(false); return; }
    const t = setTimeout(() => setShowOffline(true), 1500);
    return () => clearTimeout(t);
  }, [isConnected, connectError]);

  const handleSend = (content: string) => {
    setSendError(null);
    if (editState) {
      const ok = editMessage(editState.messageId, content);
      if (!ok) {
        setSendError('Chat is offline — message not sent.');
        return;
      }
      setEditState(null);
    } else {
      const ok = sendMessage(convId, content);
      if (!ok) {
        setSendError('Chat is offline — message not sent.');
      }
    }
  };

  const handleTyping = () => {
    if (isConnected) sendTyping(convId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text)' }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Offline banner */}
      {showOffline && (
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'rgba(225,29,72,0.08)',
            borderBottom: '1px solid rgba(225,29,72,0.2)',
            color: '#e11d48',
          }}
        >
          <WifiOff size={13} aria-hidden="true" />
          {connectError ?? 'Chat is currently offline — messages cannot be sent.'}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-4 flex flex-col gap-4">
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showDivider = !prev || !isSameDay(new Date(prev.created_at), new Date(msg.created_at));
          return (
            <div key={msg._id} className="flex flex-col gap-4">
              {showDivider && <DateDivider date={msg.created_at} />}
              <MessageBubble
                message={msg}
                isOwn={msg.sender_id._id === myId}
                seenByOthers={msg.seen_by.some(id => id !== myId)}
                onEdit={(id, content) => setEditState({ messageId: id, content })}
                onDelete={id => deleteMessage(id, convId)}
              />
            </div>
          );
        })}
        {typingUsers.size > 0 && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div
          className="px-4 py-2 text-xs"
          role="alert"
          aria-live="assertive"
          style={{ color: '#e11d48', backgroundColor: 'rgba(225,29,72,0.06)' }}
        >
          {sendError}
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-5 pt-2">
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={!isConnected}
          editValue={editState?.content}
          onCancelEdit={() => setEditState(null)}
        />
      </div>
    </div>
  );
}
