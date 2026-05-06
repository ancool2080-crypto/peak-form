// PEAK FORM Service Worker
// キャッシュ名にタイムスタンプを埋め込み → デプロイのたびに自動更新
const CACHE = 'peak-form-20260506';

const ASSETS = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&family=Bebas+Neue&display=swap'
];

// インストール時: 新しいキャッシュを作成
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(url => c.add(url).catch(() => {})))
    )
  );
  // 古いSWを待たずに即座に有効化
  self.skipWaiting();
});

// アクティベート時: 古いキャッシュを全削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('PEAK FORM SW: 古いキャッシュ削除', k);
          return caches.delete(k);
        })
      )
    )
  );
  // 開いているページを即座に新SWで制御
  self.clients.claim();
});

// フェッチ: Network First（index.htmlは常に最新を取得）
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  const url = new URL(e.request.url);

  // index.html は常にネットワーク優先（オフライン時のみキャッシュ）
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // その他（Chart.js・フォント等）はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
