import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCommunitiesApi } from '../api/communities.api';
import { CustomSelect } from '../../../components/ui/CustomSelect.tsx';
import type { SelectOption } from '../../../components/ui/CustomSelect.tsx';

const CATEGORY_OPTIONS: SelectOption[] = [
  'Photography', 'Gaming', 'Fitness', 'Music', 'Art', 'Travel',
  'Food', 'Books', 'Movies', 'Tech', 'Sports', 'Fashion', 'Other',
].map(c => ({ value: c, label: c }));

interface Props {
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function CreateCommunityModal({ onClose, onCreated }: Props) {
  const api = useCommunitiesApi();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', slug: '', description: '', category: '', is_private: false,
  });
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => api.create(form),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['communities'] });
      qc.invalidateQueries({ queryKey: ['communities-mine'] });
      onCreated?.(c.slug);
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleNameChange(name: string) {
    setForm(f => ({
      ...f,
      name,
      slug: slugManual ? f.slug : slugify(name),
    }));
  }

  function handleSlugChange(slug: string) {
    setSlugManual(true);
    setForm(f => ({ ...f, slug }));
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-h)' }}>Create Community</h2>
          <button onClick={onClose} style={{ color: 'var(--text)' }}><X size={18} /></button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text)' }}>Name *</label>
            <input
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Photography Lovers"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text)' }}>Slug *</label>
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--color-tertiary)' }}>
              <span className="px-3 py-2.5 text-xs" style={{ color: 'var(--text)', borderRight: '1px solid var(--border)' }}>
                /communities/
              </span>
              <input
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="photography-lovers"
                className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                style={{ color: 'var(--text-h)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text)' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="What's this community about?"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            />
          </div>

          <CustomSelect
            label="Category"
            value={form.category}
            onChange={v => setForm(f => ({ ...f, category: v }))}
            options={CATEGORY_OPTIONS}
            placeholder="Select category…"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_private}
              onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--text-h)' }}>Private community</span>
            <span className="text-xs" style={{ color: 'var(--text)' }}>(invite-only)</span>
          </label>
        </div>

        {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-neutral)', color: 'var(--text)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!form.name || !form.slug || create.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
