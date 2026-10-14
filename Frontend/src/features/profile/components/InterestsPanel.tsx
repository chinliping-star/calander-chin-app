import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Pencil, X, Plus, Check } from 'lucide-react';
import { useApi } from '../../../lib/api.ts';
import {
  PRESET_INTERESTS,
  MAX_INTERESTS,
  MAX_INTEREST_LENGTH,
  MAX_NOTE_LENGTH,
  type InterestNote,
} from '../interests.ts';

interface Props {
  username: string;
  interests: string[];
  notes: InterestNote[];
  isOwn: boolean;
}

/**
 * Interests tab: chips with an optional note each. The owner can add/remove
 * interests (presets or their own) and write a note for any of them.
 */
export function InterestsPanel({ username, interests, notes, isOwn }: Props) {
  const [editing, setEditing] = useState(false);
  const noteFor = (tag: string) => notes.find(n => n.tag === tag)?.note ?? '';

  return (
    <section aria-labelledby="interests-tags-heading">
      <div className="flex items-center justify-between mb-4">
        <h3 id="interests-tags-heading" className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
          Interests
        </h3>
        {isOwn && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 focus-visible:outline-2"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
          >
            <Pencil size={12} aria-hidden="true" /> Edit interests
          </button>
        )}
      </div>

      {editing ? (
        <InterestsEditor
          username={username}
          initialInterests={interests}
          initialNotes={notes}
          onDone={() => setEditing(false)}
        />
      ) : interests.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-10 px-6 text-center"
          style={{ backgroundColor: 'var(--color-neutral)', border: '2px dashed var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            {isOwn ? 'No interests yet — tap "Edit interests" to add some.' : 'No interests added yet.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {interests.map(tag => {
            const note = noteFor(tag);
            return (
              <li
                key={tag}
                className="rounded-2xl p-3"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}
              >
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary)' }}
                >
                  <Tag size={10} className="mr-1" aria-hidden="true" />
                  {tag}
                </span>
                {note ? (
                  <p className="mt-2 text-sm whitespace-pre-line break-words" style={{ color: 'var(--text-h)' }}>{note}</p>
                ) : isOwn ? (
                  <p className="mt-2 text-xs italic" style={{ color: 'var(--text)' }}>No note yet</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function InterestsEditor({
  username,
  initialInterests,
  initialNotes,
  onDone,
}: {
  username: string;
  initialInterests: string[];
  initialNotes: InterestNote[];
  onDone: () => void;
}) {
  const api = useApi();
  const qc = useQueryClient();
  const [items, setItems] = useState<string[]>(initialInterests);
  const [notes, setNotes] = useState<Record<string, string>>(
    () => Object.fromEntries(initialNotes.map(n => [n.tag, n.note])),
  );
  const [custom, setCustom] = useState('');

  const atLimit = items.length >= MAX_INTERESTS;
  const suggestions = PRESET_INTERESTS.filter(p => !items.includes(p));

  function add(tag: string) {
    const clean = tag.trim().slice(0, MAX_INTEREST_LENGTH);
    if (!clean || atLimit) return;
    if (items.some(i => i.toLowerCase() === clean.toLowerCase())) return;
    setItems(prev => [...prev, clean]);
  }

  function remove(tag: string) {
    setItems(prev => prev.filter(i => i !== tag));
  }

  const save = useMutation({
    mutationFn: () =>
      api.patch('/users/me', {
        interests: items,
        interest_notes: items
          .map(tag => ({ tag, note: (notes[tag] ?? '').trim() }))
          .filter(n => n.note),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-data', username] });
      onDone();
    },
  });

  return (
    <div className="flex flex-col gap-5">
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text)' }}>Pick some interests below.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(tag => (
            <li
              key={tag}
              className="rounded-2xl p-3 flex flex-col gap-2"
              style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{tag}</span>
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:opacity-80 active:scale-95"
                  style={{ color: 'var(--text)' }}
                  aria-label={`Remove ${tag}`}
                >
                  <X size={14} />
                </button>
              </div>
              <label className="sr-only" htmlFor={`note-${tag}`}>Note for {tag}</label>
              <textarea
                id={`note-${tag}`}
                value={notes[tag] ?? ''}
                onChange={e => setNotes(prev => ({ ...prev, [tag]: e.target.value }))}
                maxLength={MAX_NOTE_LENGTH}
                rows={2}
                placeholder="Add a note — e.g. favourite dish, places you've been…"
                className="w-full rounded-xl px-3 py-2 text-sm resize-y"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
              />
              <span className="self-end text-[10px]" style={{ color: 'var(--text)' }}>
                {(notes[tag] ?? '').length}/{MAX_NOTE_LENGTH}
              </span>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>Add more</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                disabled={atLimit}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)', border: '1.5px solid var(--border)' }}
              >
                <Plus size={11} aria-hidden="true" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          add(custom);
          setCustom('');
        }}
      >
        <label className="sr-only" htmlFor="custom-interest">Add your own interest</label>
        <input
          id="custom-interest"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          maxLength={MAX_INTEREST_LENGTH}
          placeholder="Add your own (e.g. 🍜 Ramen)"
          disabled={atLimit}
          className="flex-1 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
        />
        <button
          type="submit"
          disabled={atLimit || !custom.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--color-primary)' }}
        >
          Add
        </button>
      </form>
      {atLimit && (
        <p className="text-xs" style={{ color: 'var(--text)' }}>You can have up to {MAX_INTERESTS} interests.</p>
      )}

      {save.isError && (
        <p role="alert" className="text-sm" style={{ color: '#dc2626' }}>
          Could not save: {(save.error as Error).message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={save.isPending}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          <Check size={14} aria-hidden="true" /> {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
