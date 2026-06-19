import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Plus, Paperclip, FileText, Smile, Mic } from 'lucide-react';

const EMOJIS = [
  '😀','😂','😍','🥰','😎','😉','😮','😢','😭','😡','👍','👎','🙏','👏','🙌',
  '❤️','🔥','✨','🎉','🥳','😅','😴','🤔','🙄','😘','💯','✅','❌','⭐','💖',
  '🍕','☕','🎂','🌸','🌟','💪',
];

interface Props {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
  editValue?: string;
  onCancelEdit?: () => void;
}

export function ChatInput({ onSend, onTyping, disabled, editValue, onCancelEdit }: Props) {
  const [value, setValue] = useState(editValue ?? '');
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditing = editValue !== undefined;

  useEffect(() => {
    if (!showEmoji) return;
    const onDown = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showEmoji]);

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
      {/* Composer box */}
      <div
        className="rounded-2xl px-4 pt-3 pb-2.5 transition-all"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={2}
          disabled={disabled}
          className="w-full resize-none bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-h)', minHeight: '48px', maxHeight: '160px' }}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1" style={{ color: 'var(--text)' }}>
            {[Plus, Paperclip, FileText].map((Icon, i) => (
              <button
                key={i}
                type="button"
                disabled
                title="Coming soon"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors opacity-70 hover:opacity-100"
              >
                <Icon size={18} strokeWidth={1.5} />
              </button>
            ))}

            {/* Emoji picker */}
            <div className="relative" ref={emojiRef}>
              <button
                type="button"
                onClick={() => setShowEmoji(v => !v)}
                title="Emoji"
                aria-label="Insert emoji"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-100"
                style={{ color: showEmoji ? 'var(--color-primary)' : 'var(--text)' }}
              >
                <Smile size={18} strokeWidth={1.5} />
              </button>
              {showEmoji && (
                <div
                  className="absolute bottom-10 left-0 z-20 grid grid-cols-7 gap-1 p-2 rounded-xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', width: 252 }}
                >
                  {EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => { setValue(v => v + em); setShowEmoji(false); }}
                      className="w-8 h-8 rounded-lg text-lg leading-none flex items-center justify-center hover:bg-black/5"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="w-8 h-8 rounded-lg flex items-center justify-center opacity-70 hover:opacity-100"
              style={{ color: 'var(--text)' }}
            >
              <Mic size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              Send <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
