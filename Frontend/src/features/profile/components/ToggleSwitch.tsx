import { cn } from '../../../lib/utils.ts';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ id, checked, onChange, label, description, disabled = false }: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex-1">
        <label
          htmlFor={id}
          className="text-sm font-semibold cursor-pointer"
          style={{ color: 'var(--text-h)' }}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text)' }}>
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--border)',
        }}
        aria-label={label}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
