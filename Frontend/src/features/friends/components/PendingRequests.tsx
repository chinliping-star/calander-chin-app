import { X, Check } from 'lucide-react';
import { useState } from 'react';
import type { PendingRequest } from '../types.ts';

const INITIAL_REQUESTS: PendingRequest[] = [
  {
    id: '1',
    displayName: 'Liam Carter',
    username: 'liam.carter',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    mutualCount: 2,
  },
  {
    id: '2',
    displayName: 'Zoe Chen',
    username: 'zoe.chen',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    mutualTag: 'Friday Brunch',
  },
];

function RequestCard({ request, onAccept, onReject }: {
  request: PendingRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3.5 rounded-2xl p-4"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(74,62,78,0.07)',
      }}
    >
      <img
        src={request.avatarUrl}
        alt={request.displayName}
        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
        width={48}
        height={48}
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>
          {request.displayName}
        </p>
        {request.mutualCount !== undefined && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>
            {request.mutualCount} mutual friends
          </p>
        )}
        {request.mutualTag && (
          <span
            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
          >
            {request.mutualTag}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onReject(request.id)}
          aria-label={`Decline ${request.displayName}`}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{
            backgroundColor: 'var(--color-neutral)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <X size={15} />
        </button>
        <button
          type="button"
          onClick={() => onAccept(request.id)}
          aria-label={`Accept ${request.displayName}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Check size={15} />
        </button>
      </div>
    </div>
  );
}

export function PendingRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>(INITIAL_REQUESTS);

  if (requests.length === 0) return null;

  return (
    <section aria-labelledby="pending-requests-heading">
      <div className="flex items-center gap-3 mb-4">
        <h2
          id="pending-requests-heading"
          className="text-xl font-bold"
          style={{ color: 'var(--text-h)', margin: 0 }}
        >
          Pending Requests
        </h2>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
          aria-label={`${requests.length} new requests`}
        >
          {requests.length} New
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onAccept={(id) => setRequests((p) => p.filter((r) => r.id !== id))}
            onReject={(id) => setRequests((p) => p.filter((r) => r.id !== id))}
          />
        ))}
      </div>
    </section>
  );
}
