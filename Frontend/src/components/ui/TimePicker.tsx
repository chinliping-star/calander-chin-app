import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

interface TimePickerProps {
  value: string; // HH:MM (24h)
  onChange: (time: string) => void;
  placeholder?: string;
  error?: boolean;
  id?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = ['00', '15', '30', '45'];

function formatDisplay(value: string) {
  if (!value) return null;
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

function toValue(hour: number, minute: string, period: 'AM' | 'PM') {
  let h = hour % 12;
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

function parseValue(value: string): { hour: number; minute: string; period: 'AM' | 'PM' } {
  if (!value) return { hour: 12, minute: '00', period: 'AM' };
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: h12, minute: mStr || '00', period };
}

export function TimePicker({ value, onChange, placeholder = 'Pick a time', error, id }: TimePickerProps) {
  const parsed = parseValue(value);
  const [open, setOpen] = useState(false);
  const [selHour, setSelHour] = useState(parsed.hour);
  const [selMinute, setSelMinute] = useState(parsed.minute);
  const [selPeriod, setSelPeriod] = useState<'AM' | 'PM'>(parsed.period);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseValue(value);
    setSelHour(p.hour);
    setSelMinute(p.minute);
    setSelPeriod(p.period);
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function confirm(hour: number, minute: string, period: 'AM' | 'PM') {
    onChange(toValue(hour, minute, period));
    setOpen(false);
  }

  function handleHour(h: number) {
    setSelHour(h);
    onChange(toValue(h, selMinute, selPeriod));
  }

  function handleMinute(m: string) {
    setSelMinute(m);
    onChange(toValue(selHour, m, selPeriod));
  }

  function handlePeriod(p: 'AM' | 'PM') {
    setSelPeriod(p);
    onChange(toValue(selHour, selMinute, p));
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7FB1]"
        style={{
          border: error ? '1.5px solid var(--color-primary)' : open ? '1.5px solid var(--color-primary)' : '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '14px',
          color: value ? 'var(--text-h)' : 'var(--text)',
          backgroundColor: 'var(--bg)',
          fontFamily: 'var(--sans)',
          boxShadow: open ? '0 0 0 3px rgba(255,127,177,0.15)' : 'none',
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span>{value ? formatDisplay(value) : placeholder}</span>
        <Clock size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-2 rounded-2xl p-4 select-none"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(74,62,78,0.16)',
            width: '240px',
          }}
          role="dialog"
          aria-label="Time picker"
        >
          {/* AM / PM toggle */}
          <div
            className="flex rounded-full p-0.5 mb-4"
            style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
          >
            {(['AM', 'PM'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriod(p)}
                className="flex-1 py-1.5 rounded-full text-xs font-bold transition-all focus-visible:outline-none"
                style={
                  selPeriod === p
                    ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', boxShadow: '0 2px 6px rgba(255,127,177,0.35)' }
                    : { color: 'var(--text)' }
                }
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {/* Hours */}
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-center" style={{ color: 'var(--color-primary)' }}>
                Hour
              </p>
              <div className="grid grid-cols-3 gap-1">
                {HOURS.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHour(h)}
                    className={cn(
                      'h-8 rounded-xl text-xs font-semibold transition-all hover:scale-105 focus-visible:outline-none',
                    )}
                    style={
                      selHour === h
                        ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', boxShadow: '0 2px 6px rgba(255,127,177,0.35)' }
                        : { backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)' }
                    }
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', backgroundColor: 'var(--border)' }} />

            {/* Minutes */}
            <div className="w-14">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-center" style={{ color: 'var(--color-primary)' }}>
                Min
              </p>
              <div className="flex flex-col gap-1">
                {MINUTES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinute(m)}
                    className="h-8 rounded-xl text-xs font-semibold transition-all hover:scale-105 focus-visible:outline-none"
                    style={
                      selMinute === m
                        ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', boxShadow: '0 2px 6px rgba(255,127,177,0.35)' }
                        : { backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)' }
                    }
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected preview + confirm */}
          <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
              {selHour}:{selMinute} {selPeriod}
            </span>
            <button
              type="button"
              onClick={() => confirm(selHour, selMinute, selPeriod)}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Set Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
