/**
 * Zustand auth store placeholder.
 * Install zustand, then replace this with:
 *
 *   import { create } from 'zustand';
 *   export const useAuthStore = create<AuthStore>((set) => ({ ... }));
 */

import type { User } from '../types/index.ts';

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

// Minimal in-memory store until Zustand is installed
let _state: AuthStore = {
  user: null,
  setUser: (user: User | null) => {
    _state = { ..._state, user };
    listeners.forEach((fn) => fn(_state));
  },
};

const listeners = new Set<(state: AuthStore) => void>();

export function useAuthStore(): AuthStore;
export function useAuthStore<T>(selector: (state: AuthStore) => T): T;
export function useAuthStore<T>(selector?: (state: AuthStore) => T): AuthStore | T {
  if (selector) return selector(_state);
  return _state;
}
