import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { useCommunitiesApi } from '../api/communities.api';
import { CommunityCard } from '../components/CommunityCard';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import type { Community } from '../types';

export function CommunitiesPage() {
  const api = useCommunitiesApi();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities', searchQ],
    queryFn: () => searchQ.length >= 1 ? api.search(searchQ) : api.browse(),
    staleTime: 30_000,
  });

  const { data: mine = [] } = useQuery({
    queryKey: ['communities-mine'],
    queryFn: () => api.getMine(),
    staleTime: 60_000,
  });
  const myIds = new Set(mine.map((c: Community) => c._id));

  const join = useMutation({
    mutationFn: (id: string) => { setJoiningId(id); return api.join(id); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communities-mine'] });
      qc.invalidateQueries({ queryKey: ['communities'] });
      setJoiningId(null);
    },
    onError: () => setJoiningId(null),
  });

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQ(e.target.value);
  }, []);

  return (
    <AppShell>
    <div>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-h)' }}>Communities</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>Find your people</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
          >
            <Plus size={16} />
            New Community
          </button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-6"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <Search size={16} style={{ color: 'var(--text)' }} />
          <input
            value={searchQ}
            onChange={handleSearch}
            placeholder="Search communities by name, category…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-h)' }}
          />
        </div>

        {/* My communities */}
        {mine.length > 0 && !searchQ && (
          <section className="mb-8">
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>MY COMMUNITIES</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mine.map((c: Community) => (
                <CommunityCard
                  key={c._id}
                  community={c}
                  isMember
                />
              ))}
            </div>
          </section>
        )}

        {/* Browse */}
        <section>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>
            {searchQ ? `RESULTS` : 'DISCOVER'}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
              ))}
            </div>
          ) : communities.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text)' }}>
              {searchQ ? 'No communities match your search' : 'No communities yet — create the first one!'}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {communities.map((c: Community) => (
                <CommunityCard
                  key={c._id}
                  community={c}
                  isMember={myIds.has(c._id)}
                  onJoin={id => join.mutate(id)}
                  joining={joiningId === c._id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={slug => navigate(`/communities/${slug}`)}
        />
      )}
    </div>
    </AppShell>
  );
}
