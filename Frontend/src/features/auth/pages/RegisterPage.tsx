import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { AuthAnimatedBg } from '../components/AuthAnimatedBg.tsx';
import { Logo } from '../../../components/Logo.tsx';

const LOADING_MESSAGES = [
  'Setting up your diary…',
  'Sprinkling some magic…',
  'Getting things ready…',
  'Almost there…',
];

function CreatingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2200);
    progRef.current = setInterval(() => {
      setProgress(p => Math.min(p + 1.2, 92));
    }, 120);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progRef.current)    clearInterval(progRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{
        zIndex: 100,
        background: 'linear-gradient(135deg, #fff8fb 0%, #fdf4ff 50%, #f8f0ff 100%)',
      }}
    >
      <style>{`
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50%       { transform: scale(1.2); opacity: 1; }
        }
        @keyframes fadeMsg {
          0%   { opacity: 0; transform: translateY(8px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to   { background-position: 200% center; }
        }
      `}</style>

      {/* Spinner */}
      <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '3px solid transparent',
            borderTopColor: '#FF7FB1',
            borderRightColor: 'rgba(255,127,177,0.3)',
            animation: 'spinRing 1.1s linear infinite',
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 64, height: 64,
            border: '3px solid transparent',
            borderTopColor: '#c084fc',
            borderLeftColor: 'rgba(192,132,252,0.3)',
            animation: 'spinRing 0.75s linear infinite reverse',
          }}
        />
        {/* Center emoji */}
        <span style={{ fontSize: 28, lineHeight: 1 }}>🌸</span>
      </div>

      {/* Message */}
      <div style={{ height: 28, overflow: 'hidden' }}>
        <p
          key={msgIdx}
          className="text-base font-semibold text-center"
          style={{
            color: 'var(--text-h)',
            animation: 'fadeMsg 2.2s ease forwards',
          }}
        >
          {LOADING_MESSAGES[msgIdx]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 flex flex-col gap-2">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,127,177,0.15)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #FF7FB1, #c084fc, #FF7FB1)',
              backgroundSize: '200% auto',
              animation: 'shimmer 1.8s linear infinite',
            }}
          />
        </div>
        <p className="text-xs text-center font-medium" style={{ color: 'var(--text)' }}>
          Securing your account…
        </p>
      </div>

      {/* Floating dots */}
      <div className="flex gap-3">
        {[0, 0.3, 0.6].map((delay, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 8, height: 8,
              backgroundColor: i === 1 ? '#c084fc' : '#FF7FB1',
              animation: `pulseDot 1.2s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair',   color: '#f97316' };
  if (score <= 3) return { score, label: 'Good',   color: '#eab308' };
  if (score <= 4) return { score, label: 'Strong', color: '#22c55e' };
  return              { score, label: 'Great 🔒', color: '#FF7FB1' };
}

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

export function RegisterPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const navigate = useNavigate();

  const [step, setStep]           = useState<'form' | 'verify'>('form');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [code, setCode]           = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getStrength(password);

  async function handleGoogle() {
    if (!isLoaded || !signUp) return;
    setGoogleLoading(true);
    await signUp.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/onboarding',
    });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be 8+ characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message;
      setError(msg || 'Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError('');
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        // Activate the session before navigating — without this getToken()
        // returns null on /onboarding and every API call fails with 401
        // ("Session expired") until the user hard-refreshes the page.
        await setActive({ session: result.createdSessionId });
        navigate('/onboarding');
      } else {
        setError('Verification incomplete. Try again.');
      }
    } catch (err: unknown) {
      const msg = (err as { errors?: { message: string }[] })?.errors?.[0]?.message;
      setError(msg || 'Wrong code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Overlay only for the Google redirect flow. During email sign-up the
          Clerk captcha (#clerk-captcha) may need user interaction, so nothing
          must cover it — the submit button shows its own "Creating…" state. */}
      {googleLoading && <CreatingOverlay />}
      <AuthAnimatedBg />
      <div
        className="relative w-full max-w-md rounded-3xl p-10 flex flex-col gap-6"
        style={{
          zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(167,139,250,0.20)',
          boxShadow: '0 8px 60px rgba(167,139,250,0.15), 0 2px 20px rgba(74,62,78,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <Logo size={56} showText={false} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
            {step === 'form' ? 'Join Friendiary' : 'Check your email'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            {step === 'form'
              ? 'Create your cute social calendar'
              : `We sent a code to ${email}`}
          </p>
        </div>

        {step === 'form' ? (
          <>
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

            {/* Register form */}
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* Email */}
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
                  style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
                />
              </div>

              {/* Password + strength */}
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
                    placeholder="8+ characters"
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all focus:ring-2"
                    style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
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

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: i <= strength.score ? strength.color : 'var(--border)',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      border: `1.5px solid ${confirm.length > 0 ? (confirm === password ? '#22c55e' : '#ef4444') : 'var(--border)'}`,
                      backgroundColor: 'var(--color-neutral)',
                      color: 'var(--text-h)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--text)' }}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>
                    Passwords don't match
                  </p>
                )}
                {confirm.length > 0 && confirm === password && (
                  <p className="text-[11px] font-semibold" style={{ color: '#22c55e' }}>
                    Passwords match ✓
                  </p>
                )}
              </div>

              {error && (
                <p className="text-xs font-medium text-center rounded-xl py-2 px-3"
                   style={{ backgroundColor: '#fff0f0', color: '#e53e3e' }}>
                  {error}
                </p>
              )}

              {/* Required by Clerk for bot protection (Cloudflare Turnstile) */}
              <div id="clerk-captcha" />

              <button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? 'Creating…' : 'Create account ✨'}
              </button>
            </form>
          </>
        ) : (
          /* Verify step */
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
                Verification Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.3em] outline-none transition-all focus:ring-2"
                style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
                autoFocus
              />
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
              {loading ? 'Verifying…' : 'Verify & continue 🌸'}
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="text-xs text-center hover:opacity-70"
              style={{ color: 'var(--text)' }}
            >
              ← Back
            </button>
          </form>
        )}

        <p className="text-center text-xs" style={{ color: 'var(--text)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold hover:opacity-80 focus-visible:outline-none"
            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
