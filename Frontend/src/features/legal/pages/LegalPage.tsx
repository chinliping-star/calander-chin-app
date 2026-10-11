import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../../components/Logo.tsx';
import { PRIVACY_POLICY, TERMS, type LegalBlock } from '../content/policies.ts';

const DOCS = {
  privacy: { title: 'Privacy Policy', blocks: PRIVACY_POLICY, other: { to: '/terms', label: 'Terms & Conditions' } },
  terms:   { title: 'Terms & Conditions', blocks: TERMS, other: { to: '/privacy', label: 'Privacy Policy' } },
} as const;

/** Highlight unfilled [placeholders] so they are easy to spot before launch. */
function withPlaceholders(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\])/g).map((part, i) =>
    /^\[[^\]]+\]$/.test(part)
      ? <mark key={i} className="rounded px-1" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>{part}</mark>
      : part,
  );
}

function Block({ b }: { b: LegalBlock }) {
  switch (b.t) {
    case 'h2':
      return <h2 className="mt-8 mb-2 text-lg font-bold" style={{ color: 'var(--text-h)' }}>{b.text}</h2>;
    case 'h3':
      return <h3 className="mt-4 mb-1 text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>{b.text}</h3>;
    case 'ul':
      return (
        <ul className="my-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          {b.items.map((it, i) => <li key={i}>{withPlaceholders(it)}</li>)}
        </ul>
      );
    default:
      return <p className="my-2 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{withPlaceholders(b.text)}</p>;
  }
}

/** Public page for the Privacy Policy or Terms (no login needed). */
export function LegalPage({ doc }: { doc: keyof typeof DOCS }) {
  const { title, blocks, other } = DOCS[doc];

  useEffect(() => {
    document.title = `${title} · Friendiary`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: 'var(--color-tertiary)' }}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Logo to="/login" size={64} showText={false} />
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--text-h)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={13} /> Back to Friendiary
          </Link>
        </div>

        <article
          className="rounded-3xl px-6 py-8 sm:px-10"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(74,62,78,0.08)' }}
        >
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text-h)' }}>Friendiary {title}</h1>
          {blocks.map((b, i) => <Block key={i} b={b} />)}
        </article>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text)' }}>
          See also:{' '}
          <Link to={other.to} className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>{other.label}</Link>
        </p>
      </div>
    </div>
  );
}
