import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { BookmarkPlus, Edit3, Trash2, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import type { MoodTheme } from '../types.ts';

interface DraftMeetup {
  id: string;
  title: string;
  intent: string;
  mood: MoodTheme | null;
  date: string;
  time: string;
  location: string;
  friends: { id: string; displayName: string; avatarUrl: string }[];
  savedAt: string;
}

const MOOD_META: Record<MoodTheme, { emoji: string; label: string; bg: string; text: string }> = {
  chill:       { emoji: '🌿', label: 'Chill',       bg: '#ecfdf5', text: '#059669' },
  productive:  { emoji: '⚡', label: 'Productive',  bg: '#eff6ff', text: '#2563eb' },
  celebration: { emoji: '🎉', label: 'Celebration', bg: '#fdf4ff', text: '#9333ea' },
  dining:      { emoji: '🍽️', label: 'Dining',      bg: '#fff7ed', text: '#ea580c' },
};

const MOCK_DRAFTS: DraftMeetup[] = [
  {
    id: '1',
    title: 'Coffee & Catch-up',
    intent: "Let's grab a latte and talk about the upcoming weekend plans...",
    mood: 'chill',
    date: '2026-07-05',
    time: '10:00',
    location: 'The Daily Grind Cafe',
    friends: [
      { id: '1', displayName: 'Mia', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
      { id: '2', displayName: 'Sara', avatarUrl: 'https://i.pravatar.cc/150?img=10' },
    ],
    savedAt: '2 hours ago',
  },
  {
    id: '2',
    title: 'Team Brainstorm Session',
    intent: 'Plan the new project roadmap together over lunch.',
    mood: 'productive',
    date: '2026-07-10',
    time: '13:00',
    location: 'WeWork Downtown',
    friends: [
      { id: '3', displayName: 'Jake', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
    ],
    savedAt: 'Yesterday',
  },
  {
    id: '3',
    title: "Lily's Birthday Dinner",
    intent: 'Surprise dinner at her favourite Italian place!',
    mood: 'celebration',
    date: '2026-07-18',
    time: '19:30',
    location: 'Bella Napoli Restaurant',
    friends: [
      { id: '1', displayName: 'Mia', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
      { id: '2', displayName: 'Sara', avatarUrl: 'https://i.pravatar.cc/150?img=10' },
      { id: '3', displayName: 'Jake', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
    ],
    savedAt: '3 days ago',
  },
];

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function SavedDraftsPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftMeetup[]>(MOCK_DRAFTS);

  function deleteDraft(id: string) {
    setDrafts(prev => prev.filter(d => d.id !== id));
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none"
            style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-h)', margin: 0 }}>
              Saved for Later
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>
              {drafts.length} draft{drafts.length !== 1 ? 's' : ''} waiting to be sent
            </p>
          </div>
          <div
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-tertiary)' }}
          >
            <BookmarkPlus size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
        </div>

        {/* Empty state */}
        {drafts.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-2xl p-16 text-center"
            style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)' }}
          >
            <span className="text-5xl">📭</span>
            <div>
              <p className="font-bold text-base" style={{ color: 'var(--text-h)' }}>No saved drafts</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                Proposals you save will appear here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/meetups/propose')}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Create a Proposal
            </button>
          </div>
        )}

        {/* Draft cards */}
        <div className="flex flex-col gap-4">
          {drafts.map(draft => {
            const mood = draft.mood ? MOOD_META[draft.mood] : null;
            return (
              <article
                key={draft.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 12px rgba(74,62,78,0.07)',
                }}
              >
                {/* Top accent strip */}
                <div
                  className="h-1 w-full"
                  style={{ background: 'linear-gradient(90deg, #FF7FB1, #c084fc)' }}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Title + mood */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-h)', margin: 0 }}>
                        {draft.title}
                      </h2>
                      {mood && (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: mood.bg, color: mood.text }}
                        >
                          {mood.emoji} {mood.label}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate('/meetups/propose')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 focus-visible:outline-none"
                        style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
                        aria-label={`Edit draft: ${draft.title}`}
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDraft(draft.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-80 focus-visible:outline-none"
                        style={{ backgroundColor: '#fff0f0', color: '#ef4444' }}
                        aria-label={`Delete draft: ${draft.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Intent */}
                  <p
                    className="mt-2 text-sm leading-relaxed line-clamp-2"
                    style={{ color: 'var(--text)' }}
                  >
                    {draft.intent}
                  </p>

                  {/* Meta row */}
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
                      <Clock size={12} style={{ color: 'var(--color-primary)' }} />
                      {formatDate(draft.date)} · {formatTime(draft.time)}
                    </span>
                    {draft.location && (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
                        <MapPin size={12} style={{ color: 'var(--color-primary)' }} />
                        {draft.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
                      <Users size={12} style={{ color: 'var(--color-primary)' }} />
                      {draft.friends.length} invited
                    </span>
                  </div>

                  {/* Friends avatars + saved time + send button */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {draft.friends.map(f => (
                          <img
                            key={f.id}
                            src={f.avatarUrl}
                            alt={f.displayName}
                            title={f.displayName}
                            className="h-7 w-7 rounded-full object-cover border-2 border-white"
                            loading="lazy"
                          />
                        ))}
                      </div>
                      <span className="text-[11px]" style={{ color: 'var(--text)' }}>
                        Saved {draft.savedAt}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/meetups/propose')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      Send Proposal →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
