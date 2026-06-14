import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CursorStyle = 'default' | 'star' | 'heart' | 'flower' | 'sparkle';
export type WeekStart = 'monday' | 'sunday';
export type DefaultCalendarView = 'month' | 'week' | 'day';
export type TimeFormat = '12h' | '24h';

export interface CursorMeta {
  id: CursorStyle;
  label: string;
  emoji: string;
}

export const CURSORS: CursorMeta[] = [
  { id: 'default',  label: 'Default',  emoji: '🖱️' },
  { id: 'star',     label: 'Star',     emoji: '⭐' },
  { id: 'heart',    label: 'Heart',    emoji: '❤️' },
  { id: 'flower',   label: 'Flower',   emoji: '🌸' },
  { id: 'sparkle',  label: 'Sparkle',  emoji: '✨' },
];

interface PreferencesState {
  cursor: CursorStyle;
  weekStart: WeekStart;
  defaultView: DefaultCalendarView;
  timeFormat: TimeFormat;
  setCursor: (cursor: CursorStyle) => void;
  setWeekStart: (v: WeekStart) => void;
  setDefaultView: (v: DefaultCalendarView) => void;
  setTimeFormat: (v: TimeFormat) => void;
}

export function applyCursor(cursor: CursorStyle) {
  document.documentElement.setAttribute('data-cursor', cursor);
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      cursor: 'default',
      weekStart: 'monday',
      defaultView: 'month',
      timeFormat: '12h',
      setCursor: (cursor) => { applyCursor(cursor); set({ cursor }); },
      setWeekStart: (weekStart) => set({ weekStart }),
      setDefaultView: (defaultView) => set({ defaultView }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    { name: 'friendiary-prefs' }
  )
);
