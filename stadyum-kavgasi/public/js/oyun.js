// Oyun mantığı: takımının adını yazan izleyici o takımın formasıyla sahaya iner (kişi başı en fazla bir figür,
// ölmeden tekrar gelemez). Taraftarlar dövüşür; az olan takımlar, en kalabalık takımla aralarında 15+ fark varsa
// hep ona saldırır; fark azalınca herkes en yakınındaki rakibe vurur (aynı kişiye yığılmadan).
import * as THREE from 'three';
import { TAKIMLAR, TAKIM, takimBul, norm } from './takimlar.js';
import { savasciYap, savasciGuncelle } from './savasci.js';
import { SAHA } from './stadyum.js';

export const FARK = 15; // en kalabalık takımla bu kadar fark varsa herkes ona saldırır
const MAX = 140; // sahadaki en fazla figür
const CAN = 100;
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
const rnd = (a, b) => a + Math.random() * (b - a);
const has = (t, ...keys) => keys.some((k) => (` ${t} `).includes(` ${k}`));

const DEFAULT_RULES = [
  { eylem: 'can', etiket: 'Canı Doldur', jeton: 1, ikon: '🌹', ad: ['Rose', 'Gül'], id: ['5655'] },
  { eylem: 'ofke', etiket: 'Öfke Modu', jeton: 5, ikon: '😡', ad: [], id: [] },
  { eylem: 'mesale', etiket: 'Meşale Yak', jeton: 30, ikon: '🔥', ad: [], id: [] },
  { eylem: 'dev', etiket: 'Dev Ol', jeton: 99, ikon: '💪', ad: [], id: [] },
  { eylem: 'takviye', etiket: '5 Kişilik Takviye', jeton: 199, ikon: '🚌', ad: [], id: [] },
  { eylem: 'ultras', etiket: 'Ultras Akını', minJeton: 1000, ikon: '📯', ad: [], id: [] },
];

export function createGame(scene, stadyum, FX) {
  const G = {
    users: new Map(), savascilar: new Map(), skor: new Map(), time: 0, likes: 0, diamonds: 0, viewers: 0,
    rules: DEFAULT_RULES, fx: [], yetkili: true, top: [], botNo: 0, takimKill: {},
  };
  const listeners = {};
  G.on = (k, f) => { (listeners[k] = listeners[k] || []).push(f); };
  G.emit = (k, v) => { (listeners[k] || []).forEach((f) => f(v)); };

  function ensure(user) {
    let u = G.users.get(user.id);
    if (!u) { u = { id: user.id, nick: user.nick, lastAct: G.time }; G.users.set(user.id, u); }
    if (user.nick) u.nick = user.nick;
    if (user.avatar) u.avatar = user.avatar;
    u.lastAct = G.time;
    return u;
  }
  const canli = () => [...G.savascilar.values()].filter((f) => f.durum !== 'ko');
  G.canli = canli;
  G.sayilar = () => { const s = {}; for (const f of G.savascilar.values()) if (f.durum !== 'ko') s[f.takim.id] = (s[f.takim.id] || 0) + 1; return s; };

  // ---------- sahaya giriş ----------
  // Rastgele bir yerden: dört taraftaki reklam panolarından birinin üstünden atlayıp sahaya iner.
  function girisNoktasi() {
    const d = 4.4, ic = 3.2, A = G.arena();
    if (Math.random() < 0.7) { const s = Math.random() < 0.5 ? 1 : -1, z = rnd(-A.rz, A.rz); return { x: s * (SAHA.x + d), z, ix: s * (SAHA.x + d - ic), iz: z }; }
    const s = Math.random() < 0.5 ? 1 : -1, x = rnd(-SAHA.x * 0.6, SAHA.x * 0.6);
    return { x, z: s * (SAHA.z + d), ix: x, iz: s * (SAHA.z + d - ic) };
  }
  // Kavga alanı: saha ortasında, dikey ekrana uysun diye boyuna uzun elips. Kalabalık arttıkça büyür.
  let arenaN = 0;
  G.arena = () => { const rx = 4.5 + Math.sqrt(arenaN) * 0.62; return { rx, rz: rx * 1.7 }; };
  // kavganın ağırlık merkezi (yeni gelen oraya koşar)
  G.merkez = () => {
    const l = canli(); if (!l.length) return { x: 0, z: 0 };
    let x = 0, z = 0; for (const f of l) { x += f.x; z += f.z; } return { x: x / l.length, z: z / l.length };
  };

  function sahayaIn(u, T, opt = {}) {
    if (G.savascilar.size >= MAX) { G.emit('announce', '🏟️ Saha dolu! Biri düşünce gir.'); return null; }
    const g = opt.yer || girisNoktasi();
    const no = opt.no ?? (1 + Math.floor(Math.random() * 98));
    const ch = savasciYap(T, no);
    ch.position.set(g.x, 0, g.z);
    scene.add(ch);
    const f = {
      id: u.id, u, takim: T, hp: opt.hp ?? CAN, maxHp: opt.maxHp ?? CAN, ch, x: g.x, z: g.z, yon: Math.atan2(-g.x, -g.z), hiz: 0, faz: Math.random() * 6,
      tohum: Math.random() * 10, anim: null, durum: 'giris', hedef: null, hedefT: 0, cd: rnd(0.3, 1), kill: opt.kill || 0, bot: !!u.bot,
      no, olcek: 1, ofkeBitis: 0, devBitis: 0, girisT: G.time, gx: g.ix, gz: g.iz,
    };
    if (opt.yerinde) { f.durum = 'kavga'; } else { f.anim = { ad: 'atla', t: 0, sure: 0.75 }; f.atla = { x0: g.x, z0: g.z, x1: g.ix, z1: g.iz }; }
    const eski = G.savascilar.get(u.id);
    if (eski && eski !== f) scene.remove(eski.ch); // yere serilmiş eski hali (yatan beden) hemen kalksın
    G.savascilar.set(u.id, f);
    if (!u.bot) { u.sonTakim = T.id; u.f = f; }
    return f;
  }

  // Kişi sahadaysa (koşarak giriyor ya da dövüşüyor) hiçbir şey olmaz: yeni karakter yok, takım değişmez.
  G.sahadaki = (u) => {
    const f = G.savascilar.get(u.id);
    if (f && f.durum !== 'ko') return f;
    for (const o of G.savascilar.values()) if (!o.bot && o.durum !== 'ko' && (o.u === u || o.u.id === u.id)) return o;
    return null;
  };
  function katil(u, T, neden) {
    if (G.sahadaki(u)) return null;
    const f = sahayaIn(u, T);
    if (!f) return null;
    G.emit('feed', { kind: 'join', user: u, text: `${T.ad} formasıyla sahaya indi` });
    G.emit('giris', { f, neden });
    G.emit('chipHit', T.id);
    return f;
  }
  // takım belirtmeyen: son takımı, yoksa sahada en az kişisi olan takım (sahada kimse yoksa rastgele)
  function varsayilanTakim(u) {
    if (u.sonTakim && TAKIM[u.sonTakim]) return TAKIM[u.sonTakim];
    const s = G.sayilar(), ids = Object.keys(s);
    if (ids.length >= 2) return TAKIM[ids.sort((a, b) => s[a] - s[b])[0]];
    return TAKIMLAR[Math.floor(Math.random() * TAKIMLAR.length)];
  }

  // ---------- hedef seçimi ----------
  function hedefSec(f) {
    const s = G.sayilar();
    let enCok = null, n = -1;
    for (const [id, c] of Object.entries(s)) if (c > n) { n = c; enCok = id; }
    const benim = s[f.takim.id] || 0;
    const herkesOna = enCok && enCok !== f.takim.id && n - benim >= FARK;
    const saldiran = new Map();
    for (const o of G.savascilar.values()) if (o.hedef && o.durum !== 'ko') saldiran.set(o.hedef, (saldiran.get(o.hedef) || 0) + 1);
    let en = null, enP = 1e9;
    for (const o of G.savascilar.values()) {
      if (o === f || o.durum === 'ko' || o.takim === f.takim || o.durum === 'giris') continue;
      if (herkesOna && o.takim.id !== enCok) continue;
      const d = Math.hypot(o.x - f.x, o.z - f.z);
      // yakın olan seçilir; ama aynı kişiye çok kişi yığılmasın (fark büyükse yığılma daha serbest)
      const p = d + (saldiran.get(o) || 0) * (herkesOna ? 1.2 : 3) + Math.random() * 2.5 + Math.hypot(o.x, o.z * 0.6) * 0.25; // ortadakiler biraz öncelikli: kavga dağılmasın
      if (p < enP) { enP = p; en = o; }
    }
    f.hedef = en; f.hedefT = G.time + rnd(1.6, 3.2); f.herkesOna = herkesOna;
    if (en && Math.random() < 0.25 && Math.hypot(en.x - f.x, en.z - f.z) > 4) f.tehditEt = true;
  }

  // ---------- dövüş ----------
  const ANIM = { yumruk: 0.38, kroşe: 0.5, tekme: 0.6, darbe: 0.38, blok: 0.4, nakavt: 99, atla: 0.75, kutlama: 2, tehdit: 1.2 };
  const VURUS = { yumruk: [0.14, 4, 7, 0.3], kroşe: [0.2, 6, 9, 0.5], tekme: [0.24, 7, 11, 0.7] }; // [an, min, max, itme]
  const ISKA = 0.22; // vuruşların bir kısmı boşa gider (kavga uzun ve izlenir olsun)
  const tmp = new THREE.Vector3();
  const basNoktasi = (f, v) => { f.ch.userData.J.bas.getWorldPosition(v); v.y += 0.1 * f.olcek; return v; };
  function saldir(f) {
    const r = Math.random();
    const ad = r < 0.48 ? 'yumruk' : r < 0.8 ? 'kroşe' : 'tekme';
    f.anim = { ad, t: 0, taraf: Math.random() < 0.5 ? 'L' : 'R', vurdu: false };
    f.cd = rnd(0.9, 1.7) * (f.ofkeBitis > G.time ? 0.7 : 1);
  }
  function isabet(f) {
    const o = f.hedef, a = f.anim;
    if (!o || o.durum === 'ko') return;
    const d = Math.hypot(o.x - f.x, o.z - f.z), menzil = 0.75 * (f.olcek + o.olcek) / 2 + 0.55;
    if (d > menzil + 0.35 || Math.random() < ISKA) { G.emit('iska', f); return; }
    const [, mn, mx, itme] = VURUS[a.ad];
    let hasar = rnd(mn, mx) * (f.ofkeBitis > G.time ? 2 : 1) * (f.devBitis > G.time ? 1.6 : 1);
    const yon = Math.atan2(o.x - f.x, o.z - f.z);
    basNoktasi(o, tmp);
    if (a.ad === 'tekme') tmp.y -= 0.6 * o.olcek;
    const bloke = (!o.anim || o.anim.ad === 'darbe') && Math.random() < 0.16 && o.durum === 'kavga';
    if (bloke) {
      hasar *= 0.2; o.anim = { ad: 'blok', t: 0 }; FX.darbe(tmp, 0.5, '#9fd8ff');
    } else {
      o.anim = { ad: 'darbe', t: 0, yon: Math.random() < 0.5 ? -1 : 1 };
      FX.darbe(tmp, hasar > 14 ? 1.6 : 1, f.ofkeBitis > G.time ? '#ff4b2b' : '#ffe066');
      const it = itme / o.olcek * (f.devBitis > G.time ? 2 : 1);
      o.x += Math.sin(yon) * it; o.z += Math.cos(yon) * it;
      G.emit('vurus', { f, o, hasar, guc: hasar / 15 });
    }
    o.sonVuran = f;
    if (!G.yetkili) return; // kontrol paneli: can ve ölümler sahne penceresinden gelir
    o.hp -= hasar;
    G.emit('hasar', { o, hasar: Math.round(hasar), bloke });
    if (o.hp <= 0) nakavt(o, f);
  }
  function nakavt(o, f) {
    if (o.durum === 'ko') return;
    o.hp = 0; o.durum = 'ko'; o.koT = G.time; o.hedef = null;
    o.anim = { ad: 'nakavt', t: 0, yon: Math.random() < 0.5 ? -1 : 1 };
    o.olduren = f ? f.u.nick : null;
    // nakavtta düşme yönü: vurandan geriye
    if (f) o.yon = Math.atan2(f.x - o.x, f.z - o.z);
    setTimeout(() => FX.toz(o.ch.position), 450);
    FX.sersem(o.ch, 3);
    if (f) {
      f.kill++;
      if (!f.bot) {
        const sc = G.skor.get(f.u.id) || { id: f.u.id, nick: f.u.nick, kill: 0, takim: f.takim.id };
        sc.kill++; sc.nick = f.u.nick; sc.takim = f.takim.id; sc.avatar = f.u.avatar; G.skor.set(f.u.id, sc);
        siralama();
      }
      G.takimKill[f.takim.id] = (G.takimKill[f.takim.id] || 0) + 1;
      if (f.kill > 0 && f.kill % 5 === 0 && !f.bot) G.emit('banner', { user: f.u, takim: f.takim, text: `🔥 ${f.kill} kişiyi yere serdi!`, sub: `${f.takim.ad} taraftarı coştu` });
    }
    G.emit('ko', { o, f });
    if (!o.bot) G.emit('feed', { kind: 'ko', user: o.u, text: f ? `${f.u.nick} tarafından yere serildi 💥` : 'yere serildi 💥' });
    stadyum.cosku = Math.min(1, stadyum.cosku + 0.15);
  }
  function siralama() {
    G.top = [...G.skor.values()].sort((a, b) => b.kill - a.kill).slice(0, 5);
    G.emit('board');
  }

  // ---------- olaylar ----------
  G.handle = (ev) => {
    if (!ev || !ev.type) return;
    if (ev.type === 'viewers') { G.viewers = ev.count | 0; return; }
    if (!ev.user || !ev.user.id) return;
    if (ev.type === 'member') return;
    const u = ensure(ev.user);
    const f = G.sahadaki(u);
    const sahada = !!f;
    switch (ev.type) {
      case 'chat': {
        const text = String(ev.text || '').slice(0, 120);
        const T = takimBul(text), t = norm(text), bul = [];
        if (sahada) {
          u.bubble = { text, t: G.time };
          if (T && T !== f.takim) bul.push(`⛔ zaten ${f.takim.ad} formasıyla sahada (ölmeden takım değişmez)`);
          else if (T) bul.push(`✔ zaten sahada (${f.takim.ad})`);
          if (!f.anim && f.durum === 'kavga') f.anim = { ad: 'tehdit', t: 0 };
        } else if (T) {
          if (katil(u, T, 'yorum')) bul.push(`⚽ ${T.ad} formasıyla sahaya indi`);
          else bul.push('🏟️ saha dolu');
        } else if (has(t, 'katil', 'gir', 'savas', 'kavga', 'dov')) {
          const T2 = varsayilanTakim(u);
          if (katil(u, T2, 'yorum')) bul.push(`⚽ ${T2.ad} formasıyla sahaya indi (takım yazmadı)`);
        } else {
          bul.push('💬 takım adı yok (ör. Galatasaray, Fener, Trabzon yaz)');
        }
        G.emit('feed', { kind: 'chat', user: u, text });
        G.emit('komut', { user: u, text, bul });
        break;
      }
      case 'like': {
        const n = Math.max(1, ev.count | 0);
        G.likes += n;
        stadyum.cosku = Math.min(1, stadyum.cosku + 0.01 * n);
        if (sahada) {
          if (G.yetkili) f.hp = Math.min(f.maxHp, f.hp + Math.min(8, n));
          G.fx.push({ type: 'kalp', at: f, n: Math.min(n, 4) });
        }
        if (G.time - (u.likeFeedT ?? -99) > 6) { u.likeFeedT = G.time; G.emit('feed', { kind: 'like', user: u, text: `${n} beğeni ❤️${sahada ? ' (can +)' : ''}` }); }
        G.emit('chipHit', 'begen');
        break;
      }
      case 'gift': gift(u, ev.gift || {}); break;
      case 'follow': G.emit('feed', { kind: 'follow', user: u, text: 'takip etti ➕' }); break;
      case 'share': G.emit('feed', { kind: 'share', user: u, text: 'yayını paylaştı 🔗' }); break;
    }
  };

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
    G.diamonds += total;
    const m = G.matchRule({ ...gf, diamonds: dia });
    G.emit('giftlog', { user: u, gift: gf, dia, cnt, match: m });
    G.emit('feed', { kind: 'gift', user: u, text: `${gf.icon || '🎁'} ${gf.name || 'Hediye'} ×${cnt}${m ? ' → ' + m.r.etiket : ''} · ${fmt(total)} 💎` });
    let f = G.sahadaki(u);
    if (!f) f = katil(u, varsayilanTakim(u), 'hediye'); // hediye atan sahada değilse iner
    if (!f) return;
    if (m) { action(m.r, u, f, gf, cnt, total); G.emit('ruleHit', m.r.eylem); }
    else {
      if (G.yetkili) f.hp = Math.min(f.maxHp, f.hp + 25);
      FX.can(f.ch);
      G.emit('announce', `🎁 ${u.nick} hediye attı, canı arttı!`);
    }
    G.fx.push({ type: 'konfeti', n: total >= 1000 ? 260 : total >= 100 ? 120 : 0 });
  }

  function takviye(u, T, n) {
    let k = 0;
    for (let i = 0; i < n && G.savascilar.size < MAX; i++) {
      const b = { id: 'bot_' + (++G.botNo), nick: `${u.nick}'in adamı`, bot: true, sahip: u.id };
      setTimeout(() => sahayaIn(b, T), i * 160);
      k++;
    }
    return k;
  }

  function action(r, u, f, gf, cnt, total) {
    const T = f.takim;
    const banner = (text, sub) => G.emit('banner', { user: u, takim: T, gift: gf, count: cnt, total, text, sub });
    switch (r.eylem) {
      case 'can':
        if (G.yetkili) f.hp = f.maxHp;
        FX.can(f.ch);
        G.emit('announce', `🌹 ${u.nick}'in canı doldu!`);
        break;
      case 'ofke':
        f.ofkeBitis = G.time + 20 * cnt;
        banner('😡 ÖFKE MODU! Çift hasar', `${T.ad} taraftarı kudurdu (20 sn)`);
        break;
      case 'mesale':
        for (const o of G.savascilar.values()) if (o.takim === T && o.durum !== 'ko') { if (G.yetkili) o.hp = Math.min(o.maxHp, o.hp + 30); FX.can(o.ch); }
        for (let i = 0; i < 3; i++) setTimeout(() => FX.mesale(stadyum.tribunNoktasi(T.id)), i * 500);
        stadyum.cosku = 1;
        banner('🔥 Tribünde meşaleler yandı!', `${T.ad} taraftarlarına +30 can`);
        break;
      case 'dev':
        f.devBitis = G.time + 45 * cnt;
        if (G.yetkili) { f.maxHp = 250; f.hp = Math.min(250, f.hp + 150); }
        banner('💪 DEV OLDU! 45 sn', `${T.ad} devi sahada`);
        break;
      case 'takviye': {
        const n = takviye(u, T, 5 * cnt);
        banner(`🚌 ${n} kişilik takviye geldi!`, `${T.ad} otobüsü stada vardı`);
        break;
      }
      case 'ultras': {
        const n = takviye(u, T, 15);
        for (const o of G.savascilar.values()) if (o.takim === T && o.durum !== 'ko') o.ofkeBitis = G.time + 20;
        for (let i = 0; i < 5; i++) setTimeout(() => FX.mesale(stadyum.tribunNoktasi(T.id)), i * 400);
        stadyum.cosku = 1;
        banner(`📯 ULTRAS AKINI! +${n} kişi`, `${T.ad} taraftarı öfkeyle saldırıyor`);
        break;
      }
    }
  }

  // ---------- her kare ----------
  let uyumT = 0;
  G.update = (dt) => {
    G.time += dt;
    const t = G.time;
    stadyum.cosku += (0.35 - stadyum.cosku) * dt * 0.05;
    const liste = [...G.savascilar.values()];
    arenaN = liste.length;
    for (const f of liste) {
      if (f.anim) { f.anim.t += dt; if (f.anim.t >= (f.anim.sure || ANIM[f.anim.ad])) { if (f.anim.ad === 'atla') { f.durum = 'giris'; f.x = f.atla.x1; f.z = f.atla.z1; } f.anim = null; } }
      // ölçek (dev)
      const hedefOlcek = f.devBitis > t ? 1.5 : 1;
      if (f.devBitis && f.devBitis <= t && f.maxHp > CAN) { f.maxHp = CAN; f.hp = Math.min(f.hp, CAN); f.devBitis = 0; }
      f.olcek += (hedefOlcek - f.olcek) * Math.min(1, dt * 3);
      if (f.ofkeBitis > t && Math.random() < dt * 14) FX.aura(f.ch, '#ff3b1f');
      if (f.devBitis > t && Math.random() < dt * 6) FX.aura(f.ch, '#ffd23f');

      let vx = 0, vz = 0, hizH = 0;
      if (f.durum === 'ko') {
        const k = t - f.koT;
        if (k > 3.2) f.ch.position.y = -(k - 3.2) * 0.5;
        if (k > 4.6) { scene.remove(f.ch); if (G.savascilar.get(f.id) === f) G.savascilar.delete(f.id); continue; }
      } else if (f.anim && f.anim.ad === 'atla') {
        const u = Math.min(1, f.anim.t / f.anim.sure);
        f.x = f.atla.x0 + (f.atla.x1 - f.atla.x0) * u; f.z = f.atla.z0 + (f.atla.z1 - f.atla.z0) * u;
        f.yon = Math.atan2(f.atla.x1 - f.atla.x0, f.atla.z1 - f.atla.z0);
      } else if (f.durum === 'giris') {
        // sahaya indikten sonra kavgaya koşar
        const A = G.arena();
        if (f.hx == null) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.7; f.hx = Math.cos(a) * A.rx * r; f.hz = Math.sin(a) * A.rz * r; }
        const dx = f.hx - f.x, dz = f.hz - f.z, d = Math.hypot(dx, dz);
        if (d < 2.5 || (f.x / A.rx) ** 2 + (f.z / A.rz) ** 2 < 0.8 || t - f.girisT > 9) f.durum = 'kavga';
        else { vx = dx / d * 6; vz = dz / d * 6; hizH = 1; }
      } else {
        if (!f.hedef || f.hedef.durum === 'ko' || !G.savascilar.has(f.hedef.id) || t > f.hedefT) hedefSec(f);
        const o = f.hedef;
        if (o) {
          const dx = o.x - f.x, dz = o.z - f.z, d = Math.hypot(dx, dz) || 0.01;
          const menzil = 0.75 * (f.olcek + o.olcek) / 2 + 0.55;
          const istenen = Math.atan2(dx, dz);
          f.yon = aciYaklas(f.yon, istenen, dt * 10);
          if (f.tehditEt && d < 6 && !f.anim) { f.tehditEt = false; f.anim = { ad: 'tehdit', t: 0 }; }
          const mesgul = f.anim && f.anim.ad !== 'tehdit';
          if (d > menzil) {
            if (!mesgul || f.anim.ad === 'darbe') { const h = (f.anim ? 1.5 : d > 4 ? 5.2 : 3) * (f.olcek > 1.2 ? 1.1 : 1); vx = dx / d * h; vz = dz / d * h; hizH = h / 5.2; }
          } else {
            f.cd -= dt;
            if (f.cd <= 0 && !f.anim) saldir(f);
            // menzildeyken yana kayarak çevresinde döner (dövüş canlı görünsün)
            if (!f.anim) { const yan = Math.sin(t * 0.9 + f.tohum) * 0.9; vx = Math.cos(istenen) * yan; vz = -Math.sin(istenen) * yan; hizH = 0.15; }
          }
        } else {
          // rakip yok: merkeze yakın gezinir, arada kutlar
          const dx = -f.x * 0.2, dz = -f.z * 0.2;
          if (Math.hypot(f.x, f.z) > 6) { const d = Math.hypot(dx, dz); vx = dx / d * 2; vz = dz / d * 2; hizH = 0.4; f.yon = aciYaklas(f.yon, Math.atan2(dx, dz), dt * 6); }
          else if (!f.anim && Math.random() < dt * 0.4) f.anim = { ad: 'kutlama', t: 0 };
        }
        if (f.anim && VURUS[f.anim.ad] && !f.anim.vurdu && f.anim.t >= VURUS[f.anim.ad][0]) { f.anim.vurdu = true; isabet(f); }
      }
      if (f.durum === 'kavga' && !(f.anim && f.anim.ad === 'nakavt')) { // elips dışına taşan içeri itilir
        const A = G.arena(), e = Math.sqrt((f.x / A.rx) ** 2 + (f.z / A.rz) ** 2);
        if (e > 1) { const k = Math.min(4, (e - 1) * 8); vx -= (f.x / e) * k * 0.3; vz -= (f.z / e) * k * 0.3; }
        else if (e > 0.5) { vx -= f.x * 0.06; vz -= f.z * 0.06; } // ortaya hafif çekim
      }
      f.x += vx * dt; f.z += vz * dt;
      if (f.duz) { const k = Math.min(dt, f.duz.kalan); f.x += f.duz.x * k; f.z += f.duz.z * k; f.duz.kalan -= k; if (f.duz.kalan <= 0) f.duz = null; }
      f.hiz += (hizH - f.hiz) * Math.min(1, dt * 8);
      f.faz += dt * (6 + f.hiz * 7);
      if (Math.hypot(vx, vz) > 0.5 && f.durum !== 'kavga') f.yon = aciYaklas(f.yon, Math.atan2(vx, vz), dt * 10);
    }
    // birbirinin içine girmesinler
    const c = canli();
    for (let i = 0; i < c.length; i++) {
      const a = c[i];
      if (a.anim && a.anim.ad === 'atla') continue;
      for (let j = i + 1; j < c.length; j++) {
        const b = c[j];
        if (b.anim && b.anim.ad === 'atla') continue;
        const dx = b.x - a.x, dz = b.z - a.z, min = 0.62 * (a.olcek + b.olcek) / 2;
        if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
        const d = Math.hypot(dx, dz) || 0.01;
        if (d < min) { const p = (min - d) / 2 / d; a.x -= dx * p; a.z -= dz * p; b.x += dx * p; b.z += dz * p; }
      }
    }
    for (const f of G.savascilar.values()) {
      if (!(f.anim && f.anim.ad === 'atla')) { f.x = Math.max(-SAHA.x + 0.8, Math.min(SAHA.x - 0.8, f.x)); f.z = Math.max(-SAHA.z + 0.8, Math.min(SAHA.z - 0.8, f.z)); }
      f.ch.position.x = f.x; f.ch.position.z = f.z;
      f.ch.rotation.y = f.yon;
      f.ch.scale.setScalar(f.olcek);
      savasciGuncelle(f, dt, t);
    }
    if ((uyumT -= dt) <= 0) { uyumT = 4; stadyum.tribunUyum(G.sayilar()); }
  };
  const aciYaklas = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * Math.min(1, k); };

  G.reset = () => {
    for (const f of G.savascilar.values()) scene.remove(f.ch);
    G.savascilar.clear(); G.users.clear(); G.skor.clear(); G.top = []; G.takimKill = {};
    G.likes = 0; G.diamonds = 0;
    G.emit('board');
  };

  // ---------- durum kaydı (F5 / yeniden açılışta kaldığı yerden) ----------
  G.kaydet = () => ({
    v: 1, t: Date.now(), likes: G.likes, diamonds: G.diamonds, botNo: G.botNo, takimKill: G.takimKill,
    skor: [...G.skor.values()],
    sonTakim: [...G.users.values()].filter((u) => u.sonTakim).map((u) => [u.id, u.nick, u.sonTakim, u.avatar || '']),
    savascilar: [...G.savascilar.values()].map((f) => ({
      id: f.id, nick: f.u.nick, avatar: f.u.avatar, bot: f.bot, sahip: f.u.sahip, takim: f.takim.id, hp: Math.round(f.hp), maxHp: f.maxHp, x: +f.x.toFixed(2), z: +f.z.toFixed(2),
      kill: f.kill, no: f.no, ko: f.durum === 'ko', olduren: f.olduren, ofke: Math.max(0, f.ofkeBitis - G.time), dev: Math.max(0, f.devBitis - G.time),
    })),
  });
  function kur(x) {
    const T = TAKIM[x.takim]; if (!T) return null;
    let u;
    if (x.bot) u = { id: x.id, nick: x.nick, bot: true, sahip: x.sahip };
    else { u = G.users.get(x.id) || { id: x.id, nick: x.nick, avatar: x.avatar, lastAct: G.time }; G.users.set(u.id, u); }
    const f = sahayaIn(u, T, { yer: { x: x.x, z: x.z, ix: x.x, iz: x.z }, yerinde: true, hp: x.hp, maxHp: x.maxHp, kill: x.kill, no: x.no });
    if (!f) return null;
    if (x.ofke) f.ofkeBitis = G.time + x.ofke;
    if (x.dev) { f.devBitis = G.time + x.dev; f.olcek = 1.5; }
    return f;
  }
  G.yukle = (d) => {
    if (!d || d.v !== 1) return false;
    G.reset();
    Object.assign(G, { likes: d.likes || 0, diamonds: d.diamonds || 0, botNo: d.botNo || 0, takimKill: d.takimKill || {} });
    for (const sc of d.skor || []) G.skor.set(sc.id, { ...sc });
    for (const [id, nick, st, av] of d.sonTakim || []) { const u = { id, nick, sonTakim: st, lastAct: G.time }; if (av) u.avatar = av; G.users.set(id, u); }
    for (const x of d.savascilar || []) if (!x.ko) kur(x);
    siralama();
    return true;
  };
  // kontrol paneli, sahne penceresinin durumuna uyar: gelen/giden, can, nakavt; konum farkı yumuşakça kapanır
  G.senkron = (d) => {
    if (!d || d.v !== 1) return;
    const gelen = new Map((d.savascilar || []).map((x) => [x.id, x]));
    for (const f of [...G.savascilar.values()]) {
      const x = gelen.get(f.id);
      if (!x) { if (f.durum !== 'ko' && G.time - f.girisT > 5) nakavt(f, null); continue; } // yeni girenler kayda henüz düşmemiş olabilir
      if (x.ko && f.durum !== 'ko') { nakavt(f, null); f.olduren = x.olduren; continue; }
      f.hp = x.hp; f.maxHp = x.maxHp; f.kill = x.kill;
      // Konum: kayıt 2 sn'ye kadar eski olabiliyor; her seferinde geri çekmek koşanları "2 ileri 1 geri" oynatıyordu.
      // Küçük farklar bırakılır, büyük fark (3 m+) ise bir saniyeye yayılarak yumuşakça kapatılır.
      if (f.durum === 'kavga') { const dx = x.x - f.x, dz = x.z - f.z; if (Math.hypot(dx, dz) > 3) f.duz = { x: dx, z: dz, kalan: 1 }; }
    }
    for (const x of d.savascilar || []) { const e = G.savascilar.get(x.id); if (!x.ko && (!e || e.durum === 'ko')) kur(x); }
    G.likes = Math.max(G.likes, d.likes || 0); G.diamonds = Math.max(G.diamonds, d.diamonds || 0);
    G.skor.clear(); for (const sc of d.skor || []) G.skor.set(sc.id, { ...sc });
    G.takimKill = d.takimKill || {};
    siralama();
  };
  G.basNoktasi = basNoktasi;
  return G;
}
