// Oyun mantığı: izleyiciler (yorum/beğeni/hediye) cenaze alayına katılır, beğeniler alayı hızlandırır,
// hediyeler rol verir (tabutu omuzlamak, sancaktar, sipahi) ya da olay başlatır (Fatiha, yağmur, tekbir).
// Alay Ereğli'deki Aktepe ordugâhından Bursa'ya yürür; Muradiye'de Şehzade Mustafa defnedilir, sonra hikâye baştan başlar.
import { DURAKLAR, TOPLAM_S, TOPLAM_KM, kmAt, aralik } from './rota.js';
import { ROL } from './alay.js';

export const LEVELS = [
  { n: 'Ağır adım', e: 0, c: '#9ee37d' },
  { n: 'Yürüyüş', e: 25, c: '#f6c453' },
  { n: 'Hızlı adım', e: 55, c: '#ff9f43' },
  { n: 'Koşar adım', e: 85, c: '#ff4f7b' },
];
const HIZ = 2.0; // birim/sn (ağır adımda)
const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
export const DEFIN_SURE = 64; // defin sahnesi (sn), sonra hikâye baştan
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');

// Varsayılan hediye kuralları (asıl ayar: hediyeler.json → /api/rules)
const DEFAULT_RULES = [
  { eylem: 'tabut', etiket: 'Tabutu Omuzla', jeton: 1, ikon: '🌹', ad: ['Rose', 'Gül'], id: ['5655'] },
  { eylem: 'sancak', etiket: 'Sancaktar Ol', jeton: 10, ikon: '🚩', ad: [], id: [] },
  { eylem: 'sipahi', etiket: 'Atlı Sipahi Ol', jeton: 30, ikon: '🐎', ad: [], id: [] },
  { eylem: 'dua', etiket: 'Fatiha Oku', jeton: 99, ikon: '🤲', ad: [], id: [] },
  { eylem: 'yagmur', etiket: 'Gök Ağlasın', jeton: 199, ikon: '🌧️', ad: [], id: [] },
  { eylem: 'tekbir', etiket: 'Tekbir', minJeton: 1000, ikon: '🕌', ad: [], id: [] },
];

// yorumlar gevşek eşleşir: büyük/küçük harf, tırnak, noktalama ve Türkçe harf farkı önemsiz
export const norm = (s) => String(s || '').toLocaleLowerCase('tr')
  .replace(/[ıîİ]/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/[üû]/g, 'u').replace(/â/g, 'a')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const has = (t, ...keys) => keys.some((k) => (` ${t} `).includes(k));

export function createGame(alay) {
  const G = {
    users: new Map(), time: 0, s: 0, dir: 1, sefer: 1, durum: 'yol', varisT: 0,
    energy: 0, level: 0, hiz: 1, boostUntil: 0, likes: 0, diamonds: 0, viewers: 0,
    scores: new Map(), top: [], yuruyenler: [], rules: DEFAULT_RULES, fx: [],
    sonDurak: 0, beat: 0, bpm: 50, duaT: -99, haritaT: -99, yagmurUntil: 0, asama: 0,
  };
  const listeners = {};
  G.on = (k, f) => { (listeners[k] = listeners[k] || []).push(f); };
  G.emit = (k, v) => { (listeners[k] || []).forEach((f) => f(v)); };
  G.addEnergy = (x) => { G.energy = Math.min(100, G.energy + x); };
  G.km = () => kmAt(G.s);

  function ensure(user) {
    let u = G.users.get(user.id);
    if (!u) { u = { id: user.id, nick: user.nick, km: 0, lastAct: G.time, joinT: G.time }; G.users.set(user.id, u); }
    if (user.nick) u.nick = user.nick;
    if (user.avatar) u.avatar = user.avatar; // TikTok profil resmi (isim etiketinde gösterilir)
    u.lastAct = G.time;
    return u;
  }

  // alaya katıl (ilk gelenler tabutu omuzlar ve sancak taşır; gerisi yeniçeri)
  function katil(u) {
    if (u.rol) return false;
    let rol = 'yeniceri';
    if (alay.sayi('tabut') < ROL.tabut.max) rol = 'tabut';
    else if (alay.sayi('sancak') < 2) rol = 'sancak';
    if (rol === 'yeniceri' && alay.sayi('yeniceri') >= ROL.yeniceri.max) {
      // dolu: en uzun süredir sessiz (hediye atmamış) yeniçeri yerini bırakır
      const yer = [...alay.uyeler].filter((x) => x.rol === 'yeniceri').sort((a, b) => (a.gifted - b.gifted) || (a.lastAct - b.lastAct))[0];
      if (yer) alay.cikar(yer);
    }
    alay.ekle(u, rol);
    u.autoRole = rol !== 'yeniceri';
    u.welcomeT = G.time;
    if (u.autoRole) G.emit('rolDegisti', { u, rol, neden: 'ilk' }); // sırayla kamerada gösterilir
    G.emit('feed', { kind: 'join', user: u, text: `alaya katıldı (${ROL[rol].ad})` });
    return true;
  }
  // hediye ile rol: yer doluysa önce otomatik gelenin, sonra en eski hediyecinin yerini alır
  function rolVer(u, rol) {
    if (u.rol === rol) { u.autoRole = false; return; }
    if (alay.sayi(rol) >= ROL[rol].max) {
      // önce yorumla/otomatik gelenin, sonra en eski hediyecinin yerini alır
      const aday = alay.uyeler.filter((x) => x.rol === rol && x !== u).sort((a, b) => (!!a.hediyeRol - !!b.hediyeRol) || (b.autoRole - a.autoRole) || (a.rolT - b.rolT))[0];
      if (aday) { aday.autoRole = false; aday.hediyeRol = false; alay.ekle(aday, 'yeniceri'); aday.rolT = G.time; var verdi = aday; }
    }
    if (u.rol) alay.ekle(u, rol); else { alay.ekle(u, rol); u.welcomeT = G.time; }
    u.autoRole = false; u.rolT = G.time; u.hediyeRol = true;
    G.emit('rolDegisti', { u, rol, neden: 'hediye', yerine: verdi ? verdi.nick : null });
    if (verdi) G.emit('rolDegisti', { u: verdi, rol: 'yeniceri', neden: 'verdi' });
  }

  // Yorumla rol (hediyesiz oynanabilsin): kişi başı 30 sn bekleme. Hediyeyle alınmış yer elden alınamaz.
  const ROL_BEKLE = 30;
  const ROL_IKON = { tabut: '⚰️', sancak: '🚩', sipahi: '🐎', yeniceri: '⚔️' };
  function rolKomut(u, rol) {
    const ad = ROL[rol].ad.toLocaleLowerCase('tr'), ik = ROL_IKON[rol];
    if (u.rol === rol) return `${ik} ${ad} (zaten ${ad})`;
    const kalan = Math.ceil(ROL_BEKLE - (G.time - (u.yorumRolT ?? -99)));
    if (kalan > 0) return `${ik} ${ad} (${kalan} sn bekle)`;
    if (u.hediyeRol && G.time - u.rolT < 120) return `${ik} ${ad} (hediyeyle aldığı rolü 2 dk bırakamaz)`;
    let yerineGecti = null;
    if (rol !== 'yeniceri' && alay.sayi(rol) >= ROL[rol].max) {
      const aday = alay.uyeler.filter((x) => x.rol === rol && !x.hediyeRol && G.time - (x.rolT || 0) > ROL_BEKLE).sort((a, b) => (b.autoRole - a.autoRole) || (a.rolT - b.rolT))[0];
      if (!aday) return `${ik} ${ad} (yer dolu, hediyeyle alınabilir)`;
      aday.autoRole = false; alay.ekle(aday, 'yeniceri'); aday.rolT = G.time;
      G.emit('announce', `${ik} ${u.nick}, ${aday.nick}'in yerine geçti!`);
      yerineGecti = aday;
    } else G.emit('announce', rol === 'yeniceri' ? `⚔️ ${u.nick} yeniçeri saflarına döndü` : `${ik} ${u.nick} artık ${ad}!`);
    alay.ekle(u, rol);
    u.autoRole = false; u.hediyeRol = false; u.rolT = G.time; u.yorumRolT = G.time;
    G.emit('rolDegisti', { u, rol, neden: 'yorum', yerine: yerineGecti ? yerineGecti.nick : null });
    if (yerineGecti) G.emit('rolDegisti', { u: yerineGecti, rol: 'yeniceri', neden: 'verdi' });
    G.emit('chipHit', rol === 'yeniceri' ? 'yorum' : rol);
    return `${ik} ${ad} ✓`;
  }

  // ---------- olaylar ----------
  G.handle = (ev) => {
    if (!ev || !ev.type) return;
    if (ev.type === 'viewers') { G.viewers = ev.count | 0; return; }
    if (!ev.user || !ev.user.id) return;
    if (ev.type === 'member') return; // sadece izlemeye gelen katılmaz (yorum ya da beğeni gerekir)
    const u = ensure(ev.user);
    switch (ev.type) {
      case 'chat': {
        const text = String(ev.text || '').slice(0, 120);
        katil(u);
        G.emit('chipHit', 'yorum');
        u.bubble = { text, t: G.time };
        G.addEnergy(1.2);
        G.emit('feed', { kind: 'chat', user: u, text });
        command(u, text);
        G.emit('yorumOdak', u); // sıra boşsa kamera kısa bir an yorum yapana yaklaşır
        break;
      }
      case 'like': {
        const n = Math.max(1, ev.count | 0);
        katil(u);
        G.emit('chipHit', 'begen');
        G.likes += n; G.addEnergy(Math.min(10, 0.45 * n));
        G.fx.push({ type: 'kalp', at: u, n: Math.min(n, 4) });
        if (G.time - (u.likeFeedT ?? -99) > 6) { u.likeFeedT = G.time; G.emit('feed', { kind: 'like', user: u, text: `${n} beğeni gönderdi ❤️` }); }
        break;
      }
      case 'gift': katil(u); gift(u, ev.gift || {}); break;
      case 'follow': katil(u); G.addEnergy(3); G.emit('feed', { kind: 'follow', user: u, text: 'takip etti ➕' }); break;
      case 'share': katil(u); G.addEnergy(3); G.emit('feed', { kind: 'share', user: u, text: 'yayını paylaştı 🔗' }); break;
    }
  };

  function command(u, text) {
    const t = norm(text), bul = [];
    if (!t) { G.emit('komut', { user: u, text, bul }); return; }
    if (has(t, 'dua', 'amin', 'fatiha', 'rahmet', 'mekani cennet', 'nur icinde', 'ruhu sad', 'huzur', 'allah')) {
      G.emit('chipHit', 'dua'); bul.push('🤲 dua');
      alay.dua(u, G.time); G.fx.push({ type: 'dua', at: u });
      if (G.time - G.duaT > 8) { G.duaT = G.time; G.emit('announce', `🤲 ${u.nick}, Şehzade Mustafa'nın ruhuna dua etti`); }
    }
    if (has(t, 'agla', 'yazik', 'vah', 'sehzadem', 'mustafa', 'yas')) { G.fx.push({ type: 'yas', at: u }); bul.push('💧 yas'); }
    // harita yorumla açılmaz: sadece yayıncı (kontrol paneli düğmesi / M tuşu)
    if (has(t, 'hizlan', 'hizli', 'cabuk', 'acele')) { G.addEnergy(2); G.emit('chipHit', 'begen'); bul.push('💨 hızlan'); }
    const rolIstek = has(t, 'tabut', 'omuz', 'tasi', 'sedye') ? 'tabut' : has(t, 'sancak', 'bayrak') ? 'sancak' : has(t, 'sipahi', 'atli', 'ata bin') ? 'sipahi'
      : has(t, 'yeniceri', 'yaya') ? 'yeniceri' : null;
    if (rolIstek) bul.push(rolKomut(u, rolIstek));
    G.emit('komut', { user: u, text, bul });
  }

  G.matchRule = (gf) => {
    const name = String(gf.name || '').toLocaleLowerCase('tr'), id = String(gf.id || ''), dia = gf.diamonds | 0;
    for (const r of G.rules) {
      if (id && (r.id || []).map(String).includes(id)) return { r, by: 'id' };
      if (name && (r.ad || []).some((a) => String(a).toLocaleLowerCase('tr') === name)) return { r, by: 'ad' };
    }
    for (const r of G.rules) if (!(r.ad || []).length && !(r.id || []).length && r.jeton != null && Number(r.jeton) === dia) return { r, by: 'jeton' };
    for (const r of G.rules) if (r.minJeton != null && dia >= Number(r.minJeton)) return { r, by: 'jeton' };
    return null;
  };

  function gift(u, gf) {
    const dia = Math.max(1, gf.diamonds | 0), cnt = Math.max(1, gf.count | 0), total = dia * cnt;
    u.gifted = true; G.diamonds += total;
    const sc = G.scores.get(u.id) || { id: u.id, nick: u.nick, d: 0 }; sc.d += total; sc.nick = u.nick; G.scores.set(u.id, sc);
    G.addEnergy(Math.min(35, 4 + total * 0.06));
    const m = G.matchRule({ ...gf, diamonds: dia });
    u.puan = (u.puan || 0) + total; // dizilimde öne geçer
    G.emit('giftlog', { user: u, gift: gf, dia, cnt, match: m });
    G.emit('feed', { kind: 'gift', user: u, text: `${gf.icon || '🎁'} ${gf.name || 'Hediye'} ×${cnt}${m ? ' → ' + m.r.etiket : ''} · ${fmt(total)} 💎` });
    if (m) action(m.r, u, gf, cnt, total);
    else {
      G.emit('announce', `🎁 ${u.nick} Şehzade için hediye gönderdi`);
      if (total >= 100) G.emit('banner', { user: u, gift: gf, count: cnt, total, text: '🤲 Allah razı olsun' });
    }
    G.fx.push({ type: 'nur', n: total >= 1000 ? 60 : m ? 18 : total >= 100 ? 16 : 0 });
    alay.dizil();
    ranks();
  }

  const BANNER = {
    tabut: '⚰️ Şehzade\'nin tabutunu omuzladı!', sancak: '🚩 Sancağı kaptı!', sipahi: '🐎 Atlı sipahi oldu!',
    dua: '🤲 Bütün alay Fatiha okudu', yagmur: '🌧️ Gök ağlıyor…',
  };
  function action(r, u, gf, cnt, total) {
    G.emit('ruleHit', r.eylem);
    switch (r.eylem) {
      case 'tabut': case 'sancak': case 'sipahi':
        rolVer(u, r.eylem);
        G.emit('announce', `${ROL_IKON[r.eylem]} ${u.nick} artık ${ROL[r.eylem].ad.toLocaleLowerCase('tr')}!`);
        return; // kamera ve afiş rol sırasından gelir (rolDegisti)
      case 'dua':
        alay.topluDua(G.time); G.fx.push({ type: 'nur', n: 30 }); G.addEnergy(4);
        G.emit('announce', `🤲 ${u.nick} için bütün alay Şehzade'nin ruhuna Fatiha okudu`); G.emit('focus', 'tabut');
        break;
      case 'yagmur':
        G.yagmurUntil = Math.max(G.yagmurUntil, G.time) + 35;
        G.emit('announce', `🌧️ ${u.nick}: Gök de Şehzade'ye ağlıyor…`); G.emit('focus', 'genis');
        break;
      case 'tekbir':
        alay.topluDua(G.time); G.fx.push({ type: 'nur', n: 80 }); G.fx.push({ type: 'isik' });
        G.emit('announce', `🕌 ${u.nick}: Allahu Ekber! Bütün ordu tekbir getirdi`);
        G.emit('banner', { user: u, gift: gf, count: cnt, total, text: '🕌 Tekbir! Ruhu şad olsun' });
        G.emit('focus', 'tabut');
        return;
    }
    if (BANNER[r.eylem]) G.emit('banner', { user: u, gift: gf, count: cnt, total, text: BANNER[r.eylem] });
  }

  function ranks() {
    G.top = [...G.scores.values()].sort((a, b) => b.d - a.d).slice(0, 5);
    G.emit('board');
  }

  // ---------- her kare ----------
  let rankT = 0, pruneT = 0;
  G.update = (dt) => {
    G.time += dt;
    // enerji yavaşça söner
    G.energy = Math.max(0, G.energy - dt * (0.9 + G.energy * 0.012));
    let lv = 0; for (let i = 0; i < LEVELS.length; i++) if (G.energy >= LEVELS[i].e) lv = i;
    if (G.time < G.boostUntil) lv = 3;
    G.level = lv;
    const hedef = G.durum === 'defin' ? 0 : 1 + (G.energy / 100) * 1.0 + (G.time < G.boostUntil ? 0.6 : 0);
    G.hiz += (hedef - G.hiz) * Math.min(1, dt * 1.5);

    if (G.durum === 'yol') {
      const eski = G.s;
      let ds = G.dir * HIZ * G.hiz * dt;
      if (G.sDuz) { // panel: sahneyle aradaki farkı yumuşakça kapat (geri sıçramadan; en fazla yavaşlar)
        let k = G.sDuz * Math.min(1, dt * 0.8);
        if (G.dir * (ds + k) < 0) k = -ds;
        ds += k; G.sDuz -= k; if (Math.abs(G.sDuz) < 0.01) G.sDuz = 0;
      }
      G.s = Math.min(TOPLAM_S, Math.max(0, G.s + ds));
      const dKm = Math.abs(kmAt(G.s) - kmAt(eski));
      for (const u of alay.uyeler) u.km = (u.km || 0) + dKm;
      // durak geçişi (köşe taşı kartı)
      DURAKLAR.forEach((d, i) => {
        const ileri = G.dir > 0 ? d.s - G.s : G.s - d.s;
        if (ileri <= 14 && ileri > -1 && G.sonDurak !== i && !(G.dir > 0 && i === 0) && !(G.dir < 0 && i === DURAKLAR.length - 1)) {
          G.sonDurak = i;
          G.emit('durak', d);
          if (d.yapi && d.yapi !== 'turbe') G.emit('yapi', d);
        }
      });
      if (G.s >= TOPLAM_S) varis();
    } else if (G.durum === 'defin') definAkis();
    rankT -= dt;
    if (rankT <= 0) { rankT = 1; G.yuruyenler = [...alay.uyeler].sort((a, b) => b.km - a.km).slice(0, 5).map((u) => ({ id: u.id, nick: u.nick, km: u.km })); G.emit('walkers'); }
    // 25 dk sessiz kalanlar alaydan ayrılır (kalabalık değilse kalırlar)
    pruneT -= dt;
    if (pruneT <= 0) {
      pruneT = 15;
      if (alay.uyeler.length > 25) for (const u of [...alay.uyeler]) if (G.time - u.lastAct > 25 * 60 && !u.gifted) { alay.cikar(u); G.users.delete(u.id); }
    }
  };

  // ---------- Bursa, Muradiye: defin ----------
  // Zaman çizelgesi (varıştan sonra sn): 3 naaş kabrin başına, 13 kabre indirilir, 20 toprak, 28 sanduka + dua, 64 hikâye baştan
  function varis() {
    G.durum = 'defin'; G.varisT = G.time; G.asama = 0; G.s = TOPLAM_S;
    G.emit('varis', { hedef: DURAKLAR[DURAKLAR.length - 1], km: TOPLAM_KM, yuruyenler: [...alay.uyeler].sort((a, b) => b.km - a.km).slice(0, 3) });
    G.emit('announce', `🕌 Bursa'ya varıldı. ${TOPLAM_KM} km yol bitti, Şehzade Muradiye'de`);
  }
  const ASAMA = [
    [3, () => G.emit('announce', '⚰️ Naaş kabrin başına getiriliyor')],
    [13, () => G.emit('announce', '🤲 Şehzade Mustafa kabrine indiriliyor')],
    [20, () => G.emit('announce', '🪏 Kabre toprak atılıyor')],
    [28, () => {
      alay.topluDua(G.time); G.fx.push({ type: 'nur', n: 70 });
      G.emit('defnedildi', { yuruyenler: [...alay.uyeler].sort((a, b) => b.km - a.km).slice(0, 3) });
      G.emit('announce', '🕌 Şehzade Mustafa, Muradiye\'de ecdadının yanına defnedildi');
    }],
    [40, () => G.emit('announce', '🤲 Ruhu şad, mekânı cennet olsun')],
  ];
  function definAkis() {
    const T = G.time - G.varisT;
    while (G.asama < ASAMA.length && T >= ASAMA[G.asama][0]) ASAMA[G.asama++][1]();
    if (T >= DEFIN_SURE) yeniTur();
  }
  function yeniTur() {
    G.s = 0; G.dir = 1; G.sefer++; G.durum = 'yol'; G.sonDurak = 0; G.asama = 0;
    G.emit('sefer', { baslik: 'Hikâye yeniden başlıyor', alt: 'Aktepe ordugâhı, Ekim 1553. Alaydakiler yerinde kalır.' });
    G.emit('announce', '⛺ Alay yeniden Aktepe\'den yola çıkıyor');
    setTimeout(() => G.emit('durak', DURAKLAR[0]), 7000);
  }
  // alay ve dünya için defin durumu (null: yolda)
  G.definDurum = () => {
    if (G.durum !== 'defin') return null;
    const T = G.time - G.varisT;
    return { T, tasi: sm((T - 3) / 9), toplan: sm((T - 2) / 7), acil: sm((T - 12) / 2), indir: sm((T - 13) / 7), kabir: sm((T - 20) / 7) + sm((T - 28) / 4), dua: T > 27 && T < 58 };
  };

  G.reset = () => {
    for (const u of [...alay.uyeler]) alay.cikar(u);
    G.users.clear(); G.scores.clear(); G.top = []; G.yuruyenler = [];
    G.s = 0; G.dir = 1; G.sefer = 1; G.durum = 'yol'; G.energy = 0; G.likes = 0; G.diamonds = 0; G.sonDurak = 0; G.asama = 0; G.yagmurUntil = 0;
    G.emit('board'); G.emit('walkers');
  };
  // ---------- durum kaydı (F5 / yeniden açılışta kaldığı yerden) ----------
  G.kaydet = () => ({
    v: 1, t: Date.now(), s: G.s, dir: G.dir, hiz: G.hiz, sefer: G.sefer, durum: G.durum, definT: G.durum === 'defin' ? G.time - G.varisT : 0, yagmur: Math.max(0, G.yagmurUntil - G.time), energy: G.energy, likes: G.likes, diamonds: G.diamonds, sonDurak: G.sonDurak,
    scores: [...G.scores.values()],
    uyeler: [...alay.uyeler].sort((a, b) => (a.joinT ?? 0) - (b.joinT ?? 0)).map((u) => ({ id: u.id, nick: u.nick, avatar: u.avatar, rol: u.rol, puan: u.puan || 0, km: u.km || 0, autoRole: !!u.autoRole, gifted: !!u.gifted, sessiz: G.time - u.lastAct })),
  });
  G.yukle = (d) => {
    if (!d || d.v !== 1) return false;
    G.reset();
    Object.assign(G, { s: Math.min(TOPLAM_S, Math.max(0, d.s || 0)), dir: d.dir || 1, sefer: d.sefer || 1, durum: 'yol', energy: d.energy || 0, likes: d.likes || 0, diamonds: d.diamonds || 0, sonDurak: d.sonDurak ?? 0 });
    if (d.durum === 'defin') { G.durum = 'defin'; G.varisT = G.time - (d.definT || 0); G.asama = ASAMA.filter(([t]) => t <= (d.definT || 0)).length; }
    G.yagmurUntil = G.time + (d.yagmur || 0);
    for (const sc of d.scores || []) G.scores.set(sc.id, { ...sc });
    (d.uyeler || []).forEach((x, i) => {
      const u = { id: x.id, nick: x.nick, avatar: x.avatar, km: x.km, puan: x.puan, autoRole: x.autoRole, gifted: x.gifted, joinT: G.time - 1000 + i * 0.01, lastAct: G.time - (x.sessiz || 0), rolT: 0 };
      G.users.set(u.id, u);
      alay.ekle(u, x.rol || 'yeniceri');
    });
    alay.dizil();
    for (const u of alay.uyeler) if (u.ch && u.hedef) u.ch.position.copy(u.hedef); // koşarak gelmesin, yerinde başlasın
    ranks(); G.emit('walkers');
    return true;
  };
  // kontrol paneli, sahne penceresinin durumuna uyar (iki pencere tek oyun gibi)
  // Kişi değişince her şeyi baştan kurmaz (takılma yapıyordu): yalnızca gelen/giden/rolü değişen kişiyi işler.
  // Konum farkı yumuşakça kapatılır; kayıt 2 sn'ye kadar eski olabildiği için aradaki yol da hesaba katılır.
  G.senkron = (d) => {
    if (!d || d.v !== 1) return;
    const gelen = new Map((d.uyeler || []).map((x) => [x.id, x]));
    let degisti = false;
    for (const u of [...alay.uyeler]) if (!gelen.has(u.id)) { alay.cikar(u); G.users.delete(u.id); degisti = true; }
    for (const x of d.uyeler || []) {
      let u = G.users.get(x.id);
      if (!u) { u = { id: x.id, nick: x.nick, avatar: x.avatar, km: x.km, puan: x.puan, autoRole: x.autoRole, gifted: x.gifted, joinT: G.time, lastAct: G.time - (x.sessiz || 0), rolT: 0 }; G.users.set(u.id, u); }
      if (x.avatar) u.avatar = x.avatar;
      if ((u.puan || 0) !== (x.puan || 0)) { u.puan = x.puan; degisti = true; }
      if (u.rol !== (x.rol || 'yeniceri')) { alay.ekle(u, x.rol || 'yeniceri'); degisti = true; }
    }
    if (degisti) alay.dizil();
    const hedefS = d.s + d.dir * HIZ * (d.hiz || G.hiz) * Math.max(0, (Date.now() - d.t) / 1000) * (d.durum === 'yol' ? 1 : 0);
    if (G.dir !== d.dir || Math.abs(hedefS - G.s) > 40) { G.s = hedefS; G.dir = d.dir; G.sDuz = 0; }
    else G.sDuz = hedefS - G.s;
    Object.assign(G, { sefer: d.sefer, energy: d.energy, likes: d.likes, diamonds: d.diamonds, sonDurak: d.sonDurak });
    G.yagmurUntil = G.time + (d.yagmur || 0);
    if (d.durum === 'defin') {
      const T = (d.definT || 0) + Math.max(0, (Date.now() - d.t) / 1000);
      if (G.durum !== 'defin' || Math.abs((G.time - G.varisT) - T) > 2) { G.durum = 'defin'; G.varisT = G.time - T; G.asama = ASAMA.filter(([t]) => t <= T).length; }
    } else if (d.durum !== G.durum) { G.durum = d.durum; G.asama = 0; }
  };
  G.durakBilgi = () => {
    const [a, b] = aralik(G.s);
    const sonraki = G.dir > 0 ? DURAKLAR[b] : DURAKLAR[a];
    const kalan = Math.abs(sonraki.km - kmAt(G.s));
    return { sonraki, kalan };
  };
  return G;
}
