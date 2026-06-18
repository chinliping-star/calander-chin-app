import { useState, useRef, useEffect } from 'react';
import { X, Send, Headset } from 'lucide-react';
import { useSupportApi } from '../api/support.api.ts';

interface Msg { from: 'bot' | 'user'; text: string }

// Tappable starter prompts shown to the user
const QUICK_REPLIES = [
  'Profile blocked',
  'Payment issue',
  'Schedule a meetup',
  'Friend requests',
  'Change theme',
];

// Keyword → canned answer. First matching rule wins.
const RULES: { match: RegExp; reply: string }[] = [
  {
    match: /(profile.*block|block.*profile|blocked|banned|suspend)/i,
    reply: 'If your profile is blocked: it may be from a report or a billing issue. Check Settings → Account for any notice. If it looks wrong, tap “Talk to a human” and an agent will review it.',
  },
  {
    match: /(payment|billing|charge|refund|invoice|card|subscription issue|paid)/i,
    reply: 'For payment issues: check Settings → Subscription for your plan and billing status. For refunds or wrong charges, tap “Talk to a human” with your transaction date and an agent will help.',
  },
  {
    match: /(meetup|schedule|propose|plan|event)/i,
    reply: 'To schedule a meetup: open your calendar, click an available day, fill in the title, time and location, then invite friends. Note — max 3 meetups per day.',
  },
  {
    match: /(friend|request|add)/i,
    reply: 'For friends: search a user, send a request, and once they accept you can see their calendar and invite them to meetups.',
  },
  {
    match: /(premium|price|pricing|subscri|upgrade|pay)/i,
    reply: 'Premium unlocks memory albums and more. Open the Pricing page to upgrade — you can cancel anytime from Settings → Subscription.',
  },
  {
    match: /(theme|color|colour|appearance|dark)/i,
    reply: 'Change your look in Settings → Appearance. Pick from 8 themes; it applies instantly.',
  },
  {
    match: /(block|busy|available)/i,
    reply: 'To mark a day busy: open your own calendar, click the day, then "Mark Busy". Friends can\'t propose meetups on blocked days.',
  },
  {
    match: /(attend|miss|skip|attendance)/i,
    reply: 'After a meetup\'s date passes, open it and mark Attended / Missed / Skipped. Your reliability score updates automatically.',
  },
  {
    match: /(hi|hello|hey|salam|assalam)/i,
    reply: 'Hi! 👋 Ask me about meetups, friends, themes, attendance or premium.',
  },
];

const FALLBACK =
  "I'm not sure about that one. Please speak with a specific agent — I can guide you to them. Tap “Talk to a human” below.";

function botReply(text: string): string {
  return RULES.find(r => r.match.test(text))?.reply ?? FALLBACK;
}

export function SupportChatWidget({ onClose }: { onClose: () => void }) {
  const supportApi = useSupportApi();
  const sessionId = useRef(`sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).current;

  const [messages, setMessages] = useState<Msg[]>([
    { from: 'bot', text: 'Hi! 👋 I\'m the Friendiary assistant. How can I help today?' },
  ]);
  const [input, setInput] = useState('');
  const [waitingAgent, setWaitingAgent] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Persist a message to the backend (fire-and-forget)
  function log(from: 'user' | 'bot' | 'agent', text: string, needsAgent = false) {
    supportApi.logChat({ sessionId, from, text, needsAgent }).catch(() => {});
  }

  function handleSend(raw: string) {
    const text = raw.trim();
    if (!text || typing) return;
    const reply = botReply(text);
    setMessages(m => [...m, { from: 'user', text }]);
    setInput('');
    log('user', text);

    // Typing effect — show indicator 1–2s before the bot replies
    setTyping(true);
    const delay = 900 + Math.random() * 900;
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { from: 'bot', text: reply }]);
      log('bot', reply);
    }, delay);
  }

  function talkToHuman() {
    setWaitingAgent(true);
    const text = 'Just a moment — our agent will connect with you shortly. 💬';
    setMessages(m => [...m, { from: 'bot', text }]);
    log('user', '[requested human agent]', true);
    log('bot', text, true);
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col rounded-2xl overflow-hidden"
      style={{
        width: 340, height: 460, background: 'var(--bg)',
        border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      }}
      role="dialog"
      aria-label="Support chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--color-primary)' }}>
        <div className="flex items-center gap-2">
          <Headset size={16} color="#fff" />
          <p className="text-sm font-bold" style={{ color: '#fff' }}>Live Support</p>
        </div>
        <button onClick={onClose} aria-label="Close chat" className="text-white/90 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2" style={{ background: 'var(--color-neutral)' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] px-3 py-2 text-xs leading-relaxed rounded-2xl"
              style={m.from === 'user'
                ? { background: 'var(--color-primary)', color: '#fff', borderBottomRightRadius: 4 }
                : { background: 'var(--bg)', color: 'var(--text-h)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl flex items-center gap-1"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--text)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        {!waitingAgent && !typing && (
          <button
            onClick={talkToHuman}
            className="self-start mt-1 text-[11px] font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1px solid var(--accent-border)' }}
          >
            Talk to a human
          </button>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        {QUICK_REPLIES.map(q => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
            style={{ background: 'var(--color-tertiary)', color: 'var(--text-h)' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(input); }}
          placeholder="Type a message…"
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: 'var(--text-h)' }}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim()}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}
        >
          <Send size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}
