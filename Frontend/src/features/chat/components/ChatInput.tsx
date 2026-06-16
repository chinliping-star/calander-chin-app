import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
  editValue?: string;
  onCancelEdit?: () => void;
}

export function ChatInput({ onSend, onTyping, disabled, editValue, onCancelEdit }: Props) {
  const [value, setValue] = useState(editValue ?? '');
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditing = editValue !== undefined;

  // Sync editValue → input when entering edit mode
  const prevEditValue = useRef(editValue);
  if (editValue !== prevEditValue.current) {
    prevEditValue.current = editValue;
    setValue(editValue ?? '');
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping();
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, [onTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue('');
    }
    if (e.key === 'Escape' && isEditing) onCancelEdit?.();
  }, [value, disabled, onSend, isEditing, onCancelEdit]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="flex flex-col gap-2">
      {isEditing && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
          <span style={{ color: 'var(--color-primary)' }}>Editing message</span>
          <button
            onClick={onCancelEdit}
            className="ml-auto font-medium"
            style={{ color: 'var(--text)' }}
          >
            Cancel
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: 'var(--color-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-h)',
            minHeight: '44px',
            maxHeight: '160px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}
        >
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}
