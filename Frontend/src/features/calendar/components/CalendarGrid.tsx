import { Clock, MapPin } from 'lucide-react';
import { ChevronLeft, ChevronRight } from '../../../components/ui/Icon.tsx';
import { DayCell } from './DayCell.tsx';
import type { CalendarDayData } from '../types.ts';
import type { DayStatus } from '../../../types/index.ts';

// ── Mock data for June 2026 ──────────────────────────────────────────────────
// June 1 2026 is a Monday → 0 padding cells needed

interface DayOverride {
  status: DayStatus;
  eventLabel?: string;
}

const JUNE_2026_OVERRIDES: Record<number, DayOverride> = {
  3:  { status: 'accepted', eventLabel: '☕ Coffee w/ Mia' },
  5:  { status: 'blocked',  eventLabel: 'Busy' },
  7:  { status: 'blocked',  eventLabel: "🎂 Jake's Bday" },
  10: { status: 'accepted', eventLabel: '📚 Study Session' },
  12: { status: 'accepted', eventLabel: '🍽️ Dinner w/ All' },
  13: { status: 'accepted', eventLabel: "❤️" },
  14: { status: 'accepted', eventLabel: "💕 Valentine's" },
  17: { status: 'accepted', eventLabel: '🎉 CNY Day 1' },
  18: { status: 'accepted', eventLabel: '🎉 CNY Day 2' },
  20: { status: 'pending',  eventLabel: '🎬 Movie Marathon' },
  21: { status: 'blocked',  eventLabel: 'Busy' },
  22: { status: 'blocked',  eventLabel: "🎸 Tom's Gig" },
  25: { status: 'accepted', eventLabel: '🌿 Brunch' },
  28: { status: 'blocked',  eventLabel: '🎉 End of Feb Party' },
};

interface MeetupItem {
  day: number;
  label: string;
  time: string;
  location: string;
  status: 'accepted' | 'pending';
  with: string;
}

const JUNE_MEETUPS: MeetupItem[] = [
  { day: 3,  label: '☕ Coffee w/ Mia',    time: '10:00 AM', location: 'The Daily Grind Cafe', status: 'accepted', with: 'Mia' },
  { day: 10, label: '📚 Study Session',    time: '2:00 PM',  location: 'Central Library',       status: 'accepted', with: 'Sara, Jake' },
  { day: 12, label: '🍽️ Dinner w/ All',   time: '7:30 PM',  location: 'Bella Napoli',          status: 'accepted', with: 'Mia, Sara, Jake, Lily' },
  { day: 14, label: "💕 Valentine's",      time: '6:00 PM',  location: 'Rooftop Lounge',        status: 'accepted', with: 'Lily' },
  { day: 17, label: '🎉 CNY Day 1',        time: '12:00 PM', location: 'Family Home',           status: 'accepted', with: 'Everyone' },
  { day: 18, label: '🎉 CNY Day 2',        time: '11:00 AM', location: 'Chinatown',             status: 'accepted', with: 'Mia, Tom' },
  { day: 20, label: '🎬 Movie Marathon',   time: '4:00 PM',  location: 'CinePlex Downtown',     status: 'pending',  with: 'Jake' },
  { day: 25, label: '🌿 Brunch',           time: '11:00 AM', location: 'The Green Spot',        status: 'accepted', with: 'Sara' },
];

function buildJune2026(): CalendarDayData[] {
  // June 2026: starts on Monday → 0 padding cells
  const PADDING_BEFORE = 0;
  const DAYS_IN_MONTH = 30;

  const cells: CalendarDayData[] = [];

  // Leading empty cells (none needed)
  for (let i = 0; i < PADDING_BEFORE; i++) {
    cells.push({ day: 0, date: '', status: 'available', isCurrentMonth: false });
  }

  // Actual days
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    const override = JUNE_2026_OVERRIDES[d];
    cells.push({
      day: d,
      date: `2026-06-${String(d).padStart(2, '0')}`,
      status: override?.status ?? 'available',
      eventLabel: override?.eventLabel,
      isCurrentMonth: true,
    });
  }

  // Trailing padding to complete last row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({ day: 0, date: '', status: 'available', isCurrentMonth: false });
    }
  }

  return cells;
}

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ── Component ────────────────────────────────────────────────────────────────

export function CalendarGrid() {
  const YEAR = 2026;
  const MONTH = 5; // June, 0-indexed

  const days = buildJune2026();

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    new Date(YEAR, MONTH, 1),
  );

  return (
    <section
      className="flex flex-col gap-4 flex-1 h-full"
      aria-label={`Calendar for ${monthName} ${YEAR}`}
    >
      {/* Month navigation header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center flex-1">
          <div className="flex items-baseline justify-center gap-2">
            <h2
              className="font-bold leading-none tracking-tight"
              style={{ color: 'var(--text-h)', fontSize: '26px', margin: 0 }}
            >
              {monthName}
            </h2>
            <span className="font-semibold" style={{ color: 'var(--color-primary)', fontSize: '16px' }}>
              {YEAR}
            </span>
          </div>
          <p className="mt-1 text-[10px] tracking-wide" style={{ color: 'var(--text)' }}>
            your personal calendar ✨
          </p>
        </div>

        <button
          type="button"
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div
        className="grid grid-cols-7 gap-1"
        role="row"
        aria-label="Days of the week"
      >
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-[10px] font-bold uppercase tracking-widest rounded-lg"
            style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-tertiary)' }}
            role="columnheader"
            aria-label={d}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid — flex-1 so rows stretch to fill remaining height */}
      <div
        className="grid grid-cols-7 gap-1 flex-1"
        role="grid"
        aria-label={`Days in ${monthName} ${YEAR}`}
        style={{ gridAutoRows: '1fr' }}
      >
        {days.map((day, idx) => (
          <DayCell
            key={day.date || `pad-${idx}`}
            data={day}
            isToday={day.date === '2026-06-14'}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {[
          { label: 'Available', bg: '#ffffff', border: '1px solid #f0e6ec', text: '#6b6375' },
          { label: 'Planned',   bg: '#fff0f6', border: '1.5px solid #ffb3ce', text: '#CC5A87' },
          { label: 'Pending',   bg: '#faf5ff', border: '1.5px dashed #c084fc', text: '#7c3aed' },
          { label: 'Blocked',   bg: '#f3f4f6', border: '1px solid #e5e7eb', text: '#9ca3af' },
        ].map(({ label, bg, border, text }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="h-4 w-4 rounded-md"
              style={{ backgroundColor: bg, border }}
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium" style={{ color: text }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Meetup list ─────────────────────────────────────────────────────── */}
      <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
          This Month's Meetups
        </p>
        <div className="flex flex-col gap-2">
          {JUNE_MEETUPS.map((m) => (
            <div
              key={`${m.day}-${m.label}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer"
              style={{
                backgroundColor: m.status === 'pending' ? '#faf5ff' : '#fff0f6',
                border: m.status === 'pending' ? '1px dashed #c084fc' : '1px solid #ffb3ce',
              }}
            >
              {/* Day badge */}
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: m.status === 'pending' ? '#c084fc' : '#FF7FB1' }}
              >
                {m.day}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-h)' }}>
                  {m.label}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text)' }}>
                    <Clock size={9} />
                    {m.time}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] truncate" style={{ color: 'var(--text)' }}>
                    <MapPin size={9} />
                    {m.location}
                  </span>
                </div>
              </div>

              {/* Status pill */}
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                style={
                  m.status === 'pending'
                    ? { backgroundColor: '#ede9fe', color: '#7c3aed' }
                    : { backgroundColor: '#FF7FB1', color: '#ffffff' }
                }
              >
                {m.status === 'pending' ? 'Pending' : 'Planned'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
