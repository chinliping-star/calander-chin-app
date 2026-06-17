export interface ChartPoint {
  label: string;
  count: number;
}

export interface AnalyticsOverview {
  profileViews: { total: number; week: number };
  friends: number;
  meetups: number;
  attendanceScore: number;
  isPremium: boolean;
}

export interface AttendanceStats {
  attended: number;
  missed: number;
  skipped: number;
  score: number;
}

export interface FriendRequestStats {
  sent:     ChartPoint[];
  received: ChartPoint[];
}

export type Period = 'daily' | 'weekly' | 'monthly';
