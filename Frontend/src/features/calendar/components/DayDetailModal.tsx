import { createPortal } from 'react-dom';
import { X, Clock, MapPin, Plus, Send } from 'lucide-react';

export interface DayMeetupRow {
  id: string;
  label: string;
  time: string;
  location: string;
  status: 'accepted' | 'pending';
  attendance?: 'attended' | 'missed' | 'skipped';
  date: string;
}

interface DayDetailModalProps {
  date: string;
  meetups: DayMeetupRow[];
  isOwn: boolean;
  /** Current availability of the day on the owner's calendar. */
  isBlocked?: boolean;
  onClose: () => void;
  onMeetupClick: (info: { date: string; eventLabel: string; status: string }) => void;
  onNewMeetup?: (date: string) => void;
  onPropose?: (date: string) => void;
  onToggleAvailability?: (date: string, current: 'available' | 'blocked') => void;
}

function formatLongDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Day-detail popup. Lists every meetup on a date (tap → meetup detail) and,
 * depending on whose calendar it is, offers an Add-event (own) or Propose
 * (friend) action. Built mobile-first so small screens can read + act on a day.
 */
export function DayDetailModal({
  date, meetups, isOwn, isBlocked = false,
  onClose, onMeetupClick, onNewMeetup, onPropose, onToggleAvailability,
}: DayDetailModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,10,20,0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Plans for ${formatLongDate(date)}`}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 max-h-[85vh]"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-80"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)' }}
        >
          <X size={14} />
        </button>

        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
            {meetups.length} {meetups.length === 1 ? 'plan' : 'plans'}
          </p>
          <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-h)' }}>
            {formatLongDate(date)}
          </h3>
        </div>

        {/* Meetup list */}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {meetups.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text)' }}>
              {isBlocked ? 'This day is marked busy.' : 'Nothing planned yet.'}
            </p>
          ) : (
            meetups.map(m => {
              const pending = m.status === 'pending';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onMeetupClick({ date: m.date, eventLabel: m.label, status: m.status })}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:opacity-80 w-full"
                  style={{
                    backgroundColor: pending ? '#ede9fe' : 'var(--color-tertiary)',
                    border: pending ? '1.5px dashed #c084fc' : '1.5px solid var(--color-primary-light)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{m.label}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {m.time && (
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text)' }}>
                          <Clock size={10} />{m.time}
                        </span>
                      )}
                      {m.location && (
                        <span className="flex items-center gap-1 text-[11px] truncate" style={{ color: 'var(--text)' }}>
                          <MapPin size={10} />{m.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                    style={pending
                      ? { backgroundColor: '#ede9fe', color: '#7c3aed' }
                      : { backgroundColor: 'var(--color-primary)', color: '#fff' }}
                  >
                    {pending ? 'Pending' : 'Planned'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {isOwn ? (
            <>
              <button
                type="button"
                onClick={() => onNewMeetup?.(date)}
                disabled={isBlocked}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
              >
                <Plus size={15} /> Add event
              </button>
              <button
                type="button"
                onClick={() => onToggleAvailability?.(date, isBlocked ? 'blocked' : 'available')}
                className="py-2 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
                style={isBlocked
                  ? { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }
                  : { background: 'var(--color-tertiary)', color: 'var(--text-h)' }}
              >
                {isBlocked ? '✓ Mark Free' : '⊘ Mark Busy'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onPropose?.(date)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              <Send size={14} /> Propose meetup
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
