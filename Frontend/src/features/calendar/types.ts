import type { DayStatus } from '../../types/index.ts';

export interface CalendarDayData {
  day: number; // 1-31, or 0 for empty cell
  date: string; // YYYY-MM-DD, empty string for padding cells
  status: DayStatus;
  eventLabel?: string;
  isCurrentMonth: boolean;
}

export interface MonthData {
  year: number;
  month: number; // 0-indexed (0 = January)
  days: CalendarDayData[];
}
