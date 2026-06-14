import type { CSSProperties } from 'react';
import { cn } from '../../../lib/utils.ts';
import type { CalendarDayData } from '../types.ts';

interface DayCellProps {
  data: CalendarDayData;
  isToday?: boolean;
  onClick?: (data: CalendarDayData) => void;
}

const STATUS_STYLES: Record<string, CSSProperties> = {
  available: {
    backgroundColor: 'var(--bg)',
    border: '1px solid #f0e6ec',
  },
  blocked: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
  },
  accepted: {
    backgroundColor: 'var(--color-tertiary)',
    border: '1.5px solid var(--color-primary-light)',
  },
  pending: {
    backgroundColor: '#faf5ff',
    border: '1.5px dashed #c084fc',
  },
};

const PILL_STYLES: Record<string, CSSProperties> = {
  available: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  blocked:   { backgroundColor: '#e5e7eb', color: '#9ca3af' },
  accepted:  { backgroundColor: 'var(--color-primary)', color: '#ffffff' },
  pending:   { backgroundColor: '#ede9fe', color: '#7c3aed' },
};

const DAY_NUMBER_STYLES: Record<string, CSSProperties> = {
  available: { color: 'var(--text-h)', fontWeight: 600 },
  blocked:   { color: '#9ca3af', fontWeight: 400 },
  accepted:  { color: 'var(--color-primary-dark)', fontWeight: 700 },
  pending:   { color: '#7c3aed', fontWeight: 700 },
};

export function DayCell({ data, isToday = false, onClick }: DayCellProps) {
  if (!data.isCurrentMonth || data.day === 0) {
    return (
      <div
        className="rounded-xl"
        style={{ minHeight: '72px', height: '100%', backgroundColor: 'transparent' }}
        aria-hidden="true"
      />
    );
  }

  const { status, eventLabel, day, date } = data;

  const statusLabel =
    status === 'available' ? 'available' :
    status === 'blocked'   ? 'blocked' :
    status === 'accepted'  ? 'accepted meetup' :
    'pending meetup';

  const ariaLabel = `${date}, ${statusLabel}${eventLabel ? `, ${eventLabel}` : ''}`;

  // TODAY cell
  if (isToday) {
    return (
      <div
        role="gridcell"
        aria-label={ariaLabel}
        aria-current="date"
        className="relative flex flex-col items-start justify-start gap-1 rounded-xl p-1.5"
        style={{
          minHeight: '72px', height: '100%',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          border: '2px solid var(--color-primary-dark)',
          boxShadow: '0 4px 12px rgba(255,127,177,0.40)',
        }}
      >
        <span className="text-[10px] md:text-xs font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {day}
        </span>
        <span className="mx-auto text-lg leading-none" aria-hidden="true">💕</span>
        <span
          className="w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#ffffff' }}
        >
          Today
        </span>
      </div>
    );
  }

  const cellStyle: CSSProperties = {
    minHeight: '72px', height: '100%',
    ...STATUS_STYLES[status],
  };

  const inner = (
    <>
      <span className="text-[10px] md:text-xs" style={DAY_NUMBER_STYLES[status]}>
        {day}
      </span>

      {status === 'accepted' && (
        <span className="text-xs leading-none" aria-hidden="true">✦</span>
      )}
      {status === 'pending' && (
        <span className="text-xs leading-none" aria-hidden="true">◌</span>
      )}

      {eventLabel && (
        <span
          className="mt-auto w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-tight"
          style={PILL_STYLES[status]}
        >
          {eventLabel}
        </span>
      )}
    </>
  );

  if (status === 'available') {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => onClick?.(data)}
        className={cn(
          'relative flex w-full flex-col items-start justify-start gap-1 rounded-xl p-1.5 text-left',
          'cursor-pointer transition-all duration-150',
          'hover:shadow-md hover:border-[#FFB3CE] hover:bg-[#fff7fb]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7FB1]',
          'active:scale-[0.97]',
        )}
        style={cellStyle}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      className="relative flex w-full flex-col items-start justify-start gap-1 rounded-xl p-1.5"
      style={cellStyle}
    >
      {inner}
    </div>
  );
}
