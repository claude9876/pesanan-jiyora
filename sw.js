// Import Workbox dari Google CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox berhasil dimuat 🎉`);

  // Strategi CacheFirst untuk file gambar (seperti icon.png)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Hari
        })
      ]
    })
  );

  // Strategi StaleWhileRevalidate untuk HTML, CSS, dan JS
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'document' || 
                   request.destination === 'script' || 
                   request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );
  
} else {
  console.log(`Workbox gagal dimuat 😬`);
}
