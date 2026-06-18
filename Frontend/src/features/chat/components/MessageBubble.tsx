import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Check, CheckCheck, MoreVertical } from 'lucide-react';
import type { Message } from '../types';
import { format } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
  seenByOthers: boolean;
  onEdit: (messageId: string, current: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, seenByOthers, onEdit, onDelete }: Props) {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // sender_id can be null if that user was deleted
  const sender = message.sender_id;
  const name = sender?.display_name ?? sender?.username ?? 'Deleted user';
  const time = format(new Date(message.created_at), 'HH:mm');

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const Avatar = (
    <div
      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold overflow-hidden self-start"
      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
    >
      {sender?.avatar_url
        ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
        : name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div
      className={`flex gap-2.5 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {Avatar}

      {/* Bubble column */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Name + time row */}
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{name}</span>
          <span className="text-xs" style={{ color: 'var(--text)' }}>{time}</span>
        </div>

        {/* Bubble + kebab inline */}
        <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className="relative px-4 py-2.5 text-sm"
            style={isOwn
              ? { background: 'var(--color-primary)', color: '#fff', borderRadius: '14px', borderTopRightRadius: '4px' }
              : { background: 'var(--color-tertiary)', color: 'var(--text-h)', borderRadius: '14px', borderTopLeftRadius: '4px' }
            }
          >
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          </div>

          {/* Actions (own messages) — kebab menu */}
          {isOwn && (
            <div ref={menuRef} className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Message options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: 'var(--text)',
                  opacity: hover || menuOpen ? 1 : 0,
                  pointerEvents: hover || menuOpen ? 'auto' : 'none',
                  background: menuOpen ? 'var(--color-neutral)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-neutral)')}
                onMouseLeave={e => (e.currentTarget.style.background = menuOpen ? 'var(--color-neutral)' : 'transparent')}
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute z-20 top-8 min-w-[140px] rounded-xl py-1 overflow-hidden"
                  style={{
                    right: 0,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    boxShadow: '0px 10px 30px rgba(0,0,0,0.08)',
                  }}
                >
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onEdit(message._id, message.content); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors"
                    style={{ color: 'var(--text-h)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-neutral)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Pencil size={14} strokeWidth={1.5} /> Edit
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onDelete(message._id); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors"
                    style={{ color: '#ef4444' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={14} strokeWidth={1.5} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status row */}
        {(message.edited || isOwn) && (
          <div className={`flex items-center gap-1.5 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {message.edited && (
              <span className="text-xs italic" style={{ color: 'var(--text)' }}>edited</span>
            )}
            {isOwn && (
              seenByOthers
                ? <CheckCheck size={12} style={{ color: 'var(--color-primary)' }} />
                : <Check size={12} style={{ color: 'var(--text)' }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
