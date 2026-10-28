import { useEffect, useRef, useState } from 'react';
import { createScene, type Pointer } from '../engine.ts';
import { EffectSound, resumeAudioOnGesture } from '../sound.ts';
import { useEffectSound } from '../effects.ts';
import { useActiveEffect } from '../useActiveEffect.ts';

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
 * Full-screen animated effect drawn OVER the page content, plus its sound.
 * Transparent and pointer-events: none, so the page background stays as it is
 * and every click goes through. Sits under the navbar and modals (z-50).
 * Mounted once in AppShell.
 */
export function SceneEffects() {
  const effect = useActiveEffect();
  const reducedMotion = usePrefersReducedMotion();
  const { soundOn, volume } = useEffectSound();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const soundRef = useRef<EffectSound | null>(null);
  const pointerRef = useRef<Pointer>({ x: 0, y: 0, active: false });

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

  // Mouse position for interactive scenes (the dragon watches and flees from it).
  useEffect(() => {
    if (effect === 'none') return;
    const p = pointerRef.current;
    const move = (e: PointerEvent) => { p.x = e.clientX; p.y = e.clientY; p.active = true; };
    const leave = () => { p.active = false; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
    };
  }, [effect]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || effect === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scene = createScene(effect, {
      reducedMotion,
      emit: (e) => soundRef.current?.trigger(e),
      pointer: pointerRef.current,
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 40, width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
}
