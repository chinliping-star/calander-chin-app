import { createContext, useContext, type ReactNode } from 'react';
import { usePresence } from '../hooks/usePresence';

interface PresenceValue {
  onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceValue>({ onlineUsers: new Set() });

/**
 * Opens ONE presence socket for the whole authenticated app, so a user counts
 * as "online" whenever the app is open — not only on the chat page.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { onlineUsers } = usePresence();
  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  return useContext(PresenceContext);
}
