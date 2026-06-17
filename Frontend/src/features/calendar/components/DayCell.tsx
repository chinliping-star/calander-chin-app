import type { CSSProperties } from 'react';
import { cn } from '../../../lib/utils.ts';
import type { CalendarDayData } from '../types.ts';

interface MeetupClickInfo {
  date: string;
  eventLabel: string;
  status: string;
}

interface DayCellProps {
  data: CalendarDayData;
  isToday?: boolean;
  isOwn?: boolean;
  meetupCount?: number;
  onClick?: (data: CalendarDayData) => void;
  onNewMeetup?: (date: string) => void;
  onToggleAvailability?: (date: string, current: 'available' | 'blocked') => void;
  onMeetupClick?: (info: MeetupClickInfo) => void;
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

export function DayCell({ data, isToday = false, isOwn = false, meetupCount = 0, onClick, onNewMeetup, onToggleAvailability, onMeetupClick }: DayCellProps) {
  if (!data.isCurrentMonth || data.day === 0) {
    return <div className="rounded-xl" style={{ minHeight: '72px', height: '100%', backgroundColor: 'transparent' }} aria-hidden="true" />;
  }

  const { status, eventLabel, stickers, day, date } = data;
  const isBlocked = status === 'blocked';
  const isBusy = isBlocked;
  const canAddMeetup = !isBlocked && meetupCount < 3;
  const hasMeetup = !!eventLabel && !isBusy;

  const statusLabel =
    status === 'available' ? 'available' :
    status === 'blocked'   ? 'busy/blocked' :
    status === 'accepted'  ? 'accepted meetup' : 'pending meetup';

  const ariaLabel = `${date}, ${statusLabel}${eventLabel ? `, ${eventLabel}` : ''}`;

  if (isToday) {
    const todayBlocked = status === 'blocked';
    return (
      <div
        role="gridcell"
        aria-label={ariaLabel}
        aria-current="date"
        className="relative flex flex-col items-start justify-start gap-1 rounded-xl p-1.5 group"
        style={{
          minHeight: '72px', height: '100%',
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
        <span className="text-[10px] md:text-xs font-bold"
          style={{ color: todayBlocked ? '#6b7280' : 'rgba(255,255,255,0.9)' }}>{day}</span>
        {todayBlocked ? (
          <>
            <span className="mx-auto text-lg leading-none" aria-hidden="true">⊘</span>
            <span className="w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-center"
              style={{ backgroundColor: '#d1d5db', color: '#6b7280' }}>
              Busy · Today
            </span>
          </>
        ) : (
          <>
            <span className="mx-auto text-lg leading-none" aria-hidden="true">💕</span>
            <span className="w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#ffffff' }}>
              Today
            </span>
          </>
        )}
        {/* + meetup button — full overlay on hover */}
        {isOwn && canAddMeetup && (
          <button
            type="button"
            aria-label="Add meetup"
            onClick={(e) => { e.stopPropagation(); onNewMeetup?.(date); }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
            style={{ background: 'rgba(0,0,0,0.15)' }}
          >
            <span className="text-white text-xl font-bold leading-none">+</span>
          </button>
        )}
        {/* Availability toggle for today cell */}
        {isOwn && (
          <button
            type="button"
            aria-label={todayBlocked ? 'Mark as free' : 'Mark as busy'}
            onClick={(e) => { e.stopPropagation(); onToggleAvailability?.(date, todayBlocked ? 'blocked' : 'available'); }}
            className="absolute bottom-0.5 right-0.5 z-20 opacity-0 group-hover:opacity-100 transition-all text-[9px] font-bold px-1.5 py-0.5 rounded-md"
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

  const cellStyle: CSSProperties = { minHeight: '72px', height: '100%', ...STATUS_STYLES[status] };

  // The inner content (day number, busy label, stickers, event label)
  // Wrapped in a flex-1 relative container so the + button is centered within
  // the content area only, not displaced by the availability toggle.
  const innerContent = (
    <div className="relative flex flex-col items-start gap-1 w-full flex-1 min-h-0">
      {/* Day number row */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] md:text-xs" style={DAY_NUMBER_STYLES[status]}>{day}</span>
        {/* Meetup count dots */}
        {meetupCount > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(meetupCount, 3) }).map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: status === 'pending' ? '#c084fc' : 'var(--color-primary)' }} />
            ))}
          </div>
        )}
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
        // Bug 11.4: clickable event label that fires onMeetupClick separately from cell click
        <button
          type="button"
          aria-label={`View meetup: ${eventLabel}`}
          onClick={(e) => {
            e.stopPropagation();
            onMeetupClick?.({ date, eventLabel: eventLabel!, status });
          }}
          className="mt-auto w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-tight text-left hover:opacity-80 transition-opacity"
          style={status === 'accepted'
            ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
            : { backgroundColor: '#ede9fe', color: '#7c3aed' }}>
          {eventLabel}
        </button>
      )}

      {/* + button only shows when no meetup on this day — prevents blocking meetup label clicks */}
      {isOwn && canAddMeetup && !hasMeetup && (
        <button
          type="button"
          aria-label="New meetup"
          onClick={(e) => { e.stopPropagation(); onNewMeetup?.(date); }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
          style={{ borderRadius: 'inherit' }}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '14px', lineHeight: 1 }}
          >
            +
          </span>
        </button>
      )}
    </div>
  );

  // Own calendar — interactive with + button and availability toggle
  if (isOwn) {
    return (
      <div
        role="gridcell"
        aria-label={ariaLabel}
        className="relative flex w-full flex-col items-start justify-start gap-1 rounded-xl p-1.5 group cursor-default"
        style={cellStyle}
      >
        {innerContent}

        {/* Availability toggle — shows current state, reveals action on hover */}
        <button
          type="button"
          aria-label={isBlocked ? 'Mark as free' : 'Mark as busy'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAvailability?.(date, isBlocked ? 'blocked' : 'available');
          }}
          className={cn(
            'absolute bottom-0.5 right-0.5 transition-all text-[9px] font-bold px-1.5 py-0.5 rounded-md z-20',
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
        cursor: !isBlocked && canAddMeetup ? 'pointer' : 'default',
        opacity: isBlocked ? 0.7 : 1,
      }}
      onClick={() => !isBlocked && !hasMeetup && onClick?.(data)}
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
