import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { X, Mail, Check } from 'lucide-react';
import { useSupportApi } from '../api/support.api.ts';

const SUPPORT_EMAIL = 'support@friendiary.app';

export function SupportEmailModal({ onClose }: { onClose: () => void }) {
  const supportApi = useSupportApi();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { mutate, isPending, isSuccess, isError } = useMutation({
    mutationFn: () => supportApi.contact({ name, email, subject, message }),
    onSuccess: () => setTimeout(onClose, 1200),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutate();
  }

  const field: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px',
    fontSize: 14, color: 'var(--text-h)', background: 'var(--bg)', width: '100%', outline: 'none',
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,10,20,0.5)' }} onClick={onClose} role="dialog" aria-modal="true">
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-3"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-tertiary)', color: 'var(--text-h)' }}>
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Mail size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-base font-bold" style={{ color: 'var(--text-h)' }}>Email Support</h3>
        </div>

        <input style={field} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
        <input style={field} type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input style={field} placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} required />
        <textarea style={{ ...field, resize: 'vertical', minHeight: 110 }} placeholder="How can we help?"
          value={message} onChange={e => setMessage(e.target.value)} required />

        <button type="submit" disabled={isPending || isSuccess}
          className="mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}>
          {isSuccess ? <><Check size={15} /> Sent!</> : isPending ? 'Sending…' : 'Send Message'}
        </button>
        {isError && (
          <p className="text-[11px] text-center" style={{ color: '#dc2626' }}>
            Could not send. Try again.
          </p>
        )}
        <p className="text-[11px] text-center" style={{ color: 'var(--text)' }}>
          Goes to {SUPPORT_EMAIL}
        </p>
      </form>
    </div>,
    document.body
  );
}
