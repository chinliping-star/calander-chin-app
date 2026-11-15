import { Link } from 'react-router-dom';
import {
  CalendarHeart, Send, PartyPopper, CalendarDays, Users, Camera,
  MessageCircle, Palette, StickyNote, ArrowRight,
} from 'lucide-react';
import { Logo } from '../../../components/Logo.tsx';

// Day states in the hero preview — same colours as the real calendar.
type DayState = 'free' | 'busy' | 'planned' | 'pending';
const DAY_STYLE: Record<DayState, { bg: string; fg: string; border: string }> = {
  free:    { bg: '#ffffff', fg: '#4A3E4E', border: '#e8dfe6' },
  busy:    { bg: '#ecebee', fg: '#4A3E4E', border: '#ecebee' },
  planned: { bg: '#FF7FB1', fg: '#2d2330', border: '#FF7FB1' },
  pending: { bg: '#e9dcff', fg: '#4A3E4E', border: '#c4a8ff' },
};
const SPECIAL: Record<number, DayState> = { 3: 'busy', 4: 'busy', 9: 'planned', 12: 'pending', 17: 'busy', 20: 'planned', 24: 'pending', 27: 'planned' };
const LEGEND: [DayState, string][] = [['free', 'Free'], ['busy', 'Busy'], ['planned', 'Planned'], ['pending', 'Pending']];

const STEPS = [
  { icon: CalendarHeart, title: 'Share your calendar', text: 'Get your own page at friendiary.com/you and mark the days you are free or busy.' },
  { icon: Send,          title: 'Friends propose a meetup', text: 'Friends tap a free day and suggest a plan — coffee, a movie, a picnic.' },
  { icon: PartyPopper,   title: 'Say yes, it is on', text: 'Accept the plan and it shows up on both calendars. No more group-chat chaos.' },
];

const FEATURES = [
  { icon: CalendarDays,  title: 'Your own calendar',  text: 'A cute month view that shows when you are free, busy, or already booked.' },
  { icon: Users,         title: 'Friends & invites',  text: 'Add friends, see who is online, and plan meetups with one or many.' },
  { icon: Camera,        title: 'Memories',           text: 'After you meet up, everyone adds photos to one shared album.' },
  { icon: MessageCircle, title: 'Chat',               text: 'Talk plans through right next to your calendar.' },
  { icon: Palette,       title: 'Themes',             text: 'Pick colours, cursors and fun effects that feel like you.' },
  { icon: StickyNote,    title: 'Sticky notes',       text: 'Leave little reminders on any page, just for you.' },
];

function CalendarPreview() {
  const blanks = 2; // month starts on a Wednesday
  return (
    <div
      className="w-full max-w-sm rounded-3xl p-5"
      style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(255,127,177,0.18), 0 4px 16px rgba(74,62,78,0.06)' }}
      aria-label="Example Friendiary calendar"
      role="img"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>June</p>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary-text)' }}>
          3 meetups planned
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold" style={{ color: 'var(--text)' }} aria-hidden="true">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const s = DAY_STYLE[SPECIAL[day] ?? 'free'];
          return (
            <span
              key={day}
              className="flex aspect-square items-center justify-center rounded-lg text-[11px]"
              style={{ backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}` }}
            >
              {day}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3" aria-hidden="true">
        {LEGEND.map(([k, label]) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text)' }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DAY_STYLE[k].bg, border: `1px solid ${DAY_STYLE[k].border}` }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const ghostBtn = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2';

/** Public home page for visitors who are not signed in. */
export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #fff8fb 0%, #fdf4ff 45%, #ffffff 100%)' }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Logo to="/" size={56} showText={false} />
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link to="/login" className={ghostBtn} style={{ color: 'var(--text-h)' }}>Log in</Link>
          <Link to="/register" className={primaryBtn} style={{ backgroundColor: 'var(--color-primary-strong)' }}>Sign up</Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:px-6 md:pt-16">
          <div className="flex flex-col items-start gap-5">
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary-text)' }}>
              🌸 Your cute social calendar
            </span>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
              Plan meetups with friends, the cute way.
            </h1>
            <p className="max-w-md text-base leading-relaxed" style={{ color: 'var(--text)' }}>
              Share your calendar, let friends pick a free day, and keep the memories together.
              No more "when are you free?" back and forth.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className={primaryBtn} style={{ backgroundColor: 'var(--color-primary-strong)' }}>
                Create your calendar <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className={ghostBtn} style={{ color: 'var(--text-h)', border: '1px solid var(--border)', backgroundColor: '#fff' }}>
                How it works
              </a>
            </div>
            <p className="text-xs" style={{ color: 'var(--text)' }}>Free to start. No credit card.</p>
          </div>
          <div className="flex justify-center md:justify-end">
            <CalendarPreview />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-8 px-4 py-16 md:px-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="mx-auto max-w-6xl">
            <h2 id="how-heading" className="text-center text-3xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>How it works</h2>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--text)' }}>Three steps from "we should hang out" to an actual plan.</p>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex flex-col gap-3 rounded-3xl p-6" style={{ backgroundColor: 'var(--color-tertiary)' }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#fff', color: 'var(--color-primary-text)' }}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary-text)' }}>Step {i + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-heading" className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 id="features-heading" className="text-center text-3xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Everything for your social life</h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4 rounded-3xl p-5" style={{ backgroundColor: '#fff', border: '1px solid var(--border)' }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary-text)' }}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-h)' }}>{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final call to action */}
        <section aria-labelledby="cta-heading" className="px-4 pb-20 md:px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 rounded-[2rem] px-6 py-12 text-center" style={{ background: 'linear-gradient(135deg, #FFF0F6 0%, #f3e8ff 100%)' }}>
            <h2 id="cta-heading" className="text-3xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Ready to plan your next meetup?</h2>
            <p className="max-w-md text-sm" style={{ color: 'var(--text)' }}>Make your calendar in a minute and share the link with your friends.</p>
            <Link to="/register" className={primaryBtn} style={{ backgroundColor: 'var(--color-primary-strong)' }}>
              Get started free <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-8 md:px-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm sm:flex-row" style={{ color: 'var(--text)' }}>
          <p>© {new Date().getFullYear()} Friendiary</p>
          <nav aria-label="Footer" className="flex gap-5">
            <Link to="/pricing" className="hover:opacity-80">Pricing</Link>
            <Link to="/privacy" className="hover:opacity-80">Privacy</Link>
            <Link to="/terms" className="hover:opacity-80">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
