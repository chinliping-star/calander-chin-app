import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../../../store/auth.ts';

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, _hasHydrated } = useAuthStore();

  // Still loading — render page optimistically (faster perceived load)
  if (!isLoaded || !_hasHydrated) return <>{children}</>;

  // Signed in + have profile → go straight to calendar
  if (isSignedIn && user) return <Navigate to={`/${user.username}/calendar`} replace />;

  // Signed in but no cached profile — let AuthGuard fetch from server and decide
  // (don't redirect to /onboarding here: user could be returning after logout/clearAuth)
  if (isSignedIn && !user) return <Navigate to="/friends" replace />;

  return <>{children}</>;
}
