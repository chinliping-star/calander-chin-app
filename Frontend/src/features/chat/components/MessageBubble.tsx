import { useState } from 'react';
import { Pencil, Trash2, Check, CheckCheck } from 'lucide-react';
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

  return (
    <div
      className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar (others only) */}
      {!isOwn && (
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold overflow-hidden self-end"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
        >
          {message.sender_id.avatar_url
            ? <img src={message.sender_id.avatar_url} alt="" className="w-full h-full object-cover" />
            : message.sender_id.display_name?.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Bubble */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs mb-0.5 ml-1" style={{ color: 'var(--text)' }}>
            {message.sender_id.display_name ?? message.sender_id.username}
          </span>
        )}
        <div
          className="relative px-3 py-2 rounded-2xl text-sm"
          style={isOwn
            ? { background: 'var(--color-primary)', color: '#fff', borderBottomRightRadius: '4px' }
            : { background: 'var(--color-tertiary)', color: 'var(--text-h)', borderBottomLeftRadius: '4px' }
          }
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-1.5 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs" style={{ color: 'var(--text)' }}>
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {message.edited && (
            <span className="text-xs italic" style={{ color: 'var(--text)' }}>edited</span>
          )}
          {isOwn && (
            seenByOthers
              ? <CheckCheck size={12} style={{ color: 'var(--color-primary)' }} />
              : <Check size={12} style={{ color: 'var(--text)' }} />
          )}
        </div>
      </div>

      {/* Actions (own messages, on hover) */}
      {isOwn && hover && (
        <div className="flex items-center gap-1 self-center">
          <button
            onClick={() => onEdit(message._id, message.content)}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text)', background: 'var(--color-neutral)' }}
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(message._id)}
            className="p-1 rounded-lg transition-colors"
            style={{ color: '#ef4444', background: 'var(--color-neutral)' }}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
