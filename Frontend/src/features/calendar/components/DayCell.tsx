import type { CSSProperties } from 'react';
import { cn } from '../../../lib/utils.ts';
import type { CalendarDayData } from '../types.ts';

interface MeetupClickInfo {
  date: string;
  eventLabel: string;
  status: string;
}

// Lightweight chip shape — a subset of the calendar's MeetupItem.
export interface DayCellMeetup {
  id: string;
  label: string;
  status: 'accepted' | 'pending';
  attendance?: 'attended' | 'missed' | 'skipped';
  color?: string; // proposer's theme colour
}

// Up to this many meetups may be planned on a single day.
const MAX_MEETUPS_PER_DAY = 4;

interface DayCellProps {
  data: CalendarDayData;
  isToday?: boolean;
  isOwn?: boolean;
  meetups?: DayCellMeetup[];
  onClick?: (data: CalendarDayData) => void;
  onNewMeetup?: (date: string) => void;
  onToggleAvailability?: (date: string, current: 'available' | 'blocked') => void;
  onMeetupClick?: (info: MeetupClickInfo) => void;
  /** Open the day-detail popup for this date (own + friend calendars). */
  onDayOpen?: (date: string) => void;
}

const STATUS_STYLES: Record<string, CSSProperties> = {
  available: { backgroundColor: 'var(--bg)', border: '1px solid #f0e6ec' },
  blocked:   { backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' },
  accepted:  { backgroundColor: 'var(--color-tertiary)', border: '1.5px solid var(--color-primary-light)' },
  pending:   { backgroundColor: '#faf5ff', border: '1.5px dashed #c084fc' },
};

const DAY_NUMBER_STYLES: Record<string, CSSProperties> = {
  available: { color: 'var(--text-h)', fontWeight: 600 },
  blocked:   { color: '#9ca3af', fontWeight: 400 },
  accepted:  { color: 'var(--color-primary-dark)', fontWeight: 700 },
  pending:   { color: '#7c3aed', fontWeight: 700 },
};

// One meetup chip — clickable, opens the detail modal.
function MeetupChip({ m, date, onMeetupClick }: {
  m: DayCellMeetup; date: string; onMeetupClick?: (info: MeetupClickInfo) => void;
}) {
  // Accepted = "Planned" → follows the active theme (var(--color-primary)).
  // Pending = purple, per the calendar legend. (Proposer's own theme colour is
  // surfaced on their profile, not on every chip — keeps the calendar coherent.)
  const style: CSSProperties = m.status === 'accepted'
    ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
    : { backgroundColor: '#ede9fe', color: '#7c3aed' };
  return (
    <button
      type="button"
      aria-label={`View meetup: ${m.label}`}
      onClick={(e) => { e.stopPropagation(); onMeetupClick?.({ date, eventLabel: m.label, status: m.status }); }}
      className="relative z-30 w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-tight text-left hover:opacity-80 transition-opacity"
      style={style}
    >
      {m.label}
    </button>
  );
}

// Compact meetup indicators for small screens — mini bars, no text.
function MeetupBars({ meetups, date, onMeetupClick }: {
  meetups: DayCellMeetup[]; date: string; onMeetupClick?: (info: MeetupClickInfo) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full mt-auto sm:hidden">
      {meetups.map(m => (
        <button
          key={m.id}
          type="button"
          aria-label={`View meetup: ${m.label}`}
          onClick={(e) => { e.stopPropagation(); onMeetupClick?.({ date, eventLabel: m.label, status: m.status }); }}
          className="relative z-30 h-1.5 w-full rounded-full"
          style={{ backgroundColor: m.status === 'accepted' ? 'var(--color-primary)' : '#c084fc' }}
        />
      ))}
    </div>
  );
}

export function DayCell({ data, isToday = false, isOwn = false, meetups = [], onClick, onNewMeetup, onToggleAvailability, onMeetupClick, onDayOpen }: DayCellProps) {
  if (!data.isCurrentMonth || data.day === 0) {
    return <div className="rounded-xl" style={{ minHeight: '56px', height: '100%', backgroundColor: 'transparent' }} aria-hidden="true" />;
  }

  const { status, stickers, day, date } = data;
  const isBlocked = status === 'blocked';
  const isBusy = isBlocked;
  const meetupCount = meetups.length;
  const canAddMeetup = !isBlocked && meetupCount < MAX_MEETUPS_PER_DAY;
  const hasMeetup = meetupCount > 0 && !isBusy;
  const shownMeetups = meetups.slice(0, 3);
  const extraCount = meetupCount - shownMeetups.length;

  const statusLabel =
    status === 'available' ? 'available' :
    status === 'blocked'   ? 'busy/blocked' :
    status === 'accepted'  ? 'accepted meetup' : 'pending meetup';

  const ariaLabel = `${date}, ${statusLabel}${meetupCount ? `, ${meetupCount} meetup${meetupCount > 1 ? 's' : ''}` : ''}`;

  // Centered "+" add button — full-cell overlay, appears on hover.
  const addButton = isOwn && canAddMeetup ? (
    <button
      type="button"
      aria-label="New meetup"
      onClick={(e) => { e.stopPropagation(); onNewMeetup?.(date); }}
      className="absolute inset-0 z-20 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
      style={{ background: 'rgba(255,127,177,0.08)' }}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '16px', lineHeight: 1 }}>
        +
      </span>
    </button>
  ) : null;

  if (isToday) {
    const todayBlocked = status === 'blocked';
    return (
      <div
        role="gridcell"
        aria-label={ariaLabel}
        aria-current="date"
        onClick={() => onDayOpen?.(date)}
        className="relative flex flex-col items-start justify-start gap-1 rounded-xl p-1.5 group cursor-pointer"
        style={{
          minHeight: '56px', height: '100%',
          ...(todayBlocked
            ? { backgroundColor: '#e5e7eb', border: '2px solid #d1d5db' }
            : {
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                border: '2px solid var(--color-primary-dark)',
                boxShadow: '0 4px 12px var(--accent-border)',
              }
          ),
        }}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-[10px] md:text-xs font-bold"
            style={{ color: todayBlocked ? '#6b7280' : 'rgba(255,255,255,0.9)' }}>{day}</span>
        </div>
        {todayBlocked ? (
          <span className="mt-auto w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-center"
            style={{ backgroundColor: '#d1d5db', color: '#6b7280' }}>
            Busy
          </span>
        ) : hasMeetup ? (
          <>
            {/* Desktop: text chips */}
            <div className="hidden sm:flex sm:flex-col sm:gap-0.5 w-full mt-auto">
              {shownMeetups.map(m => (
                <MeetupChip key={m.id} m={m} date={date} onMeetupClick={onMeetupClick} />
              ))}
              {extraCount > 0 && (
                <span className="text-[8px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>+{extraCount} more</span>
              )}
            </div>
            {/* Mobile: compact bars (white on the filled today cell) */}
            <div className="flex flex-col gap-0.5 w-full mt-auto sm:hidden">
              {shownMeetups.map(m => (
                <button
                  key={m.id}
                  type="button"
                  aria-label={`View meetup: ${m.label}`}
                  onClick={(e) => { e.stopPropagation(); onMeetupClick?.({ date, eventLabel: m.label, status: m.status }); }}
                  className="relative z-30 h-1.5 w-full rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                />
              ))}
            </div>
          </>
        ) : null}
        {addButton}
        {/* Availability toggle for today cell */}
        {isOwn && (
          <button
            type="button"
            aria-label={todayBlocked ? 'Mark as free' : 'Mark as busy'}
            onClick={(e) => { e.stopPropagation(); onToggleAvailability?.(date, todayBlocked ? 'blocked' : 'available'); }}
            className="absolute top-0.5 right-0.5 z-30 hidden sm:block opacity-0 group-hover:opacity-100 transition-all text-[9px] font-bold px-1.5 py-0.5 rounded-md"
            style={todayBlocked
              ? { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }
              : { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }
            }
          >
            <span className="group-hover:hidden">{todayBlocked ? '⊘ Busy' : '✓ Free'}</span>
            <span className="hidden group-hover:inline">{todayBlocked ? '→ Free' : '→ Busy'}</span>
          </button>
        )}
      </div>
    );
  }

  const cellStyle: CSSProperties = { minHeight: '56px', height: '100%', ...STATUS_STYLES[status] };

  // Inner content: day number, busy label, stickers, and up to 3 meetup chips.
  const innerContent = (
    <div className="relative flex flex-col items-start gap-1 w-full flex-1 min-h-0">
      {/* Day number row */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] md:text-xs" style={DAY_NUMBER_STYLES[status]}>{day}</span>
      </div>

      {isBusy && (
        <span className="text-[9px] font-semibold px-1 py-0.5 rounded-md w-full text-center"
          style={{ background: '#e5e7eb', color: '#9ca3af' }}>
          Busy
        </span>
      )}

      {stickers && stickers.length > 0 && (
        <div className="flex flex-wrap gap-px leading-none">
          {stickers.slice(0, 3).map((s, i) => <span key={i} className="text-[10px] leading-none">{s}</span>)}
        </div>
      )}

      {hasMeetup && (
        <>
          {/* Desktop: text chips */}
          <div className="mt-auto hidden sm:flex sm:flex-col sm:gap-0.5 w-full">
            {shownMeetups.map(m => (
              <MeetupChip key={m.id} m={m} date={date} onMeetupClick={onMeetupClick} />
            ))}
            {extraCount > 0 && (
              <span className="text-[8px] font-semibold pl-1" style={{ color: 'var(--text)' }}>+{extraCount} more</span>
            )}
          </div>
          {/* Mobile: compact bars */}
          <MeetupBars meetups={shownMeetups} date={date} onMeetupClick={onMeetupClick} />
        </>
      )}
    </div>
  );

  // Own calendar — interactive with + button and availability toggle
  if (isOwn) {
    return (
      <div
        role="gridcell"
        aria-label={ariaLabel}
        onClick={() => onDayOpen?.(date)}
        className="relative flex w-full flex-col items-start justify-start gap-1 rounded-xl p-1.5 group cursor-pointer"
        style={cellStyle}
      >
        {innerContent}
        {addButton}

        {/* Availability toggle — shows current state, reveals action on hover */}
        <button
          type="button"
          aria-label={isBlocked ? 'Mark as free' : 'Mark as busy'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAvailability?.(date, isBlocked ? 'blocked' : 'available');
          }}
          className={cn(
            'absolute top-0.5 right-0.5 transition-all text-[9px] font-bold px-1.5 py-0.5 rounded-md z-30 hidden sm:block',
            isBlocked
              ? 'opacity-80 group-hover:opacity-100 group-hover:scale-105'   // Busy state — always visible
              : 'opacity-0 group-hover:opacity-100 group-hover:scale-105',   // Free state — reveal on hover
          )}
          style={isBlocked
            ? { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }  // Gray = currently busy → click to free
            : { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }  // Green = click to set busy
          }
        >
          <span className="group-hover:hidden">{isBlocked ? '⊘ Busy' : '✓ Free'}</span>
          <span className="hidden group-hover:inline">{isBlocked ? '→ Free' : '→ Busy'}</span>
        </button>
      </div>
    );
  }

  // Friend's calendar — read-only, just show state
  return (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      className="relative flex w-full flex-col items-start justify-start gap-1 rounded-xl p-1.5 group"
      style={{
        ...cellStyle,
        cursor: 'pointer',
        opacity: isBlocked ? 0.7 : 1,
      }}
      onClick={() => (onDayOpen ? onDayOpen(date) : (!isBlocked && !hasMeetup && onClick?.(data)))}
    >
      {innerContent}
      {/* Propose meetup hint on hover for non-blocked, non-event days */}
      {!isBlocked && canAddMeetup && !hasMeetup && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
          style={{ background: 'rgba(255,127,177,0.08)' }}>
          <span className="text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>+ Meetup</span>
        </div>
      )}
      {isBlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(0,0,0,0.04)' }}>
          <span className="text-[9px] font-bold" style={{ color: '#9ca3af' }}>🚫 Busy</span>
        </div>
      )}
    </div>
  );
}
