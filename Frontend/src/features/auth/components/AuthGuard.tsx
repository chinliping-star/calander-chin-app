import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../../../lib/api.ts';
import { useAuthStore } from '../../../store/auth.ts';
import type { User } from '../../../types/index.ts';

type ApiStatus = 'idle' | 'loading' | 'no-profile' | 'error';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-4 animate-spin"
        style={{ borderColor: 'var(--color-tertiary)', borderTopColor: 'var(--color-primary)' }} />
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { get } = useApi();
  const location = useLocation();
  const { user: cachedUser, setAuth, _hasHydrated } = useAuthStore();
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');

  useEffect(() => {
    // Skip if: Clerk not ready, not signed in, store not hydrated, already have user, already fetching
    if (!isLoaded || !isSignedIn || !_hasHydrated || cachedUser || apiStatus !== 'idle') return;

    setApiStatus('loading');
    get<User | null>('/users/me/profile')
      .then(user => {
        if (user) {
          setAuth(user, '');
          // cachedUser becomes truthy → component re-renders → children shown
        } else {
          setApiStatus('no-profile');
        }
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : '';
        // 401 = auth issue (token), 500 = server/DB error — NOT a missing profile
        // Only redirect to onboarding if profile genuinely doesn't exist
        if (msg.includes('404') || msg === 'null') {
          setApiStatus('no-profile');
        } else {
          setApiStatus('error');
        }
      });
  }, [isLoaded, isSignedIn, cachedUser, _hasHydrated]);

  if (!isLoaded || !_hasHydrated) return <Spinner />;
  if (!isSignedIn) return <Navigate to="/login" state={{ from: location }} replace />;

  // Zustand user is reactive — when store hydrates from localStorage or
  // setAuth is called (after onboarding or profile fetch), this re-renders immediately
  if (cachedUser) return <>{children}</>;

  if (apiStatus === 'no-profile') return <Navigate to="/onboarding" replace />;

  if (apiStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm" style={{ color: 'var(--text)' }}>Could not load profile. Check connection.</p>
        <button
          onClick={() => setApiStatus('idle')}
          className="rounded-xl px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          Retry
        </button>
      </div>
    );
  }

  return <Spinner />;
}
