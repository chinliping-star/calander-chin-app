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

interface Props {
  conversation: Conversation;
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

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', convId],
    queryFn: () => chatApi.getMessages(convId),
    enabled: !!convId,
    staleTime: 0,
  });

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

  useEffect(() => {
    joinConversation(convId);
    return () => leaveConversation(convId);
  }, [convId, joinConversation, leaveConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex flex-col h-full">
      {/* Offline banner */}
      {(!isConnected || connectError) && (
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
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map(msg => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender_id._id === myId}
            seenByOthers={msg.seen_by.some(id => id !== myId)}
            onEdit={(id, content) => setEditState({ messageId: id, content })}
            onDelete={id => deleteMessage(id, convId)}
          />
        ))}
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
      <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
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
