import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SceneEffect =
  | 'none' | 'snow' | 'christmas' | 'rain' | 'sunny' | 'autumn'
  | 'fireworks' | 'fireflies' | 'thunder' | 'dragon';

export interface EffectMeta {
  id: SceneEffect;
  label: string;
  emoji: string;
  blurb: string;
}

export const EFFECTS: EffectMeta[] = [
  { id: 'none',      label: 'None',       emoji: '🚫', blurb: 'No animation' },
  { id: 'snow',      label: 'Snowfall',   emoji: '❄️', blurb: 'Soft winter snow' },
  { id: 'christmas', label: 'Christmas',  emoji: '🎄', blurb: 'Sparkle tree and snow' },
  { id: 'rain',      label: 'Rain',       emoji: '🌧️', blurb: 'Gentle rainfall' },
  { id: 'sunny',     label: 'Sunny',      emoji: '☀️', blurb: 'Warm sun rays' },
  { id: 'autumn',    label: 'Autumn',     emoji: '🍂', blurb: 'Dry leaves falling' },
  { id: 'fireworks', label: 'Fireworks',  emoji: '🎆', blurb: 'Night sky celebration' },
  { id: 'fireflies', label: 'Fireflies',  emoji: '✨', blurb: 'Glowing summer night' },
  { id: 'thunder',   label: 'Thunder',    emoji: '⚡', blurb: 'Electric storm' },
  { id: 'dragon',    label: 'Dragon',     emoji: '🐉', blurb: 'A shy dragon that hides from your mouse' },
];

export function effectMeta(id?: string | null): EffectMeta | undefined {
  return EFFECTS.find(e => e.id === id);
}

export function isSceneEffect(id: unknown): id is SceneEffect {
  return EFFECTS.some(e => e.id === id);
}

/** Sound is a per-device choice — not saved to the account. */
interface EffectSoundState {
  soundOn: boolean;
  volume: number; // 0..1
  setSoundOn: (v: boolean) => void;
  setVolume: (v: number) => void;
}

export const useEffectSound = create<EffectSoundState>()(
  persist(
    (set) => ({
      soundOn: false,
      volume: 0.5,
      setSoundOn: (soundOn) => set({ soundOn }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
    }),
    { name: 'friendiary-effect-sound' },
  ),
);

/**
 * While viewing someone else's profile, their effect replaces yours.
 * The profile page sets this on mount and clears it on unmount.
 */
interface EffectOverrideState {
  override: SceneEffect | null;
  setOverride: (e: SceneEffect | null) => void;
}

export const useEffectOverride = create<EffectOverrideState>()((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}));
