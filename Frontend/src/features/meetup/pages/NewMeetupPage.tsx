import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '../../../components/ui/DatePicker.tsx';
import { TimePicker } from '../../../components/ui/TimePicker.tsx';
import { InviteFriendsPicker } from '../components/InviteFriendsPicker.tsx';
import { useMeetupsApi } from '../api/meetups.api.ts';
import { useAuthStore } from '../../../store/auth.ts';
import type { NewMeetupFormValues } from '../types.ts';

const INITIAL_VALUES: NewMeetupFormValues = {
  title: '',
  date: '',
  time: '',
  location: '',
  details: '',
  invitedFriendIds: [],
};

export function NewMeetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillDate = searchParams.get('date') ?? '';
  const qc = useQueryClient();
  const meetupsApi = useMeetupsApi();
  const { user } = useAuthStore();
  const [values, setValues] = useState<NewMeetupFormValues>({ ...INITIAL_VALUES, date: prefillDate });
  const [mode, setMode] = useState<'friends' | 'solo'>('friends');

  // Check meetup count for selected date (max 3)
  const { data: allMeetups = [] } = useQuery({
    queryKey: ['meetups'],
    queryFn: () => meetupsApi.getMeetups(),
    staleTime: 30_000,
  });
  const meetupsOnDate = allMeetups.filter(m => m.date === values.date && (m.status === 'accepted' || m.status === 'pending')).length;
  const atLimit = meetupsOnDate >= 3;
  const [errors, setErrors] = useState<Partial<Record<keyof NewMeetupFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMeetup = useMutation({
    mutationFn: meetupsApi.createMeetup,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meetups'] });
      void qc.invalidateQueries({ queryKey: ['calendar'] });
      navigate(user ? `/${user.username}/calendar` : '/friends');
    },
    onError: (e: Error) => setSubmitError(e.message),
  });

  function set<K extends keyof NewMeetupFormValues>(key: K, value: NewMeetupFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof NewMeetupFormValues, string>> = {};
    if (!values.title.trim()) next.title = 'Please add a meetup title.';
    if (!values.date) next.date = 'Please pick a date.';
    if (!values.time) next.time = 'Please pick a time.';
    if (mode === 'friends' && values.invitedFriendIds.length === 0) next.invitedFriendIds = 'Invite at least one friend.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    if (mode === 'solo') {
      // Personal event — owner is the creator, no invitees.
      if (!user?._id) { setSubmitError('You must be signed in.'); return; }
      createMeetup.mutate({
        owner_id: user._id,
        date: values.date,
        time: values.time,
        title: values.title.trim(),
        description: values.details || undefined,
        location: values.location || undefined,
      });
      return;
    }

    const [owner_id, ...rest] = values.invitedFriendIds;
    createMeetup.mutate({
      owner_id,
      date: values.date,
      time: values.time,
      title: values.title.trim(),
      description: values.details || undefined,
      location: values.location || undefined,
      participants: rest.length > 0 ? rest : undefined,
    });
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--text-h)',
    backgroundColor: 'var(--bg)',
    outline: 'none',
    width: '100%',
    fontFamily: 'var(--sans)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-h)',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-neutral)', fontFamily: 'var(--sans)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-80 xl:w-96 flex-shrink-0 flex-col justify-between p-10"
        style={{ backgroundColor: 'var(--btn-inverted-bg)' }}
      >
        <div>
          <div className="mt-16">
            <h1
              className="font-bold leading-tight"
              style={{ color: '#ffffff', fontSize: '40px', letterSpacing: '-1px', margin: 0 }}
            >
              Crafting
            </h1>
            <h1
              className="font-bold leading-tight"
              style={{ color: '#ffffff', fontSize: '40px', letterSpacing: '-1px', margin: 0 }}
            >
              Memories.
            </h1>
          </div>
          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Every great meetup starts with a simple plan. Set the stage for your next adventure with friends.
          </p>
        </div>
        <p
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: 'var(--color-primary-light)' }}
        >
          Powered by Friendiary
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-10 max-w-2xl w-full mx-auto">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 rounded"
            style={{ color: 'var(--text)', textDecoration: 'none' }}
          >
            <ArrowLeft size={15} />
            Go Back
          </Link>

          <h2 style={{ color: 'var(--text-h)', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
            New Meetup
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--text)' }}>
            Fill in the details to invite your circle.
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            {/* Title */}
            <div>
              <label htmlFor="meetup-title" style={labelStyle}>
                Meetup Title
              </label>
              <input
                id="meetup-title"
                type="text"
                placeholder="e.g. Sunday Brunch at The Grove"
                value={values.title}
                onChange={(e) => set('title', e.target.value)}
                aria-describedby={errors.title ? 'title-error' : undefined}
                aria-invalid={!!errors.title}
                style={{
                  ...inputStyle,
                  borderColor: errors.title ? 'var(--color-primary)' : 'var(--border)',
                }}
              />
              {errors.title && (
                <p id="title-error" className="mt-1.5 text-xs" style={{ color: 'var(--color-primary)' }} role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="meetup-date" style={labelStyle}>
                  When
                </label>
                <DatePicker
                  id="meetup-date"
                  value={values.date}
                  onChange={(d) => set('date', d)}
                  placeholder="Pick a date"
                  error={!!errors.date}
                />
                {errors.date && (
                  <p id="date-error" className="mt-1.5 text-xs" style={{ color: 'var(--color-primary)' }} role="alert">
                    {errors.date}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="meetup-time" style={labelStyle}>
                  Time
                </label>
                <TimePicker
                  id="meetup-time"
                  value={values.time}
                  onChange={(t) => set('time', t)}
                  placeholder="Pick a time"
                  error={!!errors.time}
                />
                {errors.time && (
                  <p id="time-error" className="mt-1.5 text-xs" style={{ color: 'var(--color-primary)' }} role="alert">
                    {errors.time}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="meetup-location" style={labelStyle}>
                Location
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                >
                  <MapPin size={16} style={{ color: 'var(--text)' }} />
                </span>
                <input
                  id="meetup-location"
                  type="text"
                  placeholder="Add a place or type 'TBD'"
                  value={values.location}
                  onChange={(e) => set('location', e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '36px' }}
                />
              </div>
            </div>

            {/* Who's coming — solo vs friends */}
            <div>
              <label style={labelStyle}>Who's coming?</label>
              <div
                className="flex items-center gap-1 p-1 rounded-full w-fit"
                style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
                role="group"
                aria-label="Meetup audience"
              >
                {([
                  { key: 'friends', label: 'With friends' },
                  { key: 'solo', label: 'Just me' },
                ] as const).map(opt => {
                  const active = mode === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setMode(opt.key)}
                      aria-pressed={active}
                      className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2"
                      style={active
                        ? { backgroundColor: 'var(--color-primary)', color: '#ffffff' }
                        : { color: 'var(--text)' }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {mode === 'friends' ? (
                <div className="mt-4">
                  <InviteFriendsPicker
                    selected={values.invitedFriendIds}
                    onChange={(ids) => set('invitedFriendIds', ids)}
                  />
                  {errors.invitedFriendIds && (
                    <p className="mt-1.5 text-xs" style={{ color: 'var(--color-primary)' }} role="alert">
                      {errors.invitedFriendIds}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs" style={{ color: 'var(--text)' }}>
                  A personal event on your calendar — confirmed right away, no invites.
                </p>
              )}
            </div>

            {/* Details */}
            <div>
              <label htmlFor="meetup-details" style={labelStyle}>
                Meetup Details
              </label>
              <textarea
                id="meetup-details"
                rows={4}
                placeholder="Tell your friends what's happening..."
                value={values.details}
                onChange={(e) => set('details', e.target.value)}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: '1.6',
                }}
              />
            </div>

            {submitError && (
              <p className="text-sm text-center" style={{ color: 'var(--color-primary)' }}>{submitError}</p>
            )}

            {/* Limit warning — own row above buttons */}
            {atLimit && values.date && (
              <p className="text-xs font-semibold text-center" style={{ color: '#dc2626' }}>
                Max 3 meetups per day reached for {values.date}
              </p>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={createMeetup.isPending || atLimit}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {createMeetup.isPending && <Loader2 size={14} className="animate-spin" />}
                {createMeetup.isPending ? 'Creating...' : atLimit ? 'Day Full (3/3)' : 'Create Meetup'}
              </button>
              <Link
                to="/friends"
                className="text-sm font-medium hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 rounded px-2"
                style={{ color: 'var(--text)', textDecoration: 'none' }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
