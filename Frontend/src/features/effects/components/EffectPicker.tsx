import { useState } from 'react';
import { Check, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.ts';
import { EFFECTS, isSceneEffect, useEffectSound, type SceneEffect } from '../effects.ts';
import { useSetEffect } from '../useSetEffect.ts';

/** Settings → Appearance: background effect + sound. */
export function EffectPicker() {
  const mine = useAuthStore(s => s.user?.scene_effect);
  const active: SceneEffect = isSceneEffect(mine) ? mine : 'none';
  const setEffect = useSetEffect();
  const [error, setError] = useState<string | null>(null);
  const { soundOn, volume, setSoundOn, setVolume } = useEffectSound();

  function choose(id: SceneEffect) {
    setError(null);
    setEffect(id).catch(() => setError('Could not save your effect. Try again.'));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text)' }}>Background effect</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>
          Animated scene behind your pages. Friends who visit your profile see it too, and can use it themselves.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {EFFECTS.map(e => {
            const on = active === e.id;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => choose(e.id)}
                aria-pressed={on}
                className="relative flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center transition-all hover:opacity-90 active:scale-95 focus-visible:outline-2"
                style={on
                  ? { backgroundColor: 'var(--accent-bg)', border: '2px solid var(--color-primary)', boxShadow: '0 0 0 3px var(--accent-bg)' }
                  : { backgroundColor: 'var(--color-neutral)', border: '2px solid var(--border)' }}
              >
                {on && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}>
                    <Check size={9} color="#fff" strokeWidth={3} />
                  </span>
                )}
                <span style={{ fontSize: '26px', lineHeight: 1 }} aria-hidden="true">{e.emoji}</span>
                <span className="text-xs font-bold" style={{ color: on ? 'var(--color-primary)' : 'var(--text-h)' }}>{e.label}</span>
                <span className="text-[10px] leading-tight" style={{ color: 'var(--text)' }}>{e.blurb}</span>
              </button>
            );
          })}
        </div>
        {error && <p role="alert" className="text-sm mt-3" style={{ color: '#dc2626' }}>{error}</p>}
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }} />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Effect sounds</p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setSoundOn(!soundOn)}
            aria-pressed={soundOn}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={soundOn
              ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
              : { backgroundColor: 'var(--color-neutral)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
          >
            {soundOn ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-h)', opacity: soundOn ? 1 : 0.5 }}>
            Volume
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={e => setVolume(Number(e.target.value) / 100)}
              disabled={!soundOn}
              aria-label="Effect volume"
              style={{ accentColor: 'var(--color-primary)' }}
            />
          </label>
        </div>
        <p className="text-xs" style={{ color: 'var(--text)' }}>
          Rain, wind, birds, fireworks, thunder and dragon sounds. Saved on this device only.
          If your device is set to reduce motion, effects run calmer.
        </p>
      </div>
    </div>
  );
}
