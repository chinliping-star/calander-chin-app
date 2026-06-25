import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BRAND = 'Friendiary';

// Pages with a fixed path → [label, short info]
const STATIC: Record<string, [string, string]> = {
  '/':          ['Welcome', 'your cute social calendar'],
  '/login':     ['Sign in', 'welcome back'],
  '/register':  ['Create account', 'join the fun'],
  '/onboarding':['Set up profile', 'almost there'],
  '/pricing':   ['Pricing', 'go Premium'],
  '/friends':   ['Friends', 'your circle'],
  '/settings':  ['Settings', 'profile & theme'],
  '/diary':     ['Diary', 'your private notes'],
  '/memory':    ['Memories', 'photo albums'],
  '/chat':      ['Messages', 'chat with friends'],
  '/analytics': ['Analytics', 'your meetup stats'],
  '/activity':  ['Activity', 'recent updates'],
};

// App's own top-level routes — anything else at the root is a /:username profile.
const RESERVED = new Set([
  'login', 'register', 'onboarding', 'pricing', 'sso-callback', 'friends',
  'settings', 'diary', 'memory', 'chat', 'analytics', 'activity', 'meetups', 'admin',
]);

function pageInfo(pathname: string): { label: string; info: string } {
  if (STATIC[pathname]) return { label: STATIC[pathname][0], info: STATIC[pathname][1] };

  if (pathname.startsWith('/meetups/new'))     return { label: 'New Meetup',     info: 'plan something fun' };
  if (pathname.startsWith('/meetups/propose')) return { label: 'Propose Meetup', info: 'suggest times to friends' };
  if (pathname.startsWith('/admin'))           return { label: 'Admin',          info: 'dashboard' };

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length && !RESERVED.has(segments[0])) {
    const handle = `@${segments[0]}`;
    if (segments[1] === 'calendar') return { label: `${handle}'s calendar`, info: 'plan a meetup' };
    return { label: handle, info: 'profile' };
  }

  return { label: BRAND, info: 'your cute social calendar' };
}

/**
 * Sets a per-page document title and gently scrolls it in the browser tab
 * (marquee). Mounted once at the router root so every route gets a fresh title.
 */
export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { label, info } = pageInfo(pathname);

    // Respect reduced-motion: static title, no animation.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      document.title = `${label} ✦ ${BRAND}`;
      return;
    }

    // "✦" is a single UTF-16 unit → safe to slice per character.
    const loop = `${label}   ✦   ${info}   ✦   ${BRAND}        `;
    const doubled = loop + loop;
    // Fixed-width window so the title length never changes (no jump).
    const WIN = Math.min(loop.length, 40);
    // Advance one char every STEP_MS; rAF keeps the cadence even (no timer drift),
    // which is the smoothest a right-to-left tab marquee can get.
    const STEP_MS = 150;

    let i = 0;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      if (now - last >= STEP_MS) {
        // i increments → text travels right-to-left (enters from the right).
        document.title = doubled.slice(i, i + WIN);
        i = (i + 1) % loop.length;
        last = now;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
