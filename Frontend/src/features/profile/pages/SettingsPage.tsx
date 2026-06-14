import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, ChevronRight, MessageCircle, FileText, Shield, Mail, Phone, ExternalLink, Check } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { SettingsSidebar } from '../components/SettingsSidebar.tsx';
import { ToggleSwitch } from '../components/ToggleSwitch.tsx';
import { useThemeStore, THEMES } from '../../../lib/theme.ts';
import { usePreferences, CURSORS } from '../../../lib/preferences.ts';
import type { SettingsSection } from '../components/SettingsSidebar.tsx';

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '14px',
  color: 'var(--text-h)',
  backgroundColor: 'var(--color-neutral)',
  width: '100%',
  fontFamily: 'var(--sans)',
  outline: 'none',
};

const smallLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text)',
  display: 'block',
  marginBottom: '6px',
};

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(74,62,78,0.08)' }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 id={id} style={{ color: 'var(--text-h)', margin: 0, fontSize: '16px', fontWeight: 700 }}>
        {children}
      </h2>
      <div className="h-0.5 w-8 rounded mt-1.5" style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true" />
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileSection() {
  const [displayName, setDisplayName] = useState('Muneb');
  const [username, setUsername] = useState('@muneb.star');
  const [bio, setBio] = useState("Social enthusiast and diary keeper. Let's make every meetup count!");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section aria-labelledby="profile-heading">
      <SectionCard>
        <SectionHeading id="profile-heading">Profile</SectionHeading>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img src="https://i.pravatar.cc/150?img=3" alt="Your avatar"
                className="h-[72px] w-[72px] rounded-full object-cover" width={72} height={72} />
              <button type="button" aria-label="Edit photo" onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm focus-visible:outline-none hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                <Pencil size={11} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload photo" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{displayName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{username}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="display-name" style={smallLabel}>Display Name</label>
              <input id="display-name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="username" style={smallLabel}>Username</label>
              <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label htmlFor="bio" style={smallLabel}>Bio</label>
            <textarea id="bio" rows={3} value={bio} onChange={e => setBio(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
          </div>

          <div className="flex justify-end">
            <button type="submit"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {saved ? '✓ Saved!' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </SectionCard>
    </section>
  );
}

// ─── Appearance / Theme ───────────────────────────────────────────────────────

function ThemeCard({ t, isActive, onSelect }: { t: import('../../../lib/theme.ts').ThemeMeta; isActive: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={`${t.label} theme`}
      className="relative flex flex-col gap-0 rounded-2xl overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 text-left"
      style={{
        border: isActive ? `2px solid ${t.primary}` : `2px solid ${t.border}`,
        boxShadow: isActive
          ? `0 0 0 3px ${t.primary}30, 0 8px 24px ${t.primary}20`
          : `0 2px 8px rgba(0,0,0,0.06)`,
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* ── Mini UI preview ── */}
      <div style={{ backgroundColor: t.bg, padding: '10px 10px 8px' }}>
        {/* Navbar strip */}
        <div
          className="flex items-center justify-between rounded-lg px-2 py-1 mb-2"
          style={{ backgroundColor: t.surface === '#0F172A' ? t.surface : t.surface, border: `1px solid ${t.border}` }}
        >
          <span style={{ fontSize: '7px', fontWeight: 800, color: t.primary, letterSpacing: '-0.3px' }}>Friendiary</span>
          <div className="flex gap-1">
            <div style={{ width: '20px', height: '4px', borderRadius: '2px', backgroundColor: t.border }} />
            <div style={{ width: '14px', height: '4px', borderRadius: '2px', backgroundColor: t.border }} />
          </div>
        </div>

        {/* Content row */}
        <div className="flex gap-1.5">
          {/* Sidebar */}
          <div
            className="flex flex-col gap-1 rounded-md p-1.5"
            style={{ width: '36px', backgroundColor: t.surface === '#0F172A' ? '#1E293B' : t.surface, border: `1px solid ${t.border}`, flexShrink: 0 }}
          >
            {[t.primary, t.border, t.border].map((c, i) => (
              <div key={i} style={{ height: '4px', borderRadius: '2px', backgroundColor: i === 0 ? `${t.primary}30` : t.border, width: i === 0 ? '100%' : '70%' }}>
                {i === 0 && <div style={{ width: '40%', height: '100%', borderRadius: '2px', backgroundColor: t.primary }} />}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Heading */}
            <div style={{ height: '5px', borderRadius: '3px', backgroundColor: t.textH, width: '60%', opacity: 0.8 }} />
            {/* Body lines */}
            <div style={{ height: '3px', borderRadius: '2px', backgroundColor: t.text, width: '90%', opacity: 0.5 }} />
            <div style={{ height: '3px', borderRadius: '2px', backgroundColor: t.text, width: '75%', opacity: 0.5 }} />
            {/* Button row */}
            <div className="flex gap-1 mt-0.5">
              <div style={{ height: '8px', width: '28px', borderRadius: '4px', backgroundColor: t.primary }} />
              <div style={{ height: '8px', width: '22px', borderRadius: '4px', border: `1px solid ${t.border}` }} />
            </div>
          </div>
        </div>

        {/* Calendar row mini */}
        <div className="flex gap-0.5 mt-2">
          {[false, false, true, false, false, false, false].map((today, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '14px',
                borderRadius: '3px',
                backgroundColor: today ? t.primary : t.surface === '#0F172A' ? '#1E293B' : t.surface,
                border: today ? 'none' : `1px solid ${t.border}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Footer: label + swatches ── */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: t.surface === '#0F172A' ? '#0F172A' : '#ffffff', borderTop: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-1.5">
          {/* Color dot swatches */}
          {[t.primary, t.bg, t.textH].map((c, i) => (
            <div
              key={i}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: c,
                border: `1px solid ${t.border}`,
              }}
            />
          ))}
          <span className="text-xs font-bold ml-1" style={{ color: t.textH, fontSize: '11px' }}>
            {t.label}
          </span>
        </div>
        {isActive && (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: t.primary }}
          >
            <Check size={9} color="#fff" strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useThemeStore();

  return (
    <section aria-labelledby="theme-heading">
      <SectionCard>
        <SectionHeading id="theme-heading">Appearance</SectionHeading>
        <p className="text-sm mb-6" style={{ color: 'var(--text)' }}>
          Pick a theme — applies instantly everywhere. Saved across sessions.
        </p>

        {/* Active theme badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
            Active theme:
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1px solid var(--accent-border)' }}
          >
            {THEMES.find(t => t.id === theme)?.label ?? 'Pink'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {THEMES.map(t => (
            <ThemeCard key={t.id} t={t} isActive={theme === t.id} onSelect={() => setTheme(t.id)} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Preview shows:</span>
          {[
            { dot: 'var(--color-primary)', label: 'Accent / buttons' },
            { dot: 'var(--bg)', label: 'Background', border: true },
            { dot: 'var(--text-h)', label: 'Headings' },
          ].map(({ dot, label, border }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dot, border: border ? '1px solid var(--border)' : 'none' }} />
              <span className="text-xs" style={{ color: 'var(--text)' }}>{label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </section>
  );
}

// ─── Calendar Preferences ────────────────────────────────────────────────────

function CalendarSection() {
  const { weekStart, defaultView, timeFormat, setWeekStart, setDefaultView, setTimeFormat, cursor, setCursor } = usePreferences();

  function RadioGroup<T extends string>({
    label, value, options, onChange,
  }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>{label}</p>
        <div className="flex gap-2 flex-wrap">
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all focus-visible:outline-none"
              style={value === o.id
                ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', boxShadow: '0 2px 8px var(--accent-bg)' }
                : { backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="calendar-heading">
      <SectionCard>
        <SectionHeading id="calendar-heading">Calendar Preferences</SectionHeading>
        <div className="flex flex-col gap-7">
          <RadioGroup
            label="Week starts on"
            value={weekStart}
            options={[{ id: 'monday', label: 'Monday' }, { id: 'sunday', label: 'Sunday' }]}
            onChange={setWeekStart}
          />
          <RadioGroup
            label="Default view"
            value={defaultView}
            options={[{ id: 'month', label: 'Month' }, { id: 'week', label: 'Week' }, { id: 'day', label: 'Day' }]}
            onChange={setDefaultView}
          />
          <RadioGroup
            label="Time format"
            value={timeFormat}
            options={[{ id: '12h', label: '12-hour (2:30 PM)' }, { id: '24h', label: '24-hour (14:30)' }]}
            onChange={setTimeFormat}
          />

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Custom cursor */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>Custom Cursor</p>
            <div className="flex gap-3 flex-wrap">
              {CURSORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCursor(c.id)}
                  aria-pressed={cursor === c.id}
                  className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all focus-visible:outline-none"
                  style={cursor === c.id
                    ? { backgroundColor: 'var(--accent-bg)', border: '2px solid var(--color-primary)', boxShadow: '0 0 0 3px var(--accent-bg)' }
                    : { backgroundColor: 'var(--color-neutral)', border: '2px solid var(--border)' }}
                >
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>{c.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: cursor === c.id ? 'var(--color-primary)' : 'var(--text-h)' }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text)' }}>
              Cursor changes apply immediately across the whole app.
            </p>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}

// ─── Privacy ──────────────────────────────────────────────────────────────────

function PrivacySection() {
  const [privateAccount, setPrivateAccount] = useState(true);
  const [friendRequests, setFriendRequests] = useState(false);
  const [discoverability, setDiscoverability] = useState(true);
  const [showMeetups, setShowMeetups] = useState(true);
  const [showFriends, setShowFriends] = useState(false);

  return (
    <section aria-labelledby="privacy-heading">
      <SectionCard>
        <SectionHeading id="privacy-heading">Privacy</SectionHeading>
        <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
          <ToggleSwitch id="private-account" checked={privateAccount} onChange={setPrivateAccount}
            label="Private Account" description="Only friends can see your calendar and past meetups." />
          <ToggleSwitch id="friend-requests" checked={friendRequests} onChange={setFriendRequests}
            label="Friend Requests" description="Allow anyone to send you friend requests." />
          <ToggleSwitch id="discoverability" checked={discoverability} onChange={setDiscoverability}
            label="Discoverability" description="Show your profile in 'Discover' for people nearby." />
          <ToggleSwitch id="show-meetups" checked={showMeetups} onChange={setShowMeetups}
            label="Show Past Meetups" description="Let friends see your meetup history on your profile." />
          <ToggleSwitch id="show-friends" checked={showFriends} onChange={setShowFriends}
            label="Public Friend List" description="Anyone can see who you are friends with." />
        </div>
      </SectionCard>
    </section>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsSection() {
  const [email, setEmail] = useState([
    { id: 'e1', label: 'New Meetup Invites', checked: true },
    { id: 'e2', label: 'Meetup Reminders',   checked: true },
    { id: 'e3', label: 'Friend Requests',    checked: true },
    { id: 'e4', label: 'Weekly Digests',     checked: false },
    { id: 'e5', label: 'Promotions',         checked: false },
  ]);
  const [push, setPush] = useState([
    { id: 'p1', label: 'Instant Messages',   checked: true },
    { id: 'p2', label: 'Activity Updates',   checked: true },
    { id: 'p3', label: 'Meetup Accepted',    checked: true },
    { id: 'p4', label: 'Meetup Declined',    checked: true },
    { id: 'p5', label: 'App Updates',        checked: false },
  ]);

  const toggle = (
    list: typeof email,
    setList: React.Dispatch<React.SetStateAction<typeof email>>,
    id: string,
  ) => setList(prev => prev.map(n => n.id === id ? { ...n, checked: !n.checked } : n));

  return (
    <section aria-labelledby="notif-heading">
      <SectionCard>
        <SectionHeading id="notif-heading">Notifications</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { title: 'Email Notifications', items: email, setItems: setEmail },
            { title: 'Push Notifications',  items: push,  setItems: setPush  },
          ].map(({ title, items, setItems }) => (
            <div key={title}>
              <p style={{ ...smallLabel, marginBottom: '12px' }}>{title}</p>
              <ul className="flex flex-col gap-3" role="list">
                {items.map(n => (
                  <li key={n.id} className="flex items-center gap-3">
                    <input id={n.id} type="checkbox" checked={n.checked}
                      onChange={() => toggle(items, setItems, n.id)}
                      className="h-4 w-4 rounded cursor-pointer focus-visible:outline-none"
                      style={{ accentColor: 'var(--color-primary)' }} />
                    <label htmlFor={n.id} className="text-sm cursor-pointer select-none" style={{ color: 'var(--text-h)' }}>
                      {n.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>
    </section>
  );
}

// ─── Account ──────────────────────────────────────────────────────────────────

function AccountSection() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  }

  return (
    <section aria-labelledby="account-heading">
      <SectionCard>
        <SectionHeading id="account-heading">Account</SectionHeading>

        {/* Change password */}
        <form onSubmit={handlePwSave} className="flex flex-col gap-4 mb-6">
          <p style={{ ...smallLabel, marginBottom: 0 }}>Change Password</p>
          <input type="password" placeholder="Current password" value={currentPw}
            onChange={e => setCurrentPw(e.target.value)} style={inputStyle} aria-label="Current password" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="password" placeholder="New password" value={newPw}
              onChange={e => setNewPw(e.target.value)} style={inputStyle} aria-label="New password" />
            <input type="password" placeholder="Confirm new password" value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)} style={inputStyle} aria-label="Confirm password" />
          </div>
          <div className="flex justify-end">
            <button type="submit"
              className="px-5 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {pwSaved ? '✓ Updated!' : 'Update Password'}
            </button>
          </div>
        </form>

        {/* 2FA */}
        <div className="py-4 border-t border-b" style={{ borderColor: 'var(--border)' }}>
          <ToggleSwitch id="two-fa" checked={twoFA} onChange={setTwoFA}
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account." />
        </div>

        {/* Connected accounts */}
        <div className="pt-4 mb-6">
          <p style={{ ...smallLabel, marginBottom: '12px' }}>Connected Accounts</p>
          <div className="flex flex-col gap-2">
            {[
              { name: 'Google',   connected: true,  color: '#ea4335' },
              { name: 'Apple',    connected: false, color: '#000000' },
            ].map(acc => (
              <div key={acc.name} className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{acc.name}</span>
                <button type="button"
                  className="text-xs font-semibold px-3 py-1 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none"
                  style={acc.connected
                    ? { backgroundColor: '#fee2e2', color: '#dc2626' }
                    : { backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}>
                  {acc.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="pt-4 border-t flex items-center justify-between flex-wrap gap-3" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#dc2626' }}>Danger Zone</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>This action is permanent and cannot be undone.</p>
          </div>
          <button type="button"
            className="px-5 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none"
            style={{ border: '1px solid #dc2626', color: '#dc2626', backgroundColor: 'transparent' }}>
            Delete Account
          </button>
        </div>
      </SectionCard>
    </section>
  );
}

// ─── Help Center ──────────────────────────────────────────────────────────────

const FAQ = [
  { q: 'How do I propose a meetup?',       a: 'Go to your calendar, click an available day, then fill in the meetup details and invite friends.' },
  { q: 'Can I change my username?',        a: 'Yes — go to Settings → Profile and update your username. Changes take effect immediately.' },
  { q: 'How do friend requests work?',     a: 'Search for a user and send a request. They must accept before you can see their calendar.' },
  { q: 'What is a pending meetup?',        a: 'A meetup you proposed that the other person has not yet accepted or declined.' },
  { q: 'How do I mark a day as blocked?',  a: 'Click any available day on your own calendar and select "Block this day".' },
];

function HelpSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section aria-labelledby="help-heading">
      <SectionCard>
        <SectionHeading id="help-heading">Help Center</SectionHeading>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: MessageCircle, label: 'Live Chat',      sub: 'Chat with support', color: 'var(--color-primary)' },
            { icon: Mail,          label: 'Email Us',       sub: 'support@friendiary.app', color: '#7c3aed' },
            { icon: Phone,         label: 'Call Us',        sub: '+1 (800) 123-4567', color: '#059669' },
          ].map(({ icon: Icon, label, sub, color }) => (
            <button key={label} type="button"
              className="flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all hover:shadow-md focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-h)' }}>{label}</p>
              <p className="text-[10px]" style={{ color: 'var(--text)' }}>{sub}</p>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="mb-6">
          <p style={{ ...smallLabel, marginBottom: '12px' }}>Frequently Asked Questions</p>
          <div className="flex flex-col gap-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:opacity-80 focus-visible:outline-none"
                  style={{ backgroundColor: openFaq === i ? 'var(--color-tertiary)' : 'var(--bg)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{item.q}</span>
                  <ChevronRight size={14} className="shrink-0 transition-transform"
                    style={{ color: 'var(--color-primary)', transform: openFaq === i ? 'rotate(90deg)' : 'none' }} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3 pt-1"
                    style={{ backgroundColor: 'var(--color-tertiary)', borderTop: '1px solid var(--border)' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Docs + status */}
        <div className="flex flex-wrap gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {[
            { icon: FileText, label: 'Documentation' },
            { icon: Shield,   label: 'Privacy Policy' },
            { icon: ExternalLink, label: 'System Status' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors hover:opacity-80 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}>
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </SectionCard>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SECTION_MAP: Record<SettingsSection, React.ReactNode> = {
  profile:       <ProfileSection />,
  appearance:    <ThemeSection />,
  calendar:      <CalendarSection />,
  privacy:       <PrivacySection />,
  notifications: <NotificationsSection />,
  account:       <AccountSection />,
  help:          <HelpSection />,
};

const VALID_SECTIONS: SettingsSection[] = ['profile', 'appearance', 'calendar', 'privacy', 'notifications', 'account', 'help'];

export function SettingsPage() {
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') as SettingsSection | null;
  const initSection: SettingsSection = sectionParam && VALID_SECTIONS.includes(sectionParam) ? sectionParam : 'profile';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initSection);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start pb-12">
        <div className="lg:w-48 lg:shrink-0">
          <SettingsSidebar active={activeSection} onSelect={setActiveSection} />
        </div>
        <div className="flex-1 min-w-0">
          {SECTION_MAP[activeSection]}
        </div>
      </div>
    </AppShell>
  );
}
