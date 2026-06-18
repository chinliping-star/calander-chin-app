import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

const SOCKET_URL =
  (import.meta.env as Record<string, string>)['VITE_API_URL']?.replace('/api', '') ??
  'http://localhost:3000';

/**
 * Subscribes to chat presence events and exposes the set of currently online
 * user ids (mongo `_id` strings). Online = peer has at least one live socket.
 */
export function usePresence() {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let socket: Socket;
    let cancelled = false;

    async function connect() {
      const token = await getToken();
      if (!token || cancelled) return;

      socket = io(`${SOCKET_URL}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 3,
        timeout: 8000,
      });

      socket.on('presence:state', (userIds: string[]) => {
        if (!cancelled) setOnlineUsers(new Set(userIds));
      });

      socket.on('presence:online', ({ userId }: { userId: string }) => {
        if (cancelled) return;
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      });

      socket.on('presence:offline', ({ userId }: { userId: string }) => {
        if (cancelled) return;
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      socket.on('disconnect', () => {
        if (!cancelled) setOnlineUsers(new Set());
      });

      // Pull the authoritative roster on (re)connect — heals any missed events.
      socket.on('connect', () => socket.emit('presence:get'));

      socketRef.current = socket;
    }

    void connect();

    // Re-sync when the tab regains focus and on a slow poll, so a stale
    // green/gray dot can never persist if a presence event was dropped.
    const refresh = () => socketRef.current?.emit('presence:get');
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    const poll = setInterval(refresh, 20_000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      clearInterval(poll);
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [getToken]);

  return { onlineUsers };
}
