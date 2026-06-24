import { useEffect, useRef } from 'react';
import { useApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/auth.ts';
import { useThemeStore } from '../../lib/theme.ts';

/**
 * Reconciles the locally-chosen theme with the server once per session.
 *
 * Existing users picked a theme that only ever lived in localStorage, so the
 * DB `theme` field stayed at its default. That meant friends viewing their
 * profile/calendar saw the wrong colour (pink fallback). On load, if the
 * server theme differs from the local one, push local → server so the
 * proposer's real theme propagates everywhere.
 */
export function ThemeSync() {
  const api = useApi();
  const { user, updateUser } = useAuthStore();
  const localTheme = useThemeStore(s => s.theme);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!user || syncedRef.current) return;
    if (user.theme === localTheme) { syncedRef.current = true; return; }
    syncedRef.current = true;
    api.patch('/users/me', { theme: localTheme })
      .then(() => updateUser({ theme: localTheme }))
      .catch(() => { syncedRef.current = false; });
  }, [user, localTheme, api, updateUser]);

  return null;
}
