// Arayüz: isim etiketleri/balonlar/efektler (2D katman), köşe taşı şeridi, durak kartları,
// duyurular, varış kartı ve kontrol paneli.
import * as THREE from 'three';
import { LEVELS } from './oyun.js';
import { DURAKLAR, TOPLAM_S, TOPLAM_KM, kmAt } from './rota.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const FONT = 'Nunito, "Segoe UI", "Segoe UI Emoji", system-ui, sans-serif';
const W = 1080, H = 1920;

export function createUI(G, camera, alay, hooks) {
  const UI = {};
  const ov = $('ov'), ctx = ov.getContext('2d');
  let q = 1;
  const aq = [], bq = [];
  let aT = 0, bT = 0, statT = 0, annOn = false, banOn = false, dkT = 0, bkT = 0;
  const parts = [];

  UI.fit = () => {
    const wrap = $('stageWrap'), w = wrap.clientWidth, h = wrap.clientHeight;
    const s = Math.min(w / W, h / H);
    $('stage').style.transform = `translate(${(w - W * s) / 2}px,${(h - H * s) / 2}px) scale(${s})`;
    q = clamp(Math.round(s * (window.devicePixelRatio || 1) * 4) / 4, 0.5, 1);
    ov.width = W * q; ov.height = H * q;
    hooks.onQuality(q);
  };
  addEventListener('resize', UI.fit);

  // ---------- 2D yardımcılar ----------
  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function pill(x, y, txt, bg, fg, fs) {
    ctx.font = `800 ${fs}px ${FONT}`;
    const w = ctx.measureText(txt).width + fs * 1.1, h = fs * 1.6, X = clamp(x - w / 2, 4, W - w - 4);
    ctx.fillStyle = bg; rr(X, y - h, w, h, h / 2); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, X + w / 2, y - h / 2 + 1);
    return h;
  }
  function bubble(gx, y, text, a, fs) {
    if (text.length > 30) text = text.slice(0, 29) + '…';
    ctx.font = `700 ${fs}px ${FONT}`;
    const w = ctx.measureText(text).width + fs * 1.3, h = fs * 1.75, tl = fs * 0.6, X = clamp(gx - w / 2, 4, W - w - 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff8e8'; rr(X, y - h - tl, w, h, fs * 0.7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(gx - tl * 0.6, y - tl - 0.5); ctx.lineTo(gx + tl * 0.6, y - tl - 0.5); ctx.lineTo(gx, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2410'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, X + w / 2, y - h / 2 - tl + 1);
    ctx.globalAlpha = 1;
  }
  const tmp = new THREE.Vector3();
  function project(v) {
    tmp.copy(v).project(camera);
    if (tmp.z > 1 || tmp.z < -1) return null;
    return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H };
  }
  const headPos = (o) => { const p = o.getWorldPosition(new THREE.Vector3()); p.y += 0.45; return p; };

  // ---------- her kare: etiketler + efektler ----------
  UI.draw = (dt, haritaA) => {
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const fade = 1 - haritaA;
    if (fade > 0.02) {
      ctx.globalAlpha = fade;
      const items = [];
      for (const u of alay.uyeler) {
        if (!u.bas) continue;
        const hp = headPos(u.bas), d = camera.position.distanceTo(hp), p = project(hp);
        if (!p || d > 60 || p.x < -80 || p.x > W + 80 || p.y < 0 || p.y > H) continue;
        items.push({ u, p, d, k: clamp(7 / d, 0.4, 1.25) });
      }
      // padişah ve paşa
      for (const [o, ad, renk] of [[alay.padisahBas, 'Kanuni Sultan Süleyman', 'rgba(179,18,46,.95)'], [alay.ibrahimBas, 'Pargalı İbrahim Paşa', 'rgba(31,107,58,.95)']]) {
        const hp = headPos(o); hp.y += 0.35; const d = camera.position.distanceTo(hp), p = project(hp);
        if (p && d < 40) items.push({ vip: ad, renk, p, d, k: clamp(7 / d, 0.5, 1.3) });
      }
      items.sort((a, b) => b.d - a.d);
      ctx.globalAlpha = fade;
      for (const it of items) {
        const { u, p, k } = it;
        let y = p.y;
        if (it.vip) { pill(p.x, y, it.vip, it.renk, '#fff', 26 * k); continue; }
        const rol = u.rol && u.rol !== 'yeniceri' ? { mehter: '🥁 Mehter', sancak: '🚩 Sancaktar', musahip: '👑 Musahip', sipahi: '🐎 Sipahi' }[u.rol] : null;
        y -= pill(p.x, y, u.nick, 'rgba(30,18,8,.74)', '#fff', 22 * k) + 4;
        if (rol) y -= pill(p.x, y, rol, 'rgba(232,194,90,.96)', '#3a2300', 20 * k) + 4;
        const b = u.bubble;
        if (b) {
          const age = G.time - b.t;
          if (age > 5.5) u.bubble = null;
          else { bubble(p.x, y, b.text, Math.min(1, age * 6, (5.5 - age) * 2) * fade, 26 * k); ctx.globalAlpha = fade; }
        } else if (G.time - (u.welcomeT ?? -99) < 3) {
          ctx.globalAlpha = Math.min(1, (3 - (G.time - u.welcomeT)) * 2) * fade;
          pill(p.x, y, 'Alaya hoş geldin! ⚔️', 'rgba(61,200,120,.95)', '#05301d', 20 * k);
          ctx.globalAlpha = fade;
        }
      }
      ctx.globalAlpha = 1;
    }

    // yeni efektler
    for (const f of G.fx) {
      if (f.type === 'konfeti') for (let i = 0; i < f.n; i++) parts.push({ k: 'c', x: Math.random() * W, y: -Math.random() * 500, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 300, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, w: 12 + Math.random() * 10, h: 6 + Math.random() * 6, col: ['#e8c25a', '#b3122e', '#ffffff', '#2f6b3a', '#ffd56a'][i % 5], life: 7 });
      else if (f.type === 'kalp' && f.at && f.at.bas) { const p = project(headPos(f.at.bas)); if (p) for (let i = 0; i < f.n; i++) parts.push({ k: 'h', x: p.x + (Math.random() - 0.5) * 30, y: p.y - 40, vy: -90 - Math.random() * 80, ph: Math.random() * 6, life: 1.7, s: 14 + Math.random() * 10, col: ['#ff4f7b', '#ff7aa2', '#ff2d55'][i % 3] }); }
      else if (f.type === 'altin') { const o = headPos(alay.padisahBas); for (let i = 0; i < f.n; i++) parts.push({ k: 'g', w: o.clone(), v: new THREE.Vector3((Math.random() - 0.5) * 7, 3 + Math.random() * 4, (Math.random() - 0.5) * 7), life: 2.4 + Math.random(), t0: i * 0.02 }); }
      else if (f.type === 'fisek') for (let i = 0; i < f.n; i++) parts.push({ k: 'f', t0: i * 0.45, x: 120 + Math.random() * (W - 240), y: 500 + Math.random() * 500, life: 2.2, col: ['#ffd56a', '#ff4f7b', '#7ad1ff', '#9ee37d', '#ffffff'][i % 5] });
      else if (f.type === 'yasa' && f.at && f.at.bas) parts.push({ k: 'e', w: headPos(f.at.bas), e: '📣', life: 2, t0: 0 });
    }
    G.fx.length = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.t0 > 0) { p.t0 -= dt; continue; }
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.k === 'c') {
        p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7)); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      } else if (p.k === 'h') {
        p.y += p.vy * dt; p.x += Math.sin(G.time * 3 + p.ph) * 0.6;
        ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.col; const s = p.s, x = p.x, y = p.y;
        ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.5, y - s, x, y - s * 0.45); ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.3, x, y + s * 0.35); ctx.fill(); ctx.globalAlpha = 1;
      } else if (p.k === 'g') { // altın sikke: 3B fırlar, düşer
        p.v.y -= 9.8 * dt; p.w.addScaledVector(p.v, dt); if (p.w.y < 0.05) { p.w.y = 0.05; p.v.set(0, 0, 0); }
        const s = project(p.w); if (!s) continue;
        const r = clamp(150 / camera.position.distanceTo(p.w), 4, 16);
        ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = '#ffd24a'; ctx.strokeStyle = '#a8761a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * Math.abs(Math.cos(G.time * 9 + i)), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (p.k === 'f') { // havai fişek
        const age = 2.2 - p.life, R = 60 + age * 160;
        ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.col;
        for (let a = 0; a < 18; a++) { const an = (a / 18) * Math.PI * 2; ctx.beginPath(); ctx.arc(p.x + Math.cos(an) * R, p.y + Math.sin(an) * R + age * age * 30, 5, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
      } else if (p.k === 'e') {
        p.w.y += dt * 0.6; const s = project(p.w); if (!s) continue;
        ctx.globalAlpha = Math.min(1, p.life); ctx.font = `46px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(p.e, s.x, s.y); ctx.globalAlpha = 1;
      }
    }
  };

  // ---------- köşe taşı şeridi ----------
  const tasEls = [];
  function seritKur() {
    const box = $('seritTaslar'); box.innerHTML = '';
    DURAKLAR.forEach((d, i) => {
      if (d.biyom === 'deniz' && i < 2) { tasEls.push(null); return; }
      const e = document.createElement('div');
      e.className = 'tas' + (d.yapi === 'saray' || d.ad === 'Bursa' ? ' buyuk' : '');
      e.style.left = (d.s / TOPLAM_S) * 100 + '%';
      box.appendChild(e); tasEls.push(e);
    });
  }
  seritKur();
  function seritGuncelle() {
    const r = G.s / TOPLAM_S;
    if (G.dir > 0) { $('seritDolu').style.left = '0'; $('seritDolu').style.width = r * 100 + '%'; }
    else { $('seritDolu').style.left = r * 100 + '%'; $('seritDolu').style.width = (1 - r) * 100 + '%'; }
    $('seritBiz').style.left = r * 100 + '%';
    $('seritBiz').style.transform = G.dir > 0 ? 'scaleX(-1)' : 'none';
    DURAKLAR.forEach((d, i) => { const e = tasEls[i]; if (e) e.classList.toggle('gecti', G.dir > 0 ? d.s <= G.s : d.s >= G.s); });
    const { sonraki, kalan } = G.durakBilgi();
    $('yolSonraki').textContent = G.durum === 'varis' ? (G.dir > 0 ? 'Manisa' : 'İstanbul') : sonraki.ad;
    $('yolKalan').textContent = G.durum === 'varis' ? 'varıldı 🎉' : `${fmt(Math.max(0, kalan))} km`;
    const km = kmAt(G.s), yapilan = G.dir > 0 ? km : TOPLAM_KM - km;
    $('yolKm').textContent = `${fmt(yapilan)} / ${TOPLAM_KM} km`;
    $('yolSefer').textContent = (G.dir > 0 ? 'İstanbul → Manisa' : 'Manisa → İstanbul') + (G.sefer > 1 ? ` · ${G.sefer}. sefer` : '');
  }

  // ---------- durak kartı ----------
  G.on('durak', (d) => {
    const el = $('durak'); el.classList.remove('off');
    const km = G.dir > 0 ? d.km : TOPLAM_KM - d.km;
    el.innerHTML = `<div class="dk"><div class="dk-ic">${esc(d.ikon || '📍')}</div><div><div class="dk-ad">${esc(d.ad)}</div><div class="dk-alt">${esc(d.alt || '')}</div><div class="dk-b">${esc(d.bilgi || '')}</div><span class="dk-km">📍 ${G.dir > 0 ? 'İstanbul' : 'Manisa'}'dan ${fmt(km)} km</span></div></div>`;
    dkT = 11;
  });
  // ---------- varış / yeni sefer ----------
  function buyuk(html, sure) { $('durak').classList.add('off'); dkT = 0; const el = $('buyuk'); el.classList.remove('off'); el.innerHTML = `<div class="bk">${html}</div>`; bkT = sure; }
  G.on('varis', (v) => {
    const md = ['🥇', '🥈', '🥉'];
    const list = v.yuruyenler.length ? `<ol>${v.yuruyenler.map((u, i) => `<li>${md[i]} ${esc(u.nick)} · ${fmt(u.km)} km</li>`).join('')}</ol>` : '';
    buyuk(`<h2>🏰 ${esc(v.hedef.ad)}'ya varıldı!</h2><p>${fmt(v.km)} km yol bitti. Alaya katılan herkese teşekkürler!</p>${list}`, 14);
  });
  G.on('sefer', (s) => buyuk(`<h2>${esc(s.baslik)}</h2><p>${esc(s.alt)}</p>`, 7));

  // ---------- akış, listeler, duyuru ----------
  function addFeed(item) {
    const feed = $('feed'), li = document.createElement('li');
    li.className = 'fi ' + item.kind;
    const ini = (item.user.nick || '?').charAt(0).toLocaleUpperCase('tr');
    li.innerHTML = `<span class="av" style="background:#8a3a19">${esc(ini)}</span><span class="tx"><b>${esc(item.user.nick)}</b> ${esc(item.text)}</span>`;
    feed.prepend(li);
    while (feed.children.length > 40) feed.lastChild.remove();
  }
  const MD = ['🥇', '🥈', '🥉', '4', '5'];
  function renderBoard() {
    $('boardList').innerHTML = G.top.length ? G.top.map((s, i) => `<li><span class="rk">${MD[i]}</span><span class="nm">${esc(s.nick)}</span><span class="dm">${fmt(s.d)} 💎</span></li>`).join('') : '<li class="empty">İlk hediyeyi sen at! 🎁</li>';
  }
  function renderWalkers() {
    $('walkList').innerHTML = G.yuruyenler.length ? G.yuruyenler.map((s, i) => `<li><span class="rk">${MD[i]}</span><span class="nm">${esc(s.nick)}</span><span class="dm">${fmt(s.km)} km</span></li>`).join('') : '<li class="empty">Yorum yaz, yürümeye başla!</li>';
  }
  function addGiftLog(e) {
    const L = $('giftLog'), li = document.createElement('li'), m = e.match;
    const res = m ? `${esc(m.r.etiket)}${m.by === 'jeton' ? ' <i>(jeton ile)</i>' : ''}` : '🎁 hediye';
    li.innerHTML = `<b>${esc(e.gift.name || '?')}</b> · id ${esc(e.gift.id || '-')} · ${fmt(e.dia)} jeton${e.cnt > 1 ? ' ×' + e.cnt : ''} → ${res}<small>${esc(e.user.nick)}</small>`;
    const empty = L.querySelector('.empty'); if (empty) empty.remove();
    L.prepend(li); while (L.children.length > 8) L.lastChild.remove();
  }
  G.on('feed', addFeed);
  G.on('board', renderBoard);
  G.on('walkers', renderWalkers);
  G.on('giftlog', addGiftLog);
  UI.renderChips = () => {
    $('giftChips').innerHTML = G.rules.map((r) => {
      const ic = /^https:\/\//.test(r.resim || '') ? `<img src="${esc(r.resim)}" referrerpolicy="no-referrer" alt="">` : esc(r.ikon || '🎁');
      const cost = r.jeton != null ? `${fmt(r.jeton)} 🪙` : `${fmt(r.minJeton)}+ 🪙`;
      return `<div class="chip" data-chip="${esc(r.eylem)}"><span class="ci">${ic}</span><span class="ct"><b>${esc(r.etiket)}</b><small>${cost}</small></span></div>`;
    }).join('');
  };
  const hitT = {};
  const flash = (key) => {
    const el = document.querySelector(`.chip[data-chip="${key}"]`); if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    clearTimeout(hitT[key]); hitT[key] = setTimeout(() => el.classList.remove('hit'), 1300);
  };
  G.on('ruleHit', flash);
  G.on('chipHit', flash);
  G.on('giftlog', (e) => { // gerçek hediye resmini öğren
    const m = e.match, img = e.gift.image;
    if (!m || m.by === 'jeton' || !/^https:\/\//.test(img || '') || m.r.resim === img) return;
    m.r.resim = img; UI.renderChips();
    fetch('/api/rule-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eylem: m.r.eylem, resim: img }) }).catch(() => {});
  });
  G.on('announce', (t) => { aq.push(t); if (aq.length > 8) aq.splice(0, aq.length - 8); });
  G.on('banner', (b) => {
    bq.push(b); if (bq.length > 10) bq.shift();
    if (!b.auto && window.CD.audio && window.CD.audio.fanfare) window.CD.audio.fanfare(true);
  });
  G.on('focus', (name) => hooks.onFocus(name));

  function showAnnounce(t) { const el = $('announce'); el.classList.remove('off'); el.innerHTML = `<div class="an">${esc(t)}</div>`; annOn = true; }
  function showBanner(b) {
    const el = $('banner'); el.classList.remove('off');
    const ic = /^https:\/\//.test(b.gift.image || '') ? `<img src="${esc(b.gift.image)}" referrerpolicy="no-referrer" alt="">` : esc(b.gift.icon || '🎁');
    const sub = b.sub || `${b.gift.name || 'Hediye'} gönderdi!${b.count > 1 ? ' ×' + b.count : ''}`;
    const line = b.total ? `${b.text} · ${fmt(b.total)} 💎` : b.text;
    el.innerHTML = `<div class="bn${b.auto ? ' auto' : ''}"><div class="bn-ic">${ic}</div><div><div class="bn-n">${esc(b.user.nick)}</div><div class="bn-g">${esc(sub)}</div><div class="bn-t">${esc(line)}</div></div></div>`;
    banOn = true;
    return b.auto ? 2.6 : 3.6;
  }

  UI.tick = (dt, haritaA) => {
    document.body.classList.toggle('harita', haritaA > 0.3);
    statT -= dt;
    if (statT <= 0) {
      statT = 0.2;
      $('stViewers').textContent = fmt(G.viewers); $('stLikes').textContent = fmt(G.likes);
      $('stDiamonds').textContent = fmt(G.diamonds); $('stAlay').textContent = alay.uyeler.length;
      const e = Math.round(G.energy), lv = LEVELS[G.level];
      $('energyPct').textContent = e + '%'; $('energyBar').style.width = e + '%';
      $('hizAd').textContent = G.durum === 'varis' ? 'Mola' : lv.n; $('hizBarI').style.width = (G.time < G.boostUntil ? 100 : e) + '%';
      const A = window.CD.audio, tr = A.current && A.current();
      $('trackInfo').textContent = !A.music ? '🥁 Müzik: kodla üretilen mehter (müzik klasörü boş). Varsayılan: kapalı' : tr ? `🎵 ${tr.name} · ${A.ti + 1}/${A.tracks.length}` : `🎵 ${A.tracks.length} parça hazır, müziği başlat`;
      $('cnt').textContent = `⚔️ ${alay.sayi('yeniceri')} yeniçeri · 🥁 ${alay.sayi('mehter')} · 🚩 ${alay.sayi('sancak')} · 🐎 ${alay.sayi('sipahi')} · 👑 ${alay.sayi('musahip')}`;
      seritGuncelle();
      kullaniciListesi();
      const hOn = hooks.director.cur === 'harita';
      $('btnMap').textContent = hOn ? '🗺️ Haritayı kapat' : '🗺️ Harita';
      document.querySelectorAll('[data-shot]').forEach((b) => b.classList.toggle('on', b.dataset.shot === hooks.director.cur));
    }
    aT -= dt;
    if (aT <= 0) { if (aq.length) { showAnnounce(aq.shift()); aT = aq.length > 2 ? 1.2 : 2.3; } else if (annOn) { $('announce').classList.add('off'); annOn = false; } }
    bT -= dt;
    if (bT <= 0) { if (bq.length) { bT = showBanner(bq.shift()); } else if (banOn) { $('banner').classList.add('off'); banOn = false; } }
    if (dkT > 0 && (dkT -= dt) <= 0) $('durak').classList.add('off');
    if (bkT > 0 && (bkT -= dt) <= 0) $('buyuk').classList.add('off');
  };

  // ---------- düğmeler ----------
  const qs = new URLSearchParams(location.search);
  const A = window.CD.audio;
  UI.refreshSoundBtn = () => {
    $('btnSound').textContent = A.on ? '🔇 Sesi kapat' : A.music ? '🎵 Müziği başlat' : '🥁 Mehteri başlat';
    $('btnSound').classList.toggle('gold', !A.on);
    $('btnNext').hidden = !A.music;
  };
  const toggleSound = async () => { await A.toggle(G.beat); UI.refreshSoundBtn(); };
  $('btnSound').onclick = toggleSound;
  $('btnNext').onclick = () => A.nextTrack();
  // ses varsayılan KAPALI (Spotify çalıyor). Açmak için adrese ?ses=1 ekle ya da düğmeye bas.
  if (qs.get('ses') === '1') { const auto = () => { if (!A.on) toggleSound(); }; setTimeout(auto, 900); addEventListener('pointerdown', auto, { once: true }); }
  const toggleClean = () => { document.body.classList.toggle('clean'); requestAnimationFrame(UI.fit); };
  $('btnClean').onclick = toggleClean;
  $('btnMap').onclick = () => hooks.onMap();
  $('btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'h' || e.key === 'H') toggleClean();
    if (e.key === 'm' || e.key === 'M') hooks.onMap();
    if (e.key === 'n' || e.key === 'N') hooks.onNext();
  });
  if (qs.has('clean')) document.body.classList.add('clean');
  if (qs.get('demo') === '1') { $('autoDemo').checked = true; hooks.demo.on = true; }
  $('autoDemo').onchange = (e) => { hooks.demo.on = e.target.checked; };
  document.querySelectorAll('[data-demo]').forEach((b) => { b.onclick = () => hooks.demo.act(b.dataset.demo); });
  // ---------- test masası ----------
  const BEN = { id: 'test_faruk', nick: 'Faruk' };
  let secili = BEN;
  const kim = () => secili;
  function kullaniciListesi() {
    const sel = $('tUser'), me = G.users.get(BEN.id), list = [me || BEN, ...[...G.users.values()].filter((u) => u.id !== BEN.id).reverse()];
    const seen = new Set(), opts = [];
    for (const u of list) { if (seen.has(u.id)) continue; seen.add(u.id); opts.push(u); }
    const key = opts.map((u) => u.id + (u.rol || '')).join('|');
    if (sel.dataset.key === key || document.activeElement === sel) return; // açık listeyi kapatma
    sel.dataset.key = key;
    const ROLAD = { mehter: '🥁', sancak: '🚩', musahip: '👑', sipahi: '🐎', yeniceri: '⚔️' };
    sel.innerHTML = opts.map((u) => `<option value="${esc(u.id)}">${esc(u.nick)}${u.id === BEN.id ? ' (sen)' : ''} ${u.rol ? ROLAD[u.rol] || '' : '· alayda değil'}</option>`).join('');
    sel.value = secili.id;
  }
  $('tUser').onchange = (e) => { const u = G.users.get(e.target.value); secili = u ? { id: u.id, nick: u.nick } : BEN; };
  const yeniKisi = (nick) => { const u = nick ? { id: 'test_' + nick.toLocaleLowerCase('tr').replace(/\s+/g, '_'), nick } : hooks.demo.absent(); G.handle({ type: 'chat', user: u, text: 'Merhaba!' }); secili = { id: u.id, nick: u.nick }; kullaniciListesi(); $('tUser').value = u.id; };
  $('tYeni').onclick = () => yeniKisi();
  $('tYeni5').onclick = () => { for (let i = 0; i < 5; i++) setTimeout(() => yeniKisi(), i * 200); };
  $('tAdEkle').onclick = () => { const n = $('tAd').value.trim(); if (n) { yeniKisi(n); $('tAd').value = ''; } };
  $('tAd').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); $('tAdEkle').click(); } };
  const yorum = (t) => G.handle({ type: 'chat', user: kim(), text: t });
  $('chatForm').onsubmit = (e) => {
    e.preventDefault();
    const t = $('chatText').value.trim(); if (!t) return;
    yorum(t); $('chatText').value = '';
  };
  G.on('komut', (k) => {
    const el = $('tSonuc');
    el.className = 'tsonuc ' + (k.bul.length ? 'ok' : 'yok');
    el.textContent = `${k.user.nick}: "${k.text}" → ` + (k.bul.length ? 'algılandı: ' + k.bul.join(', ') : 'komut yok (sadece yorum, balon çıkar)');
  });
  const KOMUTLAR = [['👋 selam', 'selam'], ['📣 çok yaşa', 'Padişahım çok yaşa'], ['🗺️ nerdeyiz', 'nerdeyiz'], ['🤸 hop', 'hop'], ['🥁 mehter', 'mehter'], ['💨 hızlan', 'hızlan'],
    ['"SELAMMM"', 'SELAMMM'], ['cok yasa', 'cok yasa'], ['"harita" 🙂', '"harita" 🙂'], ['💬 düz yorum', 'Ne güzel manzara']];
  $('tKomut').innerHTML = KOMUTLAR.map(([l], i) => `<button data-k="${i}" title="${esc(KOMUTLAR[i][1])}">${esc(l)}</button>`).join('');
  $('tKomut').querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { if (KOMUTLAR[+b.dataset.k][1] === 'nerdeyiz') G.haritaT = -99; yorum(KOMUTLAR[+b.dataset.k][1]); }; });
  document.querySelectorAll('[data-t]').forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.t, u = kim();
      if (k.startsWith('like')) G.handle({ type: 'like', user: u, count: +k.slice(4) });
      else if (k === 'hediye5') G.handle({ type: 'gift', user: u, gift: { name: 'Test hediyesi', id: '', diamonds: 5, count: 1, icon: '🎁' } });
      else G.handle({ type: k, user: u });
    };
  });
  const SHOTS = [['padisah', 'Padişah'], ['ibrahim', 'İbrahim'], ['onden', 'Önden'], ['mehter', 'Mehter'], ['yan', 'Yandan'], ['sipahi', 'Sipahi'], ['arka', 'Arkadan'], ['yeniceri', 'Yeniçeri'], ['genis', 'Geniş'], ['harita', '🗺️ Harita']];
  $('tKamera').innerHTML = SHOTS.map(([k, l]) => `<button data-shot="${k}">${l}</button>`).join('');
  $('tKamera').querySelectorAll('[data-shot]').forEach((b) => { b.onclick = () => (b.dataset.shot === 'harita' ? hooks.onMap() : hooks.onShot(b.dataset.shot)); });
  $('liveForm').onsubmit = (e) => {
    e.preventDefault();
    const st = hooks.live.status.state;
    if (st && st !== 'idle') { hooks.live.disconnect(); return; }
    const u = $('liveUser').value.trim(); if (!u) { $('liveUser').focus(); return; }
    hooks.live.connect(u);
  };
  UI.renderRuleButtons = () => {
    UI.renderChips();
    $('ruleBtns').innerHTML = G.rules.map((r, i) => `<button data-rule="${i}">${esc(r.etiket)} · ${r.jeton != null ? r.jeton : r.minJeton + '+'}</button>`).join('');
    document.querySelectorAll('[data-rule]').forEach((b) => { b.onclick = () => hooks.demo.ruleGift(+b.dataset.rule, kim()); });
  };

  // ---------- canlı bağlantı durumu ----------
  const PILL = { idle: ['DEMO', ''], connecting: ['BAĞLANIYOR…', 'wait'], waiting: ['YAYIN BEKLENİYOR', 'wait'], live: ['CANLI', 'live'], error: ['BAĞLANTI HATASI', 'err'] };
  UI.setLive = (st) => {
    const [txt, cls] = PILL[st.state] || PILL.idle;
    $('statusPill').className = 'pill ' + cls;
    $('statusText').textContent = st.state === 'live' ? `CANLI · @${st.username}` : txt;
    $('liveMsg').textContent = st.message || '';
    $('liveMsg').className = 'sub ' + (st.state === 'live' ? 'live' : st.state === 'error' ? 'err' : '');
    const active = st.state !== 'idle';
    $('liveBtn').textContent = active ? 'Kes' : 'Bağlan'; $('liveBtn').classList.toggle('stop', active); $('liveUser').disabled = active;
    if (st.username && document.activeElement !== $('liveUser')) $('liveUser').value = '@' + st.username;
    // Gerçek yayına İLK bağlanıldığında otomatik sahte izleyiciler durur ve onların kalabalığı temizlenir.
    // "Yayın bekleniyor" durum mesajları (30 sn'de bir gelir) artık hiçbir şeyi silmez; test masasında eklediklerin kalır.
    if (st.state === 'live' && UI.sonDurum !== 'live' && hooks.demo.on) { hooks.demo.on = false; $('autoDemo').checked = false; G.reset(); $('feed').innerHTML = ''; }
    UI.sonDurum = st.state;
  };

  renderBoard(); renderWalkers();
  UI.fit();
  return UI;
}
