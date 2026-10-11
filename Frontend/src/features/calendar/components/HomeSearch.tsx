import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, MapPin } from 'lucide-react';
import type { ApiMeetup } from '../api/calendar.api.ts';

interface Props {
  meetups: ApiMeetup[];
  /** Jump the calendar to this date (YYYY-MM-DD) and open the day. */
  onPick: (date: string) => void;
}

const MAX_RESULTS = 8;

function matches(m: ApiMeetup, needle: string): boolean {
  const people = [m.proposer_id, m.owner_id, ...(m.participants ?? [])].filter(Boolean);
  const haystack = [
    m.title,
    m.location ?? '',
    m.date,
    ...people.flatMap(p => [p.display_name, p.username]),
  ].join(' ').toLowerCase();
  return haystack.includes(needle);
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/** Home search: find any of your meetups by event name, friend name or place. */
export function HomeSearch({ meetups, onPick }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? meetups
        .filter(m => m.status !== 'declined' && m.status !== 'cancelled' && matches(m, needle))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, MAX_RESULTS)
    : [];

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(date: string) {
    onPick(date);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor="home-search" className="sr-only">Search your meetups</label>
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text)' }} />
      <input
        id="home-search"
        type="text"
        role="combobox"
        aria-expanded={open && !!needle}
        aria-controls="home-search-results"
        autoComplete="off"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && results[0]) pick(results[0].date);
        }}
        placeholder="Search events or friends…"
        className="w-full rounded-full py-2 pl-10 pr-9 text-sm outline-none focus-visible:ring-2"
        style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { setQuery(''); setOpen(false); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: 'var(--text)' }}
        >
          <X size={13} />
        </button>
      )}

      {open && needle && (
        <ul
          id="home-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-30 flex flex-col overflow-hidden rounded-2xl py-1"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(74,62,78,0.14)' }}
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>No events match "{query.trim()}".</li>
          ) : results.map(m => (
            <li key={m._id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => pick(m.date)}
                className="w-full flex flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-[var(--accent-bg)] focus-visible:outline-none focus-visible:bg-[var(--accent-bg)]"
              >
                <span className="text-sm font-semibold truncate w-full" style={{ color: 'var(--text-h)' }}>{m.title}</span>
                <span className="flex items-center gap-2 text-[11px] flex-wrap" style={{ color: 'var(--text)' }}>
                  <span>{formatDate(m.date)}</span>
                  {m.time && <span className="flex items-center gap-1"><Clock size={10} />{m.time}</span>}
                  {m.location && <span className="flex items-center gap-1 truncate"><MapPin size={10} />{m.location}</span>}
                  {m.status === 'pending' && (
                    <span className="font-bold px-1.5 rounded-full" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>Pending</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
