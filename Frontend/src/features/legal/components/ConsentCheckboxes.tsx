import { Link } from 'react-router-dom';

interface Props {
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  marketing: boolean;
  onMarketingChange: (v: boolean) => void;
  /** Show the red hint when the user tried to continue without agreeing. */
  showError?: boolean;
}

/**
 * Sign-up agreement. The first box is required; the promo box is optional.
 * Both start unchecked — never pre-tick consent.
 */
export function ConsentCheckboxes({ agreed, onAgreedChange, marketing, onMarketingChange, showError }: Props) {
  const boxClass = 'mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--color-primary)] cursor-pointer focus-visible:outline-none focus-visible:ring-2';
  return (
    <div className="flex flex-col gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text)', margin: 0 }}>
        Friendiary lets you share your profile, Memories, calendar and Message Wall with accepted friends.
        Private chats are only for the people in the chat. Please be thoughtful about what you share.
      </p>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer" style={{ color: 'var(--text-h)' }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => onAgreedChange(e.target.checked)}
          required
          aria-invalid={showError && !agreed ? true : undefined}
          aria-describedby={showError && !agreed ? 'consent-error' : undefined}
          className={boxClass}
        />
        <span>
          I confirm that I am at least 13 years old and agree to Friendiary's{' '}
          <Link to="/terms" target="_blank" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Terms &amp; Conditions</Link>.
          {' '}I have read the{' '}
          <Link to="/privacy" target="_blank" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>.
        </span>
      </label>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer" style={{ color: 'var(--text-h)' }}>
        <input
          type="checkbox"
          checked={marketing}
          onChange={e => onMarketingChange(e.target.checked)}
          className={boxClass}
        />
        <span>
          <span style={{ color: 'var(--text)' }}>(Optional)</span> I would like to get occasional Friendiary news and updates.
          I can unsubscribe at any time.
        </span>
      </label>

      {showError && !agreed && (
        <p id="consent-error" role="alert" className="text-[11px] font-semibold" style={{ color: '#e53e3e', margin: 0 }}>
          Please tick the first box to continue.
        </p>
      )}
    </div>
  );
}
