// BrainLens Service Worker for Offline Functionality
// Version 1.0.0

const CACHE_NAME = 'brainlens-v1.0.0';
const STATIC_CACHE_NAME = 'brainlens-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'brainlens-dynamic-v1.0.0';
const OFFLINE_PAGE = '/offline';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  // Core app shell files will be auto-discovered
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/topics',
  '/api/content',
  '/api/progress',
  '/api/bookmarks'
];

// Network-first resources (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/research/,
  /\/api\/chat/,
  /\/api\/streaming/,
  /\/api\/auth/
];

// Cache-first resources (serve from cache if available)
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:css|js)$/,
  /\/api\/topics\/static/
];

// Maximum cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 100;
const MAX_API_CACHE_SIZE = 50;

self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Create static cache
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        await staticCache.addAll(STATIC_ASSETS);
        
        // Create dynamic cache
        await caches.open(DYNAMIC_CACHE_NAME);
        
        console.log('[SW] Service worker installed successfully');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[SW] Installation failed:', error);
      }
    })()
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletionPromises = cacheNames
          .filter(name => 
            name.startsWith('brainlens-') && 
            ![STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME].includes(name)
          )
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          });
        
        await Promise.all(deletionPromises);
        
        // Take control of all clients
        await self.clients.claim();
        
        console.log('[SW] Service worker activated successfully');
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname === '/offline') {
    event.respondWith(handleOfflinePage(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle offline page requests
async function handleOfflinePage(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    let response = await cache.match(request);
    
    if (!response) {
      // Create a basic offline page if not cached
      response = new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>BrainLens - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              margin: 0; 
              padding: 2rem; 
              text-align: center;
              background: #f9fafb;
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            h1 { color: #374151; margin-bottom: 1rem; }
            p { color: #6b7280; line-height: 1.5; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 1rem;
            }
            button:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🧠</div>
            <h1>You're offline</h1>
            <p>BrainLens needs an internet connection to function properly. Your cached content is still available.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Error serving offline page:', error);
    return new Response('Offline');
  }
}

// Handle API requests with different caching strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Network-first for real-time APIs
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return networkFirstStrategy(request);
  }
  
  // Cache-first for static APIs
  if (CACHEABLE_APIS.some(pattern => url.pathname.includes(pattern))) {
    return cacheFirstStrategy(request);
  }
  
  // Default: network-only for API requests
  return networkOnlyStrategy(request);
}

// Handle static assets
async function handleStaticAsset(request) {
  // Cache-first strategy for static assets
  return cacheFirstStrategy(request);
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cached version or offline page
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page for navigation requests
    return handleOfflinePage(new Request('/offline'));
  }
}

// Caching strategies
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_API_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline indicator for failed API requests
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true,
      cached: false
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirstStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Silently fail background update
    });
    
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Content not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function networkOnlyStrategy(request) {
  return fetch(request);
}

// Utility functions
function isApiRequest(url) {
  return url.pathname.startsWith('/api');
}

function isStaticAsset(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-actions') {
    event.waitUntil(processOfflineActions());
  }
});

async function processOfflineActions() {
  try {
    // Get offline actions from IndexedDB (would need to implement)
    // This is a placeholder for offline action processing
    console.log('[SW] Processing offline actions...');
    
    // Example: sync bookmarks, progress updates, etc.
    // Implementation would depend on the specific offline actions needed
  } catch (error) {
    console.error('[SW] Error processing offline actions:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.data,
    actions: data.actions,
    tag: data.tag || 'brainlens-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const data = event.notification.data;
  const action = event.action;
  
  event.waitUntil(
    clients.matchAll().then(clientList => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(data?.url || '/') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(data?.url || '/');
      }
    })
  );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    console.log('[SW] Syncing content in background...');
    // Implement periodic content sync
    // This could update cached topics, progress, etc.
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(data?.cacheName).then(success => {
        event.ports[0].postMessage({ success });
      });
      break;
      
    case 'CACHE_CONTENT':
      cacheContent(data?.url, data?.content).then(success => {
        event.ports[0].postMessage({ success });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function getCacheStats() {
  try {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      stats[name] = keys.length;
    }
    
    return stats;
  } catch (error) {
    console.error('[SW] Error getting cache stats:', error);
    return {};
  }
}

async function clearCache(cacheName) {
  try {
    if (cacheName) {
      return await caches.delete(cacheName);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      const results = await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      return results.every(result => result);
    }
  } catch (error) {
    console.error('[SW] Error clearing cache:', error);
    return false;
  }
}

async function cacheContent(url, content) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(content, {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(url, response);
    return true;
  } catch (error) {
    console.error('[SW] Error caching content:', error);
    return false;
  }
}

console.log('[SW] Service worker script loaded');