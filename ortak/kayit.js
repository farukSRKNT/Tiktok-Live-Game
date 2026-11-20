// Olay kaydı (log) — üç oyunun sunucusu da bunu kullanır.
// Oyunda olan her şey tek satırlık JSON olarak <oyun>/loglar/YYYY-MM-DD.jsonl dosyasına yazılır
// ve /api/log adresinden okunur (testler ve hata ayıklama için).
//
// Kayıt biçimi: { seq, t, oyun, kaynak, tur, ... }
//   kaynak: tiktok | test | sunucu | sayfa
//   tur:    basladi | baglanti | tiktok | enjekte | sse | sifirla        (sunucu)
//           acildi | girdi | oyun | katildi | rol | ayrildi | gecis | hata | yuklendi   (sayfa: kayit-istemci.js)
//
// GET  /api/log?since=<seq>&tur=<tur,tur>&olay=<olay>&kaynak=<kaynak>&limit=<n>  → { son, kayitlar: [...] }
// POST /api/log  [ {tur, ...}, ... ]   (sayfanın yolladığı kayıtlar)
// GET  /ortak/kayit-istemci.js         (sayfaya eklenen istemci)
const fs = require('fs');
const path = require('path');

const ISTEMCI = path.join(__dirname, 'kayit-istemci.js');
const gunAdi = (d = new Date()) => d.toLocaleDateString('sv'); // YYYY-MM-DD (yerel saat)

function createKayit({ oyun, dir, tampon = 5000 }) {
  let seq = 0, akis = null, akisGun = '';
  const son = []; // bellekteki son kayıtlar
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  // 14 günden eski log dosyaları silinir (disk dolmasın)
  try {
    const sinir = Date.now() - 14 * 864e5;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (/^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f) && fs.statSync(fp).mtimeMs < sinir) fs.unlinkSync(fp);
    }
  } catch {}

  function dosyaya(satir) {
    const gun = gunAdi();
    if (gun !== akisGun) {
      if (akis) akis.end();
      akisGun = gun;
      akis = fs.createWriteStream(path.join(dir, gun + '.jsonl'), { flags: 'a' });
      akis.on('error', () => { akis = null; });
    }
    if (akis) akis.write(satir + '\n');
  }

  function yaz(k) {
    const e = { seq: ++seq, t: new Date().toISOString(), oyun, kaynak: 'sunucu', ...k };
    son.push(e);
    if (son.length > tampon) son.splice(0, son.length - tampon);
    try { dosyaya(JSON.stringify(e)); } catch {}
    return e;
  }

  function sorgu(q = {}) {
    const since = Number(q.since) || 0;
    const set = (v) => (v ? new Set(String(v).split(',')) : null);
    const tur = set(q.tur), olay = set(q.olay), kaynak = set(q.kaynak);
    const limit = Math.min(tampon, Number(q.limit) || tampon);
    const r = son.filter((e) => e.seq > since && (!tur || tur.has(e.tur)) && (!olay || olay.has(e.olay)) && (!kaynak || kaynak.has(e.kaynak)));
    return { son: seq, kayitlar: r.slice(-limit) };
  }

  const readJson = (req) => new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 2e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || 'null')); } catch { resolve(null); } });
  });

  // HTTP isteğini karşılarsa true döner
  async function istek(req, res, p) {
    if (p === '/api/log') {
      if (req.method === 'POST') {
        const b = await readJson(req);
        for (const k of Array.isArray(b) ? b.slice(0, 500) : []) if (k && typeof k.tur === 'string') yaz({ ...k, kaynak: 'sayfa' });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end('{"ok":true}');
        return true;
      }
      const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify(sorgu(q)));
      return true;
    }
    if (p === '/ortak/kayit-istemci.js') {
      fs.readFile(ISTEMCI, (err, buf) => {
        if (err) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(buf);
      });
      return true;
    }
    return false;
  }

  return { yaz, sorgu, istek, dir };
}

module.exports = { createKayit };
