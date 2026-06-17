import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Camera, Lock, ImageIcon, Upload, X,
  Plus, Loader2, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { useMemoryApi } from '../api/memory.api.ts';
import { useAuthStore } from '../../../store/auth.ts';
import type { ApiMeetup } from '../../calendar/api/calendar.api.ts';

// ── Local multi-photo store ────────────────────────────────────────────────────

interface LocalPhoto {
  id: string;
  url: string;
  addedBy: string;
  addedAt: string;
}

function getLocalPhotos(meetupId: string): LocalPhoto[] {
  try {
    const raw = localStorage.getItem(`friendiary-memory-${meetupId}`);
    return raw ? (JSON.parse(raw) as LocalPhoto[]) : [];
  } catch { return []; }
}

function saveLocalPhoto(meetupId: string, photo: LocalPhoto): boolean {
  try {
    const existing = getLocalPhotos(meetupId);
    localStorage.setItem(`friendiary-memory-${meetupId}`, JSON.stringify([...existing, photo]));
    return true;
  } catch {
    return false; // QuotaExceededError
  }
}

function deleteLocalPhoto(meetupId: string, photoId: string) {
  const updated = getLocalPhotos(meetupId).filter(p => p.id !== photoId);
  localStorage.setItem(`friendiary-memory-${meetupId}`, JSON.stringify(updated));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 640;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}

// ── Participant avatar ────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#FF7FB1','#A78BFA','#60A5FA','#34D399','#FBBF24','#F87171','#818CF8'];

function ParticipantAvatar({ user, size, border }: {
  user: { _id?: string; username?: string; display_name?: string; avatar_url?: string };
  size: number;
  border: string;
}) {
  const seed = user.display_name || user.username || user._id || '?';
  const initial = (user.display_name || user.username || user._id || '?').charAt(0).toUpperCase();
  const colorIdx = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const bg = AVATAR_COLORS[colorIdx];

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={seed}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size, border }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
      style={{ width: size, height: size, border, backgroundColor: bg, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}

// ── Spring config ─────────────────────────────────────────────────────────────

const SPRING_SOFT   = { type: 'spring', stiffness: 260, damping: 28 } as const;
const SPRING_BOUNCY = { type: 'spring', stiffness: 320, damping: 22 } as const;

// ── Premium gate ───────────────────────────────────────────────────────────────

function PremiumGate() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="flex flex-col items-center justify-center py-32 gap-8 text-center"
    >
      <motion.div
        className="relative"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
            boxShadow: '0 16px 48px var(--accent-border)',
          }}
        >
          <Camera size={40} color="white" />
        </div>
        <div
          className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: '#fbbf24', border: '2px solid var(--bg)' }}
        >
          <Lock size={12} color="white" />
        </div>
      </motion.div>
      <div className="max-w-sm">
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-h)' }}>Memory Book</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          Capture and relive your favourite meetup moments with friends. Upload photos, build your shared album, and keep memories alive.
        </p>
      </div>
      <Link
        to="/settings?section=subscription"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          boxShadow: '0 8px 24px var(--accent-border)',
          textDecoration: 'none',
        }}
      >
        <Sparkles size={15} />
        Unlock Memory Book
      </Link>
    </motion.div>
  );
}

// ── Album modal (bottom sheet) ────────────────────────────────────────────────

function AlbumModal({ meetup, currentUser, photos, onClose, onPhotoAdded, onDeletePhoto }: {
  meetup: ApiMeetup;
  currentUser: string;
  photos: LocalPhoto[];
  onClose: () => void;
  onPhotoAdded: (photo: LocalPhoto) => void;
  onDeletePhoto: (id: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputId = `album-file-${meetup._id}`;
  const participants = [meetup.proposer_id, ...meetup.participants].filter(Boolean).filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i);
  const dayNum = parseInt(meetup.date.split('-')[2], 10);
  const mon = new Date(meetup.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });

  async function handleModalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const url = await fileToDataUrl(file);
      const photo: LocalPhoto = {
        id: String(Date.now()),
        url,
        addedBy: currentUser,
        addedAt: new Date().toISOString(),
      };
      const saved = saveLocalPhoto(meetup._id, photo);
      if (!saved) {
        alert('Storage full. Delete some photos to free space, then try again.');
        return;
      }
      onPhotoAdded(photo);
    } catch {
      alert('Failed to process image. Try a smaller file.');
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[9990]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[9991] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        style={{
          backgroundColor: 'var(--bg)',
          borderRadius: '22px 22px 0 0',
          maxHeight: '88vh',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag pill */}
        <div className="flex justify-center pt-3 pb-0.5 flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            {/* Date chip */}
            <div
              className="flex flex-col items-center justify-center h-11 w-11 rounded-2xl shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent-bg), var(--color-tertiary))', border: '1px solid var(--color-primary-light)' }}
            >
              <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>{mon}</span>
              <span className="text-base font-bold leading-tight" style={{ color: 'var(--color-primary-dark)' }}>{dayNum}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex -space-x-1.5 items-center">
                  {participants.slice(0, 4).map((p, i) => (
                    <ParticipantAvatar key={i} user={p} size={20} border="1.5px solid var(--bg)" />
                  ))}
                  {participants.length > 4 && (
                    <span
                      className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', border: '1.5px solid var(--bg)' }}
                    >
                      +{participants.length - 4}
                    </span>
                  )}
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text)' }}>
                  {participants.length} people · {photos.length} photo{photos.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* label triggers native file picker — no JS .click() needed */}
            <label
              htmlFor={fileInputId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white cursor-pointer select-none transition-opacity hover:opacity-90 active:opacity-75"
              style={{
                background: uploading ? 'var(--color-primary-dark)' : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                boxShadow: '0 4px 12px var(--accent-border)',
                pointerEvents: uploading ? 'none' : 'auto',
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {uploading ? 'Adding…' : 'Add Photo'}
            </label>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-70 focus-visible:outline-none"
              style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Native file input — label association opens picker without .click() */}
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleModalFile}
        />

        {/* Photo grid */}
        <div className="overflow-y-auto flex-1 p-4">
          {photos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4 text-center"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--accent-bg)', border: '2px dashed var(--color-primary-light)' }}
              >
                <Camera size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-h)' }}>No photos yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>Tap "Add Photo" to capture this memory</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative overflow-hidden cursor-pointer"
                  style={{ aspectRatio: '1', borderRadius: 12 }}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...SPRING_SOFT, delay: i * 0.04 }}
                >
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onDeletePhoto(p.id); }}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              ))}

              {/* Add more tile — label opens picker natively */}
              <label
                htmlFor={fileInputId}
                className="flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none transition-opacity hover:opacity-80 active:opacity-60"
                style={{
                  aspectRatio: '1',
                  borderRadius: 12,
                  border: '2px dashed var(--color-primary-light)',
                  backgroundColor: 'var(--accent-bg)',
                  pointerEvents: uploading ? 'none' : 'auto',
                  opacity: uploading ? 0.5 : 1,
                }}
              >
                {uploading
                  ? <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  : <Plus size={20} style={{ color: 'var(--color-primary)' }} />
                }
                <span className="text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {uploading ? 'Adding…' : 'Add'}
                </span>
              </label>
            </div>
          )}
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

// ── Photo stack card ──────────────────────────────────────────────────────────

const STACK_BASE = [
  { rotate: -6, x: -7,  y: -5,  z: 0 },
  { rotate:  4, x:  5,  y: -3,  z: 1 },
  { rotate: -2, x: -2,  y: -1,  z: 2 },
  { rotate:  0, x:  0,  y:  0,  z: 3 },
];

const STACK_HOVERED = [
  { rotate: -12, x: -14, y: -10 },
  { rotate:   8, x:  12, y: -6  },
  { rotate:  -4, x:  -5, y: -3  },
  { rotate:   0, x:   0, y:  0  },
];

function MemoryCard({ meetup, currentUser, cardIndex }: {
  meetup: ApiMeetup;
  currentUser: string;
  cardIndex: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const inView  = useInView(cardRef, { once: true, margin: '0px 0px -80px 0px' });

  const [photos, setPhotos] = useState<LocalPhoto[]>(() => {
    const local = getLocalPhotos(meetup._id);
    if (meetup.memory_photo_url && !local.some(p => p.url === meetup.memory_photo_url)) {
      return [
        { id: 'api', url: meetup.memory_photo_url, addedBy: meetup.proposer_id?.username ?? 'host', addedAt: meetup.date },
        ...local,
      ];
    }
    return local;
  });

  const [hovered, setHovered]       = useState(false);
  const [albumOpen, setAlbumOpen]   = useState(false);

  const participants = [meetup.proposer_id, ...meetup.participants].filter(Boolean).filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i);
  const dayNum    = parseInt(meetup.date.split('-')[2], 10);
  const monthName = new Date(meetup.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });
  const hasPhotos = photos.length > 0;
  const preview   = photos.slice(0, 4);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const url = await fileToDataUrl(file);
    const photo: LocalPhoto = { id: String(Date.now()), url, addedBy: currentUser, addedAt: new Date().toISOString() };
    saveLocalPhoto(meetup._id, photo);
    setPhotos(prev => [...prev, photo]);
  }

  function handleDelete(photoId: string) {
    deleteLocalPhoto(meetup._id, photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }

  return (
    <>
      <motion.article
        ref={cardRef as React.RefObject<HTMLElement>}
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 32, scale: 0.94 }}
        transition={{ ...SPRING_SOFT, delay: Math.min(cardIndex * 0.07, 0.4) }}
        className="flex flex-col cursor-pointer min-w-0"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (hasPhotos) setAlbumOpen(true);
          else fileRef.current?.click();
        }}
      >
        {/* Card — lifts on hover */}
        <motion.div
          animate={{ y: hovered ? -5 : 0, scale: hovered ? 1.02 : 1 }}
          transition={SPRING_BOUNCY}
          className="relative"
          style={{ aspectRatio: '3/4', borderRadius: 28 }}
        >
          {!hasPhotos ? (
            <div
              className="w-full h-full rounded-[28px] flex flex-col items-center justify-center gap-4 transition-all duration-200"
              style={{
                border: `2px dashed ${hovered ? 'var(--color-primary)' : 'var(--color-primary-light)'}`,
                backgroundColor: hovered ? 'var(--accent-bg)' : 'var(--bg)',
                boxShadow: hovered ? '0 8px 32px var(--accent-border)' : '0 2px 12px rgba(0,0,0,0.05)',
              }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  backgroundColor: hovered ? 'var(--color-primary)' : 'var(--color-tertiary)',
                  border: `1.5px solid ${hovered ? 'transparent' : 'var(--color-primary-light)'}`,
                }}
              >
                <ImageIcon size={24} style={{ color: hovered ? 'white' : 'var(--color-primary-light)' }} />
              </div>
              <div className="text-center px-6">
                <p className="text-sm font-semibold" style={{ color: hovered ? 'var(--color-primary)' : 'var(--text-h)' }}>
                  Add meetup photo
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
                  {participants.length} {participants.length === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stacked layers */}
              {preview.map((photo, i) => {
                const base = STACK_BASE[Math.min(i, STACK_BASE.length - 1)];
                const hov  = STACK_HOVERED[Math.min(i, STACK_HOVERED.length - 1)];
                const isTop = i === preview.length - 1;
                return (
                  <motion.div
                    key={photo.id}
                    className="absolute inset-0 overflow-hidden"
                    animate={{
                      rotate: hovered && !isTop ? hov.rotate : base.rotate,
                      x:      hovered && !isTop ? hov.x      : base.x,
                      y:      hovered && !isTop ? hov.y      : base.y,
                    }}
                    transition={SPRING_BOUNCY}
                    style={{
                      borderRadius: 28,
                      zIndex: base.z,
                      border: '3px solid var(--bg)',
                      boxShadow: isTop
                        ? hovered ? '0 20px 60px rgba(74,62,78,0.30)' : '0 12px 40px rgba(74,62,78,0.22)'
                        : hovered ? '0 8px 24px rgba(74,62,78,0.18)' : '0 4px 12px rgba(74,62,78,0.12)',
                    }}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />

                    {isTop && (
                      <motion.div
                        animate={{ opacity: hovered ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex flex-col justify-between p-4"
                        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.5) 100%)' }}
                      >
                        <div className="flex justify-end">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
                          >
                            {photos.length} photo{photos.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-1.5 items-center">
                            {participants.slice(0, 4).map((p, pi) => (
                              <ParticipantAvatar key={pi} user={p} size={24} border="2px solid rgba(255,255,255,0.5)" />
                            ))}
                            {participants.length > 4 && (
                              <span
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2"
                                style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}
                              >
                                +{participants.length - 4}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[10px] font-bold text-white px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
                          >
                            Open
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.div>

        {/* Info row */}
        <div className="flex items-center gap-3 pt-4 px-1">
          <div
            className="flex flex-col items-center justify-center h-10 w-10 rounded-2xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              boxShadow: '0 4px 12px var(--accent-border)',
            }}
          >
            <span className="text-[7px] font-bold uppercase tracking-widest text-white opacity-80">{monthName}</span>
            <span className="text-sm font-extrabold leading-none text-white">{dayNum}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text)' }}>
              {participants.length} {participants.length === 1 ? 'person' : 'people'}
              {hasPhotos && <span className="font-semibold" style={{ color: 'var(--color-primary)' }}> · {photos.length} photo{photos.length !== 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </motion.article>

      <AnimatePresence>
        {albumOpen && (
          <AlbumModal
            meetup={meetup}
            currentUser={currentUser}
            photos={photos}
            onClose={() => setAlbumOpen(false)}
            onPhotoAdded={photo => setPhotos(prev => [...prev, photo])}
            onDeletePhoto={handleDelete}
          />
        )}
      </AnimatePresence>


    </>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_BOUNCY}
      className="flex flex-col items-center px-6 py-3 rounded-2xl"
      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <span className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text)' }}>{label}</span>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MemoryPage() {
  const memoryApi = useMemoryApi();
  const { user } = useAuthStore();

  const { data: meetups = [], isLoading } = useQuery({
    queryKey: ['memory', 'album'],
    queryFn: () => memoryApi.getAlbum(),
    enabled: !!user?.is_premium,
    staleTime: 30_000,
  });

  const totalPhotos = meetups.reduce((acc, m) => {
    const local = getLocalPhotos(m._id);
    const apiPhoto = m.memory_photo_url && !local.some(p => p.url === m.memory_photo_url) ? 1 : 0;
    return acc + local.length + apiPhoto;
  }, 0);

  const meetupsWithPhotos = meetups.filter(m => {
    const local = getLocalPhotos(m._id);
    return local.length > 0 || !!m.memory_photo_url;
  }).length;

  return (
    <AppShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="rounded-3xl px-8 py-8 mb-8 flex items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          boxShadow: '0 8px 32px var(--accent-border)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera size={18} color="white" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Memory Book</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Your Moments,<br />Captured. 📸
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {user?.is_premium
              ? 'Upload photos from your meetups and relive every memory.'
              : 'Premium feature — upgrade to unlock.'}
          </p>
        </div>
        {user?.is_premium && meetups.length > 0 && (
          <div className="hidden md:flex items-center gap-3">
            <StatChip value={meetups.length} label="Meetups" />
            <StatChip value={totalPhotos} label="Photos" />
            <StatChip value={meetupsWithPhotos} label="Captured" />
          </div>
        )}
        {user?.is_premium && (
          <span
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold self-start"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            ✦ Premium
          </span>
        )}
      </motion.div>

      {!user?.is_premium && <PremiumGate />}

      {user?.is_premium && isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {user?.is_premium && !isLoading && meetups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SOFT}
          className="flex flex-col items-center justify-center py-20 gap-5 text-center"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ backgroundColor: 'var(--accent-bg)', border: '2px solid var(--color-primary-light)' }}
          >
            <Camera size={32} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--text-h)' }}>No meetups yet</p>
            <p className="text-sm mt-1.5 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text)' }}>
              Once you have accepted meetups, they'll appear here ready for photos.
            </p>
          </div>
        </motion.div>
      )}

      {user?.is_premium && !isLoading && meetups.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mx-auto w-full justify-items-center"
          style={{ gap: '40px', paddingTop: 24, paddingBottom: 48, maxWidth: 900 }}
        >
          {meetups.map((m, i) => (
            <div key={m._id} className="w-full" style={{ maxWidth: 240 }}>
              <MemoryCard meetup={m} currentUser={user.username} cardIndex={i} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
