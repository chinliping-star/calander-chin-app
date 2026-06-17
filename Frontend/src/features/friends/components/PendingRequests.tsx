import { X, Check, Undo2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useFriendsApi } from '../api/friends.api.ts';

function RequestCard({ request, onAccept, onReject }: {
  request: { _id: string; requester_id: { _id: string; display_name: string; username: string; avatar_url?: string } };
  onAccept: (requesterId: string) => void;
  onReject: (requesterId: string) => void;
}) {
  const r = request.requester_id;
  return (
    <div
      className="flex items-center gap-3.5 rounded-2xl p-4"
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(74,62,78,0.07)',
      }}
    >
      <Link to={`/${r.username}`} className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-full">
        <img
          src={r.avatar_url || `https://i.pravatar.cc/150?u=${r.username}`}
          alt={r.display_name}
          className="h-12 w-12 rounded-full object-cover hover:opacity-80 transition-opacity"
          width={48}
          height={48}
          loading="lazy"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/${r.username}`} className="hover:underline focus-visible:outline-none" style={{ textDecoration: 'none' }}>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{r.display_name}</p>
        </Link>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>@{r.username}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onReject(r._id)}
          aria-label={`Decline ${r.display_name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <X size={15} />
        </button>
        <button
          type="button"
          onClick={() => onAccept(r._id)}
          aria-label={`Accept ${r.display_name}`}
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
  const qc = useQueryClient();
  const friendsApi = useFriendsApi();

  const { data: requests = [] } = useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: () => friendsApi.getRequests(),
    staleTime: 30_000,
  });

  const { data: outgoing = [] } = useQuery({
    queryKey: ['friends', 'outgoing'],
    queryFn: () => friendsApi.getOutgoing(),
    staleTime: 30_000,
  });

  const accept = useMutation({
    mutationFn: (requesterId: string) => friendsApi.acceptRequest(requesterId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['friends'] }),
  });

  const reject = useMutation({
    mutationFn: (requesterId: string) => friendsApi.rejectRequest(requesterId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['friends', 'requests'] }),
  });

  const withdraw = useMutation({
    mutationFn: (recipientId: string) => friendsApi.withdrawRequest(recipientId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['friends', 'outgoing'] }),
  });

  if (requests.length === 0 && outgoing.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {requests.length > 0 && (
        <section aria-labelledby="pending-requests-heading">
          <div className="flex items-center gap-3 mb-4">
            <h2 id="pending-requests-heading" className="text-xl font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
              Pending Requests
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              {requests.length} New
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requests.map((req) => (
              <RequestCard key={req._id} request={req} onAccept={(id) => accept.mutate(id)} onReject={(id) => reject.mutate(id)} />
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section aria-labelledby="sent-requests-heading">
          <div className="flex items-center gap-3 mb-4">
            <h2 id="sent-requests-heading" className="text-xl font-bold" style={{ color: 'var(--text-h)', margin: 0 }}>
              Sent Requests
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--color-neutral)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {outgoing.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outgoing.map((req) => {
              const r = req.recipient_id as unknown as { _id: string; display_name: string; username: string; avatar_url?: string };
              return (
                <div key={req._id} className="flex items-center gap-3.5 rounded-2xl p-4" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(74,62,78,0.07)' }}>
                  <Link to={`/${r.username}`} className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-full">
                    <img src={r.avatar_url || `https://i.pravatar.cc/150?u=${r.username}`} alt={r.display_name} className="h-12 w-12 rounded-full object-cover hover:opacity-80 transition-opacity" width={48} height={48} loading="lazy" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/${r.username}`} className="hover:underline focus-visible:outline-none" style={{ textDecoration: 'none' }}>
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{r.display_name}</p>
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>@{r.username}</p>
                    <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--color-primary)' }}>Request sent · Pending</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => withdraw.mutate(r._id)}
                    disabled={withdraw.isPending}
                    aria-label={`Withdraw request to ${r.display_name}`}
                    title="Withdraw request"
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                    style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <Undo2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
