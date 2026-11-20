// Sunucu tarafı: olay kaydı, /api/log, /api/test, JSONL dosyası (tarayıcısız, hızlı)
const fs = require('fs');
const path = require('path');
const { sunucuAc } = require('./yardimci');

const OYUNLAR = ['canli-dugun', 'sira-gecesi', 'padisah-alayi'];

describe.each(OYUNLAR)('%s sunucusu', (oyun) => {
  let srv;
  beforeAll(async () => { srv = await sunucuAc(oyun); });
  afterAll(() => { srv.proc.kill(); fs.rmSync(srv.tmp, { recursive: true, force: true }); });

  const loglar = async (q = {}) => (await (await fetch(srv.url + '/api/log?' + new URLSearchParams(q))).json());
  const post = (p, body) => fetch(srv.url + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  it('açılışı loglar ve TikTok\'a bağlanmaz', async () => {
    const { kayitlar } = await loglar();
    expect(kayitlar[0]).toMatchObject({ seq: 1, oyun, kaynak: 'sunucu', tur: 'basladi', port: srv.port });
    expect(kayitlar.some((k) => k.tur === 'baglanti' && k.durum === 'connecting')).toBe(false);
  });

  it('/api/test ile gelen olayı "enjekte" olarak loglar', async () => {
    const { son } = await loglar();
    const r = await post('/api/test', { type: 'chat', user: { id: 'x1', nick: 'Ayşe' }, text: 'selam' });
    expect(r.ok).toBe(true);
    const { kayitlar } = await loglar({ since: son, tur: 'enjekte' });
    expect(kayitlar).toHaveLength(1);
    expect(kayitlar[0]).toMatchObject({ kaynak: 'test', olay: 'chat', user: { id: 'x1', nick: 'Ayşe' }, text: 'selam' });
  });

  it('sayfanın yolladığı kayıtları sıra numarasıyla saklar ve süzer', async () => {
    const { son } = await loglar();
    await post('/api/log', [{ tur: 'girdi', olay: 'like', sayi: 3 }, { tur: 'oyun', olay: 'announce', veri: 'merhaba' }, { yanlis: 1 }]);
    const hepsi = (await loglar({ since: son })).kayitlar;
    expect(hepsi.map((k) => k.tur)).toEqual(['girdi', 'oyun']);
    expect(hepsi.every((k) => k.kaynak === 'sayfa')).toBe(true);
    expect(hepsi[1].seq).toBe(hepsi[0].seq + 1);
    expect((await loglar({ since: son, olay: 'announce' })).kayitlar).toHaveLength(1);
    expect((await loglar({ since: son, tur: 'girdi,oyun', limit: 1 })).kayitlar[0].olay).toBe('announce');
  });

  it('logları günlük JSONL dosyasına yazar', async () => {
    await new Promise((r) => setTimeout(r, 200));
    const dir = path.join(srv.tmp, 'loglar');
    const [dosya] = fs.readdirSync(dir);
    expect(dosya).toMatch(/^\d{4}-\d{2}-\d{2}\.jsonl$/);
    const satirlar = fs.readFileSync(path.join(dir, dosya), 'utf8').trim().split('\n').map((s) => JSON.parse(s));
    expect(satirlar[0].tur).toBe('basladi');
    expect(satirlar.some((k) => k.tur === 'enjekte')).toBe(true);
  });

  it('istemci kayıt dosyasını servis eder', async () => {
    const r = await fetch(srv.url + '/ortak/kayit-istemci.js');
    expect(r.headers.get('content-type')).toMatch(/javascript/);
    expect(await r.text()).toContain('OyunKayit');
  });
});
