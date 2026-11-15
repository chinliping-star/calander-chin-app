import { Check, Link2, X } from 'lucide-react';

// Decorative mock-ups of the real app UI. They are hidden from screen readers:
// the surrounding copy already says what each one shows.

const card = 'rounded-2xl bg-white shadow-[0_12px_32px_rgba(74,62,78,0.12)] border border-[#f3e3ec]';

/** Hero: a friend's meetup proposal, as it arrives in the app. */
export function ProposalCard() {
  return (
    <div className={`${card} w-56 p-3.5`} aria-hidden="true">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#A78BFA' }}>A</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold" style={{ color: '#4A3E4E' }}>Aisha proposed a meetup</p>
          <p className="text-[11px]" style={{ color: '#6b6375' }}>Sat 9 June · 4:00 PM</p>
        </div>
      </div>
      <p className="mt-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold" style={{ backgroundColor: '#FFF0F6', color: '#4A3E4E' }}>☕ Coffee & cake at Bloom Café</p>
      <div className="mt-2.5 flex gap-2">
        <span className="flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-bold text-white" style={{ backgroundColor: '#C9407B' }}><Check size={12} /> Accept</span>
        <span className="flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-semibold" style={{ backgroundColor: '#f4f1f5', color: '#4A3E4E' }}><X size={12} /> Decline</span>
      </div>
    </div>
  );
}

/** Hero: a chat bubble. */
export function ChatBubble() {
  return (
    <div className={`${card} flex items-center gap-2 px-3 py-2.5`} aria-hidden="true">
      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: '#60A5FA' }}>S</span>
      <p className="text-xs font-semibold" style={{ color: '#4A3E4E' }}>See you at 4! 🌸</p>
    </div>
  );
}

/** Hero: a memory photo stuck on after the meetup. */
export function MemoryPolaroid({ emoji = '🎂', caption = "Sara's birthday", from = '#FFB3CE', to = '#C4B5FD' }: {
  emoji?: string; caption?: string; from?: string; to?: string;
}) {
  return (
    <div className="w-36 rounded-lg bg-white p-2 pb-3 shadow-[0_12px_32px_rgba(74,62,78,0.16)]" aria-hidden="true">
      <div className="flex aspect-square items-center justify-center rounded text-4xl" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>{emoji}</div>
      <p className="mt-2 text-center text-[11px] font-semibold" style={{ color: '#4A3E4E', fontFamily: 'cursive' }}>{caption}</p>
    </div>
  );
}

/** Hero: who is free this weekend. */
export function FreeFriendsBadge() {
  return (
    <div className={`${card} flex items-center gap-2 px-3 py-2`} aria-hidden="true">
      <div className="flex -space-x-2">
        {['#FF7FB1', '#34D399', '#FBBF24'].map((c, i) => (
          <span key={c} className="h-6 w-6 rounded-full border-2 border-white text-center text-[10px] font-bold leading-5 text-white" style={{ backgroundColor: c }}>{'MKJ'[i]}</span>
        ))}
      </div>
      <p className="text-[11px] font-bold" style={{ color: '#4A3E4E' }}>3 friends free this weekend</p>
    </div>
  );
}

// ── "How it works" step illustrations ───────────────────────────────────────

function ShareVisual() {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm" style={{ color: '#4A3E4E' }}>
        <Link2 size={14} style={{ color: '#B83D72' }} /> friendiary.com/<b>you</b>
      </span>
      <div className="flex gap-1">
        {['#fff', '#ecebee', '#fff', '#fff', '#ecebee', '#fff', '#fff'].map((c, i) => (
          <span key={i} className="h-6 w-6 rounded-md border" style={{ backgroundColor: c, borderColor: '#e8dfe6' }} />
        ))}
      </div>
    </div>
  );
}

function ProposeVisual() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: '#A78BFA' }}>A</span>
      <div>
        <p className="text-xs font-bold" style={{ color: '#4A3E4E' }}>🍿 Movie night?</p>
        <p className="text-[11px]" style={{ color: '#6b6375' }}>Fri 14 June · 8 PM</p>
      </div>
      <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: '#e9dcff', color: '#4A3E4E' }}>Pending</span>
    </div>
  );
}

function BothCalendarsVisual() {
  const mini = (who: string, color: string) => (
    <div className="rounded-xl bg-white p-2 shadow-sm">
      <p className="mb-1 text-center text-[10px] font-bold" style={{ color }}>{who}</p>
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="h-4 w-4 rounded" style={{ backgroundColor: i === 5 ? '#FF7FB1' : '#f4f1f5' }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      {mini('You', '#B83D72')}
      <span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: '#34D399' }}><Check size={14} /></span>
      {mini('Aisha', '#6d4fc7')}
    </div>
  );
}

export const STEP_VISUALS = [ShareVisual, ProposeVisual, BothCalendarsVisual];

// ── Memories strip ──────────────────────────────────────────────────────────

export const MEMORIES = [
  { emoji: '🎂', caption: "Sara's birthday",   from: '#FFB3CE', to: '#C4B5FD', tilt: -6 },
  { emoji: '🏖️', caption: 'Beach day',          from: '#93C5FD', to: '#FDE68A', tilt: 4 },
  { emoji: '🍜', caption: 'Ramen Friday',       from: '#FDBA74', to: '#FCA5A5', tilt: -3 },
  { emoji: '🎤', caption: 'Karaoke night',      from: '#A78BFA', to: '#F9A8D4', tilt: 6 },
  { emoji: '🌸', caption: 'Picnic in the park', from: '#86EFAC', to: '#FBCFE8', tilt: -5 },
];
