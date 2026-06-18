import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../../../lib/api.ts';
import { useAuthStore } from '../../../store/auth.ts';
import type { User } from '../../../types/index.ts';

const INTERESTS = [
  '🎵 Music', '🎮 Gaming', '🍕 Food', '✈️ Travel', '⚽ Sports',
  '📚 Reading', '🎨 Art', '🎬 Movies', '🌿 Nature', '💻 Tech',
  '🧘 Wellness', '🐾 Pets', '📸 Photography', '🛍️ Shopping', '🎭 Theatre',
];

const COUNTRIES = [
  'Pakistan', 'India', 'United States', 'United Kingdom', 'Canada',
  'Australia', 'UAE', 'Saudi Arabia', 'Germany', 'France', 'Turkey', 'Other',
];

const HEARD_ABOUT = [
  'Friend / family', 'Instagram', 'TikTok', 'Twitter / X',
  'Google search', 'Reddit', 'YouTube', 'Other',
];

export function OnboardingPage() {
  const { user: clerkUser } = useUser();
  const { post, get } = useApi();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Guard: a returning user (already has a profile) must never see the setup
  // form. Check the server first; if a profile exists, send them to the app.
  const [checkingProfile, setCheckingProfile] = useState(true);
  useEffect(() => {
    let cancelled = false;
    get<User | null>('/users/me/profile')
      .then(user => {
        if (cancelled) return;
        if (user) {
          setAuth(user, '');
          navigate(`/${user.username}/calendar`, { replace: true });
        } else {
          setCheckingProfile(false);
        }
      })
      .catch(() => { if (!cancelled) setCheckingProfile(false); });
    return () => { cancelled = true; };
  }, []);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [form, setForm] = useState({
    username: '',
    display_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    heard_about: '',
    interests: [] as string[],
  });

  useEffect(() => {
    if (clerkUser) {
      setForm(f => ({
        ...f,
        first_name: f.first_name || clerkUser.firstName || '',
        last_name: f.last_name || clerkUser.lastName || '',
        display_name: f.display_name || clerkUser.firstName || '',
        email: f.email || clerkUser.primaryEmailAddress?.emailAddress || '',
      }));
    }
  }, [clerkUser]);

  useEffect(() => {
    if (form.username.length < 3) { setUsernameAvailable(null); return; }
    const t = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`${(import.meta.env as Record<string, string>)['VITE_API_URL'] ?? 'http://localhost:3000/api'}/users/check/${form.username}`);
        if (!res.ok) { setUsernameAvailable(null); return; }
        const data = await res.json() as { available: boolean };
        setUsernameAvailable(data.available);
      } catch {
        // CORS or network failure — assume available so user isn't permanently blocked
        // Server will reject on submit if username is actually taken
        setUsernameAvailable(true);
      }
      finally { setCheckingUsername(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [form.username]);

  function toggleInterest(interest: string) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }));
  }

  function field(label: string, key: keyof typeof form, opts?: { type?: string; placeholder?: string; required?: boolean }) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text)' }}>
          {label}{opts?.required && <span style={{ color: 'var(--color-primary)' }}> *</span>}
        </label>
        <input
          type={opts?.type ?? 'text'}
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts?.placeholder ?? ''}
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
          style={{ border: '2px solid var(--border)', backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>
    );
  }

  const step1Valid = form.username && form.display_name && form.first_name && form.last_name && form.email && usernameAvailable === true && !checkingUsername;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const user = await post<User>('/users/onboarding', {
        ...form,
        avatar_url: clerkUser?.imageUrl,
      });
      setAuth(user, '');
      navigate(`/${user.username}/calendar`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('401') || msg.toLowerCase().includes('token') || msg.toLowerCase().includes('unauthorized')) {
        setError('Session expired. Please sign out and sign in again.');
      } else if (msg.includes('409') || msg.toLowerCase().includes('taken')) {
        setError('Username already taken — try another.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // While verifying whether the user already has a profile, show a spinner
  // instead of flashing the setup form to returning users.
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, var(--color-tertiary) 0%, #fff 60%, #f0e6ff 100%)' }}>
        <div className="h-8 w-8 rounded-full border-4 animate-spin"
          style={{ borderColor: 'var(--color-tertiary)', borderTopColor: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, var(--color-tertiary) 0%, #fff 60%, #f0e6ff 100%)' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl mb-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Set up your profile</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>Step {step} of 2</p>
          <div className="mt-3 h-1.5 rounded-full mx-auto w-48" style={{ backgroundColor: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%', backgroundColor: 'var(--color-primary)' }} />
          </div>
        </div>

        <div className="rounded-3xl p-7 shadow-xl" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>

          {error && (
            <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* ── Step 1: Basic info ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>Basic info 🌸</h2>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                  Username <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') }))}
                    placeholder="chin.star"
                    maxLength={30}
                    className="w-full rounded-xl pl-8 pr-10 py-3 text-sm focus:outline-none transition-all"
                    style={{ border: `2px solid ${usernameAvailable === false ? '#fca5a5' : usernameAvailable ? '#6ee7b7' : 'var(--border)'}`, backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {checkingUsername ? '⏳' : usernameAvailable === true ? '✅' : usernameAvailable === false ? '❌' : ''}
                  </span>
                </div>
                {usernameAvailable === false && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>Username taken — try another</p>}
              </div>

              {/* First + Last name */}
              <div className="grid grid-cols-2 gap-3">
                {field('First name', 'first_name', { placeholder: 'Chin', required: true })}
                {field('Last name', 'last_name', { placeholder: 'Star', required: true })}
              </div>

              {field('Display name', 'display_name', { placeholder: 'Chin ✨', required: true })}
              {field('Email', 'email', { type: 'email', placeholder: 'chin@example.com', required: true })}
              {field('Phone number', 'phone', { type: 'tel', placeholder: '+92 300 0000000' })}

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text)' }}>Country</label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  style={{ border: '2px solid var(--border)', backgroundColor: 'var(--color-neutral)', color: form.country ? 'var(--text-h)' : 'var(--text)' }}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Heard about */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text)' }}>How did you hear about us?</label>
                <select
                  value={form.heard_about}
                  onChange={e => setForm(f => ({ ...f, heard_about: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  style={{ border: '2px solid var(--border)', backgroundColor: 'var(--color-neutral)', color: form.heard_about ? 'var(--text-h)' : 'var(--text)' }}>
                  <option value="">Select…</option>
                  {HEARD_ABOUT.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="mt-2 w-full rounded-2xl py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', boxShadow: '0 4px 12px var(--accent-border)' }}>
                Next →
              </button>
            </div>
          )}

          {/* ── Step 2: Interests ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>Your interests 💕</h2>
              <p className="text-xs" style={{ color: 'var(--text)' }}>Pick at least 2 — helps find friends with same vibe</p>

              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(interest => {
                  const selected = form.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
                      style={selected
                        ? { backgroundColor: 'var(--color-primary)', color: '#fff', border: '2px solid var(--color-primary)' }
                        : { backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)', border: '2px solid var(--border)' }}>
                      {interest}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)', border: '1px solid var(--border)' }}>
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={loading || form.interests.length < 2}
                  onClick={handleSubmit}
                  className="flex-[2] rounded-2xl py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', boxShadow: '0 4px 12px var(--accent-border)' }}>
                  {loading ? 'Creating profile…' : "Let's go! 🌸"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
