// ============================================================
// Service Worker — 离线缓存 & 加载加速
// 策略：
//   核心文件（HTML/JS/CSS）: Network First，失败回退缓存
//   静态资源（图片/音频）: Stale-While-Revalidate
//   其他: Network First
// 支持页面发送消息触发「一键离线」全量缓存
// ============================================================

var CACHE_VERSION = 'v5';
var CACHE_NAME = 'word-cards-' + CACHE_VERSION;

// 核心文件列表（安装时预缓存）
var PRECACHE_URLS = [
  '/word-cards/',
  '/word-cards/index.html',
  '/word-cards/animal-cards.html',
  '/word-cards/animal-select.html',
  '/word-cards/animal-data.js',
  '/word-cards/image-interaction.js',
  '/word-cards/common.js',
  '/word-cards/common.css',
  '/word-cards/manifest.json'
];

// ---- 安装：预缓存核心文件 ----
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function(err) {
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

  // 只处理同域请求
  if (url.origin !== self.location.origin) return;

  var path = url.pathname;

  // 图片 & 音频 → Stale-While-Revalidate
  if (/\.(jpg|jpeg|png|webp|gif|svg|mp3|wav|ogg|m4a)(\?|$)/i.test(path)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // HTML / JS / CSS → Network First，失败回退缓存
  if (/\.(html|js|css|json)(\?|$)/i.test(path) || path === '/' || path.endsWith('/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 其他 → Network First
  event.respondWith(networkFirst(event.request));
});

// ---- 消息处理：接收页面指令 ----
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'DOWNLOAD_ALL') {
    var urls = event.data.urls;
    downloadAll(urls, event.ports[0]);
  }
});

// 全量下载指定 URL 列表到缓存，实时回报进度
function downloadAll(urls, replyPort) {
  var cachePromise = caches.open(CACHE_NAME);
  var total = urls.length;
  var done = 0;
  var failed = 0;

  var promises = urls.map(function(url) {
    return cachePromise.then(function(cache) {
      return cache.match(url).then(function(cached) {
        if (cached) {
          // 已有缓存，直接算完成
          done++;
          if (replyPort) {
            replyPort.postMessage({ done: done, total: total, failed: failed, url: url, cached: true });
          }
          return;
        }
        // 没有缓存，下载
        return fetch(url, { mode: 'no-cors' }).then(function(response) {
          if (response.ok || response.type === 'opaque') {
            return cache.put(url, response);
          }
          failed++;
        }).catch(function() {
          failed++;
        }).then(function() {
          done++;
          if (replyPort) {
            replyPort.postMessage({ done: done, total: total, failed: failed, url: url });
          }
        });
      });
    });
  });

  Promise.all(promises).then(function() {
    if (replyPort) {
      replyPort.postMessage({ done: total, total: total, failed: failed, complete: true });
    }
  });
}

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

// ---- Stale-While-Revalidate ----
function staleWhileRevalidate(request) {
  return caches.match(request).then(function(cached) {
    var fetchPromise = fetch(request).then(function(response) {
      return caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, response.clone());
        return response;
      });
    }).catch(function() {});
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
