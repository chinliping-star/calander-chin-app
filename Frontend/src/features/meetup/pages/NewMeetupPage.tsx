import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import { DatePicker } from '../../../components/ui/DatePicker.tsx';
import { TimePicker } from '../../../components/ui/TimePicker.tsx';
import { InviteFriendsPicker } from '../components/InviteFriendsPicker.tsx';
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
  const [values, setValues] = useState<NewMeetupFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof NewMeetupFormValues, string>>>({});

  function set<K extends keyof NewMeetupFormValues>(key: K, value: NewMeetupFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof NewMeetupFormValues, string>> = {};
    if (!values.title.trim()) next.title = 'Please add a meetup title.';
    if (!values.date) next.date = 'Please pick a date.';
    if (!values.time) next.time = 'Please pick a time.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Static mock — no API call
    alert(`Meetup "${values.title}" created!`);
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--text-h)',
    backgroundColor: '#ffffff',
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
          style={{ color: 'rgba(255,127,177,0.7)' }}
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

            {/* Invite Friends */}
            <InviteFriendsPicker
              selected={values.invitedFriendIds}
              onChange={(ids) => set('invitedFriendIds', ids)}
            />

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

            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Create Meetup
              </button>
              <Link
                to="/friends"
                className="text-sm font-medium hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 rounded"
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
