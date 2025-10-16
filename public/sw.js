const CACHE_NAME = 'ai-academy-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const API_CACHE = 'api-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with cache strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE)
              .then(cache => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - Cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/icons/'))) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request);
        })
    );
    return;
  }

  // Other requests - Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cache, return offline page or basic response
            if (request.headers.get('accept')?.includes('text/html')) {
              return new Response(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>AI-First Academy - Offline</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        text-align: center;
                        padding: 50px 20px;
                        color: #374151;
                      }
                      .offline-container {
                        max-width: 400px;
                        margin: 0 auto;
                      }
                      h1 {
                        color: #6366f1;
                        margin-bottom: 20px;
                      }
                      .icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                      }
                      button {
                        background: #6366f1;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-top: 20px;
                      }
                      button:hover {
                        background: #4f46e5;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="offline-container">
                      <div class="icon">📚</div>
                      <h1>You're Offline</h1>
                      <p>It looks like you've lost your internet connection. Some content may not be available right now.</p>
                      <button onclick="window.location.reload()">Try Again</button>
                    </div>
                  </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            return new Response('Network error', { status: 408 });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-96x96.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('AI-First Academy', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  // Handle any queued offline actions
  try {
    // Example: sync learning progress
    const cache = await caches.open(DYNAMIC_CACHE);
    // Process any pending data...
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message handler for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});