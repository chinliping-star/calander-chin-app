import { useState } from 'react';
import { Trash2, Pencil, X, Check, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { PostPrivacyBadge } from './PostPrivacyBadge.tsx';
import { ReportModal } from '../../reports/components/ReportModal.tsx';
import type { Post } from '../types';

interface Props {
  post: Post;
  isOwn: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string, privacy: Post['privacy']) => void;
}

export function PostCard({ post, isOwn, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editPrivacy, setEditPrivacy] = useState(post.privacy);
  const [reportOpen, setReportOpen] = useState(false);

  function commitEdit() {
    onUpdate(post._id, editContent, editPrivacy);
    setEditing(false);
  }

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Author row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Link to={`/${post.author_id.username}`}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
              >
                {post.author_id.avatar_url
                  ? <img src={post.author_id.avatar_url} alt="" className="w-full h-full object-cover" />
                  : post.author_id.display_name.charAt(0).toUpperCase()}
              </div>
            </Link>
            <div>
              <Link
                to={`/${post.author_id.username}`}
                className="text-sm font-semibold hover:underline"
                style={{ color: 'var(--text-h)', textDecoration: 'none' }}
              >
                {post.author_id.display_name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <PostPrivacyBadge privacy={post.privacy} />
              </div>
            </div>
          </div>

          {isOwn && !editing && (
            <div className="flex gap-1">
              <button
                onClick={() => { setEditing(true); setEditContent(post.content); setEditPrivacy(post.privacy); }}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--text)' }}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(post._id)}
                className="p-1.5 rounded-lg"
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
          {!isOwn && (
            <button
              onClick={() => setReportOpen(true)}
              title="Report post"
              className="p-1.5 rounded-lg"
              style={{ color: 'var(--text)' }}
            >
              <Flag size={14} />
            </button>
          )}
        </div>

        {reportOpen && (
          <ReportModal targetType="post" targetId={post._id} onClose={() => setReportOpen(false)} />
        )}

        {/* Title */}
        {post.title && !editing && (
          <h3 className="font-bold" style={{ color: 'var(--text-h)' }}>{post.title}</h3>
        )}

        {/* Image */}
        {post.image_url && !editing && (
          <img
            src={post.image_url}
            alt=""
            loading="lazy"
            className="w-full rounded-xl object-contain"
            style={{ maxHeight: '24rem', background: 'var(--color-tertiary)' }}
          />
        )}

        {/* Content */}
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--color-tertiary)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            />
            {/* Privacy / category selector */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Post visibility">
              {([
                { value: 'public',  icon: '🌐', label: 'Public' },
                { value: 'friends', icon: '👥', label: 'Friends Only' },
                { value: 'private', icon: '🔒', label: 'Private' },
              ] as const).map(({ value, icon, label }) => {
                const active = editPrivacy === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEditPrivacy(value)}
                    aria-pressed={active}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      borderColor: active ? 'var(--color-primary)' : 'var(--border)',
                      backgroundColor: active ? 'var(--accent-bg)' : 'var(--color-tertiary)',
                      color: active ? 'var(--color-primary)' : 'var(--text)',
                    }}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--text)' }}
              >
                <X size={16} />
              </button>
              <button
                onClick={commitEdit}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--color-primary)' }}
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-h)' }}>
            {post.content}
          </p>
        )}
      </div>
    </article>
  );
}
