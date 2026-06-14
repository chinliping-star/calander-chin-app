import type { SuggestedPerson } from '../types.ts';

const SUGGESTED: SuggestedPerson[] = [
  {
    id: '1',
    displayName: 'Elena Ruiz',
    username: 'elena.ruiz',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    mutualContext: 'AI Multi Partners',
  },
  {
    id: '2',
    displayName: 'Marcus Thorne',
    username: 'marcus.thorne',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    mutualContext: 'In your NGO group',
  },
  {
    id: '3',
    displayName: 'Maya Patel',
    username: 'maya.patel',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    mutualContext: 'BlueAI Partners',
  },
  {
    id: '4',
    displayName: 'Daniel Kim',
    username: 'daniel.kim',
    avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg',
    mutualContext: 'Recommended by connections',
  },
];

export function PeopleYouMayKnow() {
  return (
    <section aria-labelledby="people-heading">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2
          id="people-heading"
          className="text-lg font-bold tracking-tight"
          style={{ color: 'var(--text-h)', margin: 0 }}
        >
          People you may know
        </h2>
        <button
          type="button"
          className="text-xs font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none"
          style={{ color: 'var(--color-primary)' }}
        >
          View All
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SUGGESTED.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
}

function PersonCard({ person }: { person: SuggestedPerson }) {
  return (
    <div
      className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
      }}
    >
      {/* Square photo with padding + rounded */}
      <div className="w-full p-4 pt-5 flex items-center justify-center" style={{ backgroundColor: 'var(--color-neutral)' }}>
        <div className="w-full aspect-square overflow-hidden rounded-xl">
          <img
            src={person.avatarUrl}
            alt={person.displayName}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-3.5">
        <div>
          <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text-h)' }}>
            {person.displayName}
          </p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text)' }}>
            {person.mutualContext}
          </p>
        </div>

        <ConnectButton />
      </div>
    </div>
  );
}

function ConnectButton() {
  return (
    <button
      type="button"
      className="w-full py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
      style={{
        backgroundColor: 'transparent',
        border: '1.5px solid var(--color-primary)',
        color: 'var(--color-primary)',
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget;
        btn.style.backgroundColor = 'var(--color-primary)';
        btn.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget;
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'var(--color-primary)';
      }}
    >
      Connect
    </button>
  );
}
