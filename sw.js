/* Sổ Pick – lưu sẵn trang trên máy để mở tức thì. Dữ liệu (Apps Script) luôn lấy mới, không lưu ở đây. */
const C = 'sopick-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png', './icon.svg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/script\.google(usercontent)?\.com$/.test(u.hostname)) return; // dữ liệu: luôn đi mạng
  // Trang & phông chữ: hiện bản đã lưu ngay, đồng thời tải bản mới cho lần mở sau
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(r, { ignoreSearch: u.origin === location.origin });
    const net = fetch(r).then(async res => {
      if (res && (res.ok || res.type === 'opaque')) {
        // trang có bản mới → báo app hiện nút "Cập nhật"
        if (hit && r.mode === 'navigate' && res.ok) { const [a, b] = await Promise.all([hit.clone().text(), res.clone().text()]);
          if (a !== b) self.clients.matchAll().then(cs => cs.forEach(cl => cl.postMessage('sopick-update'))); }
        c.put(r, res.clone());
      }
      return res; }).catch(() => hit);
    return hit || net;
  }));
});
