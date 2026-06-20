// ============================================================
// Service Worker — 离线缓存 & 加载加速
// 策略：
//   核心文件（HTML/JS/CSS）: Network First，失败回退缓存
//   静态资源（图片/音频）: Cache First
//   其他: Network First
// ============================================================

var CACHE_VERSION = 'v2';
var CACHE_NAME = 'word-cards-' + CACHE_VERSION;

// 核心文件列表（安装时预缓存）
var PRECACHE_URLS = [
  '/word-cards/',
  '/word-cards/index.html',
  '/word-cards/animal-cards.html',
  '/word-cards/animal-select.html',
  '/word-cards/animal-data.js',
  '/word-cards/image-interaction.js',
  '/word-cards/manifest.json'
];

// ---- 安装：预缓存核心文件 ----
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function(err) {
        // 某个文件下载失败不阻塞安装
        console.warn('SW precache partial fail:', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ---- 激活：清理旧缓存 ----
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ---- 请求拦截 ----
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  var path = url.pathname;

  // 只处理同域请求
  if (url.origin !== self.location.origin) return;

  // 策略1: 图片 & 音频 → Cache First（变体：Stale-While-Revalidate）
  if (/\.(jpg|jpeg|png|webp|gif|svg|mp3|wav|ogg|m4a)(\?|$)/i.test(path)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // 策略2: HTML / JS / CSS → Network First，失败回退缓存
  if (/\.(html|js|css|json)(\?|$)/i.test(path) || path === '/' || path.endsWith('/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 策略3: 其他 → Network First
  event.respondWith(networkFirst(event.request));
});

// ---- Cache First 辅助 ----
function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      return caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, response.clone());
        return response;
      });
    });
  });
}

// ---- Stale-While-Revalidate（立即返回缓存，后台更新） ----
function staleWhileRevalidate(request) {
  return caches.match(request).then(function(cached) {
    var fetchPromise = fetch(request).then(function(response) {
      return caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, response.clone());
        return response;
      });
    }).catch(function() {
      // 网络失败，忽略（有缓存就用缓存）
    });
    return cached || fetchPromise;
  });
}

// ---- Network First 辅助 ----
function networkFirst(request) {
  return fetch(request).then(function(response) {
    return caches.open(CACHE_NAME).then(function(cache) {
      cache.put(request, response.clone());
      return response;
    });
  }).catch(function() {
    return caches.match(request);
  });
}
