import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, LayoutGrid, AlignJustify, Calendar, X, Trash2, Pencil, Check } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton.tsx';
import { ChevronLeft, ChevronRight } from '../../../components/ui/Icon.tsx';
import { DayCell } from './DayCell.tsx';
import { useCalendarApi, type ApiMeetup, type ApiCalendarDay } from '../api/calendar.api.ts';
import { useMeetupsApi } from '../../meetup/api/meetups.api.ts';
import { InviteFriendsPicker } from '../../meetup/components/InviteFriendsPicker.tsx';
import { useAuthStore } from '../../../store/auth.ts';
import { usePreferences } from '../../../lib/preferences.ts';
import { themeColor } from '../../../lib/theme.ts';
import type { CalendarDayData } from '../types.ts';
import type { DayStatus } from '../../../types/index.ts';
import { AttendanceMarker } from '../../analytics/components/AttendanceMarker.tsx';
import { useAnalyticsApi } from '../../analytics/api/analytics.api.ts';

// Week day labels in Mon-first and Sun-first orders
const WEEK_DAYS_MON = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const WEEK_DAYS_SUN = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const HOURS = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];

// Attendance badge styles (override Planned/Pending once marked)
const ATTENDANCE_BADGE: Record<'attended' | 'missed' | 'skipped', { label: string; bg: string; color: string }> = {
  attended: { label: 'Attended', bg: '#22c55e', color: '#ffffff' },
  missed:   { label: 'Missed',   bg: '#ef4444', color: '#ffffff' },
  skipped:  { label: 'Skipped',  bg: '#f59e0b', color: '#ffffff' },
};

// Light block style for calendar event chips, by attendance/status
const ATTENDANCE_BLOCK: Record<'attended' | 'missed' | 'skipped', { bg: string; border: string; text: string }> = {
  attended: { bg: '#dcfce7', border: '1.5px solid #86efac', text: '#15803d' },
  missed:   { bg: '#ffe4e6', border: '1.5px solid #fda4af', text: '#be123c' },
  skipped:  { bg: '#fef3c7', border: '1.5px solid #fcd34d', text: '#b45309' },
};

function meetupBlockStyle(m: { status: 'accepted' | 'pending'; attendance?: 'attended' | 'missed' | 'skipped' }) {
  if (m.attendance) return ATTENDANCE_BLOCK[m.attendance];
  return m.status === 'pending'
    ? { bg: '#ede9fe', border: '1.5px dashed #c084fc', text: '#7c3aed' }
    : { bg: 'var(--color-tertiary)', border: '1.5px solid var(--color-primary-light)', text: 'var(--color-primary-dark)' };
}

type ViewMode = 'monthly' | 'weekly' | 'daily';

// Map preferences view value → internal ViewMode
const PREF_VIEW_MAP: Record<string, ViewMode> = {
  month: 'monthly',
  week:  'weekly',
  day:   'daily',
};

interface DayOverride { status: DayStatus; eventLabel?: string; stickers?: string[]; meetupId?: string; }

interface MeetupItem {
  id: string;
  day: number; label: string; time: string;
  location: string; status: 'accepted' | 'pending'; with: string;
  date: string; description?: string;
  attendance?: 'attended' | 'missed' | 'skipped';
  proposerId: string;
  ownerId: string;
  arrangedBy: string;                                   // proposer display name
  arrangedByAvatar?: string;
  invited: { name: string; avatar?: string; status: 'pending' | 'accepted' | 'declined' }[]; // everyone except the proposer (declined hidden)
  participantIds: string[];                             // extra invitee ids (excludes proposer, includes owner)
  color: string;                                        // proposer's theme colour
}

interface MeetupDetailInfo {
  date: string;
  eventLabel: string;
  status: string;
}

// ── Format time string per preference ────────────────────────────────────────

function formatTime(time: string, format: '12h' | '24h'): string {
  if (!time) return '';
  // Accept "HH:MM", "H:MM AM/PM", plain hour strings like "9 AM"
  // Normalise to a Date object then re-format
  const cleaned = time.trim();
  // Already has AM/PM marker — parse directly
  const ampmMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2] ?? '0', 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    if (format === '24h') {
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayPeriod = h < 12 ? 'AM' : 'PM';
    return m === 0 ? `${displayH} ${displayPeriod}` : `${displayH}:${String(m).padStart(2,'0')} ${displayPeriod}`;
  }
  // "HH:MM" 24h format
  const colonMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    if (format === '24h') return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayPeriod = h < 12 ? 'AM' : 'PM';
    return m === 0 ? `${displayH} ${displayPeriod}` : `${displayH}:${String(m).padStart(2,'0')} ${displayPeriod}`;
  }
  // Unrecognised — return as-is
  return cleaned;
}

// ── Build override maps from API data ─────────────────────────────────────────

function buildOverrides(days: ApiCalendarDay[], meetups: ApiMeetup[]): Record<string, DayOverride> {
  const map: Record<string, DayOverride> = {};
  for (const d of days) {
    map[d.date] = { status: d.status as DayStatus, stickers: d.stickers };
  }
  for (const m of meetups) {
    const status: DayStatus = m.status === 'accepted' ? 'accepted' : 'pending';
    if (!map[m.date]) {
      map[m.date] = { status, eventLabel: m.title, meetupId: m._id };
    } else if (map[m.date].status === 'available') {
      map[m.date] = { ...map[m.date], status, eventLabel: m.title, meetupId: m._id };
    }
  }
  return map;
}

function buildMeetupList(meetups: ApiMeetup[], timeFormat: '12h' | '24h'): MeetupItem[] {
  const nameOf = (u?: { display_name?: string; username?: string }) =>
    u?.display_name || u?.username || 'Unknown';

  return meetups
    .filter(m => m.status === 'accepted' || m.status === 'pending')
    .map(m => {
      const proposerId = m.proposer_id?._id ?? '';
      // Per-invitee RSVP status, keyed by user id
      const respMap = new Map((m.responses ?? []).map(r => [r.user_id?._id, r.status]));
      // Everyone except the proposer = the invited people; declined are hidden
      const invited = (m.participants ?? [])
        .filter(p => p._id !== proposerId)
        .map(p => ({ name: nameOf(p), avatar: p.avatar_url, status: (respMap.get(p._id) ?? 'pending') as 'pending' | 'accepted' | 'declined' }))
        .filter(p => p.status !== 'declined');
      return {
        id: m._id,
        day: parseInt(m.date.split('-')[2], 10),
        label: m.title,
        time: formatTime(m.time ?? '', timeFormat),
        location: m.location ?? '',
        status: (m.status === 'accepted' ? 'accepted' : 'pending') as 'accepted' | 'pending',
        with: invited.map(i => i.name).join(', ') || 'You',
        date: m.date,
        description: m.description,
        proposerId,
        ownerId: m.owner_id?._id ?? '',
        arrangedBy: nameOf(m.proposer_id),
        arrangedByAvatar: m.proposer_id?.avatar_url,
        invited,
        participantIds: (m.participants ?? [])
          .map(p => p._id)
          .filter(id => id !== proposerId),
        color: themeColor(m.proposer_id?.theme),
      };
    })
    // Sort by date ascending so the list is chronological, not random
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Small round avatar — image if present, else initial
function Avatar({ name, src }: { name: string; src?: string }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden text-[10px] font-bold"
      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
    >
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : name.charAt(0).toUpperCase()}
    </span>
  );
}

// ── Meetup detail modal ────────────────────────────────────────────────────────

function MeetupDetailModal({
  info, meetups, onClose,
}: {
  info: MeetupDetailInfo;
  meetups: MeetupItem[];
  onClose: () => void;
}) {
  // Find the full meetup entry that matches this date + label
  const meetup = meetups.find(m => m.date === info.date && m.label === info.eventLabel)
    ?? meetups.find(m => m.date === info.date);

  const isPending = (meetup?.status ?? info.status) === 'pending';

  // Past + accepted meetups can have attendance marked
  const todayStr = new Date().toISOString().slice(0, 10);
  const canMarkAttendance = !!meetup && meetup.status === 'accepted' && meetup.date <= todayStr;

  const analyticsApi = useAnalyticsApi();
  const { data: myAttendance = [] } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => analyticsApi.getMyAttendance(),
    enabled: canMarkAttendance,
  });
  const currentStatus = myAttendance.find(a => a.meetup_id === meetup?.id)?.status as
    | 'attended' | 'missed' | 'skipped' | undefined;

  const me = useAuthStore(s => s.user);
  // Only the person who planned it (proposer) may delete — not the owner,
  // not invited participants.
  const canDelete = !!meetup && !!me?._id && me._id === meetup.proposerId;

  const meetupsApi = useMeetupsApi();
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => meetupsApi.deleteMeetup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['meetups'] });
      onClose();
    },
  });

  function handleDelete() {
    if (!meetup) return;
    if (window.confirm('Delete this meetup? This cannot be undone.')) {
      deleteMutation.mutate(meetup.id);
    }
  }

  // Edit — proposer only, same gate as delete
  const canEdit = canDelete;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const [invited, setInvited] = useState<string[]>([]);

  const updateMutation = useMutation({
    mutationFn: (payload: { title: string; date: string; time: string; location: string; description: string; participants: string[] }) =>
      meetupsApi.updateMeetup(meetup!.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      qc.invalidateQueries({ queryKey: ['meetups'] });
      setEditing(false);
    },
  });

  function startEdit() {
    if (!meetup) return;
    setForm({
      title: meetup.label,
      date: meetup.date,
      time: meetup.time,
      location: meetup.location ?? '',
      description: meetup.description ?? '',
    });
    setInvited(meetup.participantIds);
    setEditing(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    updateMutation.mutate({ ...form, participants: invited });
  }

  return createPortal(
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,10,20,0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Meetup details"
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-3xl p-7 flex flex-col gap-4"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close meetup details"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full transition-all hover:opacity-80"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--text-h)' }}
        >
          <X size={14} />
        </button>

        {/* Status badge + title */}
        <div className="flex flex-col gap-2">
          <span
            className="self-start text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
            style={isPending
              ? { backgroundColor: '#ede9fe', color: '#7c3aed' }
              : { backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
          >
            {isPending ? 'Pending' : 'Confirmed'}
          </span>
          {!editing && (
            <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-h)' }}>
              {meetup?.label ?? info.eventLabel}
            </h3>
          )}
        </div>

        {/* Details (view mode) */}
        {!editing && (
        <div className="flex flex-col gap-2">
          {/* Date */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
            <Calendar size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>{info.date}</span>
          </div>

          {/* Time */}
          {meetup?.time && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <Clock size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{meetup.time}</span>
            </div>
          )}

          {/* Location */}
          {meetup?.location && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <MapPin size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{meetup.location}</span>
            </div>
          )}

          {/* Arranged by (proposer / host) */}
          {meetup?.arrangedBy && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <Avatar name={meetup.arrangedBy} src={meetup.arrangedByAvatar} />
              <span>Arranged by <strong style={{ color: 'var(--text-h)' }}>{meetup.arrangedBy}</strong></span>
            </div>
          )}

          {/* Invited people */}
          {meetup && meetup.invited.length > 0 && (
            <div className="flex items-start gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <span className="mt-1" style={{ color: 'var(--color-primary)', flexShrink: 0, fontSize: '13px' }}>👥</span>
              <div className="flex flex-col gap-1.5">
                <span style={{ color: 'var(--text)' }}>Invited</span>
                <div className="flex flex-wrap gap-2">
                  {meetup.invited.map((p, i) => (
                    <span key={i} className="flex items-center gap-1.5 rounded-full pl-0.5 pr-2.5 py-0.5"
                      style={{ background: 'var(--color-tertiary)' }}>
                      <Avatar name={p.name} src={p.avatar} />
                      <span style={{ color: 'var(--text-h)' }}>{p.name}</span>
                      {p.status === 'accepted'
                        ? <Check size={12} style={{ color: 'var(--color-primary)' }} aria-label="accepted" />
                        : <span className="text-[9px] font-semibold" style={{ color: 'var(--text)' }}>pending</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {meetup?.description && (
            <p className="text-xs leading-relaxed mt-1 px-1 py-2 rounded-xl"
              style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--text)' }}>
              {meetup.description}
            </p>
          )}
        </div>
        )}

        {/* Edit form — proposer only */}
        {editing && meetup && (
          <div className="flex flex-col gap-2.5">
            <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-h)' }}>
              Title
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="rounded-lg px-3 py-2 text-xs font-normal outline-none"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-h)' }}>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-xs font-normal outline-none"
                  style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-h)' }}>
                Time
                <input
                  type="text"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  placeholder="5:30 AM"
                  className="rounded-lg px-3 py-2 text-xs font-normal outline-none"
                  style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-h)' }}>
              Location
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="rounded-lg px-3 py-2 text-xs font-normal outline-none"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-h)' }}>
              Description
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="rounded-lg px-3 py-2 text-xs font-normal outline-none resize-none"
                style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              />
            </label>
            <div className="pt-1">
              <InviteFriendsPicker selected={invited} onChange={setInvited} />
            </div>
          </div>
        )}

        {/* Attendance — only for past, accepted meetups (view mode) */}
        {!editing && canMarkAttendance && meetup && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-h)' }}>How did it go?</p>
            <AttendanceMarker
              meetupId={meetup.id}
              meetupTitle={meetup.label}
              meetupDate={meetup.date}
              currentStatus={currentStatus}
            />
          </div>
        )}

        {/* Edit-mode actions — Save / Cancel */}
        {editing && (
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending || !form.title.trim()}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--color-primary)' }}
            >
              <Check size={15} />
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={updateMutation.isPending}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--color-tertiary)', color: 'var(--text-h)' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* View-mode actions — Edit / Delete (proposer only) */}
        {!editing && canEdit && (
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
              style={{ background: 'var(--accent-bg)', color: 'var(--color-primary-dark)', border: '1px solid var(--accent-border)' }}
            >
              <Pencil size={15} />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90 disabled:opacity-60"
              style={{ background: 'rgba(239,68,68,0.10)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <Trash2 size={15} />
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Meetup list ───────────────────────────────────────────────────────────────

const MEETUP_FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'accepted', label: 'Confirmed' },
  { value: 'pending',  label: 'Pending' },
] as const;
type MeetupFilter = typeof MEETUP_FILTERS[number]['value'];

function MeetupList({ meetups, onMeetupClick }: { meetups: MeetupItem[]; onMeetupClick?: (info: MeetupDetailInfo) => void }) {
  const [filter, setFilter] = useState<MeetupFilter>('all');

  if (meetups.length === 0) return (
    <p className="text-xs text-center py-4" style={{ color: 'var(--text)' }}>No meetups</p>
  );

  const shown = meetups.filter(m => filter === 'all' || m.status === filter);

  return (
    <div className="flex flex-col gap-2">
      {/* Filter pills */}
      <div className="flex gap-1.5 mb-1">
        {MEETUP_FILTERS.map(f => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition-colors"
              style={{
                backgroundColor: active ? 'var(--color-primary)' : 'var(--color-tertiary)',
                color: active ? '#ffffff' : 'var(--text)',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 && (
        <p className="text-xs text-center py-3" style={{ color: 'var(--text)' }}>No {filter} meetups</p>
      )}

      {shown.map((m) => (
        <button
          key={`${m.day}-${m.label}`}
          type="button"
          onClick={() => onMeetupClick?.({ date: m.date, eventLabel: m.label, status: m.status })}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:shadow-sm hover:opacity-80 w-full text-left"
          style={{
            backgroundColor: meetupBlockStyle(m).bg,
            border: meetupBlockStyle(m).border,
          }}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: m.attendance
              ? ATTENDANCE_BADGE[m.attendance].bg
              : m.status === 'pending' ? '#c084fc' : 'var(--color-primary)' }}>
            {m.day}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-h)' }}>{m.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {m.time && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text)' }}>
                  <Clock size={9} />{m.time}
                </span>
              )}
              {m.location && (
                <span className="flex items-center gap-1 text-[10px] truncate" style={{ color: 'var(--text)' }}>
                  <MapPin size={9} />{m.location}
                </span>
              )}
            </div>
          </div>
          {(() => {
            const badge = m.attendance
              ? ATTENDANCE_BADGE[m.attendance]
              : m.status === 'pending'
                ? { label: 'Pending', bg: '#ede9fe', color: '#7c3aed' }
                : { label: 'Planned', bg: 'var(--color-primary)', color: '#ffffff' };
            return (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                style={{ backgroundColor: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            );
          })()}
        </button>
      ))}
    </div>
  );
}

// ── Monthly view ──────────────────────────────────────────────────────────────

function MonthlyView({
  year, month, today, overrides, meetups, isOwn, weekStartsOnMonday,
  onNewMeetup, onToggleAvailability, onDayClick, onMeetupClick,
}: {
  year: number; month: number; today: Date;
  overrides: Record<string, DayOverride>; meetups: MeetupItem[];
  isOwn: boolean;
  weekStartsOnMonday: boolean;
  onNewMeetup?: (date: string) => void;
  onToggleAvailability?: (date: string, current: 'available' | 'blocked') => void;
  onDayClick?: (date: string, currentStatus: DayStatus) => void;
  onMeetupClick?: (info: MeetupDetailInfo) => void;
}) {
  const WEEK_DAYS = weekStartsOnMonday ? WEEK_DAYS_MON : WEEK_DAYS_SUN;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayJS = new Date(year, month, 1).getDay(); // 0=Sun
  // startPad: how many empty cells before day 1
  const startPad = weekStartsOnMonday
    ? (firstDayJS === 0 ? 6 : firstDayJS - 1)  // Mon-first: Sun→6, Mon→0, Tue→1...
    : firstDayJS;                                // Sun-first: Sun→0, Mon→1...
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const gridRef = useRef<HTMLDivElement>(null);

  // Group meetups by full date string so each cell can show several chips
  const meetupsByDate: Record<string, MeetupItem[]> = {};
  meetups.forEach(m => {
    (meetupsByDate[m.date] ??= []).push(m);
  });

  const cells: CalendarDayData[] = [];
  for (let i = 0; i < startPad; i++)
    cells.push({ day: 0, date: '', status: 'available', isCurrentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const override = overrides[dateStr];
    cells.push({ day: d, date: dateStr, status: override?.status ?? 'available', eventLabel: override?.eventLabel, stickers: override?.stickers, isCurrentMonth: true });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) for (let i = 0; i < 7 - remainder; i++)
    cells.push({ day: 0, date: '', status: 'available', isCurrentMonth: false });

  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="grid grid-cols-7 gap-1">
        {WEEK_DAYS.map(d => (
          <div key={d} className="py-1.5 text-center text-[10px] font-bold uppercase tracking-widest rounded-lg"
            style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-tertiary)' }}>
            {d}
          </div>
        ))}
      </div>
      <div ref={gridRef} className="relative grid grid-cols-7 gap-1 flex-1" role="grid" style={{ gridAutoRows: '1fr' }}>
        {cells.map((day, idx) => (
          <div key={day.date || `pad-${idx}`} className="relative">
            <DayCell
              data={day}
              isToday={day.date === todayStr}
              isOwn={isOwn}
              meetups={meetupsByDate[day.date] ?? []}
              onNewMeetup={onNewMeetup}
              onToggleAvailability={onToggleAvailability}
              onClick={!isOwn ? (d) => onDayClick?.(d.date, d.status) : undefined}
              onMeetupClick={onMeetupClick}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {[
          { label: 'Available', bg: 'var(--bg)', border: '1px solid #f0e6ec', text: 'var(--text)' },
          { label: 'Planned',   bg: 'var(--color-tertiary)', border: '1.5px solid var(--color-primary-light)', text: 'var(--color-primary-dark)' },
          { label: 'Pending',   bg: '#faf5ff', border: '1.5px dashed #c084fc', text: '#7c3aed' },
          { label: 'Blocked',   bg: '#f3f4f6', border: '1px solid #e5e7eb',   text: '#9ca3af' },
        ].map(({ label, bg, border, text }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-md" style={{ backgroundColor: bg, border }} aria-hidden="true" />
            <span className="text-[10px] font-medium" style={{ color: text }}>{label}</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
          This Month's Meetups
        </p>
        <MeetupList meetups={meetups} onMeetupClick={onMeetupClick} />
      </div>
    </div>
  );
}

// ── Weekly view ───────────────────────────────────────────────────────────────

function WeeklyView({
  year, month, today, overrides, meetups, weekStartsOnMonday, timeFormat,
  isOwn, onNewMeetup, onToggleAvailability, onMeetupClick,
}: {
  year: number; month: number; today: Date;
  overrides: Record<string, DayOverride>; meetups: MeetupItem[];
  weekStartsOnMonday: boolean;
  timeFormat: '12h' | '24h';
  isOwn?: boolean;
  onNewMeetup?: (date: string) => void;
  onToggleAvailability?: (date: string, current: 'available' | 'blocked') => void;
  onMeetupClick?: (info: MeetupDetailInfo) => void;
}) {
  const WEEK_DAYS = weekStartsOnMonday ? WEEK_DAYS_MON : WEEK_DAYS_SUN;
  const meetupsByDay: Record<number, MeetupItem[]> = {};
  meetups.forEach(m => {
    if (!meetupsByDay[m.day]) meetupsByDay[m.day] = [];
    meetupsByDay[m.day].push(m);
  });

  const refDay = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : 1;
  const refDate = new Date(year, month, refDay);
  const dow = refDate.getDay(); // 0=Sun

  let weekStartOffset: number;
  if (weekStartsOnMonday) {
    // Find Monday of current week: Mon=1→0, Tue=2→-1, ..., Sun=0→-6
    weekStartOffset = dow === 0 ? -6 : 1 - dow;
  } else {
    // Find Sunday of current week: Sun=0→0, Mon=1→-1, ..., Sat=6→-5
    weekStartOffset = -dow;
  }

  const weekStart = new Date(year, month, refDay + weekStartOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekLabel = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' – ' + weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--text)' }}>
        Week of {weekLabel}
      </p>
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {weekDays.map((date, i) => {
          const day = date.getDate();
          const sameMonth = date.getMonth() === month && date.getFullYear() === year;
          const isToday = date.toDateString() === today.toDateString();
          const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const override = sameMonth ? overrides[dateStr] : undefined;
          const dayMeetups = sameMonth ? (meetupsByDay[day] ?? []) : [];
          return (
            <div key={dateStr} className="flex flex-col gap-1.5">
              <div className="flex flex-col items-center py-2 rounded-xl"
                style={{
                  backgroundColor: isToday ? 'var(--color-primary)' : 'var(--color-tertiary)',
                  border: isToday ? '2px solid var(--color-primary-dark)' : '1px solid var(--border)',
                }}>
                <span className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-primary)' }}>
                  {WEEK_DAYS[i]}
                </span>
                <span className="text-base font-bold leading-none"
                  style={{ color: isToday ? 'var(--bg)' : 'var(--text-h)' }}>
                  {day}
                </span>
                {isToday && <span className="text-[8px] text-white opacity-80">Today</span>}
              </div>
              <div className="relative flex-1 rounded-xl p-1.5 flex flex-col gap-1 min-h-[160px] group/day"
                style={{
                  backgroundColor: override?.status === 'blocked' ? '#f3f4f6'
                    : override?.status === 'pending' ? '#faf5ff'
                    : 'var(--bg)',
                  border: override?.status === 'pending' ? '1.5px dashed #c084fc'
                    : '1px solid var(--border)',
                }}>
                {dayMeetups.length === 0 && !override && (
                  <p className="text-[9px] text-center mt-4" style={{ color: 'var(--border)' }}>free</p>
                )}
                {override?.status === 'blocked' && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-center"
                    style={{ backgroundColor: '#e5e7eb', color: '#9ca3af' }}>
                    {override.eventLabel ?? 'Busy'}
                  </span>
                )}
                {dayMeetups.map(m => {
                  const bs = meetupBlockStyle(m);
                  return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => onMeetupClick?.({ date: m.date, eventLabel: m.label, status: m.status })}
                    className="w-full text-left rounded-lg px-1.5 py-1 transition-opacity hover:opacity-75"
                    style={{ backgroundColor: bs.bg, border: bs.border }}
                  >
                    <p className="text-[9px] font-bold truncate" style={{ color: bs.text }}>
                      {m.label}
                    </p>
                    <p className="text-[8px]" style={{ color: 'var(--text)' }}>
                      {formatTime(m.time, timeFormat)}
                    </p>
                  </button>
                  );
                })}

                {/* + new meetup button — centered overlay on hover */}
                {isOwn && sameMonth && override?.status !== 'blocked' && (
                  <button
                    type="button"
                    aria-label="New meetup"
                    onClick={() => onNewMeetup?.(dateStr)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-opacity z-10 rounded-xl"
                    style={{ background: 'rgba(255,127,177,0.08)' }}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '16px', lineHeight: 1 }}>
                      +
                    </span>
                  </button>
                )}

                {/* busy/free toggle */}
                {isOwn && sameMonth && (
                  <button
                    type="button"
                    aria-label={override?.status === 'blocked' ? 'Mark as free' : 'Mark as busy'}
                    onClick={() => onToggleAvailability?.(dateStr, override?.status === 'blocked' ? 'blocked' : 'available')}
                    className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 rounded-md py-0.5 text-[8px] font-bold opacity-0 group-hover/day:opacity-100 transition-opacity z-10"
                    style={override?.status === 'blocked'
                      ? { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }
                      : { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }
                    }
                  >
                    {override?.status === 'blocked' ? '✓ Mark Free' : '⊘ Mark Busy'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
          This Week's Meetups
        </p>
        <MeetupList meetups={meetups.filter(m => weekDays.some(d => d.getMonth() === month && d.getDate() === m.day))} onMeetupClick={onMeetupClick} />
      </div>
    </div>
  );
}

// ── Daily view ────────────────────────────────────────────────────────────────

function DailyView({
  today, meetups, timeFormat, isOwn, onNewMeetup, overrides, onToggleAvailability, onMeetupClick,
}: {
  today: Date; meetups: MeetupItem[]; timeFormat: '12h' | '24h';
  isOwn?: boolean;
  onNewMeetup?: (date: string) => void;
  overrides?: Record<string, DayOverride>;
  onToggleAvailability?: (date: string, current: 'available' | 'blocked') => void;
  onMeetupClick?: (info: MeetupDetailInfo) => void;
}) {
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayMeetups = meetups.filter(m => m.day === today.getDate());
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const todayOverride = overrides?.[todayStr];
  const isTodayBlocked = todayOverride?.status === 'blocked';

  // Build hour slots formatted per preference
  const hourSlots = HOURS.map(h => formatTime(h, timeFormat));

  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="relative flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', boxShadow: '0 4px 12px var(--accent-border)' }}>
        <div className="w-20" />
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.75)' }}>{dayName}</p>
          <p className="text-3xl font-bold text-white leading-none">{today.getDate()}</p>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>{monthLabel} · Today</p>
        </div>
        <div className="w-20 flex flex-col items-end gap-1.5">
          {isOwn && (
            <button
              type="button"
              onClick={() => onNewMeetup?.(todayStr)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              + New
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => onToggleAvailability?.(todayStr, isTodayBlocked ? 'blocked' : 'available')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all hover:scale-105"
              style={isTodayBlocked
                ? { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }
                : { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }
              }
            >
              {isTodayBlocked ? '✓ Mark Free' : '⊘ Mark Busy'}
            </button>
          )}
        </div>
      </div>

      {isTodayBlocked && (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
          style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
          <span className="text-sm">⊘</span>
          <p className="text-sm font-semibold" style={{ color: '#6b7280' }}>This day is marked as busy</p>
        </div>
      )}

      <div className="flex flex-col gap-0 overflow-y-auto flex-1" style={{ maxHeight: '420px', opacity: isTodayBlocked ? 0.4 : 1, pointerEvents: isTodayBlocked ? 'none' : 'auto' }}>
        {hourSlots.map((hourLabel, idx) => {
          const rawHour = HOURS[idx];
          const meetup = todayMeetups.find(m =>
            m.time === rawHour || m.time === hourLabel ||
            m.time.startsWith(rawHour.replace(' AM','').replace(' PM',''))
          ) ?? null;
          return (
            <div key={rawHour} className="flex gap-3 items-start py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] font-semibold w-14 shrink-0 pt-0.5 text-right"
                style={{ color: 'var(--text)' }}>
                {hourLabel}
              </span>
              {meetup ? (
                <div className="flex-1 rounded-xl px-3 py-2"
                  style={{
                    backgroundColor: meetupBlockStyle(meetup).bg,
                    border: meetupBlockStyle(meetup).border,
                  }}>
                  <p className="text-xs font-bold" style={{ color: meetupBlockStyle(meetup).text }}>
                    {meetup.label}
                  </p>
                  {meetup.location && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text)' }}>
                        <MapPin size={9} />{meetup.location}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text)' }}>with {meetup.with}</p>
                </div>
              ) : (
                <div
                  onClick={() => isOwn && !isTodayBlocked && onNewMeetup?.(todayStr)}
                  className="group/slot flex-1 h-8 rounded-lg transition-all flex items-center gap-1.5 px-2"
                  style={{
                    cursor: isOwn && !isTodayBlocked ? 'pointer' : 'default',
                    border: '1px dashed transparent',
                  }}
                  onMouseEnter={e => { if (isOwn && !isTodayBlocked) { (e.currentTarget as HTMLDivElement).style.border = '1px dashed var(--color-primary-light)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--color-tertiary)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px dashed transparent'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  {isOwn && !isTodayBlocked && (
                    <span className="opacity-0 group-hover/slot:opacity-100 transition-opacity text-[9px] font-bold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                      <span className="text-sm leading-none">+</span> Add meetup
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
          Today's Meetups
        </p>
        <MeetupList meetups={todayMeetups} onMeetupClick={onMeetupClick} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: React.FC<{ size?: number }> }[] = [
  { key: 'daily',   label: 'Day',   icon: Calendar },
  { key: 'weekly',  label: 'Week',  icon: AlignJustify },
  { key: 'monthly', label: 'Month', icon: LayoutGrid },
];

export function CalendarGrid({ isOwn = true }: { isOwn?: boolean }) {
  // Bug 10.1: read preferences
  const { weekStart, defaultView, timeFormat } = usePreferences();
  const weekStartsOnMonday = weekStart === 'monday';

  // Bug 10.1: default view comes from saved preference
  const [view, setView] = useState<ViewMode>(() => PREF_VIEW_MAP[defaultView] ?? 'monthly');
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const navigate = useNavigate();

  // Bug 11.4: meetup detail modal state
  const [activeMeetup, setActiveMeetup] = useState<MeetupDetailInfo | null>(null);

  const qc = useQueryClient();
  const { user } = useAuthStore();
  const calendarApi = useCalendarApi();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', user?.username, monthStr],
    queryFn: () => calendarApi.getMonth(user!.username, monthStr),
    enabled: !!user?.username,
    staleTime: 60_000,
    placeholderData: { days: [], meetups: [], user: { _id: '', username: '', display_name: '' } },
  });

  const analyticsApi = useAnalyticsApi();
  const { data: myAttendance = [] } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => analyticsApi.getMyAttendance(),
    enabled: !!user?.username,
  });
  const attendanceMap = new Map(myAttendance.map(a => [a.meetup_id, a.status]));

  // Hide meetups I personally declined from my own calendar + list.
  // The proposer has no response row, so their meetups always stay visible.
  const myId = user?._id ?? '';
  const visibleMeetups = (data?.meetups ?? []).filter(m => {
    const mine = m.responses?.find(r => r.user_id?._id === myId);
    return !mine || mine.status !== 'declined';
  });

  const overrides = data ? buildOverrides(data.days, visibleMeetups) : {};
  // Bug 10.1: pass timeFormat to buildMeetupList so times are pre-formatted
  const meetupList = (data ? buildMeetupList(visibleMeetups, timeFormat) : []).map(m => ({
    ...m,
    attendance: attendanceMap.get(m.id) as MeetupItem['attendance'],
  }));

  const markDay = useMutation({
    mutationFn: ({ date, status }: { date: string; status: DayStatus }) =>
      calendarApi.markDay(date, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['calendar', user?.username, monthStr] });
    },
  });

  // Toggle available ↔ blocked
  const handleToggleAvailability = useCallback((date: string, current: 'available' | 'blocked') => {
    const next: DayStatus = current === 'blocked' ? 'available' : 'blocked';
    markDay.mutate({ date, status: next });
  }, [markDay]);

  // Friend's day click — navigate to propose meetup
  function handleDayClick(date: string, currentStatus: DayStatus) {
    if (currentStatus !== 'blocked') {
      navigate(`/meetups/propose?date=${date}`);
    }
  }

  // + button click on own calendar — navigate to new meetup
  const handleNewMeetup = useCallback((date: string) => {
    navigate(`/meetups/new?date=${date}`);
  }, [navigate]);

  // Bug 11.4: open meetup detail modal
  const handleMeetupClick = useCallback((info: MeetupDetailInfo) => {
    setActiveMeetup(info);
  }, []);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <section className="flex flex-col gap-4 flex-1 h-full" aria-label={`Calendar for ${monthName} ${year}`}>

      {/* Bug 11.4: meetup detail modal (rendered at top level to avoid overflow clipping) */}
      {activeMeetup && (
        <MeetupDetailModal
          info={activeMeetup}
          meetups={meetupList}
          onClose={() => setActiveMeetup(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" aria-label="Previous month" onClick={prevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}>
          <ChevronLeft size={16} />
        </button>

        <div className="text-center flex-1">
          <div className="flex items-baseline justify-center gap-2">
            <h2 className="font-bold leading-none tracking-tight" style={{ color: 'var(--text-h)', fontSize: '26px', margin: 0 }}>
              {view === 'daily' ? `${monthName} ${today.getDate()}` : monthName}
            </h2>
            <span className="font-semibold" style={{ color: 'var(--color-primary)', fontSize: '16px' }}>{year}</span>
          </div>
          <p className="mt-1 text-[10px] tracking-wide" style={{ color: 'var(--text)' }}>
            your personal calendar ✨
          </p>
        </div>

        <button type="button" aria-label="Next month" onClick={nextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)', border: '1px solid var(--border)' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* View toggle */}
      <div className="flex justify-center">
        <div className="flex items-center gap-0.5 p-1 rounded-full"
          style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
          role="group" aria-label="Calendar view">
          {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setView(key)}
              aria-pressed={view === key}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
              style={view === key
                ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', boxShadow: '0 2px 8px var(--accent-border)' }
                : { color: 'var(--text)' }}>
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state — skeleton grid */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} height={72} rounded="xl" />
            ))}
          </div>
        </div>
      )}

      {/* View content */}
      {!isLoading && (
        <div
          key={`${view}-${year}-${month}`}
          className="flex flex-col flex-1 gap-4"
          style={{ animation: 'calendarViewIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards' }}
        >
          {view === 'monthly' && (
            <MonthlyView
              year={year} month={month} today={today}
              overrides={overrides} meetups={meetupList}
              isOwn={isOwn}
              weekStartsOnMonday={weekStartsOnMonday}
              onNewMeetup={handleNewMeetup}
              onToggleAvailability={handleToggleAvailability}
              onDayClick={handleDayClick}
              onMeetupClick={handleMeetupClick}
            />
          )}
          {view === 'weekly' && (
            <WeeklyView
              year={year} month={month} today={today}
              overrides={overrides} meetups={meetupList}
              weekStartsOnMonday={weekStartsOnMonday}
              timeFormat={timeFormat}
              isOwn={isOwn}
              onNewMeetup={handleNewMeetup}
              onToggleAvailability={handleToggleAvailability}
              onMeetupClick={handleMeetupClick}
            />
          )}
          {view === 'daily' && (
            <DailyView
              today={today} meetups={meetupList} timeFormat={timeFormat}
              isOwn={isOwn}
              onNewMeetup={handleNewMeetup}
              overrides={overrides}
              onToggleAvailability={handleToggleAvailability}
              onMeetupClick={handleMeetupClick}
            />
          )}
        </div>
      )}
    </section>
  );
}
