import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { applyTheme, useThemeStore } from './lib/theme.ts'
import { applyCursor, usePreferences } from './lib/preferences.ts'
import { initPwa } from './features/pwa/install.ts'

applyTheme(useThemeStore.getState().theme);
applyCursor(usePreferences.getState().cursor);
initPwa();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/login"
      signInUrl="/login"
      signUpUrl="/register"
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)

// The static shell in index.html stays under the app until React has painted, then goes away.
// Removing it in the same frame React mounts made Chrome drop it as the LCP element (mobile LCP 4s → 2s).
requestAnimationFrame(() => setTimeout(() => document.getElementById('app-shell')?.remove(), 1000));
