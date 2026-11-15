// New-notification alert: a short two-note chime + the count on the installed app's icon.
// shortcut: only works while Friendiary is open (tab or installed app); alerts with the app closed need Web Push (VAPID + backend sender).

let ctx: AudioContext | null = null;

/** Soft "ding-ding". Browsers block audio until the user has interacted with the page once; then it just plays. */
export function playChime(): void {
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + i * 0.14;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // No audio support or blocked — the bell badge still shows.
  }
}

/** Number on the home-screen / dock icon of the installed app (Chrome, Edge, Safari 16.4+). */
export function setAppBadge(count: number): void {
  const nav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  if (count > 0) nav.setAppBadge?.(count).catch(() => {});
  else nav.clearAppBadge?.().catch(() => {});
}
