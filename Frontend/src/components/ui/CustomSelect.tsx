import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T extends string = string> {
  value: T | '';
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  error,
  disabled,
  className,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerId = useId();

  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIdx < 0) return;
    const item = listRef.current?.children[focusedIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIdx, open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open && focusedIdx >= 0) {
          onChange(options[focusedIdx].value);
          setOpen(false);
          setFocusedIdx(-1);
        } else {
          setOpen(v => !v);
        }
        break;
      case 'Escape':
        setOpen(false);
        setFocusedIdx(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) { setOpen(true); setFocusedIdx(0); break; }
        setFocusedIdx(i => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIdx(i => Math.max(i - 1, 0));
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }, [disabled, open, focusedIdx, onChange, options]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-h)' }}>{label}</p>
      )}

      {/* Trigger */}
      <button
        type="button"
        id={triggerId}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--color-tertiary)',
          border: `1px solid ${error ? '#ef4444' : open ? 'var(--color-primary)' : 'var(--border)'}`,
          color: selected ? 'var(--text-h)' : 'var(--text)',
          boxShadow: open ? '0 0 0 3px var(--accent-bg)' : 'none',
        }}
      >
        {selected?.icon && <span className="flex-shrink-0">{selected.icon}</span>}
        <span className="flex-1 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={15}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden overflow-y-auto max-h-56"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isFocused = focusedIdx === i;

            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value); setOpen(false); setFocusedIdx(-1); }}
                onMouseEnter={() => setFocusedIdx(i)}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                style={{
                  background: isFocused
                    ? 'var(--accent-bg)'
                    : isSelected
                    ? 'var(--color-tertiary)'
                    : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--text-h)',
                }}
              >
                {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium">{opt.label}</span>
                  {opt.description && (
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--text)' }}>
                      {opt.description}
                    </span>
                  )}
                </span>
                {isSelected && <Check size={14} className="flex-shrink-0" style={{ color: 'var(--color-primary)' }} />}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>
      )}
    </div>
  );
}
