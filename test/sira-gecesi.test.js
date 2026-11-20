// Sıra Gecesi uçtan uca: sahne penceresi (?clean) başsız tarayıcıda, olaylar sunucu üzerinden.
const { oyunAc, bekle } = require('./yardimci');

describe('Sıra Gecesi', () => {
  let O;
  beforeAll(async () => { O = await oyunAc('sira-gecesi', { sayfa: '?clean&demo=0&kalite=dusuk' }); });
  afterAll(async () => { if (O) await O.kapat(); });
  beforeEach(async () => { await O.calistir(() => window.__oyun.G.reset()); });

  const rolu = async (id) => (await O.uye(id) || {}).rol;

  it('ilk gelenler sahneyi kurar: sazcı, solist, darbukacı, sonra çiğ köfteci', async () => {
    const since = await O.sonSeq();
    for (const id of ['a1', 'a2', 'a3', 'a4']) await O.yorum(id, 'selam');
    await O.islendi(since, 'a4', 'chat');
    await O.logBosalt();
    const katilan = await O.loglar({ since, tur: 'katildi' });
    expect(katilan.map((k) => [k.kullanici.id, k.rol])).toEqual([
      ['test_a1', 'saz'], ['test_a2', 'solist'], ['test_a3', 'darbuka'], ['test_a4', 'yogur'],
    ]);
  });

  it('katılım kuralı (yorum+beğeni): sadece yayına giren salona girmez', async () => {
    const since = await O.sonSeq();
    await O.giris('izleyici');
    await O.islendi(since, 'izleyici', 'member');
    expect(await O.uye('izleyici')).toBeUndefined();
    await O.begeni('izleyici', 4);
    await O.islendi(since, 'izleyici', 'like');
    expect(await O.uye('izleyici')).toBeDefined();
    expect((await O.durum()).begeni).toBe(4);
  });

  it.each([['HALAYA KATIL'], ['"halaya katıl"'], ['halaya katil'], ['ben de halaya 💃']])('"%s" yazan halaya katılır', async (metin) => {
    const id = 'h' + Math.random().toString(36).slice(2, 7);
    const since = await O.sonSeq();
    await O.yorum(id, metin);
    await O.islendi(since, id, 'chat');
    expect(await rolu(id)).toBe('halay');
  });

  it('"bağlama" yazan, otomatik oturan sazcının yerini alır; eski sazcı masaya geçer', async () => {
    await O.yorum('oto', 'selam'); // ilk gelen: otomatik sazcı
    const since = await O.sonSeq();
    await O.yorum('istekli', 'merhaba');
    await O.yorum('istekli', 'Bağlama çalarım');
    await O.islendi(since, 'istekli', 'chat');
    await O.logBosalt();
    const rol = await O.bekle({ since, tur: 'rol' }, (k) => k.kullanici.id === 'test_istekli' && k.yeni === 'saz');
    expect(rol.eski).toBe('solist');
    expect(await rolu('oto')).toBe('masa');
    await O.bekle({ since, tur: 'oyun', olay: 'announce' }, (k) => /Sazcı artık istekli/.test(k.veri));
  });

  it('Gül → çiğ köfteci, 10 jeton → halaybaşı (hediyeler.json kuralları)', async () => {
    for (const id of ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9', 'x1', 'x2']) await O.yorum(id, 'selam');
    const since = await O.sonSeq();
    expect(await rolu('x1')).toBe('masa');
    await O.hediye('x1', { name: 'Rose', id: '5655', diamonds: 1 });
    await O.hediye('x2', { name: 'Bir şey', diamonds: 10 });
    await O.islendi(since, 'x2', 'gift');
    await O.logBosalt();
    const kurallar = (await O.loglar({ since, tur: 'oyun', olay: 'ruleHit' })).map((k) => k.veri);
    expect(kurallar).toEqual(['cigkofte', 'halaybasi']);
    expect(await rolu('x1')).toBe('yogur');
    expect(await rolu('x2')).toBe('halaybasi');
    expect((await O.durum()).elmas).toBe(11);
  });

  it('1000+ jetonluk hediye salonu ayağa kaldırır (durum geçişi loglanır)', async () => {
    const since = await O.sonSeq();
    await O.hediye('zengin', { name: 'Galaxy', diamonds: 1000 });
    await O.islendi(since, 'zengin', 'gift');
    const gecis = await O.bekle({ since, tur: 'gecis' }, (k) => k.alan === 'ayakta' && k.yeni === true);
    expect(gecis.eski).toBe(false);
    await O.bekle({ since, tur: 'oyun', olay: 'banner' }, (k) => /ayakta/.test(k.veri.text));
  });

  it('sayfada JS hatası yok', async () => {
    await bekle(500);
    expect(await O.hatalar()).toEqual([]);
  });
});
