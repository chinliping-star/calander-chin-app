import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'pink' | 'light' | 'dark' | 'purple' | 'blue' | 'green' | 'yellow' | 'grey';

export interface ThemeMeta {
  id: Theme;
  label: string;
  primary: string;
  bg: string;
  surface: string;
  textH: string;
  text: string;
  border: string;
}

export const THEMES: ThemeMeta[] = [
  { id: 'pink',   label: 'Pink',   primary: '#FF7FB1', bg: '#FFF0F6', surface: '#ffffff',  textH: '#4A3E4E', text: '#6b6375', border: '#e8dfe6' },
  { id: 'light',  label: 'Light',  primary: '#FF7FB1', bg: '#F1F5F9', surface: '#ffffff',  textH: '#1E293B', text: '#64748B', border: '#E2E8F0' },
  { id: 'dark',   label: 'Dark',   primary: '#FF7FB1', bg: '#1E293B', surface: '#0F172A',  textH: '#E2E8F0', text: '#94A3B8', border: '#334155' },
  { id: 'purple', label: 'Purple', primary: '#8B5CF6', bg: '#F5F3FF', surface: '#ffffff',  textH: '#3B2F6E', text: '#6B5C8A', border: '#DDD6FE' },
  { id: 'blue',   label: 'Blue',   primary: '#3B82F6', bg: '#EFF6FF', surface: '#ffffff',  textH: '#1E3A5F', text: '#4B6A8A', border: '#BFDBFE' },
  { id: 'green',  label: 'Green',  primary: '#10B981', bg: '#ECFDF5', surface: '#ffffff',  textH: '#064E3B', text: '#3D7A66', border: '#A7F3D0' },
  { id: 'yellow', label: 'Yellow', primary: '#F59E0B', bg: '#FFFBEB', surface: '#ffffff',  textH: '#78350F', text: '#92700F', border: '#FDE68A' },
  { id: 'grey',   label: 'Grey',   primary: '#6B7280', bg: '#F9FAFB', surface: '#ffffff',  textH: '#374151', text: '#6B7280', border: '#D1D5DB' },
];

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'pink',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    { name: 'friendiary-theme' }
  )
);
