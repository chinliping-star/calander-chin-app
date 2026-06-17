import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const STICKER_PACKS: { label: string; stickers: string[] }[] = [
  {
    label: 'Mood',
    stickers: ['😊','😴','🥳','😎','🥰','😤','🤩','😭','🥺','😏','🤔','😅'],
  },
  {
    label: 'Food',
    stickers: ['☕','🍕','🍣','🧋','🍰','🍜','🥑','🍩','🍓','🍦','🥗','🍷'],
  },
  {
    label: 'Activity',
    stickers: ['📚','🎮','🏃','🎨','🎬','🎵','💪','✈️','🏖️','🎯','🛍️','🧘'],
  },
  {
    label: 'Symbols',
    stickers: ['❤️','⭐','✨','🌸','🔥','💫','🎉','💎','🌈','🍀','🌙','⚡'],
  },
];

interface StickerPickerProps {
  date: string;
  current: string[];
  onSave: (stickers: string[]) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function StickerPicker({ date, current, onSave, onClose, anchorRef }: StickerPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const selected = new Set(current);

  function toggle(sticker: string) {
    const next = new Set(selected);
    if (next.has(sticker)) {
      next.delete(sticker);
    } else {
      if (next.size >= 6) return;
      next.add(sticker);
    }
    onSave(Array.from(next));
  }

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        !(anchorRef?.current?.contains(e.target as Node))
      ) {
        onClose();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div
      ref={pickerRef}
      className="absolute z-50 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width: '280px',
        backgroundColor: 'var(--bg)',
        border: '1.5px solid var(--border)',
        boxShadow: '0 16px 48px rgba(74,62,78,0.18)',
      }}
      role="dialog"
      aria-label={`Sticker picker for ${displayDate}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--color-tertiary)' }}
      >
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--text-h)' }}>Add Stickers</p>
          <p className="text-[10px]" style={{ color: 'var(--text)' }}>{displayDate} · {selected.size}/6 selected</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text)' }}
          aria-label="Close sticker picker"
        >
          <X size={12} />
        </button>
      </div>

      {/* Packs */}
      <div className="flex flex-col gap-3 p-4 max-h-72 overflow-y-auto">
        {STICKER_PACKS.map(pack => (
          <div key={pack.label}>
            <p
              className="text-[9px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-primary)' }}
            >
              {pack.label}
            </p>
            <div className="grid grid-cols-6 gap-1">
              {pack.stickers.map(sticker => {
                const active = selected.has(sticker);
                const maxed = selected.size >= 6 && !active;
                return (
                  <button
                    key={sticker}
                    type="button"
                    onClick={() => toggle(sticker)}
                    disabled={maxed}
                    aria-label={sticker}
                    aria-pressed={active}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-30"
                    style={{
                      backgroundColor: active ? 'var(--accent-bg)' : 'var(--color-neutral)',
                      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                      transform: active ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {sticker}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected preview */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--color-neutral)' }}
        >
          <p className="text-[10px] font-semibold shrink-0" style={{ color: 'var(--text)' }}>On day:</p>
          <div className="flex gap-1 flex-wrap">
            {Array.from(selected).map(s => (
              <span key={s} className="text-base leading-none">{s}</span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onSave([])}
            className="ml-auto text-[10px] font-semibold shrink-0 hover:opacity-70"
            style={{ color: 'var(--text)' }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
