import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, BookmarkPlus, BookOpen } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { MoodPicker } from '../components/MoodPicker.tsx';
import { FriendSelector } from '../components/FriendSelector.tsx';
import { ProposedSlot, useProposedSlots } from '../components/ProposedSlot.tsx';
import type { MoodTheme } from '../types.ts';
import { useAuthStore } from '../../../store/auth.ts';

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

function loadDraftById(id: string) {
  try {
    const raw = localStorage.getItem('friendiary-drafts');
    if (!raw) return null;
    const drafts = JSON.parse(raw) as Array<{
      id: string; title: string; intent: string; mood: MoodTheme | null;
      slots: { id: string; date: string; time: string; location: string }[];
      friendIds: string[];
    }>;
    return drafts.find(d => d.id === id) ?? null;
  } catch { return null; }
}

export function ProposeMeetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillDate = searchParams.get('date') ?? '';
  const draftId = searchParams.get('draft') ?? '';

  const draft = draftId ? loadDraftById(draftId) : null;

  const [title, setTitle] = useState(draft?.title ?? '');
  const [intent, setIntent] = useState(draft?.intent ?? '');
  const [mood, setMood] = useState<MoodTheme | null>(draft?.mood ?? null);
  const [selectedFriends, setSelectedFriends] = useState<string[]>(draft?.friendIds ?? []);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const { user } = useAuthStore();

  const { slots, addSlot, removeSlot, updateSlot } = useProposedSlots(
    draft?.slots?.[0]?.date || prefillDate,
    draft?.slots,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setToast({ msg: 'Please add a title before sending.', type: 'error' }); return; }
    setToast({ msg: `Proposal "${title}" sent! 🎉`, type: 'success' });
  }

  function handleSaveDraft() {
    const hasContent = title.trim() || intent.trim() || slots.some(s => s.date || s.time || s.location);
    if (!hasContent) {
      setToast({ msg: 'Add a title or at least one slot before saving.', type: 'error' });
      return;
    }
    const updatedDraft = {
      id: draftId || String(Date.now()),
      title: title.trim() || 'Untitled Proposal',
      intent,
      mood,
      slots,
      location: slots[0]?.location ?? '',
      friendIds: selectedFriends,
      savedAt: new Date().toISOString(),
      savedBy: user?.username ?? '',
    };
    const existing = JSON.parse(localStorage.getItem('friendiary-drafts') ?? '[]') as typeof updatedDraft[];
    const updated = draftId
      ? existing.map(d => d.id === draftId ? updatedDraft : d)
      : [updatedDraft, ...existing];
    localStorage.setItem('friendiary-drafts', JSON.stringify(updated));
    navigate('/meetups/propose/saved');
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
                backgroundColor: 'var(--bg)',
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
            <ProposedSlot slots={slots} onAdd={addSlot} onRemove={removeSlot} onUpdate={updateSlot} />

          </div>
        </div>
      </form>

      {/* ── Error modal (centered) ───────────────────────────────────────── */}
      {toast && toast.type === 'error' && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(74,62,78,0.35)', backdropFilter: 'blur(3px)' }}
          onClick={() => setToast(null)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl px-8 py-7 text-center"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1.5px solid var(--color-primary-light)',
              boxShadow: '0 16px 48px rgba(255,127,177,0.25)',
              maxWidth: '360px',
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <span style={{ fontSize: '36px' }}>⚠️</span>
            <div>
              <p className="font-bold text-base" style={{ color: 'var(--text-h)', margin: '0 0 6px' }}>
                Missing Details
              </p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{toast.msg}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Success toast (bottom) ───────────────────────────────────────── */}
      {toast && toast.type === 'success' && (
        <div
          className="fixed bottom-24 left-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg"
          style={{
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-tertiary)',
            border: '1.5px solid var(--color-primary-light)',
            color: 'var(--color-primary-dark)',
            boxShadow: '0 8px 32px rgba(255,127,177,0.2)',
          }}
        >
          <span className="text-base">✅</span>
          <p className="text-sm font-semibold">{toast.msg}</p>
        </div>
      )}

      {/* ── Sticky bottom bar ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-4 lg:px-12"
        style={{
          backgroundColor: 'var(--bg)',
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
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
          <button
            type="button"
            onClick={() => navigate('/meetups/propose/saved')}
            className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--color-primary)',
              backgroundColor: 'transparent',
            }}
          >
            <BookOpen size={15} />
            Saved Drafts
          </button>
        </div>
      </div>
    </AppShell>
  );
}
