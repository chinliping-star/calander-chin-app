import { useState, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { SettingsSidebar } from '../components/SettingsSidebar.tsx';
import { ToggleSwitch } from '../components/ToggleSwitch.tsx';
import type { SettingsSection } from '../components/SettingsSidebar.tsx';

// ─── Section: Profile ────────────────────────────────────────────────────────

function ProfileSection() {
  const [displayName, setDisplayName] = useState('Muneb');
  const [username, setUsername] = useState('@muneb.star');
  const [bio, setBio] = useState(
    "Social enthusiast and diary keeper. Let's make every meetup count!",
  );
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const smallLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--text)',
    display: 'block',
    marginBottom: '6px',
  };

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section aria-labelledby="profile-section-heading">
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        }}
      >
        <h2 id="profile-section-heading" style={{ color: 'var(--text-h)', margin: '0 0 20px', fontSize: '16px' }}>
          Profile
        </h2>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img
                src="https://i.pravatar.cc/150?img=3"
                alt="Your avatar"
                className="h-[72px] w-[72px] rounded-full object-cover"
                width={72}
                height={72}
              />
              <button
                type="button"
                aria-label="Edit profile photo"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Pencil size={11} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Upload profile photo"
              />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
                {displayName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                {username}
              </p>
            </div>
          </div>

          {/* Name + Username row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="display-name" style={smallLabelStyle}>
                Display Name
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="username" style={smallLabelStyle}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" style={smallLabelStyle}>
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saved ? 'Saved!' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// ─── Section: Privacy ────────────────────────────────────────────────────────

function PrivacySection() {
  const [privateAccount, setPrivateAccount] = useState(true);
  const [friendRequests, setFriendRequests] = useState(false);
  const [discoverability, setDiscoverability] = useState(true);

  return (
    <section aria-labelledby="privacy-section-heading">
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <h2 id="privacy-section-heading" style={{ color: 'var(--text-h)', margin: 0, fontSize: '16px' }}>
            Privacy
          </h2>
        </div>
        <div
          className="h-0.5 w-8 rounded mb-4"
          style={{ backgroundColor: 'var(--color-primary)' }}
          aria-hidden="true"
        />

        <ToggleSwitch
          id="private-account"
          checked={privateAccount}
          onChange={setPrivateAccount}
          label="Private Account"
          description="Only friends can see your calendar and past meetups."
        />
        <ToggleSwitch
          id="friend-requests"
          checked={friendRequests}
          onChange={setFriendRequests}
          label="Friend Requests"
          description="Allow anyone to send you friend requests."
        />
        <div style={{ borderBottom: 'none' }}>
          <ToggleSwitch
            id="discoverability"
            checked={discoverability}
            onChange={setDiscoverability}
            label="Discoverability"
            description="Show your profile in 'Discover' for people nearby."
          />
        </div>
      </div>
    </section>
  );
}

// ─── Section: Notifications ──────────────────────────────────────────────────

interface NotifCheckbox {
  id: string;
  label: string;
  checked: boolean;
}

function NotificationsSection() {
  const [emailNotifs, setEmailNotifs] = useState<NotifCheckbox[]>([
    { id: 'email-invites', label: 'New Meetup Invites', checked: true },
    { id: 'email-reminders', label: 'Meetup Reminders', checked: true },
    { id: 'email-digest', label: 'Weekly Digests', checked: false },
  ]);
  const [pushNotifs, setPushNotifs] = useState<NotifCheckbox[]>([
    { id: 'push-messages', label: 'Instant Messages', checked: true },
    { id: 'push-activity', label: 'Activity Updates', checked: true },
    { id: 'push-app', label: 'App Updates', checked: false },
  ]);

  function toggleEmail(id: string) {
    setEmailNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, checked: !n.checked } : n)),
    );
  }

  function togglePush(id: string) {
    setPushNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, checked: !n.checked } : n)),
    );
  }

  const smallLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--text)',
    display: 'block',
    marginBottom: '12px',
  };

  return (
    <section aria-labelledby="notif-section-heading">
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        }}
      >
        <h2 id="notif-section-heading" style={{ color: 'var(--text-h)', margin: '0 0 20px', fontSize: '16px' }}>
          Notifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Email */}
          <div>
            <p style={smallLabelStyle}>Email Notifications</p>
            <ul className="flex flex-col gap-3" role="list">
              {emailNotifs.map((n) => (
                <li key={n.id} className="flex items-center gap-3">
                  <input
                    id={n.id}
                    type="checkbox"
                    checked={n.checked}
                    onChange={() => toggleEmail(n.id)}
                    className="h-4 w-4 rounded focus-visible:outline-none focus-visible:ring-2 cursor-pointer"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor={n.id} className="text-sm cursor-pointer" style={{ color: 'var(--text-h)' }}>
                    {n.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Push */}
          <div>
            <p style={smallLabelStyle}>Push Notifications</p>
            <ul className="flex flex-col gap-3" role="list">
              {pushNotifs.map((n) => (
                <li key={n.id} className="flex items-center gap-3">
                  <input
                    id={n.id}
                    type="checkbox"
                    checked={n.checked}
                    onChange={() => togglePush(n.id)}
                    className="h-4 w-4 rounded focus-visible:outline-none focus-visible:ring-2 cursor-pointer"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor={n.id} className="text-sm cursor-pointer" style={{ color: 'var(--text-h)' }}>
                    {n.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Account ────────────────────────────────────────────────────────

function AccountSection() {
  const outlinedBtnStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: '9999px',
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-h)',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
  };

  return (
    <section aria-labelledby="account-section-heading">
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        }}
      >
        <h2 id="account-section-heading" style={{ color: 'var(--text-h)', margin: '0 0 20px', fontSize: '16px' }}>
          Account
        </h2>

        {/* Security */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>
            Security
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" style={outlinedBtnStyle} className="hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 rounded-full transition-opacity">
              Change Password
            </button>
            <button type="button" style={outlinedBtnStyle} className="hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 rounded-full transition-opacity">
              Two-Factor Auth
            </button>
          </div>
        </div>

        <div
          className="pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#dc2626' }}>
              Danger Zone
            </p>
            <button
              type="button"
              className="px-5 py-2 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{
                border: '1px solid #dc2626',
                color: '#dc2626',
                backgroundColor: 'transparent',
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  return (
    <AppShell >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start pb-12">
        {/* Sidebar */}
        <div className="lg:w-48 lg:shrink-0">
          <SettingsSidebar active={activeSection} onSelect={setActiveSection} />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <ProfileSection />
          <PrivacySection />
          <NotificationsSection />
          <AccountSection />
        </div>
      </div>
    </AppShell>
  );
}
