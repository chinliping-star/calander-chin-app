import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, useThemeStore } from './lib/theme.ts'
import { applyCursor, usePreferences } from './lib/preferences.ts'

// Apply persisted theme + cursor before first paint
applyTheme(useThemeStore.getState().theme);
applyCursor(usePreferences.getState().cursor);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
