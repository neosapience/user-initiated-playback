// Service Worker: fetch 요청을 가로채서 지연시킴

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ?delay=5000 파라미터가 있으면 해당 시간만큼 지연
  const delayParam = url.searchParams.get('delay');

  if (delayParam) {
    const delayMs = parseInt(delayParam, 10);

    // delay 파라미터 제거한 원본 URL
    url.searchParams.delete('delay');
    const originalUrl = url.toString();

    event.respondWith(
      new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const response = await fetch(originalUrl);
            resolve(response);
          } catch (err) {
            resolve(new Response('Fetch failed', { status: 500 }));
          }
        }, delayMs);
      })
    );
  }
});
