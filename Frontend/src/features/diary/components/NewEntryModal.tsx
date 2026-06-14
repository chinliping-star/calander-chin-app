import { useState, useRef, useId } from 'react';
import { cn } from '../../../lib/utils.ts';
import type { DiaryVisibility, NewDiaryEntryForm } from '../types.ts';

interface Friend {
  id: string;
  name: string;
  avatar: string;
}

const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Mia Thompson',   avatar: 'https://i.pravatar.cc/150?img=5'  },
  { id: 'f2', name: 'Jake Rivera',    avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 'f3', name: 'Lily Anderson',  avatar: 'https://i.pravatar.cc/150?img=20' },
  { id: 'f4', name: 'Sara Mitchell',  avatar: 'https://i.pravatar.cc/150?img=10' },
  { id: 'f5', name: 'Tom Bradley',    avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: 'f6', name: 'Chloe Davis',    avatar: 'https://i.pravatar.cc/150?img=25' },
];

const VISIBILITY_OPTIONS: { value: DiaryVisibility; icon: string; label: string; desc: string }[] = [
  { value: 'public',  icon: '🌐', label: 'Public',       desc: 'Anyone can see this' },
  { value: 'friends', icon: '👥', label: 'Friends Only', desc: 'Only your friends' },
  { value: 'private', icon: '🔒', label: 'Private',      desc: 'Only you' },
];

const MAX_WORDS = 250;

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
}

interface NewEntryModalProps {
  onClose: () => void;
  onSave: (entry: NewDiaryEntryForm) => void;
}

export function NewEntryModal({ onClose, onSave }: NewEntryModalProps) {
  const dialogId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<NewDiaryEntryForm>({
    friend: '',
    date: '',
    location: '',
    visibility: 'friends',
    text: '',
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof NewDiaryEntryForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const wordCount = countWords(form.text);
  const wordLimitReached = wordCount >= MAX_WORDS;

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const raw = e.target.value;
    const words = raw.trim() === '' ? [] : raw.trim().split(/\s+/).filter(Boolean);
    if (words.length <= MAX_WORDS) {
      setForm((f) => ({ ...f, text: raw }));
      setErrors((err) => ({ ...err, text: undefined }));
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setForm((f) => ({ ...f, photo: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.friend) newErrors.friend = 'Please select a friend.';
    if (!form.date) newErrors.date = 'Please pick a date.';
    if (!form.text.trim()) newErrors.text = 'Please write something.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate async save
    setTimeout(() => {
      onSave(form);
      setSubmitting(false);
    }, 600);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const selectedFriend = FRIENDS.find((f) => f.name === form.friend);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${dialogId}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(74,62,78,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
        >
          <h2
            id={`${dialogId}-title`}
            className="text-lg font-bold"
            style={{ color: 'var(--text-h)', fontFamily: 'var(--heading)' }}
          >
            ✍️ New Memory Entry
          </h2>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 active:scale-95"
            style={{ color: 'var(--text)', backgroundColor: 'var(--color-tertiary)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 flex flex-col gap-5">

          {/* Friend selector */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${dialogId}-friend`}
              className="text-sm font-semibold"
              style={{ color: 'var(--text-h)' }}
            >
              With friend <span aria-hidden="true" style={{ color: 'var(--color-primary)' }}>*</span>
            </label>
            <div className="relative">
              {selectedFriend && (
                <img
                  src={selectedFriend.avatar}
                  alt=""
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full object-cover"
                  aria-hidden="true"
                />
              )}
              <select
                id={`${dialogId}-friend`}
                value={form.friend}
                onChange={(e) => {
                  setForm((f) => ({ ...f, friend: e.target.value }));
                  setErrors((err) => ({ ...err, friend: undefined }));
                }}
                className={cn(
                  'w-full rounded-xl border py-2.5 text-sm appearance-none',
                  'focus-visible:outline-none focus-visible:ring-2',
                  selectedFriend ? 'pl-11 pr-4' : 'pl-4 pr-4',
                )}
                style={{
                  backgroundColor: 'var(--color-tertiary)',
                  borderColor: errors.friend ? '#dc2626' : 'var(--border)',
                  color: 'var(--text-h)',
                }}
                aria-invalid={!!errors.friend}
                aria-describedby={errors.friend ? `${dialogId}-friend-err` : undefined}
              >
                <option value="">Select a friend…</option>
                {FRIENDS.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.friend && (
              <p id={`${dialogId}-friend-err`} role="alert" className="text-xs" style={{ color: '#dc2626' }}>
                {errors.friend}
              </p>
            )}
          </div>

          {/* Date + Location row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${dialogId}-date`}
                className="text-sm font-semibold"
                style={{ color: 'var(--text-h)' }}
              >
                Date <span aria-hidden="true" style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              <input
                id={`${dialogId}-date`}
                type="date"
                value={form.date}
                onChange={(e) => {
                  setForm((f) => ({ ...f, date: e.target.value }));
                  setErrors((err) => ({ ...err, date: undefined }));
                }}
                className="w-full rounded-xl border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: 'var(--color-tertiary)',
                  borderColor: errors.date ? '#dc2626' : 'var(--border)',
                  color: 'var(--text-h)',
                }}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? `${dialogId}-date-err` : undefined}
              />
              {errors.date && (
                <p id={`${dialogId}-date-err`} role="alert" className="text-xs" style={{ color: '#dc2626' }}>
                  {errors.date}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${dialogId}-location`}
                className="text-sm font-semibold"
                style={{ color: 'var(--text-h)' }}
              >
                Location
              </label>
              <input
                id={`${dialogId}-location`}
                type="text"
                placeholder="e.g. Brew & Co."
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 placeholder:opacity-50"
                style={{
                  backgroundColor: 'var(--color-tertiary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-h)',
                }}
              />
            </div>
          </div>

          {/* Visibility radio */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
              Visibility
            </legend>
            <div className="flex gap-2 flex-wrap">
              {VISIBILITY_OPTIONS.map(({ value, icon, label, desc }) => {
                const checked = form.visibility === value;
                return (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all',
                      'hover:opacity-80 focus-within:ring-2',
                    )}
                    style={{
                      borderColor: checked ? 'var(--color-primary)' : 'var(--border)',
                      backgroundColor: checked ? 'var(--accent-bg)' : 'var(--color-tertiary)',
                      color: checked ? 'var(--color-primary)' : 'var(--text)',
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={checked}
                      onChange={() => setForm((f) => ({ ...f, visibility: value }))}
                      className="sr-only"
                      aria-label={`${label} — ${desc}`}
                    />
                    <span aria-hidden="true">{icon}</span>
                    <span className="font-medium">{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Textarea with word counter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor={`${dialogId}-text`}
                className="text-sm font-semibold"
                style={{ color: 'var(--text-h)' }}
              >
                Your memory <span aria-hidden="true" style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              <span
                className="text-xs font-medium tabular-nums"
                style={{ color: wordLimitReached ? '#dc2626' : 'var(--text)' }}
                aria-live="polite"
                aria-atomic="true"
              >
                {wordCount} / {MAX_WORDS} words
              </span>
            </div>
            <textarea
              id={`${dialogId}-text`}
              rows={5}
              placeholder="Write about your meetup memory…"
              value={form.text}
              onChange={handleTextChange}
              className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 placeholder:opacity-50"
              style={{
                backgroundColor: 'var(--color-tertiary)',
                borderColor: errors.text ? '#dc2626' : 'var(--border)',
                color: 'var(--text-h)',
              }}
              aria-invalid={!!errors.text}
              aria-describedby={`${dialogId}-text-hint${errors.text ? ` ${dialogId}-text-err` : ''}`}
            />
            <p id={`${dialogId}-text-hint`} className="sr-only">
              Maximum {MAX_WORDS} words allowed.
            </p>
            {errors.text && (
              <p id={`${dialogId}-text-err`} role="alert" className="text-xs" style={{ color: '#dc2626' }}>
                {errors.text}
              </p>
            )}
          </div>

          {/* Photo upload */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
              Photo <span className="font-normal text-xs" style={{ color: 'var(--text)' }}>(optional)</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload a photo for this memory"
              onChange={handlePhotoChange}
              className="sr-only"
              id={`${dialogId}-photo`}
            />
            {photoPreview ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '140px' }}>
                <img
                  src={photoPreview}
                  alt="Preview of selected photo"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => {
                    setForm((f) => ({ ...f, photo: null }));
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                htmlFor={`${dialogId}-photo`}
                className={cn(
                  'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6',
                  'transition-colors hover:opacity-80 focus-within:ring-2',
                )}
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--color-tertiary)' }}
              >
                <span className="text-2xl" aria-hidden="true">📷</span>
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  Add photo
                </span>
                <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.6 }}>
                  Click to browse
                </span>
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={cn(
                'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                'hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 active:scale-95 disabled:opacity-50',
              )}
              style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'var(--color-tertiary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all',
                'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
              )}
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-busy={submitting}
            >
              {submitting ? 'Saving…' : '💾 Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
