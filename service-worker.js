// ===========================
// Service Worker for Offline Support
// ===========================

const CACHE_NAME = 'bayanforecast-v2';
const OFFLINE_CACHE_NAME = 'bayanforecast-offline-v2';
const API_CACHE_NAME = 'bayanforecast-api-v2';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/typhoon-tracker.html',
    '/styles.css',
    '/script.js',
    '/typhoon-map.js',
    '/openweathermap-map.js',
    '/offline-storage.js',
    '/manifest.json'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
    'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
];

// API endpoints to cache
const API_PATTERNS = [
    /api\.php\?action=weather/,
    /api\.php\?action=forecast/,
    /api\.php\?action=typhoon/,
    /api\.php\?action=alerts/,
    /api\.php\?action=config/
];

// ===========================
// Install Event - Cache Static Assets
// ===========================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS.filter(url => {
                    // Only cache local assets
                    return !url.startsWith('http');
                }));
            })
            .then(() => {
                console.log('[Service Worker] Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Cache install failed:', error);
            })
    );
});

// ===========================
// Activate Event - Clean Old Caches
// ===========================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== API_CACHE_NAME && 
                            cacheName !== OFFLINE_CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated');
                return self.clients.claim();
            })
    );
});

// ===========================
// Fetch Event - Network First with Cache Fallback
// ===========================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip Chrome extensions and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Handle API requests
    if (API_PATTERNS.some(pattern => pattern.test(url.pathname + url.search))) {
        event.respondWith(networkFirstWithCache(event.request, API_CACHE_NAME));
        return;
    }
    
    // Handle map tile requests (OpenStreetMap)
    if (url.hostname.includes('tile.openstreetmap.org') || 
        url.hostname.includes('tile.openweathermap.org')) {
        event.respondWith(cacheFirstWithNetwork(event.request, OFFLINE_CACHE_NAME, {
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for map tiles
        }));
        return;
    }
    
    // Handle static assets
    if (STATIC_ASSETS.some(asset => url.pathname.includes(asset)) ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.html')) {
        event.respondWith(cacheFirstWithNetwork(event.request, CACHE_NAME));
        return;
    }
    
    // Default: Network first for other requests
    event.respondWith(networkFirstWithCache(event.request, CACHE_NAME));
});

// ===========================
// Network First Strategy (for API calls)
// ===========================
async function networkFirstWithCache(request, cacheName) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', request.url);
        
        // Network failed, try cache
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // If it's an API request and we have no cache, return offline response
        if (API_PATTERNS.some(pattern => pattern.test(request.url))) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No internet connection and no cached data available',
                offline: true
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // For other requests, return error
        throw error;
    }
}

// ===========================
// Cache First Strategy (for static assets and map tiles)
// ===========================
async function cacheFirstWithNetwork(request, cacheName, options = {}) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Check if cached response is still valid
    if (cachedResponse) {
        if (options.maxAge) {
            const cacheDate = cachedResponse.headers.get('sw-cache-date');
            if (cacheDate) {
                const age = Date.now() - parseInt(cacheDate);
                if (age < options.maxAge) {
                    return cachedResponse;
                }
            } else {
                // No date header, assume it's valid
                return cachedResponse;
            }
        } else {
            return cachedResponse;
        }
    }
    
    // Not in cache or expired, try network
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Add cache date header
            const responseToCache = networkResponse.clone();
            const newHeaders = new Headers(responseToCache.headers);
            newHeaders.set('sw-cache-date', Date.now().toString());
            
            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: newHeaders
            });
            
            cache.put(request, modifiedResponse);
            return networkResponse;
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, return cached version if available
        if (cachedResponse) {
            console.log('[Service Worker] Network failed, using stale cache:', request.url);
            return cachedResponse;
        }
        
        throw error;
    }
}

// ===========================
// Message Handler for Cache Management
// ===========================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
    
    if (event.data && event.data.type === 'CACHE_API') {
        const { url, data } = event.data;
        event.waitUntil(
            caches.open(API_CACHE_NAME).then((cache) => {
                const response = new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' }
                });
                return cache.put(url, response);
            })
        );
    }
});

