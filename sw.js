const CACHE = 'tam-v1'
const SHELL = [
  './',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)
  if (request.method !== 'GET') return
  // own files: network first so a deploy shows up on the next launch, cache when offline
  if (url.origin === location.origin) {
    e.respondWith(fetch(request)
      .then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()))
        return res
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then(r => r ?? caches.match('./'))))
    return
  }
  // versioned CDN files never change; live API and map tiles go straight to the network
  if (url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(request).then(r => r ?? fetch(request)))
  }
})
