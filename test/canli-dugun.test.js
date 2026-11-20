// Canlı Düğün uçtan uca: sahne penceresi (?clean) başsız tarayıcıda, olaylar sunucu üzerinden.
const { oyunAc, bekle } = require('./yardimci');

describe('Canlı Düğün', () => {
  let O;
  beforeAll(async () => { O = await oyunAc('canli-dugun', { sayfa: '?clean&demo=0' }); });
  afterAll(async () => { if (O) await O.kapat(); });
  beforeEach(async () => { await O.calistir(() => window.__oyun.G.reset()); });

  const rolu = async (id) => (await O.uye(id) || {}).rol;

  it('yayına giren, yorum ya da beğeni atan halaya katılır', async () => {
    const since = await O.sonSeq();
    await O.giris('g1');
    await O.yorum('g2', 'Allah mesut etsin');
    await O.begeni('g3', 12);
    await O.islendi(since, 'g3', 'like');
    await O.logBosalt();
    const katilan = await O.loglar({ since, tur: 'katildi' });
    expect(katilan.map((k) => [k.kullanici.id, k.rol])).toEqual([['test_g1', 'halay'], ['test_g2', 'halay'], ['test_g3', 'halay']]);
    expect((await O.durum()).begeni).toBe(12);
  });

  it('kurala uymayan hediye takı olur; en çok atan sağdıç, ikinci halaybaşı', async () => {
    const since = await O.sonSeq();
    await O.hediye('t1', { name: 'Kalp', diamonds: 5 });
    await O.islendi(since, 't1', 'gift');
    expect(await rolu('t1')).toBe('sagdic');
    await O.hediye('t2', { name: 'Donut', diamonds: 30 });
    await O.islendi(since, 't2', 'gift');
    await O.logBosalt();
    expect(await rolu('t2')).toBe('sagdic');
    expect(await rolu('t1')).toBe('halaybasi');
    const takilar = (await O.loglar({ since, tur: 'oyun', olay: 'tierHit' })).map((k) => k.veri);
    expect(takilar).toEqual(['yarim', 'tam']);
    const rol = await O.bekle({ since, tur: 'rol' }, (k) => k.kullanici.id === 'test_t1');
    expect(rol).toMatchObject({ eski: 'sagdic', yeni: 'halaybasi' });
    expect((await O.durum()).elmas).toBe(35);
  });

  it('100 jeton gelin, 99 jeton damat yapar (hediyeler.json)', async () => {
    const since = await O.sonSeq();
    await O.hediye('gelin', { name: 'Konfeti', diamonds: 100 });
    await O.hediye('damat', { name: 'Şapka', diamonds: 99 });
    await O.islendi(since, 'damat', 'gift');
    await O.logBosalt();
    expect(await rolu('gelin')).toBe('gelin');
    expect(await rolu('damat')).toBe('damat');
    const kurallar = (await O.loglar({ since, tur: 'oyun', olay: 'ruleHit' })).map((k) => k.veri);
    expect(kurallar).toEqual(['gelin', 'damat']);
    const roller = await O.bekle({ since, tur: 'oyun', olay: 'roles' }, (k) => k.veri.damat);
    expect(roller.veri).toMatchObject({ gelin: { id: 'test_gelin' }, damat: { id: 'test_damat' } });
  });

  it('yeni gelin eskisinin yerini alır, eski gelin halaya döner', async () => {
    await O.hediye('eski', { name: 'Konfeti', diamonds: 100 });
    const since = await O.sonSeq();
    await O.hediye('yeni', { name: 'Konfeti', diamonds: 100 });
    await O.islendi(since, 'yeni', 'gift');
    await O.logBosalt();
    expect(await rolu('yeni')).toBe('gelin');
    // eski gelin hâlâ en çok hediye atanlardan: sağdıç olur
    const rol = await O.bekle({ since, tur: 'rol' }, (k) => k.kullanici.id === 'test_eski');
    expect(rol.eski).toBe('gelin');
    expect(['sagdic', 'halaybasi', 'halay']).toContain(rol.yeni);
  });

  it('Gül "Halaya Katıl" kuralına uyar', async () => {
    const since = await O.sonSeq();
    await O.hediye('gul', { name: 'Rose', id: '5655', diamonds: 1 });
    await O.islendi(since, 'gul', 'gift');
    await O.logBosalt();
    expect((await O.loglar({ since, tur: 'oyun', olay: 'ruleHit' })).map((k) => k.veri)).toEqual(['halay']);
    await O.bekle({ since, tur: 'oyun', olay: 'announce' }, (k) => /halaya katıldı/.test(k.veri));
  });

  it('sayfada JS hatası yok', async () => {
    await bekle(500);
    expect(await O.hatalar()).toEqual([]);
  });
});
