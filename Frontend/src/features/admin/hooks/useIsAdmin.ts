import { useAuthStore } from '../../../store/auth.ts';

/** Reads is_admin off the already-cached user profile — no separate network call. */
export function useIsAdmin() {
  const user = useAuthStore(s => s.user);
  return { isAdmin: !!user?.is_admin, isLoading: false };
}
