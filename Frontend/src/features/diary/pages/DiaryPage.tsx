import { useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { DiaryEntry } from '../components/DiaryEntry.tsx';
import { NewEntryModal } from '../components/NewEntryModal.tsx';
import { cn } from '../../../lib/utils.ts';
import type { DiaryEntryData, DiaryVisibility, NewDiaryEntryForm } from '../types.ts';

// ---------------------------------------------------------------------------
// Fake seed data
// ---------------------------------------------------------------------------
const SEED_ENTRIES: DiaryEntryData[] = [
  {
    id: 'd1',
    friend: 'Mia Thompson',
    friendAvatar: 'https://i.pravatar.cc/150?img=5',
    date: 'Jun 7, 2025',
    location: 'Brew & Co.',
    visibility: 'public',
    text: 'Had the most amazing morning with Mia. We talked for hours over lattes — about life, dreams, and our plans for summer. These are the moments that make weekdays worth it. Brew & Co. has become our unofficial office.',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
  },
  {
    id: 'd2',
    friend: 'Jake Rivera',
    friendAvatar: 'https://i.pravatar.cc/150?img=12',
    date: 'Jun 3, 2025',
    location: 'Riverside Park',
    visibility: 'friends',
    text: 'Early morning run with Jake. Cold start but we pushed through 8km along the river. The sunrise at the bridge was absolutely worth waking up at 5:30 for. Feeling proud of us both.',
  },
  {
    id: 'd3',
    friend: 'Lily Anderson',
    friendAvatar: 'https://i.pravatar.cc/150?img=20',
    date: 'May 28, 2025',
    location: 'Sakura Bistro',
    visibility: 'private',
    text: 'Lily surprised me with this restaurant booking. The food was incredible — we tried the omakase menu and every dish was a poem. We stayed until they started stacking chairs. Best evening in months.',
  },
  {
    id: 'd4',
    friend: 'Sara Mitchell',
    friendAvatar: 'https://i.pravatar.cc/150?img=10',
    date: 'May 22, 2025',
    location: 'City Library',
    visibility: 'friends',
    text: 'Productive study session with Sara. We both had deadlines but somehow being in the same space made everything easier. Good background company. Also found a book I had been looking for for months.',
    photo: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
  },
  {
    id: 'd5',
    friend: 'Tom Bradley',
    friendAvatar: 'https://i.pravatar.cc/150?img=15',
    date: 'May 18, 2025',
    location: 'Noodle House',
    visibility: 'public',
    text: 'Quick lunch with Tom between meetings. He always brings energy to every conversation. We brainstormed about a side project we have been thinking about for months. Watch this space.',
  },
  {
    id: 'd6',
    friend: 'Chloe Davis',
    friendAvatar: 'https://i.pravatar.cc/150?img=25',
    date: 'May 10, 2025',
    location: 'Riverside Park',
    visibility: 'friends',
    text: 'Morning yoga with Chloe. She is so patient teaching the harder poses. The fresh air + movement combo is unbeatable. Already planning the next session.',
  },
];

// ---------------------------------------------------------------------------
// Filter pill types
// ---------------------------------------------------------------------------
type FilterValue = 'all' | DiaryVisibility;

const FILTER_PILLS: { value: FilterValue; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'public',  label: 'Public' },
  { value: 'friends', label: 'Friends Only' },
  { value: 'private', label: 'Private' },
];

// ---------------------------------------------------------------------------
// Helper: group entries by month label for timeline separators
// ---------------------------------------------------------------------------
function getMonthLabel(dateStr: string): string {
  // dateStr is like "Jun 7, 2025" or "May 10, 2025"
  const parts = dateStr.split(' ');
  // parts[0] = month abbr, parts[2] = year
  return `${parts[0]} ${parts[2] ?? ''}`.trim();
}

// ---------------------------------------------------------------------------
// Empty state illustration component
// ---------------------------------------------------------------------------
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl text-5xl"
        style={{ backgroundColor: 'var(--accent-bg)' }}
        aria-hidden="true"
      >
        📖
      </div>
      <h3
        className="mb-2 text-xl font-bold"
        style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}
      >
        No memories yet.
      </h3>
      <p className="mb-6 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
        Start your first diary entry and capture the little moments that matter most.
      </p>
      <button
        type="button"
        onClick={onNew}
        className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 active:scale-95"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        ✍️ Write First Memory
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DiaryPage
// ---------------------------------------------------------------------------
export function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntryData[]>(SEED_ENTRIES);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [showModal, setShowModal] = useState(false);

  const filtered =
    filter === 'all' ? entries : entries.filter((e) => e.visibility === filter);

  // Group filtered entries by month for timeline separators
  const grouped: { month: string; items: DiaryEntryData[] }[] = [];
  for (const entry of filtered) {
    const month = getMonthLabel(entry.date);
    const last = grouped[grouped.length - 1];
    if (last && last.month === month) {
      last.items.push(entry);
    } else {
      grouped.push({ month, items: [entry] });
    }
  }

  function handleSave(form: NewDiaryEntryForm) {
    const newEntry: DiaryEntryData = {
      id: `d${Date.now()}`,
      friend: form.friend,
      friendAvatar:
        `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      date: form.date
        ? new Date(form.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Unknown date',
      location: form.location || '',
      visibility: form.visibility,
      text: form.text,
      photo: form.photo ? URL.createObjectURL(form.photo) : undefined,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setShowModal(false);
  }

  return (
    <AppShell>
      {/* Page header */}
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold italic"
              style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}
            >
              FriendDiary
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text)' }}>
              Your personal memory journal
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 active:scale-95"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span aria-hidden="true">✍️</span>
            New Entry
          </button>
        </div>

        {/* Filter pills */}
        <div
          role="group"
          aria-label="Filter diary entries"
          className="mb-8 flex flex-wrap gap-2"
        >
          {FILTER_PILLS.map(({ value, label }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(value)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                  'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 active:scale-95',
                )}
                style={{
                  borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                  backgroundColor: active ? 'var(--color-primary)' : 'var(--bg)',
                  color: active ? '#ffffff' : 'var(--text)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        {filtered.length === 0 ? (
          <EmptyState onNew={() => setShowModal(true)} />
        ) : (
          <div className="flex flex-col gap-0">
            {grouped.map(({ month, items }) => (
              <section key={month} aria-labelledby={`month-${month.replace(/\s/g, '-')}`}>
                {/* Month separator */}
                <div className="relative mb-4 flex items-center gap-3">
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: 'var(--border)' }}
                    aria-hidden="true"
                  />
                  <span
                    id={`month-${month.replace(/\s/g, '-')}`}
                    className="rounded-full border px-3 py-0.5 text-xs font-semibold"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--color-tertiary)',
                      color: 'var(--text)',
                    }}
                  >
                    {month}
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{ backgroundColor: 'var(--border)' }}
                    aria-hidden="true"
                  />
                </div>

                {/* Entries for this month */}
                <div className="mb-8 flex flex-col gap-4">
                  {items.map((entry) => (
                    <DiaryEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* New entry modal */}
      {showModal && (
        <NewEntryModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </AppShell>
  );
}
