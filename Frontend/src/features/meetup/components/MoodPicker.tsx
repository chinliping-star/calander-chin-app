import { cn } from '../../../lib/utils.ts';
import type { MoodTheme, MoodOption } from '../types.ts';

const MOODS: MoodOption[] = [
  { key: 'chill', label: 'Chill', emoji: '🍃' },
  { key: 'productive', label: 'Productive', emoji: '📊' },
  { key: 'celebration', label: 'Celebration', emoji: '🎉' },
  { key: 'dining', label: 'Dining', emoji: '🍽️' },
];

interface MoodPickerProps {
  value: MoodTheme | null;
  onChange: (mood: MoodTheme) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-h)' }}>
        Mood &amp; Theme
      </p>
      <div
        className="grid grid-cols-4 gap-1.5"
        role="radiogroup"
        aria-label="Select meetup mood or theme"
      >
        {MOODS.map((mood) => {
          const isActive = value === mood.key;
          return (
            <button
              key={mood.key}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(mood.key)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2',
              )}
              style={
                isActive
                  ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', border: 'none' }
                  : { backgroundColor: 'transparent', color: 'var(--text-h)', border: '1px solid var(--border)' }
              }
            >
              <span aria-hidden="true" className="text-base">{mood.emoji}</span>
              {mood.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
