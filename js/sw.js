// sw.js — Service Worker для NETSNAKE 10
// Меняй CACHE_VERSION при каждом обновлении файлов игры.
const CACHE_VERSION = 'v2.2.0';
const CACHE_NAME = `netsnake-${CACHE_VERSION}`;

// Файлы, нужные для работы игры (обязательный кэш)
const PRECACHE_URLS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './css/style.css',
    './js/main.js',
    './js/game.js',
    './js/utils.js',
    './js/i18n.js',
    './js/renderer.js',
    './js/menuDrawer.js',
    './js/intro.js',
    './js/collision.js',
    './js/foodLogic.js',
    './js/aiLogic.js',
    './js/ai.js',
    './js/aiOpponent.js',
    './js/gameStateHandler.js',
    './js/gameMechanics.js',
    './js/aboutLogic.js',
    './js/screenEffects.js',
    './js/touchControls.js',
    './js/leaderboardService.js',
    './js/obstacleManager.js',
    './js/nameInputManager.js',
    './js/animationController.js',
    './js/specialModes.js',
    './js/particleSystem.js',
    './js/achievements.js',
    './js/tasks.js',
    './js/inputs.js',
    './js/firebase-config.js',
    // === МАГАЗИН ===
    './js/currency.js',
    './js/shop.js',
    './js/shopDrawer.js',
    // === ИКОНКИ ===
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png'
];

// === Установка: кэшируем всё нужное ===
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Предзагрузка файлов...');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.error('[SW] Ошибка предзагрузки:', err);
            })
    );
});

// === Активация: удаляем старые кэши ===
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('[SW] Удаляем старый кэш:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// === Перехват запросов ===
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Пропускаем не-GET запросы
    if (request.method !== 'GET') return;

    // Firebase и внешние API — только сеть, без кэша
    if (url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('zvukogram')) {
        return;
    }

    // Навигационные запросы — сеть, при ошибке оффлайн-страница
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match('./offline.html'))
        );
        return;
    }

    // Остальные файлы — Cache First
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
                return response;
            }).catch(() => {
                return caches.match('./offline.html');
            });
        })
    );
});

// === Сообщения от главного потока ===
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
