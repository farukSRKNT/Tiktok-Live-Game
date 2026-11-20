// Arayüz: başların üstünde profil resmi + isim + can çubuğu (2D katman), hasar sayıları, takım savaşı şeridi,
// takım listesi (yaz, katıl), yere serme akışı, sıralama, duyurular ve kontrol paneli / test masası.
import * as THREE from 'three';
import { TAKIMLAR, TAKIM, formaIkon } from './takimlar.js';
import { FARK } from './oyun.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const FONT = 'Nunito, "Segoe UI", "Segoe UI Emoji", system-ui, sans-serif';
const W = 1080, H = 1920;

export function createUI(G, camera, hooks) {
  const UI = {};
  const ov = $('ov'), ctx = ov.getContext('2d');
  let q = 1;
  const aq = [], bq = [];
  let aT = 0, bT = 0, statT = 0, annOn = false, banOn = false;
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
  function bubble(gx, y, text, a, fs) {
    if (text.length > 30) text = text.slice(0, 29) + '…';
    ctx.font = `700 ${fs}px ${FONT}`;
    const w = ctx.measureText(text).width + fs * 1.3, h = fs * 1.75, tl = fs * 0.6, X = clamp(gx - w / 2, 4, W - w - 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffffff'; rr(X, y - h - tl, w, h, fs * 0.7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(gx - tl * 0.6, y - tl - 0.5); ctx.lineTo(gx + tl * 0.6, y - tl - 0.5); ctx.lineTo(gx, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, X + w / 2, y - h / 2 - tl + 1);
    ctx.globalAlpha = 1;
  }
  const tmp = new THREE.Vector3();
  function project(v) {
    tmp.copy(v).project(camera);
    if (tmp.z > 1 || tmp.z < -1) return null;
    return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H };
  }
  const AV = new Map();
  const avatarSrc = (url) => '/api/avatar?u=' + encodeURIComponent(url);
  function avatarImg(url) {
    if (!url) return null;
    let im = AV.get(url);
    if (!im) { im = new Image(); im.src = avatarSrc(url); AV.set(url, im); if (AV.size > 300) AV.delete(AV.keys().next().value); }
    return im.complete && im.naturalWidth ? im : null;
  }
  const IK = new Map();
  function ikonImg(T) { let im = IK.get(T.id); if (!im) { im = new Image(); im.src = formaIkon(T); IK.set(T.id, im); } return im; }

  // isim etiketi: [profil resmi | isim] + altında takım renginde can çubuğu
  function etiket(f, p, k, a) {
    const u = f.u, T = f.takim, vurgu = f.vurgu > G.time;
    const fs = (f.bot ? 17 : 22) * k * (vurgu ? 1.3 : 1);
    ctx.font = `800 ${fs}px ${FONT}`;
    const ad = f.bot ? T.kisa : u.nick;
    const tw = Math.min(ctx.measureText(ad).width, 240 * k), h = fs * 1.55;
    const avi = !f.bot && avatarImg(u.avatar), ar = h * 0.62;
    const ikonW = h * 0.9;
    const w = tw + fs * 0.9 + ikonW + (avi ? ar * 2 + 4 : 0);
    const X = clamp(p.x - w / 2, 4, W - w - 4), Y = p.y - h - 14 * k;
    ctx.globalAlpha = a;
    ctx.fillStyle = vurgu ? 'rgba(255,210,63,.96)' : 'rgba(8,12,24,.78)'; rr(X, Y, w, h, h / 2); ctx.fill();
    let x = X + h * 0.2;
    if (avi) {
      const cx = x + ar, cy = Y + h / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, ar, 0, Math.PI * 2); ctx.fillStyle = T.a; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, ar * 0.86, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(avi, cx - ar, cy - ar, ar * 2, ar * 2); ctx.restore();
      x += ar * 2 + 4;
    }
    const ik = ikonImg(T); if (ik.complete) ctx.drawImage(ik, x, Y + (h - ikonW) / 2, ikonW, ikonW);
    x += ikonW + 2;
    ctx.fillStyle = vurgu ? '#1a1200' : '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.beginPath(); ctx.rect(x, Y, tw + 2, h); ctx.clip(); ctx.fillText(ad, x, Y + h / 2 + 1); ctx.restore();
    // can çubuğu
    const bw = Math.max(70 * k, w * 0.8), bh = Math.max(6, 9 * k), bx = clamp(p.x - bw / 2, 4, W - bw - 4), by = p.y - 10 * k;
    const r = clamp(f.hp / f.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(bx - 2, by - 2, bw + 4, bh + 4, bh); ctx.fill();
    ctx.fillStyle = r > 0.5 ? '#4cd964' : r > 0.25 ? '#ffcc00' : '#ff3b30'; rr(bx, by, bw * r, bh, bh / 2); ctx.fill();
    if (f.maxHp > 100) { ctx.fillStyle = '#ffd23f'; ctx.font = `900 ${14 * k}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('💪', bx - 10 * k, by + bh / 2); }
    ctx.globalAlpha = 1;
    return Y;
  }

  // ---------- her kare: etiketler + efektler ----------
  const kafa = new THREE.Vector3();
  UI.draw = (dt) => {
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const items = [];
    for (const f of G.savascilar.values()) {
      G.basNoktasi(f, kafa); kafa.y += 0.32 * f.olcek;
      const d = camera.position.distanceTo(kafa), p = project(kafa);
      if (!p || d > 90 || p.x < -80 || p.x > W + 80 || p.y < 0 || p.y > H) continue;
      items.push({ f, p, d, k: clamp(16 / d, 0.45, 1.3) });
    }
    items.sort((a, b) => b.d - a.d);
    for (const it of items) {
      const { f, p, k } = it;
      const a = f.durum === 'ko' ? clamp(1 - (G.time - f.koT) / 1.2, 0, 1) : 1;
      if (a <= 0) continue;
      if (f.bot && it.d > 30) continue; // uzaktaki takviyelerin etiketi kalabalık yapmasın
      const y = etiket(f, p, k, a);
      const b = f.u.bubble;
      if (b && !f.bot) {
        const age = G.time - b.t;
        if (age > 5) f.u.bubble = null;
        else bubble(p.x, y - 4, b.text, Math.min(1, age * 6, (5 - age) * 2), 24 * k);
      }
    }

    for (const fx of G.fx) {
      if (fx.type === 'konfeti') for (let i = 0; i < fx.n; i++) parts.push({ k: 'c', x: Math.random() * W, y: -Math.random() * 500, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 300, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, w: 12 + Math.random() * 10, h: 6 + Math.random() * 6, col: fx.renk ? fx.renk[i % fx.renk.length] : ['#ffd23f', '#c8102e', '#ffffff', '#0b1e5b', '#4cd964'][i % 5], life: 7 });
      else if (fx.type === 'kalp' && fx.at) { G.basNoktasi(fx.at, kafa); const p = project(kafa); if (p) for (let i = 0; i < fx.n; i++) parts.push({ k: 'h', x: p.x + (Math.random() - 0.5) * 30, y: p.y - 30, vy: -90 - Math.random() * 80, ph: Math.random() * 6, life: 1.7, s: 14 + Math.random() * 10, col: ['#ff4f7b', '#ff7aa2', '#ff2d55'][i % 3] }); }
      else if (fx.type === 'sayi' && fx.at) { G.basNoktasi(fx.at, kafa); if (camera.position.distanceTo(kafa) < 20) parts.push({ k: 'n', w: kafa.clone(), t: fx.t, col: fx.col, life: 0.9, s: fx.s }); }
    }
    G.fx.length = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.k === 'c') {
        p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7)); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      } else if (p.k === 'h') {
        p.y += p.vy * dt; const x = p.x + Math.sin(p.ph + p.life * 5) * 10;
        ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.col; ctx.font = `${p.s * 2}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('❤', x, p.y); ctx.globalAlpha = 1;
      } else if (p.k === 'n') { // hasar sayısı
        p.w.y += dt * 1.2; const s = project(p.w); if (!s) continue;
        const u = 1 - p.life / 0.9, sc = u < 0.15 ? 0.6 + u * 4 : 1.2 - u * 0.3;
        ctx.globalAlpha = Math.min(1, p.life * 3); ctx.font = `900 ${p.s * sc}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(p.t, s.x + 26, s.y); ctx.fillStyle = p.col; ctx.fillText(p.t, s.x + 26, s.y); ctx.globalAlpha = 1;
      }
    }
  };
  G.on('hasar', (e) => { if (e.hasar >= 2 && !e.bloke) G.fx.push({ type: 'sayi', at: e.o, t: '-' + e.hasar, col: e.bloke ? '#9fd8ff' : e.hasar >= 15 ? '#ff4b2b' : '#ffe066', s: e.hasar >= 15 ? 40 : 30 }); });

  // ---------- takım listesi (yaz, katıl) ----------
  $('takimlar').innerHTML = TAKIMLAR.map((T) => `<div class="tk" data-tk="${T.id}"><img src="${formaIkon(T)}" alt=""><span>${esc(T.ad.replace(' FK', ''))}</span><b></b></div>`).join('');
  const hitT = {};
  const flash = (key) => {
    const el = document.querySelector(`[data-tk="${key}"]`) || document.querySelector(`.chip[data-chip="${key}"]`); if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    clearTimeout(hitT[key]); hitT[key] = setTimeout(() => el.classList.remove('hit'), 1300);
  };
  G.on('chipHit', flash);
  G.on('ruleHit', flash);

  // ---------- üst şerit: takımlar savaşı ----------
  function ustGuncelle() {
    const s = G.sayilar(), l = Object.entries(s).sort((a, b) => b[1] - a[1]), top = l.reduce((a, b) => a + b[1], 0);
    $('ustSay').textContent = `Sahada ${top} kişi · ${l.length} takım`;
    const key = l.map((x) => x.join(':')).join('|');
    if (ustGuncelle.key !== key) {
      ustGuncelle.key = key;
      $('bar').innerHTML = l.map(([id, n]) => { const T = TAKIM[id]; return `<i style="width:${(n / top) * 100}%;background:${T.desen === 'cubuk' || T.desen === 'yarim' || T.desen === 'dortlu' ? `linear-gradient(90deg,${T.a} 50%,${T.b} 50%)` : T.a}"></i>`; }).join('');
      $('ustTakim').innerHTML = l.length ? l.slice(0, 5).map(([id, n], i) => { const T = TAKIM[id], k = G.takimKill[id] || 0; return `<div class="ut${i === 0 && l.length > 1 ? ' lider' : ''}"><img src="${formaIkon(T)}" alt="">${esc(T.kisa)} ${n}${k ? `<small>💥${k}</small>` : ''}</div>`; }).join('')
        : '<div class="ut">Henüz kimse yok · takımını yaz!</div>';
      for (const T of TAKIMLAR) { const el = document.querySelector(`[data-tk="${T.id}"] b`); if (el) el.textContent = s[T.id] ? s[T.id] : ''; }
    }
    // fark kuralı: en kalabalıkla 15+ fark varsa herkes ona
    const not = $('hedefNot');
    if (l.length >= 2 && l[0][1] - l[l.length - 1][1] >= FARK) {
      const T = TAKIM[l[0][0]];
      not.textContent = `🎯 Herkes ${T.ad}'a saldırıyor! (${l[0][1]} kişi, fark ${FARK}+)`; not.classList.add('on');
    } else not.classList.remove('on');
  }

  // ---------- yere serme akışı ----------
  G.on('ko', ({ o, f }) => {
    const el = document.createElement('div'); el.className = 'kf';
    const kisi = (x) => `<img src="${formaIkon(x.takim)}" alt=""><span class="nm">${esc(x.bot ? x.takim.kisa + ' taraftarı' : x.u.nick)}</span>`;
    el.innerHTML = f ? `${kisi(f)} 💥 ${kisi(o)}` : `💥 ${kisi(o)}`;
    const box = $('killFeed'); box.prepend(el);
    while (box.children.length > 5) box.lastChild.remove();
    setTimeout(() => el.classList.add('eski'), 6000);
    setTimeout(() => el.remove(), 6700);
  });

  // ---------- akış, sıralama, duyuru ----------
  function addFeed(item) {
    const feed = $('feed'), li = document.createElement('li');
    li.className = 'fi ' + item.kind;
    const ini = (item.user.nick || '?').charAt(0).toLocaleUpperCase('tr');
    const avu = item.user.avatar || (G.users.get(item.user.id) || {}).avatar;
    li.innerHTML = (avu ? `<img class="av" alt="" src="${avatarSrc(avu)}" style="object-fit:cover;padding:0">` : `<span class="av" style="background:#8a1930">${esc(ini)}</span>`) + `<span class="tx"><b>${esc(item.user.nick)}</b> ${esc(item.text)}</span>`;
    feed.prepend(li);
    while (feed.children.length > 40) feed.lastChild.remove();
  }
  const MD = ['🥇', '🥈', '🥉', '4', '5'];
  function renderBoard() {
    $('boardList').innerHTML = G.top.length ? G.top.map((s, i) => `<li><span class="rk">${MD[i]}</span>${TAKIM[s.takim] ? `<img src="${formaIkon(TAKIM[s.takim])}" alt="">` : ''}<span class="nm">${esc(s.nick)}</span><span class="dm">${fmt(s.kill)} 💥</span></li>`).join('') : '<li class="empty">İlk yere seren sen ol! 🥊</li>';
  }
  function addGiftLog(e) {
    const L = $('giftLog'), li = document.createElement('li'), m = e.match;
    const res = m ? `${esc(m.r.etiket)}${m.by === 'jeton' ? ' <i>(jeton ile)</i>' : ''}` : '🎁 can +25';
    li.innerHTML = `<b>${esc(e.gift.name || '?')}</b> · id ${esc(e.gift.id || '-')} · ${fmt(e.dia)} jeton${e.cnt > 1 ? ' ×' + e.cnt : ''} → ${res}<small>${esc(e.user.nick)}</small>`;
    const empty = L.querySelector('.empty'); if (empty) empty.remove();
    L.prepend(li); while (L.children.length > 8) L.lastChild.remove();
  }
  G.on('feed', addFeed);
  G.on('board', renderBoard);
  G.on('giftlog', addGiftLog);
  UI.renderChips = () => {
    $('giftChips').innerHTML = G.rules.map((r) => {
      const ic = /^https:\/\//.test(r.resim || '') ? `<img src="${esc(r.resim)}" referrerpolicy="no-referrer" alt="">` : esc(r.ikon || '🎁');
      const cost = r.jeton != null ? `${fmt(r.jeton)} 🪙` : `${fmt(r.minJeton)}+ 🪙`;
      return `<div class="chip" data-chip="${esc(r.eylem)}"><span class="ci">${ic}</span><span class="ct"><b>${esc(r.etiket)}</b><small>${cost}</small></span></div>`;
    }).join('');
  };
  G.on('giftlog', (e) => { // gerçek hediye resmini öğren
    const m = e.match, img = e.gift.image;
    if (!m || m.by === 'jeton' || !/^https:\/\//.test(img || '') || m.r.resim === img) return;
    m.r.resim = img; UI.renderChips();
    fetch('/api/rule-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eylem: m.r.eylem, resim: img }) }).catch(() => {});
  });
  G.on('announce', (t) => { aq.push(t); if (aq.length > 8) aq.splice(0, aq.length - 8); });
  G.on('banner', (b) => { bq.push(b); if (bq.length > 10) bq.shift(); });

  function showAnnounce(t) { const el = $('announce'); el.classList.remove('off'); el.innerHTML = `<div class="an">${esc(t)}</div>`; annOn = true; }
  function showBanner(b) {
    const el = $('banner'); el.classList.remove('off');
    const av = b.user && b.user.avatar ? `<img class="av" src="${avatarSrc(b.user.avatar)}" alt="">` : b.takim ? `<img src="${formaIkon(b.takim)}" alt="">` : esc((b.gift && b.gift.icon) || '🎁');
    const line = b.total ? `${b.text} · ${fmt(b.total)} 💎` : b.text;
    const bg = b.takim ? `style="background:linear-gradient(135deg,${b.takim.a}f2,${b.takim.b}f2)"` : '';
    el.innerHTML = `<div class="bn" ${bg}><div class="bn-ic">${av}</div><div><div class="bn-n" style="text-shadow:0 3px 8px rgba(0,0,0,.6)">${esc(b.user ? b.user.nick : '')}</div><div class="bn-g" style="text-shadow:0 2px 6px rgba(0,0,0,.6)">${esc(b.sub || '')}</div><div class="bn-t">${esc(line)}</div></div></div>`;
    banOn = true;
    return 3.4;
  }

  UI.tick = (dt) => {
    statT -= dt;
    if (statT <= 0) {
      statT = 0.25;
      $('stViewers').textContent = fmt(G.viewers); $('stLikes').textContent = fmt(G.likes);
      $('stDiamonds').textContent = fmt(G.diamonds); $('stSaha').textContent = G.canli().length;
      ustGuncelle();
      kullaniciListesi();
      sahaListesi();
      document.querySelectorAll('[data-shot]').forEach((b) => b.classList.toggle('on', b.dataset.shot === hooks.director.cur));
    }
    aT -= dt;
    if (aT <= 0) { if (aq.length) { showAnnounce(aq.shift()); aT = aq.length > 2 ? 1.2 : 2.3; } else if (annOn) { $('announce').classList.add('off'); annOn = false; } }
    bT -= dt;
    if (bT <= 0) { if (bq.length) { bT = showBanner(bq.shift()); } else if (banOn) { $('banner').classList.add('off'); banOn = false; } }
  };

  // ---------- düğmeler ----------
  const qs = new URLSearchParams(location.search);
  const A = hooks.ses;
  UI.refreshSoundBtn = () => { $('btnSound').textContent = A.on ? '🔇 Sesi kapat' : '📣 Tribün sesini aç'; $('btnSound').classList.toggle('gold', !A.on); };
  $('btnSound').onclick = () => { A.toggle(); UI.refreshSoundBtn(); };
  if (qs.get('ses') === '1') { const auto = () => { if (!A.on) { A.toggle(); UI.refreshSoundBtn(); } }; setTimeout(auto, 900); addEventListener('pointerdown', auto, { once: true }); }
  const toggleClean = () => { document.body.classList.toggle('clean'); requestAnimationFrame(UI.fit); };
  $('btnClean').onclick = toggleClean;
  $('btnReset').onclick = () => { if (confirm('Her şey sıfırlansın mı?\nSahadaki herkes ve sıralama silinir.')) hooks.sifirla(); };
  $('btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  addEventListener('keydown', (e) => { if (e.target.tagName !== 'INPUT' && (e.key === 'h' || e.key === 'H')) toggleClean(); });
  if (qs.has('clean')) document.body.classList.add('clean');
  if (qs.get('demo') === '1') { $('autoDemo').checked = true; hooks.demo.on = true; }
  $('autoDemo').onchange = (e) => { hooks.demo.on = e.target.checked; };

  // ---------- kontrol paneli: sahada kim var ----------
  function sahaListesi() {
    const l = G.canli().filter((f) => !f.bot);
    const key = l.map((f) => f.id + f.takim.id + f.kill).join('|') + G.canli().length;
    if (sahaListesi.key === key) return; sahaListesi.key = key;
    $('sahaSay').textContent = `${G.canli().length} kişi`;
    const s = G.sayilar();
    const html = Object.keys(s).sort((a, b) => s[b] - s[a]).map((id) => {
      const T = TAKIM[id], kisiler = l.filter((f) => f.takim.id === id).sort((a, b) => b.kill - a.kill), bot = s[id] - kisiler.length;
      return `<div class="rg"><div class="rh"><img src="${formaIkon(T)}" alt="">${esc(T.ad)} (${s[id]})</div>${kisiler.map((f) => `<span class="rk">${esc(f.u.nick)}${f.kill ? `<i>💥${f.kill}</i>` : ''}</span>`).join('')}${bot ? `<span class="rk">+${bot} takviye</span>` : ''}</div>`;
    }).join('');
    $('sahaListe').innerHTML = html || '<div class="sub">Henüz kimse yok.</div>';
  }

  // ---------- test masası ----------
  const BEN = { id: 'test_faruk', nick: 'Faruk' };
  let secili = BEN;
  const kim = () => secili;
  function kullaniciListesi() {
    const sel = $('tUser'), me = G.users.get(BEN.id), list = [me || BEN, ...[...G.users.values()].filter((u) => u.id !== BEN.id && !u.bot).reverse()];
    const seen = new Set(), opts = [];
    for (const u of list) { if (seen.has(u.id)) continue; seen.add(u.id); opts.push(u); if (opts.length > 60) break; }
    const durum = (u) => { const f = G.savascilar.get(u.id); return f && f.durum !== 'ko' ? `⚽ ${f.takim.kisa}` : '· sahada değil'; };
    const key = opts.map((u) => u.id + durum(u)).join('|');
    if (sel.dataset.key === key || document.activeElement === sel) return;
    sel.dataset.key = key;
    sel.innerHTML = opts.map((u) => `<option value="${esc(u.id)}">${esc(u.nick)}${u.id === BEN.id ? ' (sen)' : ''} ${durum(u)}</option>`).join('');
    sel.value = secili.id;
  }
  $('tUser').onchange = (e) => { const u = G.users.get(e.target.value); secili = u ? { id: u.id, nick: u.nick } : BEN; };
  const yeniKisi = (nick, takim) => {
    const u = nick ? { id: 'test_' + nick.toLocaleLowerCase('tr').replace(/\s+/g, '_'), nick } : hooks.demo.absent();
    const T = takim || TAKIMLAR[Math.floor(Math.random() * TAKIMLAR.length)];
    G.yolla({ type: 'chat', user: u, text: hooks.demo.yaz(T) });
    secili = { id: u.id, nick: u.nick };
  };
  $('tYeni').onclick = () => yeniKisi();
  $('tYeni5').onclick = () => { for (let i = 0; i < 5; i++) setTimeout(() => yeniKisi(), i * 200); };
  $('tAdEkle').onclick = () => { const n = $('tAd').value.trim(); if (n) { secili = { id: 'test_' + n.toLocaleLowerCase('tr').replace(/\s+/g, '_'), nick: n }; G.yolla({ type: 'chat', user: secili, text: 'merhaba' }); $('tAd').value = ''; } };
  $('tAd').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); $('tAdEkle').click(); } };
  const yorum = (t) => G.yolla({ type: 'chat', user: kim(), text: t });
  $('chatForm').onsubmit = (e) => { e.preventDefault(); const t = $('chatText').value.trim(); if (!t) return; yorum(t); $('chatText').value = ''; };
  G.on('komut', (k) => {
    if (k.user.id !== kim().id) return;
    const el = $('tSonuc');
    el.className = 'tsonuc ' + (k.bul.length ? 'ok' : '');
    el.textContent = `${k.user.nick}: "${k.text}" → ` + k.bul.join(', ');
  });
  $('tTakim').innerHTML = TAKIMLAR.map((T) => `<button data-yaz="${T.id}"><img src="${formaIkon(T)}" alt="">${esc(T.ad.replace(' FK', ''))}</button>`).join('');
  $('tTakim').querySelectorAll('[data-yaz]').forEach((b) => { b.onclick = () => yorum(hooks.demo.yaz(TAKIM[b.dataset.yaz])); });
  document.querySelectorAll('[data-k]').forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.k, n = parseInt(k, 10), id = k.replace(/^\d+/, '');
      for (let i = 0; i < n; i++) setTimeout(() => yeniKisi(null, id === 'karisik' ? null : TAKIM[id]), i * 120);
    };
  });
  document.querySelectorAll('[data-t]').forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.t, u = kim();
      if (k.startsWith('like')) G.yolla({ type: 'like', user: u, count: +k.slice(4) });
      else if (k === 'hediye5') G.yolla({ type: 'gift', user: u, gift: { name: 'Test hediyesi', id: '', diamonds: 5, count: 1, icon: '🎁' } });
      else G.yolla({ type: k, user: u });
    };
  });
  const SHOTS = [['genel', 'Genel'], ['yakin', 'Yakın'], ['yildiz', 'Yıldız'], ['tepe', 'Tepeden'], ['tribun', 'Tribün']];
  $('tKamera').innerHTML = SHOTS.map(([k, l]) => `<button data-shot="${k}">${l}</button>`).join('');
  $('tKamera').querySelectorAll('[data-shot]').forEach((b) => { b.onclick = () => hooks.kontrol({ k: 'kamera', shot: b.dataset.shot }); });
  $('liveForm').onsubmit = (e) => {
    e.preventDefault();
    const st = hooks.live.status.state;
    if (st && st !== 'idle') { hooks.live.disconnect(); return; }
    const u = $('liveUser').value.trim(); if (!u) { $('liveUser').focus(); return; }
    hooks.live.connect(u);
  };
  UI.renderRuleButtons = () => {
    UI.renderChips();
    $('ruleBtns').innerHTML = G.rules.map((r, i) => `<button data-rule="${i}">${esc(r.ikon || '')} ${esc(r.etiket)} · ${r.jeton != null ? r.jeton : r.minJeton + '+'}</button>`).join('');
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
    if (st.state === 'live' && UI.sonDurum !== 'live' && hooks.demo.on) { hooks.demo.on = false; $('autoDemo').checked = false; }
    UI.sonDurum = st.state;
  };

  renderBoard();
  UI.fit();
  return UI;
}
