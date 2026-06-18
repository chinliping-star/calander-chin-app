import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { AuthAnimatedBg } from '../components/AuthAnimatedBg.tsx';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export function LoginPage() {
  const { signIn, isLoaded } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError('');
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        // Navigate to a protected route — AuthGuard fetches profile and
        // redirects to calendar (existing user) or onboarding (new user)
        navigate('/friends');
      } else {
        setError('Login incomplete. Try again.');
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code?: string; message: string }[] };
      const firstErr = clerkErr?.errors?.[0];
      if (firstErr?.code === 'user_banned') {
        setError('Your account has been deleted. To recover it, contact us at support@friendiary.com');
      } else {
        setError(firstErr?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      // Send to a protected route — AuthGuard fetches profile and routes
      // existing users to the app, new users to /onboarding. Never hardcode
      // /onboarding here or returning users get the setup form again.
      redirectUrlComplete: '/friends',
    });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-8" style={{ zIndex: 100, background: 'linear-gradient(135deg, #fff8fb 0%, #fdf4ff 50%, #f8f0ff 100%)' }}>
          <style>{`
            @keyframes spinRing2 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes pulseDot2 { 0%,100%{transform:scale(0.6);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }
            @keyframes shimmer2 { from{background-position:-200% center} to{background-position:200% center} }
          `}</style>
          <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
            <div className="absolute inset-0 rounded-full" style={{ border: '3px solid transparent', borderTopColor: '#FF7FB1', borderRightColor: 'rgba(255,127,177,0.3)', animation: 'spinRing2 1.1s linear infinite' }} />
            <div className="absolute rounded-full" style={{ width: 64, height: 64, border: '3px solid transparent', borderTopColor: '#c084fc', borderLeftColor: 'rgba(192,132,252,0.3)', animation: 'spinRing2 0.75s linear infinite reverse' }} />
            <span style={{ fontSize: 28 }}>🌸</span>
          </div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-h)' }}>Signing you in…</p>
          <div className="w-64 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,127,177,0.15)' }}>
            <div className="h-full rounded-full" style={{ width: '70%', background: 'linear-gradient(90deg,#FF7FB1,#c084fc,#FF7FB1)', backgroundSize: '200% auto', animation: 'shimmer2 1.8s linear infinite' }} />
          </div>
          <div className="flex gap-3">
            {[0, 0.3, 0.6].map((d, i) => (
              <div key={i} className="rounded-full" style={{ width: 8, height: 8, backgroundColor: i===1?'#c084fc':'#FF7FB1', animation: 'pulseDot2 1.2s ease-in-out infinite', animationDelay: `${d}s` }} />
            ))}
          </div>
        </div>
      )}
      <AuthAnimatedBg />
      <div
        className="relative w-full max-w-md rounded-3xl p-10 flex flex-col gap-6"
        style={{
          zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,127,177,0.20)',
          boxShadow: '0 8px 60px rgba(255,127,177,0.15), 0 2px 20px rgba(74,62,78,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">🌸</span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            Sign in to your Friendiary
          </p>
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-2xl py-2.5 text-sm font-semibold transition-all hover:opacity-80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
          style={{ border: '1.5px solid var(--border)', color: 'var(--text-h)', backgroundColor: 'var(--color-neutral)' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2"
              style={{
                border: '1.5px solid var(--border)',
                backgroundColor: 'var(--color-neutral)',
                color: 'var(--text-h)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all focus:ring-2"
                style={{
                  border: '1.5px solid var(--border)',
                  backgroundColor: 'var(--color-neutral)',
                  color: 'var(--text-h)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                style={{ color: 'var(--text)' }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-center rounded-xl py-2 px-3"
               style={{ backgroundColor: '#fff0f0', color: '#e53e3e' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isLoaded}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? 'Signing in…' : 'Sign in 🌸'}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--text)' }}>
          No account?{' '}
          <Link
            to="/register"
            className="font-semibold hover:opacity-80 focus-visible:outline-none"
            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
