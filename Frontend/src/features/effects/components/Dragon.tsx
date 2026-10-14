import { useEffect, useRef, useState } from 'react';

/**
 * A shy dragon peeking out from behind the page. Its eyes follow the mouse;
 * when the pointer comes close it ducks away and pops up somewhere else.
 * Sits behind the content (pointer-events: none), so it never blocks clicks.
 */

interface Spot {
  side: 'bottom' | 'left' | 'right';
  /** Position along the edge, 0..1 */
  at: number;
}

const SPOTS: Spot[] = [
  { side: 'bottom', at: 0.18 },
  { side: 'bottom', at: 0.82 },
  { side: 'left',   at: 0.35 },
  { side: 'left',   at: 0.7 },
  { side: 'right',  at: 0.3 },
  { side: 'right',  at: 0.65 },
];

const ANGLE: Record<Spot['side'], number> = { bottom: 0, left: 90, right: -90 };
const NEAR_PX = 170;
const W = 130, H = 160;

export function Dragon({ onHide, reducedMotion }: { onHide?: () => void; reducedMotion: boolean }) {
  const [spotIdx, setSpotIdx] = useState(0);
  const [hidden, setHidden] = useState(true);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const headRef = useRef<SVGCircleElement | null>(null);
  const hiddenRef = useRef(true);
  const spotRef = useRef(0);
  const onHideRef = useRef(onHide);
  useEffect(() => { onHideRef.current = onHide; }, [onHide]);

  // First appearance shortly after mount.
  useEffect(() => {
    const id = window.setTimeout(() => { hiddenRef.current = false; setHidden(false); }, 800);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let last: { x: number; y: number } | null = null;

    function check() {
      raf = 0;
      const head = headRef.current;
      if (!head || !last) return;
      const r = head.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = last.x - cx, dy = last.y - cy;

      // Eyes: rotate the pointer direction into the dragon's own frame.
      const a = (-ANGLE[SPOTS[spotRef.current].side] * Math.PI) / 180;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      const len = Math.hypot(lx, ly) || 1;
      setPupil({ x: (lx / len) * 3, y: (ly / len) * 3 });

      if (!hiddenRef.current && Math.hypot(dx, dy) < NEAR_PX) {
        hiddenRef.current = true;
        setHidden(true);
        onHideRef.current?.();
        // Come back at the spot farthest from the pointer.
        const pointer = last;
        timer = window.setTimeout(() => {
          const vw = window.innerWidth, vh = window.innerHeight;
          const pos = (s: Spot) =>
            s.side === 'bottom' ? { x: s.at * vw, y: vh } : { x: s.side === 'left' ? 0 : vw, y: s.at * vh };
          let best = spotRef.current, bestD = -1;
          SPOTS.forEach((s, i) => {
            if (i === spotRef.current) return;
            const p = pos(s);
            const d = Math.hypot(p.x - pointer.x, p.y - pointer.y) + Math.random() * 150;
            if (d > bestD) { bestD = d; best = i; }
          });
          spotRef.current = best;
          setSpotIdx(best);
          timer = window.setTimeout(() => { hiddenRef.current = false; setHidden(false); }, 80);
        }, 1100);
      }
    }

    function onMove(e: PointerEvent) {
      last = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(check);
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  const spot = SPOTS[spotIdx];
  const anchor: React.CSSProperties =
    spot.side === 'bottom'
      ? { left: `${spot.at * 100}%`, bottom: 0 }
      : spot.side === 'left'
        ? { left: 0, top: `${spot.at * 100}%` }
        : { right: 0, top: `${spot.at * 100}%` };

  return (
    <div style={{ position: 'fixed', zIndex: 0, pointerEvents: 'none', ...anchor, width: 0, height: 0 }} aria-hidden="true">
      <div
        style={{
          position: 'absolute',
          left: -W / 2,
          bottom: 0,
          width: W,
          height: H,
          transformOrigin: '50% 100%',
          transform: `rotate(${ANGLE[spot.side]}deg) translateY(${hidden ? 105 : 22}%)`,
          transition: hidden
            ? 'transform 0.35s cubic-bezier(.5,0,.75,0)'
            : `transform ${reducedMotion ? 0.2 : 0.7}s cubic-bezier(.2,1.4,.4,1)`,
        }}
      >
        <svg viewBox="0 0 130 160" width={W} height={H}>
          {/* Neck */}
          <path d="M40 160 C40 120 45 100 50 85 L80 85 C85 100 90 120 90 160 Z" fill="#16a34a" />
          <path d="M55 160 C55 125 58 105 60 95 L70 95 C72 105 75 125 75 160 Z" fill="#bbf7d0" opacity="0.8" />
          {/* Spikes */}
          <path d="M40 120 L28 112 L42 104 L30 96 L45 90" fill="#f97316" />
          {/* Horns */}
          <path d="M42 40 L30 8 L52 32 Z" fill="#fde68a" />
          <path d="M88 40 L100 8 L78 32 Z" fill="#fde68a" />
          {/* Head */}
          <circle ref={headRef} cx="65" cy="58" r="36" fill="#22c55e" />
          <ellipse cx="65" cy="80" rx="24" ry="14" fill="#86efac" />
          {/* Nostrils */}
          <circle cx="58" cy="80" r="2.4" fill="#14532d" />
          <circle cx="72" cy="80" r="2.4" fill="#14532d" />
          {/* Cheeks */}
          <circle cx="38" cy="68" r="5" fill="#fda4af" opacity="0.7" />
          <circle cx="92" cy="68" r="5" fill="#fda4af" opacity="0.7" />
          {/* Eyes */}
          <circle cx="51" cy="52" r="10" fill="#fff" />
          <circle cx="79" cy="52" r="10" fill="#fff" />
          <circle cx={51 + pupil.x} cy={52 + pupil.y} r="5" fill="#1f2937" />
          <circle cx={79 + pupil.x} cy={52 + pupil.y} r="5" fill="#1f2937" />
          <circle cx={53 + pupil.x} cy={50 + pupil.y} r="1.6" fill="#fff" />
          <circle cx={81 + pupil.x} cy={50 + pupil.y} r="1.6" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}
