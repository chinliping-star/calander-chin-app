import { useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { isIos, isMobile, isStandalone, promptInstall, useInstallState } from '../install.ts';

const DISMISS_KEY = 'friendiary:install-dismissed-at';
const HIDE_FOR_MS = 7 * 24 * 60 * 60 * 1000; // closed banner comes back after a week

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < HIDE_FOR_MS;
  } catch {
    return false;
  }
}

/** Mobile-only card: "Download as app". Android → one-tap install, iPhone → Share → Add to Home Screen steps. */
export function InstallAppBanner() {
  const { canPrompt, justInstalled } = useInstallState();
  const [hidden, setHidden] = useState(() => !isMobile() || isStandalone() || recentlyDismissed());
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [busy, setBusy] = useState(false);

  const ios = isIos();
  if (hidden || justInstalled || (!canPrompt && !ios)) return null;

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    setHidden(true);
  }

  async function install() {
    if (ios) { setShowIosSteps(s => !s); return; }
    setBusy(true);
    try { await promptInstall(); } finally { setBusy(false); }
  }

  return (
    <div
      role="region"
      aria-label="Install Friendiary app"
      className="fixed inset-x-3 top-3 z-[60] rounded-2xl p-3"
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 28px rgba(74,62,78,0.18)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <img src="/pwa-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-h)' }}>Friendiary app</p>
          <p className="text-xs leading-snug" style={{ color: 'var(--text)' }}>Open it from your home screen</p>
        </div>
        <button
          type="button"
          onClick={install}
          disabled={busy}
          aria-expanded={ios ? showIosSteps : undefined}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
        >
          <Download size={14} aria-hidden="true" />
          Download app
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="shrink-0 rounded-full p-1.5 transition-opacity hover:opacity-70 focus-visible:outline-2"
          style={{ color: 'var(--text)' }}
        >
          <X size={16} />
        </button>
      </div>

      {ios && showIosSteps && (
        <ol className="mt-3 flex flex-col gap-2 rounded-xl p-3 text-xs" style={{ background: 'var(--accent-bg)', color: 'var(--text-h)' }}>
          <li className="flex items-center gap-2">
            <span className="font-bold">1.</span> Tap the Share button
            <Share size={15} aria-label="Share icon" style={{ color: 'var(--color-primary)' }} />
            in the browser bar
          </li>
          <li className="flex items-center gap-2">
            <span className="font-bold">2.</span> Choose <b>Add to Home Screen</b>
            <SquarePlus size={15} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
          </li>
          <li className="flex items-center gap-2">
            <span className="font-bold">3.</span> Tap <b>Add</b> — Friendiary appears on your home screen
          </li>
        </ol>
      )}
    </div>
  );
}
