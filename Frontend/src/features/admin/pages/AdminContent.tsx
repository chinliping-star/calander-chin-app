import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { useAdminApi } from '../api/admin.api.ts';

type Tab = 'posts' | 'communities' | 'meetups';
const TABS: { id: Tab; label: string }[] = [
  { id: 'posts',       label: 'Posts' },
  { id: 'communities', label: 'Communities' },
  { id: 'meetups',     label: 'Meetups' },
];

function authorName(a?: { username: string; display_name: string }) {
  return a ? (a.display_name || `@${a.username}`) : 'Unknown';
}

export function AdminContent() {
  const api = useAdminApi();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('posts');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', tab, { search, page }],
    queryFn: () => {
      if (tab === 'posts')       return api.listPosts({ search, page });
      if (tab === 'communities') return api.listCommunities({ search, page });
      return api.listMeetups({ search, page });
    },
    staleTime: 15_000,
  });

  const del = useMutation({
    mutationFn: (id: string) => {
      if (tab === 'posts')       return api.deletePost(id);
      if (tab === 'communities') return api.deleteCommunity(id);
      return api.deleteMeetup(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', tab] }),
  });

  function remove(id: string) {
    if (confirm('Delete this item permanently?')) del.mutate(id);
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Content moderation</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1); setSearch(''); }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={tab === t.id
                ? { background: 'var(--color-primary)', color: '#ffffff' }
                : { color: 'var(--text)' }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[200px]" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--text)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={`Search ${tab}`}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-h)' }}
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : !data || data.items.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--text)' }}>Nothing here</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {data.items.map((item: Record<string, any>) => (
              <li key={item._id} className="flex items-center gap-4 px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  {tab === 'posts' && (
                    <>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{item.title || item.content?.slice(0, 60)}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text)' }}>by {authorName(item.author_id)} · {item.privacy} · {item.created_at?.slice(0, 10)}</p>
                    </>
                  )}
                  {tab === 'communities' && (
                    <>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{item.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text)' }}>/{item.slug} · {item.member_count} members · owner {authorName(item.owner_id)}</p>
                    </>
                  )}
                  {tab === 'meetups' && (
                    <>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-h)' }}>{item.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text)' }}>{item.date} · {item.status} · by {authorName(item.proposer_id)}</p>
                    </>
                  )}
                </div>
                <button onClick={() => remove(item._id)} title="Delete" className="rounded-lg p-2 shrink-0" style={{ color: '#dc2626', background: 'rgba(239,68,68,0.08)' }}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--text)' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg px-3 py-1.5 disabled:opacity-40" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>Prev</button>
          <span>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="rounded-lg px-3 py-1.5 disabled:opacity-40" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>Next</button>
        </div>
      )}
    </div>
  );
}
