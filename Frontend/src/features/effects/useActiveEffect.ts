import { useAuthStore } from '../../store/auth.ts';
import { isSceneEffect, useEffectOverride, type SceneEffect } from './effects.ts';

/** The effect that should be showing right now: a visited profile's, else mine. */
export function useActiveEffect(): SceneEffect {
  const mine = useAuthStore(s => s.user?.scene_effect);
  const override = useEffectOverride(s => s.override);
  if (override) return override;
  return isSceneEffect(mine) ? mine : 'none';
}
