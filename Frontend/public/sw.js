// Minimal service worker — makes Friendiary installable as an app.
// No caching: every request goes to the network, so new deploys show up at once.
// Page loads that fail (phone offline) get a small "you're offline" page instead of the browser error.

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Friendiary</title>
<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
font-family:system-ui,sans-serif;background:#fff;color:#4a3e4e;text-align:center;padding:24px}
button{margin-top:16px;border:0;border-radius:999px;padding:10px 22px;background:#FF7FB1;color:#fff;font-weight:700;font-size:15px}</style>
</head><body><img src="/pwa-192.png" width="96" height="96" alt="">
<h1 style="font-size:20px;margin:12px 0 4px">You're offline</h1>
<p style="margin:0;font-size:14px">Check your internet connection and try again.</p>
<button onclick="location.reload()">Try again</button></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    ),
  );
});
