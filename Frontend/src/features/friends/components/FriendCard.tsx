import { MoreHorizontal, Calendar, Clock, Coffee } from 'lucide-react';
import { useState } from 'react';
import type { FriendProfile } from '../types.ts';

interface FriendCardProps {
  friend: FriendProfile;
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'CLOSE FRIEND':   { bg: 'rgba(255,127,177,0.13)', text: '#d6488a' },
  'BOOK CLUB':      { bg: 'rgba(192,132,252,0.13)', text: '#7c3aed' },
  'GYM BUDDY':      { bg: 'rgba(74,62,78,0.09)',    text: 'var(--text-h)' },
  'COWORKER':       { bg: 'rgba(74,62,78,0.09)',    text: 'var(--text-h)' },
  'BEST FRIEND':    { bg: 'rgba(255,127,177,0.13)', text: '#d6488a' },
  'WORK COLLEAGUE': { bg: 'rgba(74,62,78,0.09)',    text: 'var(--text-h)' },
  'FAMILY':         { bg: 'rgba(192,132,252,0.13)', text: '#7c3aed' },
};

function ActivityIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes('meetup') || l.includes('tomorrow') || l.includes('saturday') || l.includes('friday') || l.includes('week'))
    return <Calendar size={11} />;
  if (l.includes('seen') || l.includes('ago') || l.includes('until'))
    return <Clock size={11} />;
  return <Coffee size={11} />;
}

export function FriendCard({ friend }: FriendCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      className="relative flex flex-col rounded-2xl p-4 group cursor-pointer"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(74,62,78,0.07)',
      }}
      aria-label={`${friend.displayName} friend card`}
    >
      {/* Three-dot menu — top right */}
      <div className="absolute top-3 right-3">
        <button
          type="button"
          aria-label={`More options for ${friend.displayName}`}
          aria-expanded={menuOpen}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline-none"
          style={{ color: 'var(--text)' }}
        >
          <MoreHorizontal size={16} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-8 w-36 rounded-xl py-1 z-20"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 20px rgba(74,62,78,0.15)',
            }}
            role="menu"
          >
            {['View Profile', 'Propose Meetup', 'Remove Friend'].map((item) => (
              <button
                key={item}
                type="button"
                role="menuitem"
                className="w-full text-left px-3.5 py-2 text-xs hover:opacity-70 focus-visible:outline-none transition-opacity"
                style={{ color: item === 'Remove Friend' ? '#e11d48' : 'var(--text-h)' }}
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Circular avatar with online dot */}
      <div className="relative w-12 h-12 mb-3 shrink-0">
        <img
          src={friend.avatarUrl}
          alt={friend.displayName}
          className="w-full h-full rounded-full object-cover object-top"
          loading="lazy"
        />
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
          style={{ backgroundColor: '#22c55e' }}
          aria-hidden="true"
        />
      </div>

      {/* Name */}
      <p className="text-sm font-bold leading-tight mb-1 pr-6" style={{ color: 'var(--text-h)' }}>
        {friend.displayName}
      </p>

      {/* Activity line */}
      {friend.nextMeetup && (
        <p className="flex items-center gap-1 text-[11px] mb-2.5" style={{ color: 'var(--text)' }}>
          <ActivityIcon label={friend.nextMeetup} />
          {friend.nextMeetup.toLowerCase().includes('seen') || friend.nextMeetup.toLowerCase().includes('until')
            ? friend.nextMeetup
            : `Next meetup: ${friend.nextMeetup}`}
        </p>
      )}

      {/* Meetup count + tags */}
      <div className="flex flex-wrap items-center gap-1.5 mt-auto">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
        >
          {friend.meetupCount} meetups
        </span>
        {friend.tags.map((tag) => {
          const colors = TAG_COLORS[tag] ?? { bg: 'var(--surface)', text: 'var(--text)' };
          return (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {tag}
            </span>
          );
        })}
      </div>
    </article>
  );
}
