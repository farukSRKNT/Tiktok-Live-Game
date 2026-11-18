// Alay: Kanuni Sultan Süleyman beyaz atında, Pargalı İbrahim Paşa biraz gerisinde,
// önde mehter ve sancaktarlar, arkada atlı sipahiler ve yeniçeriler (izleyiciler).
// Figürler kodla yapılmış basit low-poly modeller; modeller/ klasörüne .glb atılırsa onlar kullanılır.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const MC = {};
const mat = (c, o = {}) => MC[c + JSON.stringify(o)] || (MC[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true, ...o }));
const GEO = {
  kutu: new THREE.BoxGeometry(1, 1, 1),
  sil: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  kaftan: new THREE.CylinderGeometry(0.27, 0.43, 1, 10),
  koni: new THREE.ConeGeometry(0.5, 1, 10),
  top: new THREE.SphereGeometry(0.5, 12, 9),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 4, 10),
};
function m(geo, c, x, y, z, sx, sy, sz, o) {
  const k = new THREE.Mesh(geo, typeof c === 'string' ? mat(c, o) : c);
  k.position.set(x, y, z); k.scale.set(sx, sy ?? sx, sz ?? sx); k.castShadow = true;
  return k;
}
const TEN = '#d9a77c';

// ---------- insan ----------
// o: { kaftan, ic, kusak, bas, sakal, tasi, cizme }
export function insan(o) {
  const g = new THREE.Group(), U = {};
  const govde = new THREE.Group(); g.add(govde); U.govde = govde;
  // bacaklar (kalçadan döner)
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 0.12, 0.88, 0);
    p.add(m(GEO.kutu, o.ic || '#e8e0cc', 0, -0.36, 0, 0.17, 0.72, 0.19));
    p.add(m(GEO.kutu, o.cizme || '#8a2a1a', 0, -0.8, -0.04, 0.17, 0.18, 0.28));
    govde.add(p); U[s < 0 ? 'bacakL' : 'bacakR'] = p;
  }
  govde.add(m(GEO.kaftan, o.kaftan, 0, 0.98, 0, 1, 1.0, 1));
  govde.add(m(GEO.sil, o.kusak || '#d8b04a', 0, 1.12, 0, 0.6, 0.1, 0.6));
  // kollar (omuzdan döner)
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 0.33, 1.42, 0);
    p.add(m(GEO.kutu, o.kaftan, 0, -0.29, 0, 0.14, 0.58, 0.15));
    p.add(m(GEO.top, TEN, 0, -0.62, 0, 0.13));
    govde.add(p); U[s < 0 ? 'kolL' : 'kolR'] = p;
  }
  // baş
  const bas = new THREE.Group(); bas.position.set(0, 1.64, 0); govde.add(bas); U.bas = bas;
  bas.add(m(GEO.top, TEN, 0, 0, 0, 0.34, 0.38, 0.34));
  bas.add(m(GEO.kutu, '#1a1410', 0, -0.06, -0.165, 0.18, 0.04, 0.03)); // bıyık
  if (o.sakal) bas.add(m(GEO.koni, o.sakal, 0, -0.17, -0.1, 0.2, -0.22, 0.14));
  for (const s of [-1, 1]) bas.add(m(GEO.top, '#1a1410', s * 0.07, 0.04, -0.16, 0.035));
  // başlık
  switch (o.bas) {
    case 'kallavi': // padişah kavuğu: iri beyaz sarık, kırmızı tepe, sorguç
      bas.add(m(GEO.top, '#f7f4ec', 0, 0.26, 0, 0.62, 0.52, 0.62));
      bas.add(m(GEO.sil, '#b3122e', 0, 0.5, 0, 0.18, 0.12, 0.18));
      bas.add(m(GEO.top, '#2bb673', 0, 0.22, -0.3, 0.07, 0.07, 0.04, { emissive: '#0a3', emissiveIntensity: 0.4 }));
      bas.add(m(GEO.koni, '#ffffff', 0.02, 0.48, -0.26, 0.05, 0.42, 0.05));
      break;
    case 'kavuk': // vezir kavuğu
      bas.add(m(GEO.sil, '#f2eee4', 0, 0.3, 0, 0.42, 0.36, 0.42));
      bas.add(m(GEO.top, '#f2eee4', 0, 0.48, 0, 0.42, 0.18, 0.42));
      bas.add(m(GEO.sil, o.tepe || '#2f6b3a', 0, 0.56, 0, 0.16, 0.1, 0.16));
      break;
    case 'bork': // yeniçeri börkü: uzun beyaz keçe, arkaya sarkan yatırtma
      bas.add(m(GEO.sil, '#f3efe6', 0, 0.36, 0.02, 0.3, 0.5, 0.3));
      bas.add(m(GEO.kutu, '#f3efe6', 0, 0.2, 0.2, 0.26, 0.5, 0.05));
      bas.add(m(GEO.kutu, '#d8b04a', 0, 0.2, -0.15, 0.1, 0.16, 0.03));
      break;
    case 'mehter':
      bas.add(m(GEO.koni, '#b3202a', 0, 0.34, 0, 0.36, 0.48, 0.36));
      bas.add(m(GEO.sil, '#f3efe6', 0, 0.14, 0, 0.38, 0.1, 0.38));
      break;
    case 'migfer': // sipahi: sarıklı sivri miğfer
      bas.add(m(GEO.sil, '#f2eee4', 0, 0.16, 0, 0.38, 0.12, 0.38));
      bas.add(m(GEO.koni, '#b9c0c8', 0, 0.38, 0, 0.32, 0.4, 0.32, { metalness: 0.7, roughness: 0.3 }));
      break;
  }
  // taşıdıkları
  if (o.tasi === 'sancak') {
    const s = new THREE.Group(); s.position.set(0, -0.6, 0);
    s.add(m(GEO.sil, '#4a3020', 0, 1.3, 0, 0.05, 3.4, 0.05));
    s.add(m(GEO.top, '#e8c25a', 0, 3.02, 0, 0.12, 0.12, 0.12, { metalness: 0.8, roughness: 0.3 }));
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.75, 6, 1), mat(o.bayrak || '#c1121f', { side: THREE.DoubleSide }));
    b.position.set(0, 2.55, 0.56); b.rotation.y = Math.PI / 2; b.castShadow = true; s.add(b); U.bayrak = b;
    U.kolR.add(s); U.kolR.rotation.x = -0.25; U.sancakKol = true;
  } else if (o.tasi === 'davul') {
    const d = m(GEO.sil, '#c9a36b', 0, 1.0, -0.36, 0.6, 0.36, 0.6); d.rotation.z = Math.PI / 2; govde.add(d);
  } else if (o.tasi === 'zurna') {
    const z = m(GEO.koni, '#7a5734', 0, -0.62, -0.25, 0.06, 0.5, 0.06); z.rotation.x = -1.2; U.kolR.add(z); U.zurna = true;
  } else if (o.tasi === 'zil') {
    for (const s of [-1, 1]) U[s < 0 ? 'kolL' : 'kolR'].add(m(GEO.sil, '#d8b04a', 0, -0.68, -0.05, 0.3, 0.03, 0.3, { metalness: 0.8, roughness: 0.3 }));
  } else if (o.tasi === 'mizrak') {
    const s = m(GEO.sil, '#5a3d24', 0, 0.2, 0, 0.04, 3.2, 0.04); U.kolR.add(s);
    U.kolR.add(m(GEO.koni, '#c0c6cc', 0, 1.9, 0, 0.08, 0.3, 0.08, { metalness: 0.8 }));
  }
  g.userData = U;
  return g;
}

// ---------- at ----------
export function at(renk, cul = '#9b1b30', sus = '#e8c25a') {
  const g = new THREE.Group(), U = { bacak: [] };
  const govde = new THREE.Group(); g.add(govde); U.govde = govde;
  const gv = m(GEO.capsule, renk, 0, 1.35, 0, 0.62, 0.8, 0.62); gv.rotation.x = Math.PI / 2; govde.add(gv);
  // çul (eyer örtüsü)
  govde.add(m(GEO.kutu, cul, 0, 1.55, 0.05, 0.72, 0.5, 0.95));
  govde.add(m(GEO.kutu, sus, 0, 1.31, 0.05, 0.74, 0.06, 0.97));
  // boyun + baş
  const boyun = new THREE.Group(); boyun.position.set(0, 1.6, -0.62); govde.add(boyun); U.boyun = boyun;
  const bn = m(GEO.kutu, renk, 0, 0.32, -0.12, 0.3, 0.8, 0.36); bn.rotation.x = -0.5; boyun.add(bn);
  boyun.add(m(GEO.kutu, renk, 0, 0.66, -0.45, 0.26, 0.28, 0.6));
  boyun.add(m(GEO.kutu, '#3a2a20', 0, 0.68, -0.4, 0.27, 0.06, 0.62)); // yular
  for (const s of [-1, 1]) boyun.add(m(GEO.koni, renk, s * 0.08, 0.88, -0.25, 0.08, 0.18, 0.06));
  boyun.add(m(GEO.kutu, renk === '#f4f1ea' ? '#e6e0d4' : '#2a1d15', 0, 0.55, 0.0, 0.08, 0.7, 0.2)); // yele
  // kuyruk
  const k = m(GEO.koni, renk === '#f4f1ea' ? '#ebe5d8' : '#2a1d15', 0, 1.15, 0.78, 0.18, 0.8, 0.18); k.rotation.x = -0.4; govde.add(k); U.kuyruk = k;
  // bacaklar
  for (const [x, z] of [[-0.2, -0.5], [0.2, -0.5], [-0.2, 0.5], [0.2, 0.5]]) {
    const p = new THREE.Group(); p.position.set(x, 1.15, z);
    p.add(m(GEO.kutu, renk, 0, -0.5, 0, 0.14, 1.0, 0.16));
    p.add(m(GEO.kutu, '#2a2018', 0, -1.07, 0, 0.15, 0.1, 0.18));
    govde.add(p); U.bacak.push(p);
  }
  g.userData = U;
  return g;
}

// ata binmiş figür (binici + at)
function atli(binici, atG) {
  const g = new THREE.Group();
  g.add(atG);
  binici.position.set(0, 0.92, 0.05);
  const B = binici.userData;
  B.bacakL.rotation.set(-1.25, 0, -0.35); B.bacakR.rotation.set(-1.25, 0, 0.35);
  B.atli = true;
  atG.userData.govde.add(binici);
  g.userData = { binici: B, at: atG.userData, bas: B.bas };
  return g;
}

// ---------- yürüyüş animasyonu ----------
function animInsan(U, ph, amp, t) {
  if (!U || !U.govde) return;
  if (!U.atli) {
    U.bacakL.rotation.x = Math.sin(ph) * 0.45 * amp; U.bacakR.rotation.x = -Math.sin(ph) * 0.45 * amp;
    U.govde.position.y = Math.abs(Math.cos(ph)) * 0.05 * amp;
  }
  const sel = U.selamT != null ? t - U.selamT : 99, cos = U.cosT != null ? t - U.cosT : 99;
  if (cos < 2.2) { // "çok yaşa": iki kol havada
    const k = Math.sin(Math.min(1, cos * 3) * Math.PI / 2) * (cos > 1.8 ? (2.2 - cos) / 0.4 : 1);
    U.kolL.rotation.set(0, 0, -2.6 * k); if (!U.sancakKol) U.kolR.rotation.set(0, 0, 2.6 * k);
  } else if (sel < 2) { // selam: sağ el kalkar sallanır
    const k = Math.min(1, sel * 4, (2 - sel) * 4);
    U.kolR.rotation.set(0, 0, (2.4 + Math.sin(t * 14) * 0.3) * k);
    U.kolL.rotation.x = U.atli ? -0.5 : -Math.sin(ph) * 0.35 * amp;
  } else {
    U.kolL.rotation.set(U.atli ? -0.6 : -Math.sin(ph) * 0.35 * amp, 0, 0.08);
    if (U.sancakKol) U.kolR.rotation.set(-0.25 + Math.sin(ph) * 0.03, 0, 0);
    else if (U.zurna) U.kolR.rotation.set(-1.25, 0, -0.3);
    else U.kolR.rotation.set(U.atli ? -0.6 : Math.sin(ph) * 0.35 * amp, 0, -0.08);
  }
  if (U.bayrak) { // bayrak dalgalanır
    const p = U.bayrak.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.55; p.setZ(i, Math.sin(t * 6 - x * 4 + ph * 0.2) * 0.12 * x); }
    p.needsUpdate = true;
  }
}
function animAt(A, ph, amp) {
  const s = Math.sin(ph), c = Math.cos(ph);
  A.bacak[0].rotation.x = s * 0.5 * amp; A.bacak[3].rotation.x = s * 0.5 * amp;
  A.bacak[1].rotation.x = -s * 0.5 * amp; A.bacak[2].rotation.x = -s * 0.5 * amp;
  A.govde.position.y = Math.abs(c) * 0.06 * amp;
  A.boyun.rotation.x = c * 0.08 * amp;
  A.kuyruk.rotation.z = Math.sin(ph * 0.5) * 0.15;
}

// ---------- roller ----------
const YENICERI_RENK = ['#2d4f8a', '#34568f', '#7d2424', '#2d4f8a', '#4a3f7a', '#2f6b5a'];
export const ROL = {
  mehter:  { ad: 'Mehter', max: 9 },
  sancak:  { ad: 'Sancaktar', max: 4 },
  musahip: { ad: 'Musahip', max: 2 },
  sipahi:  { ad: 'Sipahi', max: 6 },
  yeniceri: { ad: 'Yeniçeri', max: 45 },
};
function figur(rol, i, h) {
  switch (rol) {
    case 'mehter': return insan({ kaftan: '#b3202a', ic: '#e8c25a', kusak: '#e8c25a', bas: 'mehter', sakal: i % 2 ? '#2a1d15' : null, tasi: ['davul', 'zurna', 'zil'][i % 3] });
    case 'sancak': return insan({ kaftan: '#7d2424', bas: 'bork', tasi: 'sancak', bayrak: i % 2 ? '#1f6b3a' : '#c1121f', sakal: '#2a1d15' });
    case 'musahip': return insan({ kaftan: '#5a2d6e', kusak: '#e8c25a', bas: 'kavuk', tepe: '#5a2d6e', sakal: '#3a2a20' });
    case 'sipahi': return atli(insan({ kaftan: '#8f1d1d', bas: 'migfer', sakal: '#2a1d15', tasi: 'mizrak' }), at(['#5a3a24', '#2a1d15', '#7a4a2a'][i % 3], '#2d4f8a'));
    default: return insan({ kaftan: YENICERI_RENK[h % YENICERI_RENK.length], bas: 'bork', sakal: h % 3 === 0 ? '#2a1d15' : null });
  }
}

export function createAlay(scene) {
  const A = { root: new THREE.Group(), uyeler: [], ph: 0, glb: {} };
  scene.add(A.root);

  // Padişah ve İbrahim Paşa
  const padisahAt = at('#f4f1ea', '#b3122e', '#e8c25a');
  A.padisah = atli(insan({ kaftan: '#d9b25a', ic: '#f2e6c9', kusak: '#b3122e', bas: 'kallavi', sakal: '#3a2a1e', cizme: '#c8a040' }), padisahAt);
  A.padisah.position.set(0, 0, 0);
  A.ibrahim = atli(insan({ kaftan: '#2f6b3a', kusak: '#e8c25a', bas: 'kavuk', tepe: '#b3122e', sakal: '#2a1d15' }), at('#7a4a2a', '#1f4a2a'));
  A.ibrahim.position.set(1.1, 0, 3.4);
  A.root.add(A.padisah, A.ibrahim);
  A.padisahBas = A.padisah.userData.bas; A.ibrahimBas = A.ibrahim.userData.bas;

  // Dizilim: herkes padişah ve İbrahim Paşa'nın ARKASINDA. Hediye toplamı büyük olan en yakında,
  // hediyesizler en geride (önce gelen önde). Yayalar 3'lü, atlılar 2'li sıra.
  A.dizil = () => {
    const sirali = [...A.uyeler].sort((a, b) => (b.puan || 0) - (a.puan || 0) || (a.joinT ?? 0) - (b.joinT ?? 0));
    let z = 6.2, satir = [], tip = null;
    const kapat = () => {
      if (!satir.length) return;
      const atli = tip === 'atli', xs = atli ? [-1.3, 1.3] : [-1.3, 0, 1.3];
      const bas = atli && satir.length === 1 ? [0] : satir.length === 1 ? [0] : satir.length === 2 && !atli ? [-0.7, 0.7] : xs;
      satir.forEach((u, i) => { u.hedef = new THREE.Vector3(bas[i], 0, z + (atli ? 0.6 : 0)); });
      z += atli ? 3.2 : 1.35; satir = [];
    };
    for (const u of sirali) {
      const t = u.rol === 'sipahi' ? 'atli' : 'yaya';
      if (t !== tip || satir.length >= (t === 'atli' ? 2 : 3)) { kapat(); tip = t; }
      satir.push(u);
    }
    kapat();
  };

  A.ekle = (u, rol) => {
    if (u.ch) A.root.remove(u.ch);
    let h = 0; for (const c of String(u.id)) h = (h * 31 + c.charCodeAt(0)) | 0;
    h = Math.abs(h);
    const sayi = A.uyeler.filter((x) => x.rol === rol && x !== u).length;
    u.ch = glbFigur(rol, sayi, h) || figur(rol, sayi, h);
    u.rol = rol; u.faz = (h % 100) / 100 * 0.6;
    u.bas = u.ch.userData.bas || u.ch;
    if (!A.uyeler.includes(u)) A.uyeler.push(u);
    A.dizil();
    // yeni gelen arkadan (veya yandan) koşarak gelir
    u.ch.position.copy(u.hedef).add(new THREE.Vector3(Math.sign(u.hedef.x || 1) * 6, 0, 4));
    A.root.add(u.ch);
  };
  A.cikar = (u) => {
    const i = A.uyeler.indexOf(u); if (i < 0) return;
    A.uyeler.splice(i, 1); if (u.ch) A.root.remove(u.ch); u.ch = null; u.rol = null;
    A.dizil();
  };
  A.sayi = (rol) => A.uyeler.filter((u) => u.rol === rol).length;

  // her kare
  A.update = (dt, hiz, t, denizde) => {
    // adım hızı yürüyüş hızına bağlı; denizde (mavnada) durup sallanırlar
    const amp = denizde ? 0.08 : Math.min(1.2, 0.55 + hiz * 0.18);
    A.ph += dt * (denizde ? 1 : 3.2 + hiz * 1.6);
    const P = A.padisah.userData, I = A.ibrahim.userData;
    if (P.at) { animAt(P.at, A.ph * 0.5, amp); animInsan(P.binici, A.ph, amp, t); }
    if (I.at) { animAt(I.at, A.ph * 0.5 + 0.8, amp); animInsan(I.binici, A.ph + 0.8, amp, t); }
    for (const u of A.uyeler) {
      const c = u.ch; if (!c) continue;
      if (u.hedef) {
        const d = c.position.distanceTo(u.hedef), k = Math.min(1, dt * (d > 3 ? 1.6 : 2.5));
        c.position.lerp(u.hedef, k);
      }
      const U = c.userData;
      if (U.mixer) U.mixer.update(dt * (0.6 + hiz * 0.3));
      else if (U.at) { animAt(U.at, A.ph * 0.5 + u.faz * 6, amp); animInsan(U.binici, A.ph + u.faz, amp, t); }
      else animInsan(U, A.ph + u.faz * 3, amp, t);
      if (u.ziplaT != null && t - u.ziplaT < 0.6) c.position.y = Math.sin((t - u.ziplaT) / 0.6 * Math.PI) * 0.6; else c.position.y = 0;
    }
    for (const k of ['padisah', 'ibrahim']) { const U = A[k].userData; if (U.mixer) U.mixer.update(dt * (0.6 + hiz * 0.3)); }
  };
  A.selam = (u, t) => { const U = u === 'padisah' ? A.padisah.userData.binici : u === 'ibrahim' ? A.ibrahim.userData.binici : u.ch && (u.ch.userData.binici || u.ch.userData); if (U) U.selamT = t; };
  A.cosku = (t) => { for (const u of A.uyeler) { const U = u.ch && (u.ch.userData.binici || u.ch.userData); if (U) U.cosT = t + Math.random() * 0.3; } };

  // ---------- modeller/ klasöründen .glb ----------
  // padisah.glb, ibrahim.glb: binici+at tamamı; yeniceri.glb, mehter.glb, sancak.glb, musahip.glb, sipahi.glb
  // İsteğe bağlı modeller/ayar.json: { "padisah": { "boy": 3.2, "y": 0, "don": 180 } }
  const BOY = { padisah: 3.2, ibrahim: 3.1, sipahi: 3.0, yeniceri: 1.85, mehter: 1.85, sancak: 1.85, musahip: 1.85 };
  // İskeletli (parça adlı) model: govde/kolL/kolR/bacakL/bacakR/bas (+ at_govde/at_boyun/at_kuyruk/at_bacak0..3).
  // Bu adlar varsa kodla yapılan figürlerle aynı animasyonlar (yürüyüş, selam, çok yaşa, bayrak) oynar.
  function iskelet(o) {
    const n = {}; o.traverse((k) => { if (k.name && !n[k.name]) n[k.name] = k; });
    if (!n.govde) return null;
    const B = { govde: n.govde, kolL: n.kolL, kolR: n.kolR, bacakL: n.bacakL, bacakR: n.bacakR, bas: n.bas };
    if (!B.kolL || !B.kolR || !B.bacakL || !B.bacakR || !B.bas) return null;
    if (n.bayrak && n.bayrak.isMesh) { n.bayrak.geometry = n.bayrak.geometry.clone(); B.bayrak = n.bayrak; B.sancakKol = true; }
    if (n.zurna) B.zurna = true;
    if (!n.at_govde) return { U: B, bas: B.bas };
    B.atli = true;
    const At = { govde: n.at_govde, boyun: n.at_boyun, kuyruk: n.at_kuyruk, bacak: [0, 1, 2, 3].map((i) => n['at_bacak' + i]) };
    if (!At.boyun || !At.kuyruk || At.bacak.some((x) => !x)) return null;
    return { U: { binici: B, at: At, bas: B.bas }, bas: B.bas };
  }
  function hazirla(key) {
    const src = A.glb[key]; if (!src) return null;
    const o = SkeletonUtils.clone(src.scene);
    const wrap = new THREE.Group(); wrap.add(o);
    const a = src.ayar || {};
    o.scale.setScalar(src.olcek); o.position.y = src.yOff + (a.y || 0);
    o.rotation.y = THREE.MathUtils.degToRad(a.don != null ? a.don : src.rig ? 0 : 180);
    o.traverse((k) => { if (k.isMesh) { k.castShadow = true; k.receiveShadow = true; } });
    const r = src.rig && iskelet(o);
    if (r) { // oyun kendisi canlandırır
      if (r.U.bayrak) r.U.bayrak.castShadow = false;
      wrap.userData = r.U; wrap.userData.bas = r.bas;
      return wrap;
    }
    if (src.anims.length) {
      const mixer = new THREE.AnimationMixer(o);
      const clip = src.anims.find((c) => /walk|yuru|yürü|ride|gallop|trot|run/i.test(c.name)) || src.anims[0];
      mixer.clipAction(clip).play(); wrap.userData.mixer = mixer;
    }
    // isim etiketi için kafa yüksekliği
    const bas = new THREE.Object3D(); bas.position.y = src.boy * 0.92; wrap.add(bas); wrap.userData.bas = bas;
    return wrap;
  }
  // Aynı rolün çeşitleri: yeniceri.glb, yeniceri-2.glb ... (mehter: davul/zurna/zil sırayla, diğerleri kişiye göre)
  function glbFigur(rol, i = 0, h = 0) {
    const c = Object.keys(A.glb).filter((k) => k === rol || k.startsWith(rol + '-')).sort();
    if (!c.length) return null;
    return hazirla(c[(rol === 'yeniceri' ? h : i) % c.length]);
  }
  A.loadModels = async () => {
    let list = [], ayar = {};
    try { list = (await (await fetch('/api/models')).json()).models || []; } catch {}
    if (!list.length) return;
    try { ayar = await (await fetch('/modeller/ayar.json')).json(); } catch {}
    const loader = new GLTFLoader();
    for (const f of list) {
      const key = f.replace(/\.(glb|gltf)$/i, '').toLocaleLowerCase('tr'), kok = key.split('-')[0];
      if (!BOY[kok]) continue;
      try {
        const gl = await loader.loadAsync('/modeller/' + encodeURIComponent(f));
        const a = ayar[key] || ayar[kok] || {};
        let rig = false; gl.scene.traverse((k) => { if (k.name === 'govde') rig = true; });
        const box = new THREE.Box3().setFromObject(gl.scene), size = box.getSize(new THREE.Vector3());
        // iskeletli modeller oyun ölçüsünde yapılır: boyu olduğu gibi kalır (ayar.json'da "boy" verilmezse)
        const boy = a.boy || (rig ? size.y : BOY[kok]), olcek = size.y > 0 ? boy / size.y : 1;
        A.glb[key] = { scene: gl.scene, anims: gl.animations || [], ayar: a, olcek, yOff: rig ? 0 : -box.min.y * olcek, boy, rig };
        console.log(`[model] ${f} yüklendi (${gl.animations.length} animasyon)`);
      } catch (e) { console.warn('[model] yüklenemedi:', f, e); }
    }
    // yüklenenleri yerine koy
    for (const k of ['padisah', 'ibrahim']) {
      const w = hazirla(k); if (!w) continue;
      const old = A[k]; w.position.copy(old.position); A.root.remove(old); A.root.add(w);
      if (!w.userData.at) w.userData.binici = { kolL: new THREE.Object3D(), kolR: new THREE.Object3D() }; // iskeletsiz modelde selam yok sayılır
      A[k] = w; A[k + 'Bas'] = w.userData.bas;
    }
    for (const u of [...A.uyeler]) if (A.glb[u.rol]) A.ekle(u, u.rol);
  };
  return A;
}
