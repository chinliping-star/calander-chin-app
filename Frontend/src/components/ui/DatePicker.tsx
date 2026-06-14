import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  error?: boolean;
  id?: string;
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', error, id }: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    onChange(toDateString(viewYear, viewMonth, day));
    setOpen(false);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7FB1]',
        )}
        style={{
          border: error ? '1.5px solid #FF7FB1' : open ? '1.5px solid #FF7FB1' : '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '14px',
          color: value ? 'var(--text-h)' : 'var(--text)',
          backgroundColor: '#ffffff',
          fontFamily: 'var(--sans)',
          boxShadow: open ? '0 0 0 3px rgba(255,127,177,0.15)' : 'none',
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span>{value ? formatDisplay(value) : placeholder}</span>
        <Calendar size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-72 rounded-2xl p-4 select-none"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(74,62,78,0.16)',
          }}
          role="dialog"
          aria-label="Date picker"
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>

            <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
              {MONTHS[viewMonth]} {viewYear}
            </p>

            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS.map(d => (
              <div
                key={d}
                className="text-center text-[10px] font-bold uppercase tracking-wide py-1"
                style={{ color: 'var(--color-primary)' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {/* Leading empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {/* Day buttons */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = toDateString(viewYear, viewMonth, day);
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className="flex h-8 w-full items-center justify-center rounded-full text-xs font-medium transition-all hover:scale-110 focus-visible:outline-none"
                  style={
                    isSelected
                      ? { backgroundColor: '#FF7FB1', color: '#ffffff', fontWeight: 700, boxShadow: '0 2px 8px rgba(255,127,177,0.4)' }
                      : isToday
                      ? { backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', fontWeight: 700, border: '1.5px solid #FFB3CE' }
                      : { color: 'var(--text-h)' }
                  }
                  aria-label={dateStr}
                  aria-pressed={isSelected}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs font-semibold hover:opacity-70 transition-opacity focus-visible:outline-none"
              style={{ color: 'var(--text)' }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onChange(todayStr); setOpen(false); }}
              className="text-xs font-semibold hover:opacity-70 transition-opacity focus-visible:outline-none"
              style={{ color: 'var(--color-primary)' }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
