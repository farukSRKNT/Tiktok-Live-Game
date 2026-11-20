// Padişah Alayı uçtan uca: sahne penceresi (?clean) başsız tarayıcıda, olaylar sunucu üzerinden.
const { oyunAc, bekle } = require('./yardimci');

describe('Padişah Alayı', () => {
  let O;
  beforeAll(async () => { O = await oyunAc('padisah-alayi', { sayfa: '?clean&demo=0&kalite=dusuk' }); });
  afterAll(async () => { if (O) await O.kapat(); });
  beforeEach(async () => { await O.calistir(() => window.__oyun.G.reset()); });

  it('yorum yapan alaya katılır: ilk 3 kişi mehter, sonraki 2 sancaktar, gerisi yeniçeri', async () => {
    const since = await O.sonSeq();
    for (const id of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']) await O.yorum(id, 'selam');
    await O.islendi(since, 'a6', 'chat');
    await O.logBosalt();
    const katilan = await O.loglar({ since, tur: 'katildi' });
    expect(katilan.map((k) => [k.kullanici.id, k.rol])).toEqual([
      ['test_a1', 'mehter'], ['test_a2', 'mehter'], ['test_a3', 'mehter'],
      ['test_a4', 'sancak'], ['test_a5', 'sancak'], ['test_a6', 'yeniceri'],
    ]);
    const rolOlay = await O.loglar({ since, tur: 'oyun', olay: 'rolDegisti' });
    expect(rolOlay.map((k) => k.veri.neden)).toEqual(['ilk', 'ilk', 'ilk', 'ilk', 'ilk']);
  });

  it('sadece izlemeye giren (member) alaya katılmaz, beğeni katar', async () => {
    const since = await O.sonSeq();
    await O.giris('izleyici');
    await O.islendi(since, 'izleyici', 'member');
    expect(await O.uye('izleyici')).toBeUndefined();
    await O.begeni('izleyici', 5);
    await O.islendi(since, 'izleyici', 'like');
    expect(await O.uye('izleyici')).toMatchObject({ rol: 'mehter' });
    expect((await O.durum()).begeni).toBe(5);
  });

  it('komutlar gevşek: tırnak, büyük harf ve Türkçe karakter fark etmez', async () => {
    for (const id of ['m1', 'm2', 'm3', 's1', 's2', 'y1']) await O.yorum(id, 'merhaba');
    await O.ileriSar(60); // yorumla rol değiştirme 30 sn bekleme ister
    const since = await O.sonSeq();
    await O.yorum('y1', '"MEHTER" olmak istiyorum!');
    await O.islendi(since, 'y1', 'chat');
    await O.logBosalt();
    const rol = await O.bekle({ since, tur: 'rol' }, (k) => k.kullanici.id === 'test_y1');
    expect(rol).toMatchObject({ eski: 'yeniceri', yeni: 'mehter' });
    const komut = await O.bekle({ since, tur: 'oyun', olay: 'komut' }, (k) => k.veri.user.id === 'test_y1');
    expect(komut.veri.bul.join(' ')).toMatch(/mehter ✓/);

    await O.ileriSar(60);
    const s2 = await O.sonSeq();
    await O.yorum('y1', 'yeniceri'); // "yeniçeri" yazmadan
    await O.bekle({ since: s2, tur: 'rol' }, (k) => k.kullanici.id === 'test_y1' && k.yeni === 'yeniceri');
  });

  it('Gül hediyesi sancaktar yapar; 4 sancak doluysa otomatik gelenin yerini alır', async () => {
    for (const id of ['m1', 'm2', 'm3', 's1', 's2', 'g1', 'g2', 'g3']) await O.yorum(id, 'selam');
    const gul = { name: 'Rose', id: '5655', diamonds: 1 };
    await O.hediye('g1', gul);
    await O.hediye('g2', gul);
    const since = await O.sonSeq();
    expect((await O.durum()).uyeler.filter((u) => u.rol === 'sancak')).toHaveLength(4);
    await O.hediye('g3', gul);
    await O.islendi(since, 'g3', 'gift');
    await O.logBosalt();
    const kural = await O.bekle({ since, tur: 'oyun', olay: 'ruleHit' });
    expect(kural.veri).toBe('sancak');
    const degisti = await O.bekle({ since, tur: 'oyun', olay: 'rolDegisti' }, (k) => k.veri.neden === 'hediye');
    expect(degisti.veri).toMatchObject({ u: { id: 'test_g3' }, rol: 'sancak' });
    expect(['s1', 's2']).toContain(degisti.veri.yerine); // hediyeyle alınmış yerler (g1, g2) korunur
    const verdi = await O.bekle({ since, tur: 'rol' }, (k) => k.yeni === 'yeniceri');
    expect(verdi.kullanici.nick).toBe(degisti.veri.yerine);
    expect(await O.uye('g3')).toMatchObject({ rol: 'sancak' });
    expect((await O.durum()).elmas).toBe(3);
  });

  it('kurala uymayan hediye rol vermez ama elmas sayılır', async () => {
    await O.yorum('h1', 'selam');
    const since = await O.sonSeq();
    await O.hediye('h1', { name: 'Bilinmeyen', diamonds: 7, count: 3 });
    await O.islendi(since, 'h1', 'gift');
    await O.logBosalt();
    expect(await O.loglar({ since, tur: 'oyun', olay: 'ruleHit' })).toHaveLength(0);
    expect((await O.durum()).elmas).toBe(21);
  });

  it('kontrol: "ileri" bir sonraki durağa, "varış" Manisa\'ya götürür', async () => {
    const since = await O.sonSeq();
    await O.olay({ type: 'kontrol', k: 'ileri' });
    const durak = await O.bekle({ since, tur: 'oyun', olay: 'durak' }, (k) => k.veri.ad !== 'İstanbul', 40000);
    expect(durak.veri.km).toBeGreaterThan(0);
    await O.olay({ type: 'kontrol', k: 'varis' });
    const varis = await O.bekle({ since, tur: 'oyun', olay: 'varis' }, () => true, 60000);
    expect(varis.veri.hedef.ad).toBe('Manisa');
    await O.bekle({ since, tur: 'gecis' }, (k) => k.alan === 'durum' && k.yeni === 'varis');
  });

  it('sayfa yenilenince (F5) alay kaldığı yerden devam eder', async () => {
    for (const id of ['k1', 'k2', 'k3', 'k4']) await O.yorum(id, 'selam');
    await O.hediye('k4', { name: 'X', diamonds: 30 }); // sipahi
    await O.bekle({}, (k) => k.tur === 'rol' && k.kullanici.id === 'test_k4' && k.yeni === 'sipahi');
    await bekle(2600); // sahne durumu 2 sn'de bir kaydeder
    const once = (await O.durum()).uyeler;
    const since = await O.sonSeq();
    await O.page.reload();
    await O.page.waitForFunction(() => window.__oyun && window.__oyun.hazir());
    const yuklendi = await O.bekle({ since, tur: 'yuklendi' });
    expect(yuklendi.kisi).toBe(once.length);
    const sonra = (await O.durum()).uyeler;
    const sirala = (a) => [...a].sort((x, y) => x.id.localeCompare(y.id));
    expect(sirala(sonra)).toEqual(sirala(once));
    // yüklenen kişiler yeniden "katıldı" sayılmaz
    expect(await O.loglar({ since, tur: 'katildi' })).toHaveLength(0);
  });

  it('kontrol paneli tek başına açıkken yeni gelenler silinmez', async () => {
    await O.page.close(); O.page = null; // sahne penceresi kapandı
    await fetch(O.url + '/api/sifirla', { method: 'POST' }); // sahnenin son kaydı silinsin
    const panel = await O.sayfaAc('?demo=0&kalite=dusuk');
    await bekle(2500); // panel kendi durumunu kaydetmiş olsun (eskiden 10 sn boyunca bu eski kayda uyup yeni geleni siliyordu)
    const since = await O.sonSeq();
    await O.yorum('p1', 'selam');
    await O.islendi(since, 'p1', 'chat');
    await bekle(5000); // panel 2 sn'de bir sunucuyla eşitlenir
    expect(await O.uye('p1', panel)).toMatchObject({ rol: 'mehter' });
  });

  it('sayfada JS hatası yok', async () => {
    await bekle(500);
    expect(await O.hatalar()).toEqual([]);
  });
});
