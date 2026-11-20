// Uçtan uca test yardımcıları: oyun sunucusunu YAN PORTTA, geçici klasörlerle açar (canlı oyuna, durum.json'a,
// loglar/'a dokunmaz; TikTok'a bağlanmaz), sayfayı başsız tarayıcıda açar, TikTok olaylarını /api/test ile
// gönderir ve oyunun JSON loglarından (/api/log) ya da sayfadaki anlık durumdan (window.__oyun) kontrol eder.
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright-core');

const KOK = path.join(__dirname, '..');
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

const bosPort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

// Tarayıcı: CHROME_YOLU > bulutun hazır Chromium'u > Windows/Mac'te kurulu Chrome > Playwright Chromium
function tarayiciAc() {
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
  const headless = process.env.GORUNUR !== '1';
  if (process.env.CHROME_YOLU) return chromium.launch({ executablePath: process.env.CHROME_YOLU, headless, args });
  if (fs.existsSync('/opt/pw-browsers/chromium')) return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless, args });
  if (process.platform === 'win32' || process.platform === 'darwin') return chromium.launch({ channel: 'chrome', headless, args });
  return chromium.launch({ headless, args });
}

async function sunucuAc(oyun) {
  const port = await bosPort();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `${oyun}-test-`));
  const env = { ...process.env, PORT: String(port), LOG_DIR: path.join(tmp, 'loglar'), VERI_DIR: tmp, TIKTOK_KAPALI: '1' };
  const cikti = [];
  const proc = spawn(process.execPath, ['server.js'], { cwd: path.join(KOK, oyun), env });
  proc.stdout.on('data', (d) => cikti.push(String(d)));
  proc.stderr.on('data', (d) => cikti.push(String(d)));
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url + '/api/status')).ok) return { port, url, tmp, proc, cikti }; } catch {}
    if (proc.exitCode != null) break;
    await bekle(100);
  }
  proc.kill();
  throw new Error(`${oyun} sunucusu açılmadı:\n${cikti.join('')}`);
}

const LOG_OZET = (k) => JSON.stringify(k).slice(0, 240);

// Bir oyunu aç: sunucu + sayfa. sayfa: URL'nin sorgu kısmı (ör. '?clean&demo=0')
async function oyunAc(oyun, { sayfa = '?clean&demo=0', tarayici } = {}) {
  const srv = await sunucuAc(oyun);
  const kendiTarayicim = !tarayici;
  const browser = tarayici || await tarayiciAc();
  const sayfaHatalari = [];

  const O = {
    oyun, url: srv.url, tmp: srv.tmp, browser, sayfaHatalari,
    page: null,

    async sayfaAc(q = sayfa) {
      const since = await O.sonSeq();
      const page = await browser.newPage({ viewport: { width: 608, height: 1080 } });
      page.on('pageerror', (e) => sayfaHatalari.push(String(e && e.message)));
      await page.goto(srv.url + '/' + q);
      await page.waitForFunction(() => window.__oyun && window.__oyun.hazir(), null, { timeout: 45000 });
      // SSE bağlantısı açılmadan gönderilen olay kaybolur: sunucu "sse" kaydını görene kadar bekle
      await O.bekle({ since, tur: 'sse' }, (k) => k.acik >= 1, 15000);
      if (!O.page) O.page = page;
      return page;
    },

    // TikTok'tan gelmiş gibi olay gönder (oyunun olay formatı)
    async olay(ev) {
      const r = await fetch(srv.url + '/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ev) });
      if (!r.ok) throw new Error('olay gönderilemedi: ' + r.status);
    },
    kisi: (id, nick) => ({ id: 'test_' + id, nick: nick || id }),
    yorum: (id, text, nick) => O.olay({ type: 'chat', user: O.kisi(id, nick), text }),
    begeni: (id, count = 1) => O.olay({ type: 'like', user: O.kisi(id), count }),
    hediye: (id, gift) => O.olay({ type: 'gift', user: O.kisi(id), gift: { count: 1, ...gift } }),
    giris: (id) => O.olay({ type: 'member', user: O.kisi(id) }),

    async loglar(q = {}) {
      const r = await fetch(srv.url + '/api/log?' + new URLSearchParams(q));
      return (await r.json()).kayitlar;
    },
    // Sorguya uyan ve pred'i sağlayan ilk log kaydını bekle (since: bu seq'ten sonrakiler)
    async bekle(q, pred = () => true, ms = 15000) {
      const son = Date.now() + ms;
      while (Date.now() < son) {
        const k = (await O.loglar(q)).find(pred);
        if (k) return k;
        await bekle(150);
      }
      const hepsi = await O.loglar({ since: q.since || 0 });
      throw new Error(`Log bulunamadı: ${JSON.stringify(q)} ${pred}\nSon kayıtlar:\n${hepsi.slice(-25).map(LOG_OZET).join('\n')}`);
    },
    // Şu ana kadarki son log numarası (önce sayfadaki bekleyen logları boşaltır: sonraki sorgular yalnızca yenileri görür)
    async sonSeq() {
      if (O.page && !O.page.isClosed()) { await O.logBosalt(); await bekle(150); await O.logBosalt(); }
      return (await (await fetch(srv.url + '/api/log?limit=1')).json()).son;
    },
    // Sayfanın sıradaki logları sunucuya yollamasını garantiye al
    async logBosalt(page = O.page) { await page.evaluate(() => window.__oyun.yolla()); await bekle(200); },

    durum: (page = O.page) => page.evaluate(() => window.__oyun.durum()),
    calistir: (fn, arg, page = O.page) => page.evaluate(fn, arg),
    async uye(id, page = O.page) { return (await O.durum(page)).uyeler.find((u) => u.id === 'test_' + id); },
    // olayın sayfaya ulaşıp işlenmesini bekle (girdi logu)
    async islendi(since, id, olay) {
      return O.bekle({ since, tur: 'girdi', olay }, (k) => k.kullanici && k.kullanici.id === 'test_' + id);
    },
    // Oyun saatini ileri al (bekleme süreleri: başsız tarayıcıda 3B oyunlar yavaş döner)
    ileriSar: (sn, page = O.page) => page.evaluate((s) => { window.__oyun.G.time += s; }, sn),

    async hatalar() {
      const js = await O.loglar({ tur: 'hata' });
      return [...sayfaHatalari, ...js.map((k) => k.mesaj)];
    },

    async kapat() {
      try { if (kendiTarayicim) await browser.close(); else if (O.page) await O.page.close(); } catch {}
      srv.proc.kill();
      await bekle(100);
      try { fs.rmSync(srv.tmp, { recursive: true, force: true }); } catch {}
    },
  };
  await O.sayfaAc();
  return O;
}

module.exports = { oyunAc, sunucuAc, tarayiciAc, bekle, KOK };
