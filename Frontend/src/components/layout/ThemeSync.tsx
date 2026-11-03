import { useEffect, useRef } from 'react';
import { useApi } from '../../lib/api.ts';
import { useAuthStore } from '../../store/auth.ts';
import { useThemeStore } from '../../lib/theme.ts';
import { usePreferences } from '../../lib/preferences.ts';

/**
 * Reconciles the locally-chosen theme with the server once per session.
 *
 * Existing users picked a theme that only ever lived in localStorage, so the
 * DB `theme` field stayed at its default. That meant friends viewing their
 * profile/calendar saw the wrong colour (pink fallback). On load, if the
 * server theme differs from the local one, push local → server so the
 * proposer's real theme propagates everywhere. Same for the cursor, which
 * friends also see on this user's profile.
 */
export function ThemeSync() {
  const api = useApi();
  const { user, updateUser } = useAuthStore();
  const localTheme = useThemeStore(s => s.theme);
  const localCursor = usePreferences(s => s.cursor);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!user || syncedRef.current) return;
    const diff: { theme?: string; cursor?: string } = {};
    if (user.theme !== localTheme) diff.theme = localTheme;
    if ((user.cursor ?? 'default') !== localCursor) diff.cursor = localCursor;
    syncedRef.current = true;
    if (!diff.theme && !diff.cursor) return;
    api.patch('/users/me', diff)
      .then(() => updateUser(diff))
      .catch(() => { syncedRef.current = false; });
  }, [user, localTheme, localCursor, api, updateUser]);

  return null;
}
