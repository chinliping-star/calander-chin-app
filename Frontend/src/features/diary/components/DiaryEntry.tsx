import { useState } from 'react';
import { cn } from '../../../lib/utils.ts';
import type { DiaryEntryData } from '../types.ts';

interface DiaryEntryProps {
  entry: DiaryEntryData;
}

const VISIBILITY_CONFIG = {
  public: {
    icon: '🌐',
    label: 'Public',
    bg: 'rgba(16,185,129,0.12)',
    color: '#059669',
  },
  friends: {
    icon: '👥',
    label: 'Friends',
    bg: 'rgba(59,130,246,0.12)',
    color: '#1D4ED8',
  },
  private: {
    icon: '🔒',
    label: 'Private',
    bg: 'rgba(107,114,128,0.10)',
    color: '#6B7280',
  },
} as const;

const WORD_TRUNCATE_LIMIT = 80;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateWords(text: string, limit: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(' ') + '…';
}

export function DiaryEntry({ entry }: DiaryEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const vis = VISIBILITY_CONFIG[entry.visibility];
  const wordCount = countWords(entry.text);
  const needsTruncation = wordCount > WORD_TRUNCATE_LIMIT;
  const displayText =
    needsTruncation && !expanded ? truncateWords(entry.text, WORD_TRUNCATE_LIMIT) : entry.text;

  function handleLike() {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  return (
    <article
      className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(74,62,78,0.06)',
      }}
      aria-label={`Diary entry with ${entry.friend} on ${entry.date}`}
    >
      {/* Card header — visibility badge + menu */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: vis.bg, color: vis.color }}
          aria-label={`Visibility: ${vis.label}`}
        >
          <span aria-hidden="true">{vis.icon}</span>
          {vis.label}
        </span>

        {/* Overflow menu */}
        <div className="relative">
          <button
            type="button"
            aria-label="Entry options"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors',
              'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 active:scale-95',
            )}
            style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-9 z-20 min-w-[140px] rounded-xl py-1 shadow-lg"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              {(['Edit', 'Delete', 'Change visibility'] as const).map((item) => (
                <button
                  key={item}
                  role="menuitem"
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-4 py-2 text-left text-sm transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                  style={{ color: item === 'Delete' ? '#dc2626' : 'var(--text)' }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optional photo */}
      {entry.photo && (
        <div className="px-4 pb-3">
          <img
            src={entry.photo}
            alt={`Memory with ${entry.friend}`}
            className="w-full rounded-lg object-cover"
            style={{ height: '160px' }}
            loading="lazy"
            width={400}
            height={160}
          />
        </div>
      )}

      {/* Friend + date + location */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2">
          <img
            src={entry.friendAvatar}
            alt={entry.friend}
            className="h-7 w-7 rounded-full object-cover border"
            style={{ borderColor: 'var(--border)' }}
            width={28}
            height={28}
          />
          <p className="text-sm" style={{ color: 'var(--text-h)' }}>
            <span className="font-semibold">With {entry.friend}</span>
            <span style={{ color: 'var(--text)' }}> · {entry.date}</span>
          </p>
        </div>
        {entry.location && (
          <p className="mt-0.5 pl-9 text-xs" style={{ color: 'var(--text)' }}>
            📍 {entry.location}
          </p>
        )}
      </div>

      {/* Diary text */}
      <div className="px-4 pb-3">
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text)' }}
        >
          {displayText}
        </p>
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-xs font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 rounded-sm"
            style={{ color: 'var(--color-primary)' }}
            aria-expanded={expanded}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Comments panel (collapsed by default) */}
      {commentsOpen && (
        <div
          className="mx-4 mb-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs italic" style={{ color: 'var(--text)' }}>
            No comments yet. Be the first!
          </p>
        </div>
      )}

      {/* Action bar */}
      <div
        className="flex items-center gap-1 border-t px-4 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Comment toggle */}
        <button
          type="button"
          aria-label="Toggle comments"
          aria-pressed={commentsOpen}
          onClick={() => setCommentsOpen((o) => !o)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 active:scale-95',
          )}
          style={{
            color: commentsOpen ? 'var(--color-primary)' : 'var(--text)',
            backgroundColor: commentsOpen ? 'var(--accent-bg)' : 'transparent',
          }}
        >
          <span aria-hidden="true">💬</span>
          Comment
        </button>

        {/* Like */}
        <button
          type="button"
          aria-label={liked ? 'Unlike entry' : 'Like entry'}
          aria-pressed={liked}
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 active:scale-95',
          )}
          style={{
            color: liked ? '#e11d48' : 'var(--text)',
            backgroundColor: liked ? 'rgba(225,29,72,0.10)' : 'transparent',
          }}
        >
          <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span>
          {likeCount > 0 ? likeCount : 'Like'}
        </button>

        {/* Share */}
        <button
          type="button"
          aria-label="Share entry"
          onClick={handleShare}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 active:scale-95',
          )}
          style={{ color: 'var(--text)', backgroundColor: 'transparent' }}
        >
          <span aria-hidden="true">🔗</span>
          Share
        </button>
      </div>
    </article>
  );
}
