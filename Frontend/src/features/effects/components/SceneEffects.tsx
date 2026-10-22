import { useEffect, useRef, useState } from 'react';
import { createScene } from '../engine.ts';
import { EffectSound, resumeAudioOnGesture } from '../sound.ts';
import { useEffectSound, type SceneEffect } from '../effects.ts';
import { useActiveEffect } from '../useActiveEffect.ts';
import { Dragon } from './Dragon.tsx';

// These paint a dark sky, so cards stay more opaque to keep text readable.
const NIGHT_SKY_EFFECTS = new Set<SceneEffect>(['fireworks', 'fireflies', 'thunder']);

function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Full-screen animated background behind the page content, plus its sound.
 * Mounted once in AppShell.
 */
export function SceneEffects() {
  const effect = useActiveEffect();
  const reducedMotion = usePrefersReducedMotion();
  const { soundOn, volume } = useEffectSound();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundRef = useRef<EffectSound | null>(null);

  // Sound bed follows the effect + the per-device sound toggle.
  useEffect(() => {
    soundRef.current ??= new EffectSound();
    const s = soundRef.current;
    if (soundOn && effect !== 'none') s.play(effect, volume);
    else s.stop();
    return () => s.stop();
    // volume changes are applied below without restarting the bed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, soundOn]);

  useEffect(() => { soundRef.current?.setVolume(volume); }, [volume]);

  // Turns cards see-through (see "Glass surfaces" in index.css) so the effect shows behind them.
  useEffect(() => {
    const root = document.documentElement;
    if (effect === 'none') root.removeAttribute('data-glass');
    else root.setAttribute('data-glass', NIGHT_SKY_EFFECTS.has(effect) ? 'dark' : 'light');
    return () => root.removeAttribute('data-glass');
  }, [effect]);

  // Browsers block audio until the user interacts — retry on first tap.
  useEffect(() => {
    if (!soundOn) return;
    window.addEventListener('pointerdown', resumeAudioOnGesture);
    window.addEventListener('keydown', resumeAudioOnGesture);
    return () => {
      window.removeEventListener('pointerdown', resumeAudioOnGesture);
      window.removeEventListener('keydown', resumeAudioOnGesture);
    };
  }, [soundOn]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || effect === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scene = createScene(effect, {
      reducedMotion,
      emit: (e) => soundRef.current?.trigger(e),
    });
    if (!scene) return;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene!.resize(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let prev = performance.now();
    const start = prev;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { prev = now; return; }
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      scene!.step(ctx!, dt, (now - start) / 1000);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [effect, reducedMotion]);

  if (effect === 'none') return null;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, width: '100vw', height: '100vh' }} aria-hidden="true" />
      {effect === 'dragon' && (
        <Dragon reducedMotion={reducedMotion} onHide={() => soundRef.current?.trigger('dragon')} />
      )}
    </>
  );
}
