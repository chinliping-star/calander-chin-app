import type { SceneEffect } from './effects.ts';
import type { SceneEvent } from './engine.ts';

/**
 * Ambient sound for each background effect, synthesised with the Web Audio
 * API — no audio files to download. One shared AudioContext; browsers only
 * let it start after a user gesture, so `resume()` is retried on the next tap.
 */

type Stop = () => void;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function audio(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  return { ctx, master: master! };
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** Looping filtered noise bed (wind, rain). Optional slow swell for wind. */
function noiseBed(c: AudioContext, out: AudioNode, type: BiquadFilterType, freq: number, level: number, swell = 0): Stop {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = level;
  src.connect(f).connect(g).connect(out);
  let lfo: OscillatorNode | null = null;
  if (swell) {
    lfo = c.createOscillator();
    lfo.frequency.value = 0.12;
    const lg = c.createGain();
    lg.gain.value = level * swell;
    lfo.connect(lg).connect(g.gain);
    lfo.start();
  }
  src.start();
  return () => { src.stop(); lfo?.stop(); };
}

/** Short decaying noise burst — firework pop, leaf rustle, rumble. */
function burst(c: AudioContext, out: AudioNode, freq: number, dur: number, level: number, type: BiquadFilterType = 'bandpass') {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, rand(0, 1.5), dur);
}

/** Pitched blip — bird chirp, cricket, bell. */
function tone(c: AudioContext, out: AudioNode, from: number, to: number, dur: number, level: number, type: OscillatorType = 'sine') {
  const o = c.createOscillator();
  o.type = type;
  const g = c.createGain();
  const t = c.currentTime;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Calls `fn` at random intervals until stopped. */
function every(min: number, max: number, fn: () => void): Stop {
  let id = 0;
  const loop = () => { id = window.setTimeout(() => { fn(); loop(); }, rand(min, max) * 1000); };
  loop();
  return () => window.clearTimeout(id);
}

function startBed(effect: SceneEffect, c: AudioContext, out: AudioNode): Stop[] {
  switch (effect) {
    case 'snow':
      return [noiseBed(c, out, 'lowpass', 400, 0.25, 0.6)];
    case 'christmas':
      return [
        noiseBed(c, out, 'lowpass', 350, 0.15, 0.5),
        every(2, 5, () => { const n = [784, 988, 1175, 1319][Math.floor(rand(0, 4))]; tone(c, out, n, n, 1.6, 0.08); }),
      ];
    case 'rain':
      return [noiseBed(c, out, 'bandpass', 1800, 0.35)];
    case 'thunder':
      return [noiseBed(c, out, 'bandpass', 1400, 0.22)];
    case 'sunny':
      return [
        noiseBed(c, out, 'lowpass', 300, 0.05),
        every(1.5, 5, () => {
          const n = Math.floor(rand(2, 5));
          for (let i = 0; i < n; i++) window.setTimeout(() => tone(c, out, rand(2600, 3200), rand(3600, 4400), 0.09, 0.07), i * 130);
        }),
      ];
    case 'autumn':
      return [
        noiseBed(c, out, 'lowpass', 600, 0.18, 0.7),
        every(0.8, 2.5, () => burst(c, out, 3500, 0.25, 0.06)),
      ];
    case 'fireflies':
      return [every(0.6, 1.8, () => {
        for (let i = 0; i < 3; i++) window.setTimeout(() => tone(c, out, 4400, 4300, 0.05, 0.03, 'triangle'), i * 70);
      })];
    case 'dragon':
      return [noiseBed(c, out, 'lowpass', 250, 0.18, 0.8)];
    default:
      return [];
  }
}

export class EffectSound {
  private stops: Stop[] = [];
  private effect: SceneEffect = 'none';
  private out: GainNode | null = null;

  /** Start the bed for `effect` (stops any previous one). */
  play(effect: SceneEffect, volume: number) {
    this.stop();
    const a = audio();
    if (!a || effect === 'none') return;
    this.effect = effect;
    this.out = a.ctx.createGain();
    this.out.gain.value = volume;
    this.out.connect(a.master);
    void a.ctx.resume().catch(() => {});
    this.stops = startBed(effect, a.ctx, this.out);
  }

  setVolume(v: number) {
    if (this.out && ctx) this.out.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  }

  /** Sound for a moment in the animation (firework burst, thunder strike, dragon). */
  trigger(e: SceneEvent | 'dragon') {
    if (!ctx || !this.out || ctx.state !== 'running') return;
    if (e === 'burst' && this.effect === 'fireworks') {
      burst(ctx, this.out, 900, 0.7, 0.5, 'lowpass');
      window.setTimeout(() => ctx && this.out && burst(ctx, this.out, 5000, 0.5, 0.12, 'highpass'), 60);
    } else if (e === 'thunder' && this.effect === 'thunder') {
      tone(ctx, this.out, 1800, 300, 0.25, 0.05, 'sawtooth'); // electric zap
      window.setTimeout(() => ctx && this.out && burst(ctx, this.out, 120, 2.8, 0.9, 'lowpass'), 250);
    } else if (e === 'dragon' && this.effect === 'dragon') {
      tone(ctx, this.out, 90, 55, 0.9, 0.18, 'sawtooth');
    }
  }

  stop() {
    this.stops.forEach(s => s());
    this.stops = [];
    this.out?.disconnect();
    this.out = null;
    this.effect = 'none';
  }
}

/** Retry starting audio on the next user gesture (autoplay policy). */
export function resumeAudioOnGesture() {
  if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => {});
}
