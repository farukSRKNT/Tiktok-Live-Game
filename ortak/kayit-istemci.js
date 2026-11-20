// Sayfa tarafı olay kaydı: oyunun girdilerini (yorum, beğeni, hediye…), oyun olaylarını (G.emit),
// kişilerin katılma / rol değiştirme / ayrılmasını, durum geçişlerini ve JS hatalarını
// JSON olarak sunucuya (/api/log) yollar. Oyunun kendisine dokunmaz, yalnızca dinler.
//
// Kullanım (oyunun main.js'inde):
//   OyunKayit.bagla(G, {
//     uyeler: () => [...],             // sahnedeki kişiler
//     rol: (u) => 'halay',             // kişinin rolü
//     durum: () => ({ seviye: 1 }),    // izlenen durum alanları (değişince "gecis" kaydı)
//     sessiz: ['yukle'],               // bu fonksiyonlardan sonraki kişi değişimleri kaydedilmez (durum yükleme)
//     ozet: () => ({ begeni: 3 }),     // testlerin okuduğu ek bilgiler (değişimi kaydedilmez)
//     hazir: () => true,               // sayfa olay almaya hazır mı (testler bekler)
//   })
// Testler window.__oyun.durum() ile anlık durumu okur.
(function () {
  const qs = new URLSearchParams(location.search);
  const sayfa = qs.has('clean') ? 'sahne' : 'panel';
  const sid = Math.random().toString(36).slice(2, 8);
  const kuyruk = [];
  const ACIK = location.protocol !== 'file:';

  function yolla() {
    if (!ACIK || !kuyruk.length) return;
    const b = kuyruk.splice(0, 300);
    fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b), keepalive: true }).catch(() => {});
  }
  setInterval(yolla, 300);
  addEventListener('pagehide', yolla);

  function yaz(tur, veri) {
    kuyruk.push({ tur, sayfa, sid, ...veri });
    if (kuyruk.length > 3000) kuyruk.splice(0, 1000);
  }

  // JSON'a uygun sade kopya: kişiler {id, nick}, 3B nesneler / fonksiyonlar atlanır
  function sade(v, d = 0) {
    if (v == null) return v;
    if (typeof v === 'function') return undefined;
    if (typeof v !== 'object') return typeof v === 'number' && !Number.isFinite(v) ? null : v;
    if (d > 3 || v.isObject3D || v.isVector3 || v.isMaterial || (typeof Node !== 'undefined' && v instanceof Node)) return undefined;
    if (v instanceof Map || v instanceof Set) return undefined;
    if (Array.isArray(v)) return v.slice(0, 25).map((x) => sade(x, d + 1));
    if ('id' in v && 'nick' in v) return { id: v.id, nick: v.nick };
    const o = {};
    for (const k of Object.keys(v)) {
      if (k === 'ch' || k === 'look' || k.startsWith('_')) continue;
      const x = sade(v[k], d + 1);
      if (x !== undefined) o[k] = x;
    }
    return o;
  }
  const kisi = (u) => (u && u.id ? { id: u.id, nick: u.nick } : undefined);

  addEventListener('error', (e) => yaz('hata', { mesaj: String(e.message || e.error || 'hata'), dosya: e.filename, satir: e.lineno }));
  addEventListener('unhandledrejection', (e) => yaz('hata', { mesaj: String((e.reason && (e.reason.stack || e.reason.message)) || e.reason) }));

  // Oyun içi olaylardan çok sık gelen ve bilgi taşımayanlar (skor tablosu yenilemesi gibi)
  const SESSIZ = new Set(['board', 'walkers', 'yorumOdak', 'feed']);

  function bagla(G, o = {}) {
    const uyeler = o.uyeler || (() => []);
    const rolu = o.rol || (() => null);
    let onceki = new Map(), sessiz = 0;

    const anlik = () => {
      const m = new Map();
      for (const u of uyeler()) if (u && u.id != null) m.set(u.id, { nick: u.nick, rol: rolu(u) ?? null });
      return m;
    };
    function fark() {
      const simdi = anlik();
      if (!sessiz) {
        for (const [id, x] of simdi) {
          const e = onceki.get(id);
          if (!e) yaz('katildi', { kullanici: { id, nick: x.nick }, rol: x.rol });
          else if (e.rol !== x.rol) yaz('rol', { kullanici: { id, nick: x.nick }, eski: e.rol, yeni: x.rol });
        }
        for (const [id, e] of onceki) if (!simdi.has(id)) yaz('ayrildi', { kullanici: { id, nick: e.nick }, rol: e.rol });
      }
      onceki = simdi;
    }

    let durumOnce = null;
    function gecis() {
      if (!o.durum) return;
      const d = o.durum();
      if (durumOnce) for (const k of Object.keys(d)) if (d[k] !== durumOnce[k]) yaz('gecis', { alan: k, eski: durumOnce[k], yeni: d[k] });
      durumOnce = d;
    }

    // girdiler (TikTok / test / demo olayları)
    const handle = G.handle;
    G.handle = function (ev) {
      if (ev && ev.type && ev.type !== 'viewers') {
        const v = { olay: ev.type, kullanici: kisi(ev.user) };
        if (ev.text != null) v.metin = String(ev.text).slice(0, 200);
        if (ev.count != null) v.sayi = ev.count;
        if (ev.gift) v.hediye = sade(ev.gift);
        yaz('girdi', v);
      }
      const r = handle.apply(this, arguments);
      fark();
      return r;
    };
    // oyun olayları (duyuru, afiş, kural, rol, durak, varış…)
    const emit = G.emit;
    G.emit = function (ev, d) {
      if (!SESSIZ.has(ev)) yaz('oyun', { olay: ev, veri: sade(d) });
      return emit.apply(this, arguments);
    };
    if (typeof G.reset === 'function') {
      const reset = G.reset;
      G.reset = function () { const r = reset.apply(this, arguments); yaz('sifirla', {}); onceki = anlik(); return r; };
    }
    for (const ad of o.sessiz || []) {
      const f = G[ad];
      if (typeof f !== 'function') continue;
      G[ad] = function () {
        sessiz++;
        try { return f.apply(this, arguments); } finally { sessiz--; const n = onceki.size; onceki = anlik(); if (ad === 'yukle' && onceki.size) yaz('yuklendi', { kisi: onceki.size, once: n }); }
      };
    }

    setInterval(() => { fark(); gecis(); }, 1000); // olay dışı değişimler (sessiz kalan çıkar, hız seviyesi…)
    onceki = anlik(); gecis();
    yaz('acildi', { url: location.pathname + location.search });

    window.__oyun = {
      G,
      hazir: () => (o.hazir ? !!o.hazir() : true),
      durum: () => ({ ...(o.durum ? o.durum() : {}), ...(o.ozet ? o.ozet() : {}), uyeler: [...anlik()].map(([id, x]) => ({ id, ...x })) }),
      yolla,
    };
  }

  window.OyunKayit = { bagla, yaz, sade };
})();
