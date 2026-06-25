import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Clock, MapPin, Calendar } from 'lucide-react';
import { ChevronLeft, ChevronRight } from '../../../components/ui/Icon.tsx';
import { DayCell, type DayCellMeetup } from '../../calendar/components/DayCell.tsx';
import { DayDetailModal, type DayMeetupRow } from '../../calendar/components/DayDetailModal.tsx';
import type { CalendarDayData } from '../../calendar/types.ts';
import type { DayStatus } from '../../../types/index.ts';
import type { ProfileMeetup } from '../api/profile.api.ts';

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** Read-only detail popup for one of a friend's meetups. */
function ProfileMeetupDetailModal({ meetup, onClose }: { meetup: ProfileMeetup; onClose: () => void }) {
  const pending = meetup.status === 'pending';
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,10,20,0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Meetup details"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl p-7 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg)', border: '1.5px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close meetup details"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-80"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)' }}
        >
          <X size={14} />
        </button>

        <span
          className="self-start text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
          style={pending ? { backgroundColor: '#ede9fe', color: '#7c3aed' } : { backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {pending ? 'Pending' : 'Confirmed'}
        </span>
        <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-h)' }}>{meetup.title}</h3>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
            <Calendar size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>{meetup.date}</span>
          </div>
          {meetup.time && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <Clock size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{meetup.time}</span>
            </div>
          )}
          {meetup.location && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <MapPin size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{meetup.location}</span>
            </div>
          )}
          {meetup.with && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <span aria-hidden="true">👥</span>
              <span>with <strong style={{ color: 'var(--text-h)' }}>{meetup.with.display_name}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Read-only month calendar for a friend's profile. Plots their meetups onto the
 * grid; tapping a meetup opens its detail, tapping a day opens a day popup with
 * a Propose action.
 */
export function ProfileMeetupCalendar({ meetups }: { meetups: ProfileMeetup[] }) {
  const navigate = useNavigate();
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [activeMeetup, setActiveMeetup] = useState<ProfileMeetup | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Group meetups by date string, mapped to lightweight chips.
  const byDate: Record<string, DayCellMeetup[]> = {};
  for (const m of meetups) {
    const chip: DayCellMeetup = {
      id: m._id,
      label: m.title,
      status: m.status === 'pending' ? 'pending' : 'accepted',
    };
    (byDate[m.date] ??= []).push(chip);
  }

  function openMeetup(date: string, label: string) {
    const found = meetups.find(m => m.date === date && m.title === label) ?? meetups.find(m => m.date === date);
    if (found) setActiveMeetup(found);
  }

  // Build the cell grid (Mon-first), padding to whole weeks.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayJS = new Date(year, month, 1).getDay(); // 0=Sun
  const startPad = firstDayJS === 0 ? 6 : firstDayJS - 1;

  const cells: CalendarDayData[] = [];
  for (let i = 0; i < startPad; i++)
    cells.push({ day: 0, date: '', status: 'available', isCurrentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status: DayStatus = byDate[dateStr]?.length ? 'accepted' : 'available';
    cells.push({ day: d, date: dateStr, status, isCurrentMonth: true });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0)
    for (let i = 0; i < 7 - remainder; i++)
      cells.push({ day: 0, date: '', status: 'available', isCurrentMonth: false });

  // Map this profile's meetups to the shared DayDetailModal row shape.
  const dayRows: DayMeetupRow[] = activeDay
    ? meetups
        .filter(m => m.date === activeDay)
        .map(m => ({
          id: m._id,
          label: m.title,
          time: m.time ?? '',
          location: m.location ?? '',
          status: m.status === 'pending' ? 'pending' : 'accepted',
          date: m.date,
        }))
    : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Header + month nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={15} />
        </button>
        <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{monthName}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1">
        {WEEK_DAYS.map(d => (
          <div
            key={d}
            className="py-1 text-center text-[9px] font-bold uppercase tracking-widest rounded-lg"
            style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-tertiary)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid — read-only */}
      <div className="grid grid-cols-7 gap-1 [grid-auto-rows:minmax(56px,1fr)]" role="grid">
        {cells.map((cell, idx) => (
          <DayCell
            key={cell.date || `pad-${idx}`}
            data={cell}
            isToday={cell.date === todayStr}
            isOwn={false}
            meetups={byDate[cell.date] ?? []}
            onMeetupClick={(info) => openMeetup(info.date, info.eventLabel)}
            onDayOpen={(d) => setActiveDay(d)}
          />
        ))}
      </div>

      {activeMeetup && (
        <ProfileMeetupDetailModal meetup={activeMeetup} onClose={() => setActiveMeetup(null)} />
      )}

      {activeDay && (
        <DayDetailModal
          date={activeDay}
          meetups={dayRows}
          isOwn={false}
          onClose={() => setActiveDay(null)}
          onMeetupClick={(info) => { setActiveDay(null); openMeetup(info.date, info.eventLabel); }}
          onPropose={(d) => navigate(`/meetups/propose?date=${d}`)}
        />
      )}
    </div>
  );
}
