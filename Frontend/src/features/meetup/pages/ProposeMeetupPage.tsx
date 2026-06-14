import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, BookmarkPlus } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { MoodPicker } from '../components/MoodPicker.tsx';
import { FriendSelector } from '../components/FriendSelector.tsx';
import { ProposedSlot, useProposedSlots } from '../components/ProposedSlot.tsx';
import type { MoodTheme } from '../types.ts';

const LOCATION_IMAGE = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400';

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

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-h)',
  display: 'block',
  marginBottom: '6px',
};

export function ProposeMeetupPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Coffee & Catch-up');
  const [intent, setIntent] = useState(
    "Let's grab a latte and talk about the upcoming weekend plans...",
  );
  const [mood, setMood] = useState<MoodTheme | null>('chill');
  const [selectedFriends, setSelectedFriends] = useState<string[]>(['1', '2']);

  const { slots, addSlot, updateSlot } = useProposedSlots();

  const firstSlot = slots[0];
  const locationName = firstSlot?.location ?? '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(`Proposal for "${title}" sent!`);
  }

  return (
    <AppShell >
      <form onSubmit={handleSubmit} className="pb-28">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* The Idea card */}
            <div
              className="rounded-2xl p-6 flex flex-col gap-5"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
              }}
            >
              <h2 style={{ color: 'var(--text-h)', margin: 0, fontSize: '16px' }}>
                💡 The Idea
              </h2>

              {/* Title */}
              <div>
                <label htmlFor="proposal-title" style={labelStyle}>
                  Title
                </label>
                <input
                  id="proposal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                  aria-required="true"
                />
              </div>

              {/* Intent */}
              <div>
                <label htmlFor="proposal-intent" style={labelStyle}>
                  The Intent
                </label>
                <textarea
                  id="proposal-intent"
                  rows={3}
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }}
                />
              </div>

              {/* Mood picker */}
              <MoodPicker value={mood} onChange={setMood} />
            </div>

            {/* With Whom card */}
            <FriendSelector selected={selectedFriends} onChange={setSelectedFriends} />
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-6">
            {/* Proposed Slots */}
            <ProposedSlot slots={slots} onAdd={addSlot} onUpdate={updateSlot} />

            {/* Location Preview card */}
            <section aria-label="Location preview">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
                }}
              >
                <div className="relative h-44">
                  <img
                    src={LOCATION_IMAGE}
                    alt="Coffee shop location preview"
                    className="h-full w-full object-cover"
                    width={400}
                    height={176}
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-4"
                    style={{
                      background: 'linear-gradient(to top, rgba(74,62,78,0.8) 0%, transparent 60%)',
                    }}
                    aria-hidden="true"
                  >
                    <p className="text-sm font-bold text-white leading-tight">
                      {locationName || 'The Daily Grind Cafe'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      134 Boutique St, Downtown
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-h)' }}>
                    Location Preview
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
                    {locationName || 'The Daily Grind Cafe'} · 134 Boutique St, Downtown
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </form>

      {/* ── Sticky bottom bar ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-4 lg:px-12"
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 24px rgba(74,62,78,0.10)',
        }}
      >
        <button
          type="submit"
          form="propose-form"
          onClick={handleSubmit}
          className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Send size={15} />
          Send Proposal
        </button>
        <button
          type="button"
          onClick={() => navigate('/meetups/saved')}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--text-h)',
            backgroundColor: 'transparent',
          }}
        >
          <BookmarkPlus size={15} />
          Save for Later
        </button>
      </div>
    </AppShell>
  );
}
