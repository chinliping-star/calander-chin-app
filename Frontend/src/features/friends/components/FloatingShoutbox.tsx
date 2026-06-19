import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, GripVertical } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.ts';
import { Shoutbox } from './Shoutbox.tsx';

const POS_KEY = 'friendiary-shoutbox-pos';
const OPEN_KEY = 'friendiary-shoutbox-open';
const PANEL_W = 300;
const PANEL_H = 420;
const HEADER_H = 40;
const MARGIN = 16;

interface Pos {
  x: number;
  y: number;
}

/** Clamp a position so the panel stays fully on screen (using its header height as the min footprint). */
function clamp(p: Pos): Pos {
  const maxX = Math.max(MARGIN, window.innerWidth - PANEL_W - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - HEADER_H - MARGIN);
  return {
    x: Math.min(Math.max(MARGIN, p.x), maxX),
    y: Math.min(Math.max(MARGIN, p.y), maxY),
  };
}

function defaultPos(): Pos {
  return {
    x: window.innerWidth - PANEL_W - MARGIN,
    y: window.innerHeight - PANEL_H - MARGIN,
  };
}

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) return JSON.parse(raw) as Pos;
  } catch {
    /* ignore */
  }
  return defaultPos();
}

/**
 * Floating, draggable Shoutbox. Collapses by sliding the body up into the
 * header (bottom→top); expands the body back down (top→bottom). Position and
 * open/closed state persist in localStorage.
 */
export function FloatingShoutbox() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(
    () => localStorage.getItem(OPEN_KEY) !== 'false',
  );
  const [pos, setPos] = useState<Pos>(loadPos);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(OPEN_KEY, String(open));
  }, [open]);

  useEffect(() => {
    function onResize() {
      setPos((p) => clamp(p));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    setPos(
      clamp({ x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy }),
    );
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    setPos((p) => {
      localStorage.setItem(POS_KEY, JSON.stringify(p));
      return p;
    });
  }, [onPointerMove]);

  function startDrag(e: React.PointerEvent) {
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  if (!user) return null;

  return (
    <div
      className="fixed z-50 rounded-2xl flex flex-col overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: PANEL_W,
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(74,62,78,0.22)',
      }}
      role="dialog"
      aria-label="Shoutbox"
    >
      {/* Drag handle / header */}
      <div
        onPointerDown={startDrag}
        className="flex items-center justify-between gap-2 px-3 cursor-grab active:cursor-grabbing select-none"
        style={{
          height: HEADER_H,
          backgroundColor: 'var(--color-tertiary)',
          borderBottom: open ? '1px solid var(--border)' : 'none',
          touchAction: 'none',
        }}
      >
        <span
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
          style={{ color: 'var(--color-primary)' }}
        >
          <GripVertical size={14} style={{ opacity: 0.6 }} />
          Shoutbox
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          onPointerDown={(e) => e.stopPropagation()}
          className="grid place-items-center h-6 w-6 rounded-full transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: 'var(--color-primary)' }}
          aria-label={open ? 'Collapse shoutbox' : 'Expand shoutbox'}
          aria-expanded={open}
        >
          <ChevronDown
            size={18}
            style={{
              transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>
      </div>

      {/* Collapsible body — slides up to collapse, down to expand */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: open ? PANEL_H - HEADER_H : 0,
          opacity: open ? 1 : 0,
          transition: 'max-height 0.28s ease, opacity 0.2s ease',
        }}
      >
        <div className="p-3">
          <Shoutbox hideHeading />
        </div>
      </div>
    </div>
  );
}
