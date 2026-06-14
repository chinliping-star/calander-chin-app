import { Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { ProposedSlotData } from '../types.ts';

interface ProposedSlotProps {
  slots: ProposedSlotData[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Pick<ProposedSlotData, 'date' | 'time' | 'location'>, value: string) => void;
}

export function ProposedSlot({ slots, onAdd, onUpdate }: ProposedSlotProps) {
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
        <div className="flex flex-col gap-3">
          {slots.map((slot) => (
            <div key={slot.id} className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="sr-only" htmlFor={`slot-date-${slot.id}`}>Date and time</label>
                  <input
                    id={`slot-date-${slot.id}`}
                    type="datetime-local"
                    value={slot.date && slot.time ? `${slot.date}T${slot.time}` : ''}
                    onChange={(e) => {
                      const [d, t] = e.target.value.split('T');
                      onUpdate(slot.id, 'date', d ?? '');
                      onUpdate(slot.id, 'time', t ?? '');
                    }}
                    style={inputStyle}
                    aria-label="Slot date and time"
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`slot-location-${slot.id}`}>Location</label>
                  <input
                    id={`slot-location-${slot.id}`}
                    type="text"
                    value={slot.location}
                    onChange={(e) => onUpdate(slot.id, 'location', e.target.value)}
                    placeholder="Location"
                    style={inputStyle}
                    aria-label="Slot location"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add alternative card */}
        <button
          type="button"
          onClick={onAdd}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{
            border: '1.5px dashed var(--border)',
            color: 'var(--text)',
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
