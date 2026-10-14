import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.ts';
import { effectMeta, type SceneEffect } from '../effects.ts';
import { useSetEffect } from '../useSetEffect.ts';

/**
 * Shown on someone else's profile when they use a background effect:
 * "Ana is using Snowfall — use this theme?"
 */
export function AdoptEffectToast({ ownerName, effect }: { ownerName: string; effect: SceneEffect }) {
  const me = useAuthStore(s => s.user);
  const setEffect = useSetEffect();
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const meta = effectMeta(effect);

  if (!me || !meta || effect === 'none' || dismissed) return null;
  if (me?.scene_effect === effect && state !== 'done') return null;

  async function adopt() {
    setState('saving');
    try {
      await setEffect(effect);
      setState('done');
      window.setTimeout(() => setDismissed(true), 2500);
    } catch {
      setState('error');
    }
  }

  return (
    <div
      role="status"
      className="fixed bottom-24 xl:bottom-6 right-4 z-40 w-[min(320px,calc(100vw-32px))] rounded-2xl p-4 flex gap-3 items-start"
      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
    >
      <span style={{ fontSize: '28px', lineHeight: 1 }} aria-hidden="true">{meta.emoji}</span>
      <div className="flex-1 flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--text-h)' }}>
          {state === 'done'
            ? <>Done! <strong>{meta.label}</strong> is now your theme.</>
            : <><strong>{ownerName}</strong> is using the <strong>{meta.label}</strong> theme. Want it too?</>}
        </p>
        {state !== 'done' && (
          <button
            type="button"
            onClick={adopt}
            disabled={state === 'saving'}
            className="self-start px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            {state === 'saving' ? 'Applying…' : 'Use this theme'}
          </button>
        )}
        {state === 'error' && <p role="alert" className="text-xs" style={{ color: '#dc2626' }}>Could not apply it. Try again.</p>}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:opacity-80"
        style={{ color: 'var(--text)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
