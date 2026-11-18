// Oyun mantığı: izleyiciler (yorum/beğeni/hediye) alaya katılır, beğeniler alayı hızlandırır,
// hediyeler rol verir (sancaktar, mehter, sipahi, musahip) ya da olay başlatır (altın saçma, dörtnala, şenlik).
// Alay İstanbul'dan Manisa'ya yürür; varınca kutlama, sonra dönüş yolu (cülus için İstanbul'a).
import { DURAKLAR, TOPLAM_S, TOPLAM_KM, kmAt, aralik } from './rota.js';
import { ROL } from './alay.js';

export const LEVELS = [
  { n: 'Ağır yürüyüş', e: 0, c: '#9ee37d' },
  { n: 'Rahvan', e: 25, c: '#f6c453' },
  { n: 'Tırıs', e: 55, c: '#ff9f43' },
  { n: 'Dörtnala', e: 85, c: '#ff4f7b' },
];
const HIZ = 2.4; // birim/sn (ağır yürüyüşte)
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');

// Varsayılan hediye kuralları (asıl ayar: hediyeler.json → /api/rules)
const DEFAULT_RULES = [
  { eylem: 'sancak', etiket: 'Sancaktar Ol', jeton: 1, ikon: '🌹', ad: ['Rose', 'Gül'], id: ['5655'] },
  { eylem: 'mehter', etiket: 'Mehter Ol', jeton: 10, ikon: '🥁', ad: [], id: [] },
  { eylem: 'sipahi', etiket: 'Atlı Sipahi Ol', jeton: 30, ikon: '🐎', ad: [], id: [] },
  { eylem: 'altin', etiket: 'Altın Saçtır', jeton: 50, ikon: '💰', ad: [], id: [] },
  { eylem: 'musahip', etiket: 'Musahip Ol', jeton: 99, ikon: '👑', ad: [], id: [] },
  { eylem: 'dortnala', etiket: 'Dörtnala!', jeton: 199, ikon: '💨', ad: [], id: [] },
  { eylem: 'senlik', etiket: 'Şenlik Ateşi', minJeton: 1000, ikon: '🎆', ad: [], id: [] },
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
    sonDurak: 0, beat: 0, bpm: 96, coskuT: -99, selamT: -99, haritaT: -99,
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
    u.lastAct = G.time;
    return u;
  }

  // alaya katıl (ilk gelenler mehter ve sancaktar olur; gerisi yeniçeri)
  function katil(u) {
    if (u.rol) return false;
    let rol = 'yeniceri';
    if (alay.sayi('mehter') < 3) rol = 'mehter';
    else if (alay.sayi('sancak') < 2) rol = 'sancak';
    if (rol === 'yeniceri' && alay.sayi('yeniceri') >= ROL.yeniceri.max) {
      // dolu: en uzun süredir sessiz (hediye atmamış) yeniçeri yerini bırakır
      const yer = [...alay.uyeler].filter((x) => x.rol === 'yeniceri').sort((a, b) => (a.gifted - b.gifted) || (a.lastAct - b.lastAct))[0];
      if (yer) alay.cikar(yer);
    }
    alay.ekle(u, rol);
    u.autoRole = rol !== 'yeniceri';
    u.welcomeT = G.time;
    if (u.autoRole) G.emit('banner', { auto: true, user: u, gift: { icon: rol === 'mehter' ? '🥁' : '🚩' }, sub: rol === 'mehter' ? 'Mehter takımına katıldı!' : 'Sancağı taşıyor!', text: 'İlk gelenlerden! Hediye atan yerini alır.' });
    G.emit('feed', { kind: 'join', user: u, text: `alaya katıldı (${ROL[rol].ad})` });
    return true;
  }
  // hediye ile rol: yer doluysa önce otomatik gelenin, sonra en eski hediyecinin yerini alır
  function rolVer(u, rol) {
    if (u.rol === rol) { u.autoRole = false; return; }
    if (alay.sayi(rol) >= ROL[rol].max) {
      // önce yorumla/otomatik gelenin, sonra en eski hediyecinin yerini alır
      const aday = alay.uyeler.filter((x) => x.rol === rol && x !== u).sort((a, b) => (!!a.hediyeRol - !!b.hediyeRol) || (b.autoRole - a.autoRole) || (a.rolT - b.rolT))[0];
      if (aday) { aday.autoRole = false; aday.hediyeRol = false; alay.ekle(aday, 'yeniceri'); aday.rolT = G.time; }
    }
    if (u.rol) alay.ekle(u, rol); else { alay.ekle(u, rol); u.welcomeT = G.time; }
    u.autoRole = false; u.rolT = G.time; u.hediyeRol = true;
  }

  // Yorumla rol (hediyesiz oynanabilsin): kişi başı 30 sn bekleme. Hediyeyle alınmış yer elden alınamaz.
  const ROL_BEKLE = 30;
  const ROL_IKON = { sancak: '🚩', mehter: '🥁', sipahi: '🐎', musahip: '👑', yeniceri: '⚔️' };
  function rolKomut(u, rol) {
    const ad = ROL[rol].ad.toLocaleLowerCase('tr'), ik = ROL_IKON[rol];
    if (u.rol === rol) return `${ik} ${ad} (zaten ${ad})`;
    const kalan = Math.ceil(ROL_BEKLE - (G.time - (u.yorumRolT ?? -99)));
    if (kalan > 0) return `${ik} ${ad} (${kalan} sn bekle)`;
    if (u.hediyeRol && G.time - u.rolT < 120) return `${ik} ${ad} (hediyeyle aldığı rolü 2 dk bırakamaz)`;
    if (rol !== 'yeniceri' && alay.sayi(rol) >= ROL[rol].max) {
      const aday = alay.uyeler.filter((x) => x.rol === rol && !x.hediyeRol && G.time - (x.rolT || 0) > ROL_BEKLE).sort((a, b) => (b.autoRole - a.autoRole) || (a.rolT - b.rolT))[0];
      if (!aday) return `${ik} ${ad} (yer dolu, hediyeyle alınabilir)`;
      aday.autoRole = false; alay.ekle(aday, 'yeniceri'); aday.rolT = G.time;
      G.emit('announce', `${ik} ${u.nick}, ${aday.nick}'in yerine geçti!`);
    } else G.emit('announce', rol === 'yeniceri' ? `⚔️ ${u.nick} yeniçeri saflarına döndü` : `${ik} ${u.nick} artık ${ad}!`);
    alay.ekle(u, rol);
    u.autoRole = false; u.hediyeRol = false; u.rolT = G.time; u.yorumRolT = G.time;
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
    if (has(t, 'selam', 'slm', 'merhaba', ' sa ', ' hey')) {
      G.emit('chipHit', 'selam'); bul.push('👋 selam');
      alay.selam(u, G.time);
      if (G.time - G.selamT > 6) {
        G.selamT = G.time; alay.selam('padisah', G.time + 0.4);
        G.emit('announce', `👋 Padişah, ${u.nick}'i selamladı`);
        G.emit('focus', 'padisah');
      }
    }
    if (has(t, 'yasa', 'padisahim', 'sultanim')) {
      G.emit('chipHit', 'yasa'); bul.push('📣 çok yaşa');
      if (G.time - G.coskuT > 5) {
        G.coskuT = G.time; alay.cosku(G.time); G.addEnergy(4);
        G.emit('announce', '📣 Padişahım çok yaşa!');
        G.fx.push({ type: 'yasa', at: u });
      } else { const U = u.ch && (u.ch.userData.binici || u.ch.userData); if (U) U.cosT = G.time; }
    }
    // harita yorumla açılmaz: sadece yayıncı (kontrol paneli düğmesi / M tuşu)
    if (has(t, 'hizlan', 'hizli', 'kos', 'dortnala', 'cabuk')) { G.addEnergy(2); G.emit('chipHit', 'begen'); bul.push('💨 hızlan'); }
    if (has(t, 'zipla', 'hop')) { u.ziplaT = G.time; G.emit('chipHit', 'hop'); bul.push('🤸 zıpla'); }
    const rolIstek = has(t, 'sancak', 'bayrak') ? 'sancak' : has(t, 'mehter', 'davul', 'zurna') ? 'mehter' : has(t, 'sipahi', 'atli', 'ata bin') ? 'sipahi'
      : has(t, 'musahip') ? 'musahip' : has(t, 'yeniceri', 'yaya') ? 'yeniceri' : null;
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
      G.emit('announce', `🎁 ${u.nick} alaya hediye gönderdi!`);
      if (total >= 100) G.emit('banner', { user: u, gift: gf, count: cnt, total, text: '🎉 Alay alkışlıyor!' });
    }
    G.fx.push({ type: 'konfeti', n: total >= 1000 ? 280 : m ? 140 : total >= 100 ? 120 : 0 });
    alay.dizil();
    ranks();
  }

  const BANNER = {
    sancak: '🚩 Sancağı kaptı!', mehter: '🥁 Mehter takımına katıldı!', sipahi: '🐎 Atlı sipahi oldu!',
    musahip: '👑 Padişahın musahibi oldu!', altin: '💰 Padişah halka altın saçtı!', dortnala: '💨 Alay dörtnala!',
  };
  function action(r, u, gf, cnt, total) {
    G.emit('ruleHit', r.eylem);
    switch (r.eylem) {
      case 'sancak': case 'mehter': case 'sipahi': case 'musahip':
        rolVer(u, r.eylem);
        G.emit('announce', `${{ sancak: '🚩', mehter: '🥁', sipahi: '🐎', musahip: '👑' }[r.eylem]} ${u.nick} artık ${ROL[r.eylem].ad.toLocaleLowerCase('tr')}!`);
        G.emit('focus', 'mehter');
        break;
      case 'altin':
        G.fx.push({ type: 'altin', n: 40 + Math.min(80, cnt * 20) }); G.addEnergy(6); alay.selam('padisah', G.time);
        G.emit('announce', `💰 Padişah, ${u.nick} adına halka altın saçtı!`); G.emit('focus', 'padisah');
        break;
      case 'dortnala':
        G.boostUntil = Math.max(G.boostUntil, G.time) + 25; G.energy = Math.max(G.energy, 88);
        G.emit('announce', `💨 ${u.nick}: Dörtnala! Alay hızlandı`); G.emit('focus', 'yan');
        break;
      case 'senlik':
        G.boostUntil = Math.max(G.boostUntil, G.time) + 20; G.energy = 100; alay.cosku(G.time);
        G.fx.push({ type: 'fisek', n: 10 });
        G.emit('announce', `🎆 ${u.nick} şenlik ateşi yaktı!`);
        G.emit('banner', { user: u, gift: gf, count: cnt, total, text: '🎆 Bütün alay coştu!' });
        G.emit('focus', 'genis');
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
    const hedef = G.durum === 'varis' ? 0 : 1 + (G.energy / 100) * 1.4 + (G.time < G.boostUntil ? 1.1 : 0);
    G.hiz += (hedef - G.hiz) * Math.min(1, dt * 1.5);

    if (G.durum === 'yol') {
      const eski = G.s;
      G.s = Math.min(TOPLAM_S, Math.max(0, G.s + G.dir * HIZ * G.hiz * dt));
      const dKm = Math.abs(kmAt(G.s) - kmAt(eski));
      for (const u of alay.uyeler) u.km = (u.km || 0) + dKm;
      // durak geçişi (köşe taşı kartı)
      DURAKLAR.forEach((d, i) => {
        const ileri = G.dir > 0 ? d.s - G.s : G.s - d.s;
        if (ileri <= 14 && ileri > -1 && G.sonDurak !== i && !(G.dir > 0 && i === 0) && !(G.dir < 0 && i === DURAKLAR.length - 1)) {
          G.sonDurak = i;
          G.emit('durak', d);
          if (d.yapi) G.emit('yapi', d);
        }
      });
      if ((G.dir > 0 && G.s >= TOPLAM_S) || (G.dir < 0 && G.s <= 0)) varis();
    } else if (G.durum === 'varis' && G.time - G.varisT > 32) {
      G.dir = -G.dir; G.sefer++; G.durum = 'yol';
      G.emit('sefer', G.dir > 0
        ? { baslik: 'Yeni sefer: Manisa\'ya!', alt: 'Sancak yine Saruhan\'a gidiyor' }
        : { baslik: 'Cülus için İstanbul\'a!', alt: 'Şehzade Süleyman tahta çıkmaya gidiyor (1520)' });
      G.emit('announce', G.dir > 0 ? '🐎 Alay yeniden Manisa yolunda!' : '👑 Alay İstanbul\'a dönüyor: cülus vakti!');
    }
    rankT -= dt;
    if (rankT <= 0) { rankT = 1; G.yuruyenler = [...alay.uyeler].sort((a, b) => b.km - a.km).slice(0, 5).map((u) => ({ id: u.id, nick: u.nick, km: u.km })); G.emit('walkers'); }
    // 25 dk sessiz kalanlar alaydan ayrılır (kalabalık değilse kalırlar)
    pruneT -= dt;
    if (pruneT <= 0) {
      pruneT = 15;
      if (alay.uyeler.length > 25) for (const u of [...alay.uyeler]) if (G.time - u.lastAct > 25 * 60 && !u.gifted) { alay.cikar(u); G.users.delete(u.id); }
    }
  };

  function varis() {
    G.durum = 'varis'; G.varisT = G.time;
    const hedef = G.dir > 0 ? DURAKLAR[DURAKLAR.length - 1] : DURAKLAR[0];
    G.emit('varis', { hedef, km: TOPLAM_KM, yuruyenler: [...alay.uyeler].sort((a, b) => b.km - a.km).slice(0, 3) });
    G.emit('announce', `🏰 ${hedef.ad}'ya varıldı! ${TOPLAM_KM} km yol bitti`);
    G.fx.push({ type: 'konfeti', n: 300 }); G.fx.push({ type: 'fisek', n: 8 });
    alay.cosku(G.time);
  }

  G.reset = () => {
    for (const u of [...alay.uyeler]) alay.cikar(u);
    G.users.clear(); G.scores.clear(); G.top = []; G.yuruyenler = [];
    G.s = 0; G.dir = 1; G.sefer = 1; G.durum = 'yol'; G.energy = 0; G.likes = 0; G.diamonds = 0; G.sonDurak = 0;
    G.emit('board'); G.emit('walkers');
  };
  // ---------- durum kaydı (F5 / yeniden açılışta kaldığı yerden) ----------
  G.kaydet = () => ({
    v: 1, t: Date.now(), s: G.s, dir: G.dir, sefer: G.sefer, durum: G.durum, energy: G.energy, likes: G.likes, diamonds: G.diamonds, sonDurak: G.sonDurak,
    scores: [...G.scores.values()],
    uyeler: [...alay.uyeler].sort((a, b) => (a.joinT ?? 0) - (b.joinT ?? 0)).map((u) => ({ id: u.id, nick: u.nick, rol: u.rol, puan: u.puan || 0, km: u.km || 0, autoRole: !!u.autoRole, gifted: !!u.gifted, sessiz: G.time - u.lastAct })),
  });
  G.yukle = (d) => {
    if (!d || d.v !== 1) return false;
    G.reset();
    Object.assign(G, { s: d.s || 0, dir: d.dir || 1, sefer: d.sefer || 1, durum: 'yol', energy: d.energy || 0, likes: d.likes || 0, diamonds: d.diamonds || 0, sonDurak: d.sonDurak ?? 0 });
    if (d.durum === 'varis') { G.durum = 'varis'; G.varisT = G.time - 25; }
    for (const sc of d.scores || []) G.scores.set(sc.id, { ...sc });
    (d.uyeler || []).forEach((x, i) => {
      const u = { id: x.id, nick: x.nick, km: x.km, puan: x.puan, autoRole: x.autoRole, gifted: x.gifted, joinT: G.time - 1000 + i * 0.01, lastAct: G.time - (x.sessiz || 0), rolT: 0 };
      G.users.set(u.id, u);
      alay.ekle(u, x.rol || 'yeniceri');
    });
    alay.dizil();
    for (const u of alay.uyeler) if (u.ch && u.hedef) u.ch.position.copy(u.hedef); // koşarak gelmesin, yerinde başlasın
    ranks(); G.emit('walkers');
    return true;
  };
  // kontrol paneli, sahne penceresinin durumuna uyar (iki pencere tek oyun gibi)
  G.senkron = (d) => {
    if (!d || d.v !== 1) return;
    const imza = (l) => l.map((x) => x.id + ':' + x.rol + ':' + (x.puan || 0)).sort().join('|');
    if (imza(d.uyeler || []) !== imza([...alay.uyeler])) { G.yukle(d); return; }
    if (Math.abs(G.s - d.s) > 3 || G.dir !== d.dir) { G.s = d.s; G.dir = d.dir; }
    Object.assign(G, { sefer: d.sefer, energy: d.energy, likes: d.likes, diamonds: d.diamonds, sonDurak: d.sonDurak });
    if (d.durum !== G.durum) { G.durum = d.durum; if (d.durum === 'varis') G.varisT = G.time - 25; }
  };
  G.durakBilgi = () => {
    const [a, b] = aralik(G.s);
    const sonraki = G.dir > 0 ? DURAKLAR[b] : DURAKLAR[a];
    const kalan = Math.abs(sonraki.km - kmAt(G.s));
    return { sonraki, kalan };
  };
  return G;
}
