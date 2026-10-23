// Service Worker der Sammlung „Akten & Action“ (MZ, 22.10.2026): macht die Sammlung auf Android als App installierbar
// und hält die zuletzt geladenen Dateien für den Fall ohne Netz bereit.
// Strategie „zuerst Netz“: jede Anfrage geht ans Netz (neue Veröffentlichungen kommen sofort an); nur wenn das Netz fehlt,
// antwortet die Kopie aus dem Zwischenspeicher. Nur eigene Dateien, keine fremden Server, kein Tracking.
// Bei Änderungen an dieser Datei VERSION erhöhen – alte Zwischenspeicher dieser Sammlung werden dann gelöscht.
const PREFIX = 'akten-action-';
const VERSION = PREFIX + 'v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(namen => Promise.all(namen.filter(n => n.startsWith(PREFIX) && n !== VERSION).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  e.respondWith(fetch(anfrage).then(antwort => {
    // nur vollständige eigene Antworten merken (keine Teilantworten von Musik/Klängen, keine Fehlerseiten)
    if (antwort.status === 200 && antwort.type === 'basic' && !anfrage.headers.has('range')) {
      const kopie = antwort.clone();
      e.waitUntil(caches.open(VERSION).then(c => c.put(anfrage, kopie)).catch(() => {}));
    }
    return antwort;
  }).catch(() => caches.open(VERSION).then(c => c.match(anfrage)).then(treffer => treffer || Response.error())));
});
