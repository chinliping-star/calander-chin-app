import { Camera, Lock } from 'lucide-react';

export type MemoryUploadMode = 'everyone' | 'selected';

interface Props {
  value: MemoryUploadMode;
  onChange: (v: MemoryUploadMode) => void;
}

const OPTIONS = [
  { value: 'everyone', label: 'Everyone invited', hint: 'All friends in the meetup can add photos', Icon: Camera },
  { value: 'selected', label: 'Only me', hint: 'Only you can add photos. Friends can still see them.', Icon: Lock },
] as const;

/**
 * Who can add memory photos to this meetup. "Only me" is stored as
 * memory_upload_mode 'selected' with nobody picked — the creator can always
 * add, and can let more people in later from the memory album.
 */
export function MemoryUploadToggle({ value, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold mb-2" style={{ color: 'var(--text-h)' }}>
        Who can add memory photos?
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
        {OPTIONS.map(({ value: v, label, hint, Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v)}
              className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                backgroundColor: active ? 'var(--accent-bg)' : 'var(--bg)',
              }}
            >
              <Icon size={15} className="mt-0.5 shrink-0" style={{ color: active ? 'var(--color-primary)' : 'var(--text)' }} />
              <span className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: active ? 'var(--color-primary)' : 'var(--text-h)' }}>{label}</span>
                <span className="text-[11px]" style={{ color: 'var(--text)' }}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
