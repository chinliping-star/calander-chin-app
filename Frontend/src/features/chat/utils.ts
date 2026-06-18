import type { Conversation, ChatUser } from './types';

interface MeLike {
  _id?: string;
  username?: string;
}

/** True when this participant is the current user (robust to missing _id). */
export function isSelf(p: ChatUser, me?: MeLike | null): boolean {
  if (!me) return false;
  if (me._id && p._id === me._id) return true;
  if (me.username && p.username === me.username) return true;
  return false;
}

/** The other participant in a private conversation (never the current user). */
export function getPeer(conv: Conversation, me?: MeLike | null): ChatUser | undefined {
  if (conv.type !== 'private') return undefined;
  return conv.participants.find(p => !isSelf(p, me)) ?? undefined;
}

/** Whether a private conversation's peer is currently online. */
export function isPeerOnline(
  conv: Conversation,
  me: MeLike | null | undefined,
  onlineUsers: Set<string>,
): boolean {
  const peer = getPeer(conv, me);
  return !!peer && onlineUsers.has(peer._id);
}
