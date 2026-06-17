import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, X, Lock, ImageIcon, Loader2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { useMemoryApi } from '../api/memory.api.ts';
import { useAuthStore } from '../../../store/auth.ts';
import type { ApiMeetup } from '../../calendar/api/calendar.api.ts';

// ── Premium gate ──────────────────────────────────────────────────────────────

function PremiumGate() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--accent-bg)', border: '2px solid var(--color-primary-light)' }}
      >
        <Lock size={32} style={{ color: 'var(--color-primary)' }} />
      </div>
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Memory Book</h2>
        <p className="mt-2 text-sm max-w-xs mx-auto" style={{ color: 'var(--text)' }}>
          Capture and relive your meetup moments. Upgrade to premium to unlock photo memories.
        </p>
      </div>
      <Link
        to="/settings?section=subscription"
        className="px-8 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
        style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 4px 16px var(--accent-border)', textDecoration: 'none' }}
      >
        ✦ Upgrade to Premium
      </Link>
    </div>
  );
}

// ── Photo lightbox ────────────────────────────────────────────────────────────

function Lightbox({ meetup, onClose, onDelete, deleting }: {
  meetup: ApiMeetup;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--bg)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Image */}
        <img
          src={meetup.memory_photo_url}
          alt={meetup.title}
          className="w-full object-cover"
          style={{ maxHeight: '480px' }}
        />

        {/* Info bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
              {meetup.date}{meetup.location ? ` · ${meetup.location}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ border: '1px solid var(--border)', color: 'var(--text)', backgroundColor: 'transparent' }}
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Remove
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text)' }}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Memory card ───────────────────────────────────────────────────────────────

function MemoryCard({ meetup, onUpload, onOpen, uploading }: {
  meetup: ApiMeetup;
  onUpload: (file: File) => void;
  onOpen: () => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  const hasPhoto = !!meetup.memory_photo_url;
  const dayNum = parseInt(meetup.date.split('-')[2], 10);
  const monthName = new Date(meetup.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });

  return (
    <article
      className="group relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(74,62,78,0.06)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(74,62,78,0.14)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(74,62,78,0.06)'; }}
    >
      {/* Photo area */}
      <div
        className="relative w-full overflow-hidden cursor-pointer"
        style={{ aspectRatio: '4/3', backgroundColor: 'var(--color-neutral)' }}
        onClick={hasPhoto ? onOpen : undefined}
      >
        {hasPhoto ? (
          <>
            <img
              src={meetup.memory_photo_url}
              alt={meetup.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* View overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            >
              <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                View Photo
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <ImageIcon size={28} style={{ color: 'var(--border)' }} />
            <p className="text-[10px] font-medium" style={{ color: 'var(--text)' }}>No photo yet</p>
          </div>
        )}

        {/* Upload button overlay */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          disabled={uploading}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
          aria-label={hasPhoto ? 'Replace photo' : 'Upload photo'}
        >
          {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
          {uploading ? 'Uploading…' : hasPhoto ? 'Replace' : 'Add Photo'}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          aria-label="Upload memory photo"
        />
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Date badge */}
        <div
          className="flex flex-col items-center justify-center h-10 w-10 rounded-xl shrink-0"
          style={{ backgroundColor: 'var(--accent-bg)', border: '1px solid var(--color-primary-light)' }}
        >
          <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--color-primary)' }}>{monthName}</span>
          <span className="text-sm font-bold leading-none" style={{ color: 'var(--color-primary-dark)' }}>{dayNum}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: 'var(--text-h)' }}>{meetup.title}</p>
          <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text)' }}>
            with {meetup.participants.map(p => p.display_name).join(', ') || meetup.proposer_id.display_name}
          </p>
        </div>

        {hasPhoto && (
          <Camera size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        )}
      </div>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MemoryPage() {
  const qc = useQueryClient();
  const memoryApi = useMemoryApi();
  const { user } = useAuthStore();
  const [lightbox, setLightbox] = useState<ApiMeetup | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data: meetups = [], isLoading } = useQuery({
    queryKey: ['memory', 'album'],
    queryFn: () => memoryApi.getAlbum(),
    enabled: !!user?.is_premium,
    staleTime: 30_000,
  });

  const upload = useMutation({
    mutationFn: ({ meetupId, file }: { meetupId: string; file: File }) =>
      memoryApi.uploadPhoto(meetupId, file),
    onMutate: ({ meetupId }) => setUploadingId(meetupId),
    onSettled: () => setUploadingId(null),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['memory', 'album'] });
      void qc.invalidateQueries({ queryKey: ['meetups'] });
    },
  });

  const deletePhoto = useMutation({
    mutationFn: (meetupId: string) => memoryApi.deletePhoto(meetupId),
    onSuccess: () => {
      setLightbox(null);
      void qc.invalidateQueries({ queryKey: ['memory', 'album'] });
      void qc.invalidateQueries({ queryKey: ['meetups'] });
    },
  });

  const withPhotos = meetups.filter(m => m.memory_photo_url);
  const withoutPhotos = meetups.filter(m => !m.memory_photo_url);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
            Memory Book 📸
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text)' }}>
            {user?.is_premium
              ? `${withPhotos.length} photo${withPhotos.length !== 1 ? 's' : ''} · ${meetups.length} meetup${meetups.length !== 1 ? 's' : ''}`
              : 'Premium feature — unlock your memories'}
          </p>
        </div>
        {user?.is_premium && (
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: '#fdf4ff', color: '#7c3aed', border: '1px solid #e9d5ff' }}
          >
            ✦ Premium
          </span>
        )}
      </div>

      {/* Premium gate */}
      {!user?.is_premium && <PremiumGate />}

      {/* Loading */}
      {user?.is_premium && isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      {/* Album content */}
      {user?.is_premium && !isLoading && (
        <div className="flex flex-col gap-10">
          {/* Photos section */}
          {withPhotos.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-primary)', margin: '0 0 16px' }}>
                Captured Memories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {withPhotos.map(m => (
                  <MemoryCard
                    key={m._id}
                    meetup={m}
                    uploading={uploadingId === m._id}
                    onUpload={(file) => upload.mutate({ meetupId: m._id, file })}
                    onOpen={() => setLightbox(m)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No photos yet section */}
          {withoutPhotos.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text)', margin: '0 0 16px' }}>
                Add a Photo
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {withoutPhotos.map(m => (
                  <MemoryCard
                    key={m._id}
                    meetup={m}
                    uploading={uploadingId === m._id}
                    onUpload={(file) => upload.mutate({ meetupId: m._id, file })}
                    onOpen={() => {}}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {meetups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--accent-bg)' }}
              >
                <Camera size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-h)' }}>No meetups yet</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                  Your accepted meetups will appear here — add a photo to each one!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          meetup={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={() => deletePhoto.mutate(lightbox._id)}
          deleting={deletePhoto.isPending}
        />
      )}
    </AppShell>
  );
}
