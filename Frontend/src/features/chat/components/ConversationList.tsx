import type { Conversation, ChatUser } from '../types';
import { useAuthStore } from '../../../store/auth';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (conv: Conversation) => void;
}

function getOtherParticipant(conv: Conversation, myMongoId?: string): ChatUser | undefined {
  return conv.participants.find(p => p._id !== myMongoId);
}

function getConvName(conv: Conversation, myMongoId?: string): string {
  if (conv.type === 'group') return conv.name ?? 'Group Chat';
  const other = getOtherParticipant(conv, myMongoId);
  return other?.display_name ?? other?.username ?? 'Unknown';
}

function getConvAvatar(conv: Conversation, myMongoId?: string): string | undefined {
  if (conv.type === 'group') return conv.avatar_url;
  return getOtherParticipant(conv, myMongoId)?.avatar_url;
}

export function ConversationList({ conversations, activeId, onSelect }: Props) {
  const user = useAuthStore(s => s.user);
  const myId = user?._id;

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {conversations.length === 0 && (
        <p className="text-center text-sm py-8" style={{ color: 'var(--text)' }}>
          No conversations yet
        </p>
      )}
      {conversations.map(conv => {
        const name   = getConvName(conv, myId);
        const avatar = getConvAvatar(conv, myId);
        const isActive = conv._id === activeId;
        const lastMsg = conv.last_message;

        return (
          <button
            key={conv._id}
            onClick={() => onSelect(conv)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors w-full"
            style={{
              background: isActive ? 'var(--accent-bg)' : 'transparent',
              border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
            }}
          >
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold overflow-hidden"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
            >
              {avatar
                ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                : name.charAt(0).toUpperCase()}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-h)' }}>
                  {name}
                </span>
                {lastMsg?.sent_at && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text)' }}>
                    {formatDistanceToNow(new Date(lastMsg.sent_at), { addSuffix: false })}
                  </span>
                )}
              </div>
              {lastMsg && (
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text)' }}>
                  {lastMsg.content}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
