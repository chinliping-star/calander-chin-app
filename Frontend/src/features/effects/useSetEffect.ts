import { useApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/auth.ts';
import type { SceneEffect } from './effects.ts';

/** Save my background effect: applied instantly, then stored on the account. */
export function useSetEffect() {
  const api = useApi();
  const updateUser = useAuthStore(s => s.updateUser);
  const current = useAuthStore(s => s.user?.scene_effect);

  return async (effect: SceneEffect) => {
    updateUser({ scene_effect: effect });
    try {
      await api.patch('/users/me', { scene_effect: effect });
    } catch (err) {
      updateUser({ scene_effect: current });
      throw err;
    }
  };
}
