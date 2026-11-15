import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import {
  ProposalCard, ChatBubble, MemoryPolaroid, FreeFriendsBadge, STEP_VISUALS, MEMORIES,
} from '../components/LandingVisuals.tsx';
import {
  CalendarHeart, Send, PartyPopper, CalendarDays, Users, Camera,
  MessageCircle, Palette, StickyNote, ArrowRight, Lock, UserCheck, EyeOff,
  ShieldCheck, Heart, Plane, GraduationCap, Coffee, ChevronDown, Smartphone,
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

const AUDIENCE = [
  { icon: Heart,         title: 'Best friends',          text: 'Never let a month slip by without catching up.' },
  { icon: Plane,         title: 'Long-distance friends', text: 'See when they are back in town and grab that day first.' },
  { icon: GraduationCap, title: 'Uni & school groups',   text: 'Study sessions, birthdays and trips without the endless group chat.' },
  { icon: Coffee,        title: 'Busy schedules',        text: 'Block your busy days once; friends only ask when you are actually free.' },
];

const PRIVACY = [
  { icon: Lock,        title: 'Friends-only by default',  text: 'New calendars are private. Only friends you accept can see your days.' },
  { icon: UserCheck,   title: 'You approve every friend', text: 'Nobody sees your calendar until you accept their friend request.' },
  { icon: EyeOff,      title: 'Private meetups',          text: 'Mark a meetup private and only the people in it can see it.' },
  { icon: ShieldCheck, title: 'Your data stays yours',    text: 'We do not sell your data. Read exactly what we store in our Privacy Policy.' },
];

const FAQS = [
  { q: 'Is Friendiary free?', a: 'Yes. The calendar, friends and meetups are free. Optional Premium plans add extras like memory albums and more customisation.' },
  { q: 'Who can see my calendar?', a: 'Only friends you have accepted. Calendars are friends-only by default, and you can change this in Settings.' },
  { q: 'How do I propose a meetup?', a: "Open a friend's calendar, tap one of their free days, fill in the plan and send it. They can accept or decline." },
  { q: 'What does a pending meetup mean?', a: 'It is a plan that was proposed but not answered yet. Once it is accepted it becomes a planned meetup on both calendars.' },
  { q: 'How do I mark a day as busy?', a: 'Tap any free day on your own calendar and choose to block it. Friends cannot propose meetups on blocked days.' },
  { q: 'Can I use it on my phone?', a: 'Yes. Friendiary works in any mobile browser, and you can add it to your home screen to use it like an app.' },
];

// Links starting with "#" scroll within this page; the rest are app routes.
const FOOTER_COLS: { title: string; links: { label: string; to: string }[] }[] = [
  { title: 'Product', links: [
    { label: 'How it works', to: '#how-it-works' },
    { label: 'Features', to: '#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Create account', to: '/register' },
  ] },
  { title: 'Company', links: [
    { label: 'About', to: '#about' },
    { label: 'FAQ', to: '#faq' },
    { label: 'Privacy & safety', to: '#privacy' },
    { label: 'Log in', to: '/login' },
  ] },
  { title: 'Legal', links: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms & Conditions', to: '/terms' },
  ] },
];

const NAV = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'FAQ', href: '#faq' },
];

const sectionTitle = 'text-center text-3xl font-bold';
const textLink = 'rounded text-sm hover:opacity-80 focus-visible:outline-none focus-visible:ring-2';
const pill = 'flex items-center gap-2 rounded-full px-4 py-2 text-sm';

function CalendarPreview() {
  const blanks = 2; // month starts on a Wednesday
  return (
    <div
      className="w-full max-w-sm rounded-3xl p-5 transition-[rotate,scale] duration-500 hover:-rotate-1 hover:scale-[1.02]"
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
              data-day
              className="flex aspect-square cursor-default items-center justify-center rounded-lg text-[11px] transition-[scale] duration-150 hover:scale-110"
              style={{ backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}`, '--i': i } as React.CSSProperties}
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

const hoverCard = 'transition-[translate,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(255,127,177,0.18)]';

const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(201,64,123,0.28)] transition-[translate,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(201,64,123,0.38)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const ghostBtn = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-[translate,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2';

/** Public home page for visitors who are not signed in. */
export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Page is lazy-loaded, so the browser's own jump to /#faq etc. ran before the section existed.
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();

    // GSAP loads after first paint so it never delays the hero (the LCP element).
    // Hero entrance lives in LandingPage.css; GSAP only does the below-the-fold scroll reveals.
    let mm: gsap.MatchMedia | undefined;
    let cancelled = false;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      mm = gsap.matchMedia();
      // No motion at all for people who ask their device to reduce it.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(group => {
          gsap.from(group.children, {
            y: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 85%', once: true },
          });
        });
        gsap.from('[data-polaroid]', {
          y: 80, opacity: 0, rotation: -20, duration: 0.9, stagger: 0.12, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '#memories', start: 'top 75%', once: true },
        });
      }, rootRef);
    });
    return () => { cancelled = true; mm?.revert(); };
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-clip" style={{ background: 'linear-gradient(180deg, #fff8fb 0%, #fdf4ff 45%, #ffffff 100%)' }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Logo to="/" size={56} showText={false} />
        <nav aria-label="Page sections" className="hidden items-center gap-6 md:flex">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`${textLink} font-medium`} style={{ color: 'var(--text-h)' }}>{n.label}</a>
          ))}
        </nav>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link to="/login" className={ghostBtn} style={{ color: 'var(--text-h)' }}>Log in</Link>
          <Link to="/register" className={primaryBtn} style={{ backgroundColor: 'var(--color-primary-strong)' }}>Sign up</Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:px-6 md:pt-16">
          <div className="flex flex-col items-start gap-5">
            <span data-hero className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary-text)' }}>
              🌸 Your cute social calendar
            </span>
            <h1 className="m-0 text-4xl font-extrabold leading-tight md:text-5xl" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>
              Plan meetups with friends, the cute way.
            </h1>
            <p data-hero className="max-w-md text-base leading-relaxed" style={{ color: 'var(--text)' }}>
              Share your calendar, let friends pick a free day, and keep the memories together.
              No more "when are you free?" back and forth.
            </p>
            <div data-hero className="flex flex-wrap gap-3">
              <Link to="/register" className={primaryBtn} style={{ backgroundColor: 'var(--color-primary-strong)' }}>
                Create your calendar <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className={ghostBtn} style={{ color: 'var(--text-h)', border: '1px solid var(--border)', backgroundColor: '#fff' }}>
                How it works
              </a>
            </div>
            <p data-hero className="text-xs" style={{ color: 'var(--text)' }}>Free to start. No credit card.</p>
          </div>
          <div className="relative flex justify-center py-10 sm:pt-20 md:justify-end md:pb-14">
            <CalendarPreview />
            {/* Floating app snippets around the calendar (outer = entrance, inner = idle float) */}
            {[
              { el: <ProposalCard />,     pos: 'left-0 top-24 lg:-left-16' },
              { el: <ChatBubble />,       pos: 'right-0 top-6 md:-right-4' },
              { el: <FreeFriendsBadge />, pos: 'left-2 bottom-0 md:-left-10' },
              { el: <MemoryPolaroid />,   pos: 'right-0 -bottom-6 rotate-6 md:-right-8' },
            ].map(({ el, pos }, i) => (
              <div key={i} data-float className={`absolute z-10 hidden transition-[translate] duration-300 hover:-translate-y-2 sm:block ${pos}`} style={{ '--i': i } as React.CSSProperties}>
                <div data-float-inner>{el}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-8 px-4 py-16 md:px-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="mx-auto max-w-6xl">
            <h2 id="how-heading" className="text-center text-3xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>How it works</h2>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--text)' }}>Three steps from "we should hang out" to an actual plan.</p>
            <ol data-reveal className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => {
                const Visual = STEP_VISUALS[i];
                return (
                <li key={title} className={`flex flex-col gap-3 rounded-3xl p-6 ${hoverCard}`} style={{ backgroundColor: 'var(--color-tertiary)' }}>
                  <div className="mb-2 flex h-32 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #ffe4ef 0%, #f3e8ff 100%)' }} aria-hidden="true">
                    <Visual />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: '#fff', color: 'var(--color-primary-text)' }}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary-text)' }}>Step {i + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
                </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-heading" className="scroll-mt-8 px-4 py-16 md:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 id="features-heading" className="text-center text-3xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Everything for your social life</h2>
            <ul data-reveal className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className={`flex gap-4 rounded-3xl p-5 ${hoverCard}`} style={{ backgroundColor: '#fff', border: '1px solid var(--border)' }}>
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

        {/* Memories */}
        <section id="memories" aria-labelledby="memories-heading" className="overflow-hidden px-4 py-16 md:px-6" style={{ background: 'linear-gradient(180deg, #fdf4ff 0%, #fff0f6 100%)' }}>
          <div className="mx-auto max-w-6xl">
            <h2 id="memories-heading" className={sectionTitle} style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Keep the memories together</h2>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--text)' }}>
              After a meetup, everyone who was there can add their photos to one shared album. Your year with friends, all in one place.
            </p>
            <ul tabIndex={0} aria-label="Example memory photos. Hover to spread them out." className="group/pile mx-auto mt-12 flex w-fit justify-center rounded-3xl px-4 py-6 focus-visible:outline-none focus-visible:ring-2">
              {MEMORIES.map((m, i) => (
                <li
                  key={m.caption}
                  className="relative -ml-28 transition-[margin,rotate,translate] duration-500 ease-out first:ml-0 hover:z-10 hover:-translate-y-3 sm:group-hover/pile:ml-5 sm:group-focus-visible/pile:ml-5 sm:group-hover/pile:first:ml-0 sm:group-focus-visible/pile:first:ml-0"
                  style={{ rotate: `${m.tilt * 2}deg`, zIndex: MEMORIES.length - i }}
                >
                  <div data-polaroid>
                    <MemoryPolaroid emoji={m.emoji} caption={m.caption} from={m.from} to={m.to} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Who it is for */}
        <section aria-labelledby="audience-heading" className="px-4 py-16 md:px-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="mx-auto max-w-6xl">
            <h2 id="audience-heading" className={sectionTitle} style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Made for every kind of friendship</h2>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--text)' }}>However your crew works, planning gets easier.</p>
            <ul data-reveal className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIENCE.map(({ icon: Icon, title, text }) => (
                <li key={title} className={`flex flex-col items-center gap-3 rounded-3xl p-6 text-center ${hoverCard}`} style={{ backgroundColor: 'var(--color-tertiary)' }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: '#fff', color: 'var(--color-primary-text)' }}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="font-bold" style={{ color: 'var(--text-h)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Privacy & safety */}
        <section id="privacy" aria-labelledby="privacy-heading" className="scroll-mt-8 px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary-text)' }}>
                <ShieldCheck size={24} aria-hidden="true" />
              </span>
              <h2 id="privacy-heading" className="text-3xl font-bold" style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Private by default</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                Your calendar shows where you are and when. That is personal, so Friendiary keeps it between you and the friends you choose.
              </p>
              <Link to="/privacy" className={`${textLink} inline-flex w-fit items-center gap-1.5 font-semibold`} style={{ color: 'var(--color-primary-text)' }}>
                Read our Privacy Policy <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <ul data-reveal className="grid gap-4 sm:grid-cols-2">
              {PRIVACY.map(({ icon: Icon, title, text }) => (
                <li key={title} className={`flex flex-col gap-2 rounded-3xl p-5 ${hoverCard}`} style={{ backgroundColor: '#fff', border: '1px solid var(--border)' }}>
                  <Icon size={20} aria-hidden="true" style={{ color: 'var(--color-primary-text)' }} />
                  <h3 className="font-bold" style={{ color: 'var(--text-h)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* About */}
        <section id="about" aria-labelledby="about-heading" className="scroll-mt-8 px-4 py-16 md:px-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <h2 id="about-heading" className={sectionTitle} style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>About Friendiary</h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text)' }}>
              Friendiary started with a simple feeling: we all want to see our friends more, but planning it is the hard part.
              Group chats get buried, "let's meet soon" never turns into a date, and months go by.
            </p>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text)' }}>
              So we made a calendar that is about people, not work. It is soft, colourful and a little playful,
              because making plans with friends should feel as nice as the meetup itself.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {[
                { icon: Heart, label: 'Made for friendships' },
                { icon: Smartphone, label: 'Works on phone & desktop' },
                { icon: Lock, label: 'Private by default' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className={pill} style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)' }}>
                  <Icon size={16} aria-hidden="true" style={{ color: 'var(--color-primary-text)' }} /> {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-8 px-4 py-16 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-heading" className={sectionTitle} style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}>Questions? We have answers</h2>
            <div data-reveal className="mt-8 flex flex-col gap-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl px-5 py-4 transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(255,127,177,0.14)] open:shadow-[0_10px_28px_rgba(255,127,177,0.14)]" style={{ backgroundColor: '#fff', border: '1px solid var(--border)' }}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-semibold focus-visible:outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden" style={{ color: 'var(--text-h)' }}>
                    {q}
                    <ChevronDown size={18} aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--color-primary-text)' }} />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{a}</p>
                </details>
              ))}
            </div>
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

      <footer className="border-t px-4 pb-8 pt-12 md:px-6" style={{ borderColor: 'var(--border)', backgroundColor: '#ffffff' }}>
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Logo to="/" size={64} showText={false} />
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              The cute social calendar for planning meetups with friends and keeping the memories together.
            </p>
          </div>
          {FOOTER_COLS.map(col => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-h)' }}>{col.title}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map(l => (
                  <li key={l.label}>
                    {l.to.startsWith('#')
                      ? <a href={l.to} className={textLink} style={{ color: 'var(--text)' }}>{l.label}</a>
                      : <Link to={l.to} className={textLink} style={{ color: 'var(--text)' }}>{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-2 border-t pt-6 text-xs sm:flex-row" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
          <p>© {new Date().getFullYear()} Friendiary. All rights reserved.</p>
          <p>Made with 💗 for friends everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
