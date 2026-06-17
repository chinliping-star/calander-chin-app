import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import type { Message } from '../types';

const SOCKET_URL =
  (import.meta.env as Record<string, string>)['VITE_API_URL']?.replace('/api', '') ??
  'http://localhost:3000';

type Handler<T = unknown> = (data: T) => void;

interface UseChatOptions {
  onMessage?:        Handler<Message>;
  onMessageEdited?:  Handler<Message>;
  onMessageDeleted?: Handler<{ messageId: string; conversationId: string }>;
  onTyping?:         Handler<{ conversationId: string; userId: string }>;
  onSeen?:           Handler<{ messageId: string; conversationId: string; seenBy: string }>;
  onError?:          Handler<{ message: string }>;
}

export function useChat(options: UseChatOptions = {}) {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    let socket: Socket;
    let cancelled = false;

    async function connect() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        socket = io(`${SOCKET_URL}/chat`, {
          auth: { token },
          transports: ['websocket'],
          reconnectionAttempts: 3,
          timeout: 8000,
        });

        socket.on('connect', () => {
          if (!cancelled) {
            setIsConnected(true);
            setConnectError(null);
          }
        });

        socket.on('disconnect', () => {
          if (!cancelled) setIsConnected(false);
        });

        socket.on('connect_error', (err: Error) => {
          if (!cancelled) {
            setIsConnected(false);
            setConnectError(err.message ?? 'Could not connect to chat');
          }
        });

        socket.on('message:new',     (msg: Message) => optionsRef.current.onMessage?.(msg));
        socket.on('message:edited',  (msg: Message) => optionsRef.current.onMessageEdited?.(msg));
        socket.on('message:deleted', (data: { messageId: string; conversationId: string }) =>
          optionsRef.current.onMessageDeleted?.(data));
        socket.on('message:typing',  (data: { conversationId: string; userId: string }) =>
          optionsRef.current.onTyping?.(data));
        socket.on('message:seen',    (data: { messageId: string; conversationId: string; seenBy: string }) =>
          optionsRef.current.onSeen?.(data));
        socket.on('error',           (data: { message: string }) =>
          optionsRef.current.onError?.(data));

        socketRef.current = socket;
      } catch {
        if (!cancelled) setConnectError('Chat unavailable');
      }
    }

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [getToken]);

  const joinConversation = useCallback((convId: string) => {
    socketRef.current?.emit('conversation:join', convId);
  }, []);

  const leaveConversation = useCallback((convId: string) => {
    socketRef.current?.emit('conversation:leave', convId);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string): boolean => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('message:send', { conversationId, content });
    return true;
  }, []);

  const editMessage = useCallback((messageId: string, content: string): boolean => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('message:edit', { messageId, content });
    return true;
  }, []);

  const deleteMessage = useCallback((messageId: string, conversationId: string): boolean => {
    if (!socketRef.current?.connected) return false;
    socketRef.current.emit('message:delete', { messageId, conversationId });
    return true;
  }, []);

  const markSeen = useCallback((conversationId: string, messageId: string) => {
    socketRef.current?.emit('message:seen', { conversationId, messageId });
  }, []);

  const sendTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('message:typing', { conversationId });
  }, []);

  return {
    isConnected,
    connectError,
    joinConversation,
    leaveConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    markSeen,
    sendTyping,
  };
}
