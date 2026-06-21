import { useState, useRef } from 'react';
import { X, Image, Globe, Users, Lock } from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect.tsx';
import type { SelectOption } from '../../../components/ui/CustomSelect.tsx';
import type { PostPrivacy } from '../types';

const PRIVACY_OPTIONS: SelectOption<PostPrivacy>[] = [
  { value: 'public',  label: 'Public',       description: 'Anyone can see this', icon: <Globe size={14} style={{ color: '#16a34a' }} /> },
  { value: 'friends', label: 'Friends',       description: 'Only your friends',   icon: <Users size={14} style={{ color: 'var(--color-primary)' }} /> },
  { value: 'private', label: 'Private',       description: 'Only you',            icon: <Lock size={14} style={{ color: 'var(--text)' }} /> },
];

interface Props {
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    title?: string;
    privacy: PostPrivacy;
    image?: File | null;
  }) => void;
  submitting?: boolean;
}

export function NewPostModal({ onClose, onSubmit, submitting }: Props) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>('friends');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleSubmit() {
    if (!content.trim()) { setError('Write something first'); return; }
    onSubmit({ content, title: title || undefined, privacy, image });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="font-bold text-base" style={{ color: 'var(--text-h)' }}>New Post</h2>
          <button onClick={onClose} style={{ color: 'var(--text)' }}><X size={18} /></button>
        </div>

        <div
          className="px-5 py-4 flex flex-col gap-4 overflow-y-auto transition-[padding] duration-200"
          style={{ paddingBottom: privacyOpen ? '180px' : undefined }}
        >
          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-semibold"
            style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setError(''); }}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none leading-relaxed"
            style={{ background: 'var(--color-tertiary)', border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`, color: 'var(--text-h)' }}
          />
          {error && <p className="text-xs -mt-2" style={{ color: '#ef4444' }}>{error}</p>}

          {/* Image */}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
          {preview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ height: '160px' }}>
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => { setImage(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm w-fit transition-colors"
              style={{ background: 'var(--color-neutral)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <Image size={15} />
              Add photo
            </button>
          )}

          {/* Privacy */}
          <CustomSelect<PostPrivacy>
            label="Who can see this?"
            value={privacy}
            onChange={setPrivacy}
            options={PRIVACY_OPTIONS}
            onOpenChange={setPrivacyOpen}
          />
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 flex gap-3 px-5 py-4"
          style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-neutral)', color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
