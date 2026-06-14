import { Plus, RefreshCw, MapPin } from 'lucide-react';
import { useState } from 'react';
import { DatePicker } from '../../../components/ui/DatePicker.tsx';
import { TimePicker } from '../../../components/ui/TimePicker.tsx';
import type { ProposedSlotData } from '../types.ts';

interface ProposedSlotProps {
  slots: ProposedSlotData[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Pick<ProposedSlotData, 'date' | 'time' | 'location'>, value: string) => void;
}

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--text-h)',
  backgroundColor: 'var(--color-neutral)',
  fontFamily: 'var(--sans)',
  outline: 'none',
  width: '100%',
};

export function ProposedSlot({ slots, onAdd, onUpdate }: ProposedSlotProps) {
  return (
    <section aria-labelledby="proposed-slots-heading">
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 id="proposed-slots-heading" className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
            📅 Proposed Slots
          </h3>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 rounded"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus size={12} />
            Add another
          </button>
        </div>

        {/* Slot rows */}
        <div className="flex flex-col gap-4">
          {slots.map((slot, i) => (
            <div
              key={slot.id}
              className="flex flex-col gap-2 rounded-xl p-3"
              style={{
                backgroundColor: 'var(--color-tertiary)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Slot number */}
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                Option {i + 1}
              </p>

              {/* Date + Time row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-h)' }} htmlFor={`slot-date-${slot.id}`}>
                    Date
                  </label>
                  <DatePicker
                    id={`slot-date-${slot.id}`}
                    value={slot.date}
                    onChange={(d) => onUpdate(slot.id, 'date', d)}
                    placeholder="Pick date"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-h)' }} htmlFor={`slot-time-${slot.id}`}>
                    Time
                  </label>
                  <TimePicker
                    id={`slot-time-${slot.id}`}
                    value={slot.time}
                    onChange={(t) => onUpdate(slot.id, 'time', t)}
                    placeholder="Pick time"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-h)' }} htmlFor={`slot-location-${slot.id}`}>
                  Location
                </label>
                <div className="relative">
                  <MapPin
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-primary)' }}
                    aria-hidden="true"
                  />
                  <input
                    id={`slot-location-${slot.id}`}
                    type="text"
                    value={slot.location}
                    onChange={(e) => onUpdate(slot.id, 'location', e.target.value)}
                    placeholder="Add a place"
                    style={{ ...inputStyle, paddingLeft: '30px', backgroundColor: '#ffffff' }}
                    aria-label="Slot location"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add alternative */}
        <button
          type="button"
          onClick={onAdd}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{
            border: '1.5px dashed var(--color-primary-light)',
            color: 'var(--color-primary)',
            backgroundColor: 'transparent',
          }}
          aria-label="Suggest an alternative time"
        >
          <RefreshCw size={14} />
          Suggest an alternative time
        </button>
      </div>
    </section>
  );
}

// ─── Controlled state helper hook ────────────────────────────────────────────

export function useProposedSlots() {
  const [slots, setSlots] = useState<ProposedSlotData[]>([
    { id: '1', date: '2026-10-14', time: '10:30', location: 'The Daily Grind Cafe' },
  ]);

  function addSlot() {
    const id = String(Date.now());
    setSlots((prev) => [...prev, { id, date: '', time: '', location: '' }]);
  }

  function updateSlot(id: string, field: keyof Pick<ProposedSlotData, 'date' | 'time' | 'location'>, value: string) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  return { slots, addSlot, updateSlot };
}
