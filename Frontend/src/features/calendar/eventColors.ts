/** Colours a user can pick for a meetup chip on their own calendar. */
export const EVENT_COLORS: { value: string; label: string }[] = [
  { value: '#ff7fb1', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#a16207', label: 'Brown' },
  { value: '#64748b', label: 'Grey' },
];

/** Black or white text, whichever reads better on the given hex background. */
export function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  // Perceived brightness (YIQ)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#1f1720' : '#ffffff';
}
