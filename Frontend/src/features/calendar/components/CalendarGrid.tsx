import { useState } from 'react';
import { Clock, MapPin, LayoutGrid, AlignJustify, Calendar } from 'lucide-react';
import { ChevronLeft, ChevronRight } from '../../../components/ui/Icon.tsx';
import { DayCell } from './DayCell.tsx';
import type { CalendarDayData } from '../types.ts';
import type { DayStatus } from '../../../types/index.ts';

// ── Shared data ───────────────────────────────────────────────────────────────

interface DayOverride { status: DayStatus; eventLabel?: string; }

const JUNE_2026_OVERRIDES: Record<number, DayOverride> = {
  3:  { status: 'accepted', eventLabel: '☕ Coffee w/ Mia' },
  5:  { status: 'blocked',  eventLabel: 'Busy' },
  7:  { status: 'blocked',  eventLabel: "🎂 Jake's Bday" },
  10: { status: 'accepted', eventLabel: '📚 Study Session' },
  12: { status: 'accepted', eventLabel: '🍽️ Dinner w/ All' },
  13: { status: 'accepted', eventLabel: '❤️' },
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
  day: number; label: string; time: string;
  location: string; status: 'accepted' | 'pending'; with: string;
}

const JUNE_MEETUPS: MeetupItem[] = [
  { day: 3,  label: '☕ Coffee w/ Mia',  time: '10:00 AM', location: 'The Daily Grind Cafe', status: 'accepted', with: 'Mia' },
  { day: 10, label: '📚 Study Session',  time: '2:00 PM',  location: 'Central Library',      status: 'accepted', with: 'Sara, Jake' },
  { day: 12, label: '🍽️ Dinner w/ All', time: '7:30 PM',  location: 'Bella Napoli',         status: 'accepted', with: 'Mia, Sara, Jake, Lily' },
  { day: 14, label: "💕 Valentine's",    time: '6:00 PM',  location: 'Rooftop Lounge',       status: 'accepted', with: 'Lily' },
  { day: 17, label: '🎉 CNY Day 1',      time: '12:00 PM', location: 'Family Home',          status: 'accepted', with: 'Everyone' },
  { day: 18, label: '🎉 CNY Day 2',      time: '11:00 AM', location: 'Chinatown',            status: 'accepted', with: 'Mia, Tom' },
  { day: 20, label: '🎬 Movie Marathon', time: '4:00 PM',  location: 'CinePlex Downtown',    status: 'pending',  with: 'Jake' },
  { day: 25, label: '🌿 Brunch',         time: '11:00 AM', location: 'The Green Spot',       status: 'accepted', with: 'Sara' },
];

const WEEK_DAYS_SHORT = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const HOURS = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];

// June 2026 week 2: Jun 8–14 (includes today Jun 14)
const WEEK_DAYS_DATA = [8,9,10,11,12,13,14];

type ViewMode = 'monthly' | 'weekly' | 'daily';

// ── Meetup list (shared bottom) ───────────────────────────────────────────────

function MeetupList({ meetups }: { meetups: MeetupItem[] }) {
  if (meetups.length === 0) return (
    <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>No meetups</p>
  );
  return (
    <div className="flex flex-col gap-2">
      {meetups.map((m) => (
        <div key={`${m.day}-${m.label}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer"
          style={{
            backgroundColor: m.status === 'pending' ? '#faf5ff' : 'var(--color-tertiary)',
            border: m.status === 'pending' ? '1px dashed #c084fc' : '1px solid var(--color-primary-light)',
          }}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: m.status === 'pending' ? '#c084fc' : 'var(--color-primary)' }}>
            {m.day}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-h)' }}>{m.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text)' }}>
                <Clock size={9} />{m.time}
              </span>
              <span className="flex items-center gap-1 text-[10px] truncate" style={{ color: 'var(--text)' }}>
                <MapPin size={9} />{m.location}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
            style={m.status === 'pending'
              ? { backgroundColor: '#ede9fe', color: '#7c3aed' }
              : { backgroundColor: 'var(--color-primary)', color: '#ffffff' }}>
            {m.status === 'pending' ? 'Pending' : 'Planned'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Monthly view ──────────────────────────────────────────────────────────────

function MonthlyView() {
  const cells: CalendarDayData[] = [];
  for (let d = 1; d <= 30; d++) {
    const override = JUNE_2026_OVERRIDES[d];
    cells.push({ day: d, date: `2026-06-${String(d).padStart(2,'0')}`, status: override?.status ?? 'available', eventLabel: override?.eventLabel, isCurrentMonth: true });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) for (let i = 0; i < 7 - remainder; i++)
    cells.push({ day: 0, date: '', status: 'available', isCurrentMonth: false });

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEK_DAYS_SHORT.map(d => (
          <div key={d} className="py-1.5 text-center text-[10px] font-bold uppercase tracking-widest rounded-lg"
            style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-tertiary)' }}>
            {d}
          </div>
        ))}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 flex-1" role="grid" style={{ gridAutoRows: '1fr' }}>
        {cells.map((day, idx) => (
          <DayCell key={day.date || `pad-${idx}`} data={day} isToday={day.date === '2026-06-14'} />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {[
          { label: 'Available', bg: 'var(--bg)', border: '1px solid #f0e6ec', text: 'var(--text)' },
          { label: 'Planned',   bg: 'var(--color-tertiary)', border: '1.5px solid var(--color-primary-light)', text: 'var(--color-primary-dark)' },
          { label: 'Pending',   bg: '#faf5ff', border: '1.5px dashed #c084fc', text: '#7c3aed' },
          { label: 'Blocked',   bg: '#f3f4f6', border: '1px solid #e5e7eb',   text: '#9ca3af' },
        ].map(({ label, bg, border, text }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-md" style={{ backgroundColor: bg, border }} aria-hidden="true" />
            <span className="text-[10px] font-medium" style={{ color: text }}>{label}</span>
          </div>
        ))}
      </div>
      {/* Meetup list */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
          This Month's Meetups
        </p>
        <MeetupList meetups={JUNE_MEETUPS} />
      </div>
    </div>
  );
}

// ── Weekly view ───────────────────────────────────────────────────────────────

function WeeklyView() {
  const meetupsByDay: Record<number, MeetupItem[]> = {};
  JUNE_MEETUPS.forEach(m => {
    if (!meetupsByDay[m.day]) meetupsByDay[m.day] = [];
    meetupsByDay[m.day].push(m);
  });

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--text)' }}>
        Week of Jun 8 – Jun 14, 2026
      </p>
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {WEEK_DAYS_DATA.map((day, i) => {
          const isToday = day === 14;
          const override = JUNE_2026_OVERRIDES[day];
          const dayMeetups = meetupsByDay[day] ?? [];
          return (
            <div key={day} className="flex flex-col gap-1.5">
              {/* Day header */}
              <div className="flex flex-col items-center py-2 rounded-xl"
                style={{
                  backgroundColor: isToday ? 'var(--color-primary)' : 'var(--color-tertiary)',
                  border: isToday ? '2px solid var(--color-primary-dark)' : '1px solid var(--border)',
                }}>
                <span className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-primary)' }}>
                  {WEEK_DAYS_SHORT[i]}
                </span>
                <span className="text-base font-bold leading-none"
                  style={{ color: isToday ? 'var(--bg)' : 'var(--text-h)' }}>
                  {day}
                </span>
                {isToday && <span className="text-[8px] text-white opacity-80">Today</span>}
              </div>

              {/* Day body */}
              <div className="flex-1 rounded-xl p-1.5 flex flex-col gap-1 min-h-[160px]"
                style={{
                  backgroundColor: override?.status === 'blocked' ? '#f3f4f6'
                    : override?.status === 'pending' ? '#faf5ff'
                    : 'var(--bg)',
                  border: override?.status === 'pending' ? '1.5px dashed #c084fc'
                    : '1px solid var(--border)',
                }}>
                {dayMeetups.length === 0 && !override && (
                  <p className="text-[9px] text-center mt-4" style={{ color: 'var(--border)' }}>free</p>
                )}
                {override?.status === 'blocked' && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-center"
                    style={{ backgroundColor: '#e5e7eb', color: '#9ca3af' }}>
                    {override.eventLabel ?? 'Busy'}
                  </span>
                )}
                {dayMeetups.map(m => (
                  <div key={m.label} className="rounded-lg px-1.5 py-1"
                    style={{ backgroundColor: m.status === 'pending' ? '#ede9fe' : '#fff0f6' }}>
                    <p className="text-[9px] font-bold truncate"
                      style={{ color: m.status === 'pending' ? '#7c3aed' : 'var(--color-primary-dark)' }}>
                      {m.label}
                    </p>
                    <p className="text-[8px]" style={{ color: 'var(--text)' }}>{m.time}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meetup list */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
          This Week's Meetups
        </p>
        <MeetupList meetups={JUNE_MEETUPS.filter(m => WEEK_DAYS_DATA.includes(m.day))} />
      </div>
    </div>
  );
}

// ── Daily view ────────────────────────────────────────────────────────────────

const HOUR_MEETUPS: Record<string, MeetupItem> = {
  '6:00 PM': JUNE_MEETUPS.find(m => m.day === 14)!,
};

function DailyView() {
  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Day header */}
      <div className="flex items-center justify-center gap-3 py-3 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', boxShadow: '0 4px 12px var(--accent-border)' }}>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.75)' }}>Sunday</p>
          <p className="text-3xl font-bold text-white leading-none">14</p>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>June 2026 · Today</p>
        </div>
      </div>

      {/* Hour slots */}
      <div className="flex flex-col gap-0 overflow-y-auto flex-1" style={{ maxHeight: '420px' }}>
        {HOURS.map((hour) => {
          const meetup = HOUR_MEETUPS[hour];
          return (
            <div key={hour} className="flex gap-3 items-start py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              {/* Time label */}
              <span className="text-[10px] font-semibold w-12 shrink-0 pt-0.5 text-right"
                style={{ color: 'var(--text)' }}>
                {hour}
              </span>
              {/* Slot */}
              {meetup ? (
                <div className="flex-1 rounded-xl px-3 py-2"
                  style={{
                    backgroundColor: meetup.status === 'pending' ? '#faf5ff' : 'var(--color-tertiary)',
                    border: meetup.status === 'pending' ? '1.5px dashed #c084fc' : '1.5px solid var(--color-primary-light)',
                  }}>
                  <p className="text-xs font-bold" style={{ color: meetup.status === 'pending' ? '#7c3aed' : 'var(--color-primary-dark)' }}>
                    {meetup.label}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text)' }}>
                      <MapPin size={9} />{meetup.location}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text)' }}>with {meetup.with}</p>
                </div>
              ) : (
                <div className="flex-1 h-8 rounded-lg cursor-pointer transition-colors hover:bg-pink-50"
                  style={{ border: '1px dashed transparent' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Meetup list */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
          Today's Meetups
        </p>
        <MeetupList meetups={JUNE_MEETUPS.filter(m => m.day === 14)} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: 'daily',   label: 'Day',   icon: Calendar },
  { key: 'weekly',  label: 'Week',  icon: AlignJustify },
  { key: 'monthly', label: 'Month', icon: LayoutGrid },
];

export function CalendarGrid() {
  const [view, setView] = useState<ViewMode>('monthly');
  const YEAR = 2026;
  const MONTH = 5;
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(YEAR, MONTH, 1));

  return (
    <section className="flex flex-col gap-4 flex-1 h-full" aria-label={`Calendar for ${monthName} ${YEAR}`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" aria-label="Previous"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}>
          <ChevronLeft size={16} />
        </button>

        <div className="text-center flex-1">
          <div className="flex items-baseline justify-center gap-2">
            <h2 className="font-bold leading-none tracking-tight" style={{ color: 'var(--text-h)', fontSize: '26px', margin: 0 }}>
              {view === 'daily' ? 'June 14' : monthName}
            </h2>
            <span className="font-semibold" style={{ color: 'var(--color-primary)', fontSize: '16px' }}>{YEAR}</span>
          </div>
          <p className="mt-1 text-[10px] tracking-wide" style={{ color: 'var(--text)' }}>
            your personal calendar ✨
          </p>
        </div>

        <button type="button" aria-label="Next"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* View toggle */}
      <div className="flex justify-center">
        <div className="flex items-center gap-0.5 p-1 rounded-full"
          style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
          role="group" aria-label="Calendar view">
          {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setView(key)}
              aria-pressed={view === key}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
              style={view === key
                ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', boxShadow: '0 2px 8px var(--accent-border)' }
                : { color: 'var(--text)' }}>
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* View content — key triggers remount → smooth slide-in */}
      <div
        key={view}
        className="flex flex-col flex-1 gap-4"
        style={{ animation: 'calendarViewIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards' }}
      >
        {view === 'monthly' && <MonthlyView />}
        {view === 'weekly'  && <WeeklyView />}
        {view === 'daily'   && <DailyView />}
      </div>
    </section>
  );
}
