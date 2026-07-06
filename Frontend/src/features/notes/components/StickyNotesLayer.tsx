import { useEffect, useRef, useState, useCallback } from 'react';
import {
  StickyNote as StickyIcon,
  Plus,
  X,
  Eye,
  EyeOff,
  GripHorizontal,
  Pin,
  PinOff,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.ts';
import {
  useStickyNotesApi,
  type StickyNote,
  type NoteColor,
} from '../api/sticky-notes.api.ts';

const MIN_W = 140;
const MIN_H = 120;
const MAX_W = 480;
const MAX_H = 480;

const COLORS: Record<NoteColor, { bg: string; border: string }> = {
  yellow: { bg: 'rgba(255,236,140,0.88)', border: '#f1c40f' },
  pink:   { bg: 'rgba(255,191,214,0.88)', border: '#ff7fb1' },
  blue:   { bg: 'rgba(186,225,255,0.88)', border: '#5aa9f0' },
  green:  { bg: 'rgba(190,240,200,0.88)', border: '#54c98a' },
  purple: { bg: 'rgba(221,204,255,0.88)', border: '#a779f0' },
};
const COLOR_KEYS = Object.keys(COLORS) as NoteColor[];

function clampPos(x: number, y: number, w: number, h: number) {
  const maxX = Math.max(8, window.innerWidth - w - 8);
  const maxY = Math.max(8, window.innerHeight - h - 8);
  return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
}

// ── Single draggable note ──────────────────────────────────────────────────

function NoteCard({
  note,
  currentPath,
  onPatch,
  onDelete,
}: {
  note: StickyNote;
  currentPath: string;
  onPatch: (id: string, patch: Partial<StickyNote>) => void;
  onDelete: (id: string) => void;
}) {
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ w: note.width, h: note.height });
  const [body, setBody] = useState(note.body);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; w: number; h: number } | null>(null);
  const c = COLORS[note.color] ?? COLORS.yellow;

  // sync if server values change (e.g. refetch)
  useEffect(() => setPos({ x: note.x, y: note.y }), [note.x, note.y]);
  useEffect(() => setSize({ w: note.width, h: note.height }), [note.width, note.height]);

  // ── Drag ──
  const onMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    setPos(clampPos(e.clientX - dragRef.current.dx, e.clientY - dragRef.current.dy, size.w, size.h));
  }, [size.w, size.h]);

  const onUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    setPos((p) => {
      onPatch(note._id, { x: p.x, y: p.y });
      return p;
    });
  }, [onMove, note._id, onPatch]);

  function startDrag(e: React.PointerEvent) {
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  // ── Resize ──
  const onResizeMove = useCallback((e: PointerEvent) => {
    if (!resizeRef.current) return;
    const r = resizeRef.current;
    const w = Math.min(MAX_W, Math.max(MIN_W, r.w + (e.clientX - r.sx)));
    const h = Math.min(MAX_H, Math.max(MIN_H, r.h + (e.clientY - r.sy)));
    setSize({ w, h });
  }, []);

  const onResizeUp = useCallback(() => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    document.removeEventListener('pointermove', onResizeMove);
    document.removeEventListener('pointerup', onResizeUp);
    setSize((s) => {
      onPatch(note._id, { width: s.w, height: s.h });
      return s;
    });
  }, [onResizeMove, note._id, onPatch]);

  function startResize(e: React.PointerEvent) {
    e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, w: size.w, h: size.h };
    document.addEventListener('pointermove', onResizeMove);
    document.addEventListener('pointerup', onResizeUp);
  }

  return (
    <div
      className="fixed z-40 rounded-xl flex flex-col shadow-lg"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        backgroundColor: c.bg,
        border: `1.5px solid ${c.border}`,
        backdropFilter: 'blur(2px)',
        boxShadow: '0 6px 18px rgba(74,62,78,0.22)',
      }}
      role="note"
    >
      {/* Header / drag strip */}
      <div
        onPointerDown={startDrag}
        className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none', borderBottom: `1px solid ${c.border}` }}
      >
        <GripHorizontal size={14} style={{ color: c.border, opacity: 0.8 }} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() =>
              onPatch(note._id, {
                pinned_path: note.pinned_path ? null : currentPath,
              })
            }
            className="grid place-items-center h-5 w-5 rounded hover:opacity-70 focus-visible:outline-none"
            style={{ color: note.pinned_path ? c.border : 'rgba(74,62,78,0.7)' }}
            aria-label={note.pinned_path ? 'Unlock from this page' : 'Lock to this page'}
            title={
              note.pinned_path
                ? 'Locked to this page — click to show everywhere'
                : 'Shown on all pages — click to lock to this page'
            }
          >
            {note.pinned_path ? <Pin size={13} fill="currentColor" /> : <PinOff size={13} />}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onPatch(note._id, { visible: false })}
            className="grid place-items-center h-5 w-5 rounded hover:opacity-70 focus-visible:outline-none"
            style={{ color: 'rgba(74,62,78,0.7)' }}
            aria-label="Hide note"
          >
            <EyeOff size={13} />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(note._id)}
            className="grid place-items-center h-5 w-5 rounded hover:opacity-70 focus-visible:outline-none"
            style={{ color: 'rgba(74,62,78,0.7)' }}
            aria-label="Delete note"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 500))}
        onBlur={() => body !== note.body && onPatch(note._id, { body })}
        placeholder="Jot a note…"
        className="flex-1 w-full resize-none bg-transparent px-2.5 py-2 text-sm focus:outline-none"
        style={{ color: '#4a3e4e', fontFamily: "'Comic Sans MS', cursive, sans-serif" }}
      />

      {/* Color picker */}
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ borderTop: `1px solid ${c.border}` }}>
        {COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPatch(note._id, { color: key })}
            className="h-4 w-4 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: COLORS[key].border,
              border: note.color === key ? '2px solid #4a3e4e' : '2px solid transparent',
            }}
            aria-label={`Color ${key}`}
          />
        ))}
      </div>

      {/* Resize handle (bottom-right) */}
      <div
        onPointerDown={startResize}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        style={{ touchAction: 'none' }}
        aria-label="Resize note"
        role="separator"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M14 6 L6 14 M14 11 L11 14" stroke={c.border} strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

// ── Layer: launcher + notes ─────────────────────────────────────────────────

export function StickyNotesLayer() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const api = useStickyNotesApi();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryKey = ['sticky-notes'];
  const { data: notes = [] } = useQuery({
    queryKey,
    queryFn: () => api.list(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<StickyNote> }) =>
      api.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.create(),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey });
    },
    onError: () => setError('Note limit reached. Upgrade for more.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const onPatch = useCallback(
    (id: string, patch: Partial<StickyNote>) =>
      patchMutation.mutate({ id, patch }),
    [patchMutation],
  );
  const onDelete = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation],
  );

  if (!user) return null;

  // Show a note when visible AND (not locked OR locked to this page)
  const visibleNotes = notes.filter(
    (n) => n.visible && (!n.pinned_path || n.pinned_path === pathname),
  );

  return (
    <>
      {/* Render visible notes */}
      {visibleNotes.map((note) => (
        <NoteCard
          key={note._id}
          note={note}
          currentPath={pathname}
          onPatch={onPatch}
          onDelete={onDelete}
        />
      ))}

      {/* Launcher FAB (bottom-right) */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {menuOpen && (
          <div
            className="rounded-2xl p-2 flex flex-col gap-1 w-56"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 24px rgba(74,62,78,0.2)',
            }}
          >
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Plus size={15} /> New sticky note
            </button>
            {error && (
              <p className="text-[11px] px-2" style={{ color: 'var(--color-primary)' }}>
                {error}
              </p>
            )}
            {notes.length === 0 ? (
              <p className="text-xs px-2 py-1" style={{ color: 'var(--text)' }}>
                No notes yet.
              </p>
            ) : (
              notes.map((n) => (
                <div
                  key={n._id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'var(--color-neutral)' }}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[n.color]?.border }}
                  />
                  <span
                    className="flex-1 min-w-0 truncate text-xs"
                    style={{ color: 'var(--text-h)' }}
                  >
                    {n.body || 'Empty note'}
                  </span>
                  {n.pinned_path && (
                    <Pin
                      size={11}
                      fill="currentColor"
                      className="shrink-0"
                      style={{
                        color:
                          n.pinned_path === pathname
                            ? 'var(--color-primary)'
                            : 'var(--text)',
                      }}
                      aria-label={
                        n.pinned_path === pathname
                          ? 'Locked to this page'
                          : 'Locked to another page'
                      }
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onPatch(n._id, { visible: !n.visible })}
                    className="shrink-0 hover:opacity-70 focus-visible:outline-none"
                    style={{ color: 'var(--text)' }}
                    aria-label={n.visible ? 'Hide note' : 'Show note'}
                  >
                    {n.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="grid place-items-center h-12 w-12 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
          style={{
            backgroundColor: 'var(--color-secondary)',
            boxShadow: '0 6px 20px rgba(74,62,78,0.25)',
          }}
          aria-label="Sticky notes"
          aria-expanded={menuOpen}
        >
          <StickyIcon size={20} />
        </button>
      </div>
    </>
  );
}
