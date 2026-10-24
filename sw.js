/* Sổ Pick – lưu sẵn trang trên máy để mở nhanh. Dữ liệu (Apps Script) luôn lấy mới, không lưu ở đây. */
const C = 'sopick-v5';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png', './icon.svg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/script\.google(usercontent)?\.com$/.test(u.hostname)) return; // dữ liệu: luôn đi mạng
  // Trang chính: lấy bản mới trên mạng trước (tối đa 2,5 giây); mạng chậm/mất thì mở bản đã lưu → luôn thấy bản cập nhật
  if (r.mode === 'navigate') {
    e.respondWith(caches.open(C).then(async c => {
      const hit = await c.match(r, { ignoreSearch: true });
      const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; });
      if (!hit) return net;
      return Promise.race([net.catch(() => hit), new Promise(ok => setTimeout(() => ok(hit), 2500))]);
    }));
    return;
  }
  // Ảnh, phông chữ: dùng bản đã lưu, đồng thời tải bản mới cho lần sau
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(r, { ignoreSearch: u.origin === location.origin });
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
