// Cenaze alayı: Şehzade Mustafa sedyede, kırmızı desenli örtü üstünde, beyaz işlemeli kaftanıyla.
// Önde imam; sedyeyi iki yanda altı kişi omuzlar (izleyiciler, boş yerde bostancılar); arkada yedek at,
// sancaktarlar, atlı sipahiler ve yeniçeriler (izleyiciler). Figürler Padişah Alayı'ndaki gibi kodla ya da .glb.
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


// ---------- desenli dokular (resimdeki gibi: beyaz işlemeli kaftan, kırmızı desenli örtü) ----------
function tuval(w, h, ciz, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  ciz(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function gul(x, cx, cy, r, renk, ic) { // çiçek (rozet): taç yapraklar + göbek
  x.fillStyle = renk;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; x.beginPath(); x.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.42, r * 0.22, a, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = ic; x.beginPath(); x.arc(cx, cy, r * 0.28, 0, Math.PI * 2); x.fill();
}
const ORTU_TEX = () => tuval(256, 256, (x, w, h) => {
  x.fillStyle = '#7a0f17'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(233,214,170,.55)'; x.lineWidth = 3;
  for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, i * 64 + 20); x.bezierCurveTo(64, i * 64 - 10, 128, i * 64 + 50, 256, i * 64 + 20); x.stroke(); } // dallar
  for (const [cx, cy, r] of [[64, 64, 34], [192, 192, 34], [192, 64, 20], [64, 192, 20], [128, 128, 14], [0, 128, 14], [256, 128, 14], [128, 0, 14], [128, 256, 14]]) gul(x, cx, cy, r, '#e9dcbc', '#b3122e');
  x.fillStyle = '#d8b04a'; for (let i = 0; i < 40; i++) { x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 6, 2.5, Math.random() * 3, 0, Math.PI * 2); x.fill(); } // yapraklar
}, [2, 4]);
const KAFTAN_TEX = () => tuval(128, 128, (x, w, h) => {
  x.fillStyle = '#efeadf'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(190,175,140,.55)'; x.lineWidth = 1.5;
  for (let i = -w; i < w * 2; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i, h); x.lineTo(i + h, 0); x.stroke(); }
  x.fillStyle = 'rgba(200,180,130,.6)'; for (let a = 0; a < w; a += 16) for (let b = 0; b < h; b += 16) { x.beginPath(); x.arc(a + 8, b, 2.2, 0, Math.PI * 2); x.fill(); }
}, [3, 6]);
const KOL_TEX = () => tuval(64, 64, (x, w, h) => {
  x.fillStyle = '#1f1d1a'; x.fillRect(0, 0, w, h);
  gul(x, 16, 16, 10, '#c8a54a', '#6a5a2a'); gul(x, 48, 48, 10, '#c8a54a', '#6a5a2a');
}, [2, 3]);

// ---------- Şehzade Mustafa sedyede (baş -z yönünde, yüz yukarı) ----------
export const SEDYE_Y = 1.85; // taşıma sırıklarının yüksekliği (omuz üstü)
const SIRIK_X = 0.6;
function mustafa() {
  const g = new THREE.Group(), Y = SEDYE_Y;
  const ahsap = mat('#4a3020'), ortu = new THREE.MeshStandardMaterial({ map: ORTU_TEX(), roughness: 0.85 });
  const kaftan = new THREE.MeshStandardMaterial({ map: KAFTAN_TEX(), roughness: 0.6 }), kol = new THREE.MeshStandardMaterial({ map: KOL_TEX(), roughness: 0.7 });
  const altin = mat('#e2bc52', { metalness: 0.35, roughness: 0.45 });
  const k = (geo, mt, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, mt); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  // sırıklar ve sedye
  for (const s of [-1, 1]) { const r = k(GEO.sil, ahsap, s * SIRIK_X, Y, 0, 0.09, 4.4, 0.09); r.rotation.x = Math.PI / 2; }
  for (const z of [-1.3, 1.3]) { const r = k(GEO.sil, ahsap, 0, Y, z, 0.07, 1.25, 0.07); r.rotation.z = Math.PI / 2; }
  k(GEO.kutu, ahsap, 0, Y + 0.04, 0, 1.08, 0.08, 2.7);
  // kırmızı desenli örtü: üstü ve iki yana sarkan etekleri
  k(GEO.kutu, ortu, 0, Y + 0.11, 0, 1.3, 0.06, 2.85);
  for (const s of [-1, 1]) k(GEO.kutu, ortu, s * 0.66, Y - 0.1, 0, 0.03, 0.46, 2.85);
  for (const s of [-1, 1]) k(GEO.kutu, ortu, 0, Y - 0.1, s * 1.43, 1.3, 0.46, 0.03);
  const T = Y + 0.14; // yatağın üstü
  k(GEO.kutu, mat('#8a1420'), 0, T + 0.07, -1.2, 0.66, 0.14, 0.4); // yastık
  // beyaz işlemeli kaftan: gövde, etek, ayaklar
  k(GEO.kutu, kaftan, 0, T + 0.15, -0.5, 0.58, 0.3, 0.76);
  k(GEO.kutu, kaftan, 0, T + 0.12, 0.42, 0.6, 0.24, 1.12);
  for (const s of [-1, 1]) k(GEO.kutu, mat('#2a1d15'), s * 0.12, T + 0.22, 1.02, 0.14, 0.24, 0.12); // çizmeler
  for (let i = 0; i < 4; i++) k(GEO.kutu, mat('#c9bfa2'), 0, T + 0.31, -0.78 + i * 0.13, 0.44, 0.025, 0.03); // göğüs kordonları
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) k(GEO.top, altin, s * 0.22, T + 0.31, -0.78 + i * 0.13, 0.05, 0.05, 0.05); // düğmeler
  k(GEO.kutu, kaftan, 0, T + 0.25, -0.15, 0.6, 0.1, 0.12); // kuşak
  for (const z of [-0.2, -0.08]) { const d = k(GEO.sil, altin, 0, T + 0.3, z, 0.17, 0.03, 0.17); d.rotation.x = 0; } // altın kemer tokası
  // kollar: kısa beyaz yen + siyah-altın işlemeli kolluk, eller karında
  for (const s of [-1, 1]) {
    k(GEO.kutu, kaftan, s * 0.36, T + 0.15, -0.62, 0.18, 0.22, 0.34);
    k(GEO.kutu, kol, s * 0.33, T + 0.14, -0.28, 0.14, 0.16, 0.38);
    k(GEO.top, mat(TEN), s * 0.2, T + 0.22, -0.08, 0.13, 0.08, 0.15);
  }
  // baş: siyah saç, gür sakal, bıyık, kapalı gözler (yüz yukarı bakar)
  const B = new THREE.Group(); B.position.set(0, T + 0.26, -1.2); B.scale.setScalar(1.2); g.add(B);
  const bk = (geo, c, x, y, z, sx, sy, sz) => { const o = m(geo, c, x, y, z, sx, sy, sz); B.add(o); return o; };
  bk(GEO.top, TEN, 0, 0, 0, 0.34, 0.3, 0.38);
  bk(GEO.top, '#17110d', 0, -0.05, -0.08, 0.36, 0.26, 0.3); // saç (başın arkası/tepesi)
  bk(GEO.top, '#17110d', 0, 0.05, 0.16, 0.32, 0.2, 0.26); // sakal
  bk(GEO.koni, '#17110d', 0, 0.07, 0.27, 0.22, 0.14, 0.12).rotation.x = Math.PI / 2;
  bk(GEO.kutu, '#17110d', 0, 0.15, 0.08, 0.2, 0.03, 0.04); // bıyık
  for (const s of [-1, 1]) bk(GEO.kutu, '#3a2a20', s * 0.07, 0.16, -0.05, 0.07, 0.01, 0.015); // kapalı gözler
  bk(GEO.kutu, '#c99872', 0, 0.17, 0.0, 0.05, 0.05, 0.08); // burun
  g.userData = { bas: B, tabut: true };
  return g;
}
// imam: beyaz kavuk, koyu yeşil cübbe. Atı: Mustafa'nın boş beyaz atı (siyah çullu), yedekte.
const imam = () => insan({ kaftan: '#1f4a35', ic: '#e8e0cc', kusak: '#e8e0cc', bas: 'kavuk', tepe: '#1f4a35', sakal: '#d9d4c8', cizme: '#2a1d15' });
const yedekAt = () => { const a = at('#f4f1ea', '#1d1d1d', '#8a7a5a'); a.userData.bas = a.userData.boyun; return a; };

// ---------- yürüyüş animasyonu ----------
// U.tasi: tabut taşıyan (-1 sol sırıkta, 1 sağ sırıkta): iç kol yukarıda sırığı tutar.
// U.duaT: dua (iki el önde, avuçlar yukarı). Herkes başı hafif önde, ağır adımla yürür.
function animInsan(U, ph, amp, t) {
  if (!U || !U.govde) return;
  if (!U.atli) {
    U.bacakL.rotation.x = Math.sin(ph) * 0.4 * amp; U.bacakR.rotation.x = -Math.sin(ph) * 0.4 * amp;
    U.govde.position.y = Math.abs(Math.cos(ph)) * 0.04 * amp;
  }
  if (U.bas && !U.atli) U.bas.rotation.x = 0.18; // yas: baş önde
  const dua = U.duaT != null ? t - U.duaT : 99;
  const duaK = dua < 4.5 ? Math.min(1, dua * 3, (4.5 - dua) * 3) : U.duaSurekli ? 1 : 0;
  const ic = U.tasi ? (U.tasi > 0 ? U.kolL : U.kolR) : null, dis = U.tasi ? (U.tasi > 0 ? U.kolR : U.kolL) : null;
  if (ic) { // sırığı tutan kol (sırık içeride, omuz üstünde)
    ic.rotation.set(-0.1, 0, U.tasi > 0 ? -2.75 : 2.75);
    if (duaK > 0) dis.rotation.set(-1.25 * duaK, 0, 0);
    else dis.rotation.set(Math.sin(ph) * 0.3 * amp * -U.tasi, 0, U.tasi > 0 ? -0.08 : 0.08);
    return;
  }
  if (duaK > 0) { // dua: iki el göğüs önünde, avuçlar yukarı
    U.kolL.rotation.set(-1.25 * duaK, 0, -0.25 * duaK);
    if (!U.sancakKol) U.kolR.rotation.set(-1.25 * duaK, 0, 0.25 * duaK);
  } else {
    U.kolL.rotation.set(U.atli ? -0.6 : -Math.sin(ph) * 0.3 * amp, 0, 0.08);
    if (U.sancakKol) U.kolR.rotation.set(-0.25 + Math.sin(ph) * 0.03, 0, 0);
    else U.kolR.rotation.set(U.atli ? -0.6 : Math.sin(ph) * 0.3 * amp, 0, -0.08);
  }
  if (U.bayrak) { // bayrak dalgalanır
    const p = U.bayrak.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.55; p.setZ(i, Math.sin(t * 4 - x * 4 + ph * 0.2) * 0.1 * x); }
    p.needsUpdate = true;
  }
}
function animAt(A, ph, amp) {
  const s = Math.sin(ph), c = Math.cos(ph);
  A.bacak[0].rotation.x = s * 0.5 * amp; A.bacak[3].rotation.x = s * 0.5 * amp;
  A.bacak[1].rotation.x = -s * 0.5 * amp; A.bacak[2].rotation.x = -s * 0.5 * amp;
  A.govde.position.y = Math.abs(c) * 0.06 * amp;
  A.boyun.rotation.x = c * 0.08 * amp + 0.15;
  A.kuyruk.rotation.z = Math.sin(ph * 0.5) * 0.15;
}

// ---------- roller ----------
const YENICERI_RENK = ['#2d4f8a', '#34568f', '#7d2424', '#2d4f8a', '#4a3f7a', '#2f6b5a'];
export const ROL = {
  tabut:   { ad: 'Tabutçu', max: 6 },
  sancak:  { ad: 'Sancaktar', max: 4 },
  sipahi:  { ad: 'Sipahi', max: 6 },
  yeniceri: { ad: 'Yeniçeri', max: 45 },
};
// tabut taşıyanların yeri (sedyeye göre): iki yanda üçer kişi
const TASIMA = [[-1, -1.25], [1, -1.25], [-1, 0], [1, 0], [-1, 1.25], [1, 1.25]].map(([s, z]) => ({ s, x: s * 0.98, z }));
function figur(rol, i, h) {
  switch (rol) {
    case 'sancak': return insan({ kaftan: '#3a2424', bas: 'bork', tasi: 'sancak', bayrak: i % 2 ? '#1f5e3a' : '#1d1d1d', sakal: '#2a1d15' });
    case 'sipahi': return atli(insan({ kaftan: '#5a1d1d', bas: 'migfer', sakal: '#2a1d15', tasi: 'mizrak' }), at(['#5a3a24', '#2a1d15', '#7a4a2a'][i % 3], '#1d1d1d'));
    case 'tabut': // tabutçular yeniçeri kılığında (yeniçeri modeli varsa o kullanılır)
    default: return insan({ kaftan: YENICERI_RENK[h % YENICERI_RENK.length], bas: 'bork', sakal: h % 3 === 0 ? '#2a1d15' : null });
  }
}

export function createAlay(scene) {
  const A = { root: new THREE.Group(), uyeler: [], ph: 0, glb: {}, defin: null };
  scene.add(A.root);

  // sedye (Şehzade Mustafa), önde imam, arkada yedek at ve seyisi
  A.tabut = new THREE.Group(); A.tabut.add(mustafa()); A.root.add(A.tabut);
  A.mustafaBas = A.tabut.children[0].userData.bas;
  A.imam = imam(); A.imam.position.set(0, 0, -4.4); A.root.add(A.imam);
  A.at = yedekAt(); A.at.position.set(0.5, 0, 3.9); A.root.add(A.at);
  A.seyis = insan({ kaftan: '#5a4a3a', bas: 'bork', sakal: '#2a1d15' }); A.seyis.position.set(-0.9, 0, 3.4); A.root.add(A.seyis);
  // boş taşıma yerlerini dolduran bostancılar (izleyici gelince çekilir)
  A.bostanci = TASIMA.map((y, i) => {
    const b = insan({ kaftan: '#8a1d1d', bas: 'bork', sakal: i % 2 ? '#2a1d15' : null });
    b.userData.tasi = y.s; b.position.set(y.x, 0, y.z); A.root.add(b);
    return b;
  });

  // Dizilim: tabutçular sedyenin iki yanında; diğerleri yedek atın arkasında. Hediye toplamı büyük olan öne,
  // hediyesizler en geride (önce gelen önde). Yayalar 3'lü, atlılar 2'li sıra.
  A.dizil = () => {
    const tasiyan = A.uyeler.filter((u) => u.rol === 'tabut').sort((a, b) => (b.puan || 0) - (a.puan || 0) || (a.joinT ?? 0) - (b.joinT ?? 0));
    const dolu = new Set();
    for (const u of tasiyan) {
      // yeri değişmesin: eskiden taşıdığı yer boşsa orada kalır
      let i = u.yer != null && !dolu.has(u.yer) && u.yer < TASIMA.length ? u.yer : TASIMA.findIndex((_, k) => !dolu.has(k));
      if (i < 0) i = 0;
      dolu.add(i); u.yer = i;
    }
    for (const u of A.uyeler) if (u.rol !== 'tabut') u.yer = null;
    A.bostanci.forEach((b, i) => { b.visible = !dolu.has(i); });
    const sirali = A.uyeler.filter((u) => u.rol !== 'tabut').sort((a, b) => (b.puan || 0) - (a.puan || 0) || (a.joinT ?? 0) - (b.joinT ?? 0));
    let z = 6.6, satir = [], tip = null;
    const kapat = () => {
      if (!satir.length) return;
      const atli = tip === 'atli', xs = atli ? [-1.3, 1.3] : [-1.3, 0, 1.3];
      const bas = satir.length === 1 ? [0] : satir.length === 2 && !atli ? [-0.7, 0.7] : xs;
      satir.forEach((u, i) => { u.sira = new THREE.Vector3(bas[i], 0, z + (atli ? 0.6 : 0)); });
      z += atli ? 3.2 : 1.35; satir = [];
    };
    for (const u of sirali) {
      const t = u.rol === 'sipahi' ? 'atli' : 'yaya';
      if (t !== tip || satir.length >= (t === 'atli' ? 2 : 3)) { kapat(); tip = t; }
      satir.push(u);
    }
    kapat();
    hedefler();
  };
  // hedef konumlar: tabutçular sedyenin o anki yerine göre, diğerleri sıradaki yerine göre (definde kabre yaklaşırlar)
  const tabutYer = new THREE.Vector3(), TOPLAN = new THREE.Vector3(-10, 0, -2); // definde alay kabrin arkasında toplanır
  function hedefler() {
    const D = A.defin, ac = D ? D.acil || 0 : 0; // ac: definde tabutçular kabirden geri çekilir
    for (const u of A.uyeler) {
      if (!u.hedef) u.hedef = new THREE.Vector3();
      if (u.rol === 'tabut' && u.yer != null) { const y = TASIMA[u.yer]; u.hedef.set(tabutYer.x + y.x + y.s * ac * 0.9, 0, tabutYer.z + y.z); }
      else if (u.sira) { u.hedef.copy(u.sira); if (D && D.toplan) u.hedef.addScaledVector(TOPLAN, D.toplan); }
    }
    A.bostanci.forEach((b, i) => { const y = TASIMA[i]; b.userData.hedef = new THREE.Vector3(tabutYer.x + y.x + y.s * ac * 0.9, 0, tabutYer.z + y.z); });
  }

  A.ekle = (u, rol) => {
    if (u.ch) A.root.remove(u.ch);
    let h = 0; for (const c of String(u.id)) h = (h * 31 + c.charCodeAt(0)) | 0;
    h = Math.abs(h);
    const sayi = A.uyeler.filter((x) => x.rol === rol && x !== u).length;
    u.ch = glbFigur(rol === 'tabut' ? 'yeniceri' : rol, sayi, h) || figur(rol, sayi, h);
    if (rol !== u.rol) u.yer = null;
    u.rol = rol; u.faz = (h % 100) / 100 * 0.6;
    u.bas = u.ch.userData.bas || u.ch;
    if (!A.uyeler.includes(u)) A.uyeler.push(u);
    A.dizil();
    if (rol === 'tabut') u.ch.userData.tasi = TASIMA[u.yer].s;
    // yeni gelen arkadan (veya yandan) yürüyerek gelir
    u.ch.position.copy(u.hedef).add(new THREE.Vector3(Math.sign(u.hedef.x || 1) * 5, 0, 4));
    A.root.add(u.ch);
  };
  A.cikar = (u) => {
    const i = A.uyeler.indexOf(u); if (i < 0) return;
    A.uyeler.splice(i, 1); if (u.ch) A.root.remove(u.ch); u.ch = null; u.rol = null; u.yer = null;
    A.dizil();
  };
  A.sayi = (rol) => A.uyeler.filter((u) => u.rol === rol).length;

  // Defin: d = { tasi 0..1 (sedye kabrin başına), indir 0..1 (kabre iner), acil 0..1, toplan 0..1, dua bool } ya da null
  A.setDefin = (d) => { A.defin = d; };

  // her kare
  A.update = (dt, hiz, t, kabirX) => {
    const D = A.defin;
    // sedyenin yeri: yolda kendi yerinde; definde kabrin başına gider ve kabre iner
    const tk = D ? D.tasi : 0, ik = D ? D.indir : 0;
    tabutYer.set((kabirX ?? -12) * tk, 0, 0);
    hedefler();
    const duruyor = !!D && (tk >= 1 || tk <= 0);
    const amp = duruyor ? 0.05 : Math.min(1, 0.45 + hiz * 0.15);
    A.ph += dt * (duruyor ? 0.6 : 2.4 + hiz * 1.2);
    const sallan = duruyor ? 0 : Math.abs(Math.sin(A.ph)) * 0.04;
    A.tabut.position.set(tabutYer.x, sallan - ik * 2.6, tabutYer.z);
    A.tabut.visible = ik < 0.999;
    // imam, yedek at, seyis
    animInsan(A.imam.userData, A.ph, amp, t);
    const iu = A.imam.userData; if (D && D.dua) { iu.duaSurekli = true; } else iu.duaSurekli = false;
    A.imam.position.lerp(D && D.toplan ? new THREE.Vector3((kabirX ?? -12) + 0.2, 0, -2.6) : new THREE.Vector3(0, 0, -4.4), Math.min(1, dt * 0.8));
    if (A.at.userData.bacak) animAt(A.at.userData, A.ph * 0.5, amp);
    animInsan(A.seyis.userData, A.ph + 0.5, amp, t);
    for (const b of A.bostanci) {
      if (!b.visible) continue;
      b.position.lerp(b.userData.hedef, Math.min(1, dt * 2));
      b.userData.duaSurekli = !!(D && D.dua);
      animInsan(b.userData, A.ph + b.position.z, amp, t);
    }
    for (const u of A.uyeler) {
      const c = u.ch; if (!c) continue;
      if (u.hedef) {
        const d = c.position.distanceTo(u.hedef), k = Math.min(1, dt * (d > 3 ? 1.4 : 2.5));
        c.position.lerp(u.hedef, k);
      }
      const U = c.userData;
      const B = U.binici || U;
      B.tasi = u.rol === 'tabut' && u.yer != null && !(D && D.acil > 0.5) ? TASIMA[u.yer].s : 0;
      B.duaSurekli = !!(D && D.dua);
      if (U.mixer) U.mixer.update(dt * (0.5 + hiz * 0.25));
      else if (U.at) { animAt(U.at, A.ph * 0.5 + u.faz * 6, amp); animInsan(U.binici, A.ph + u.faz, amp, t); }
      else animInsan(U, A.ph + u.faz * 3, amp, t);
    }
  };
  A.dua = (u, t) => { const U = u.ch && (u.ch.userData.binici || u.ch.userData); if (U) U.duaT = t; };
  A.topluDua = (t) => {
    for (const u of A.uyeler) A.dua(u, t + Math.random() * 0.4);
    for (const b of A.bostanci) b.userData.duaT = t + Math.random() * 0.4;
    A.imam.userData.duaT = t;
  };

  // ---------- modeller/ klasöründen .glb ----------
  // mustafa.glb: sedye + naaş (varsa kodla yapılanın yerine). yeniceri.glb, sancak.glb, sipahi.glb (+ -2, -3 çeşitleri)
  // Bu klasörde yoksa Padişah Alayı'nın modelleri kullanılır (sunucu verir). İsteğe bağlı modeller/ayar.json.
  const BOY = { mustafa: 2.2, sipahi: 3.0, yeniceri: 1.85, sancak: 1.85 };
  // İskeletli (parça adlı) model: govde/kolL/kolR/bacakL/bacakR/bas (+ at_govde/at_boyun/at_kuyruk/at_bacak0..3).
  function iskelet(o) {
    const n = {}; o.traverse((k) => { if (k.name && !n[k.name]) n[k.name] = k; });
    if (!n.govde) return null;
    const B = { govde: n.govde, kolL: n.kolL, kolR: n.kolR, bacakL: n.bacakL, bacakR: n.bacakR, bas: n.bas };
    if (!B.kolL || !B.kolR || !B.bacakL || !B.bacakR || !B.bas) return null;
    if (n.bayrak && n.bayrak.isMesh) { n.bayrak.geometry = n.bayrak.geometry.clone(); B.bayrak = n.bayrak; B.sancakKol = true; }
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
    if (r) {
      if (r.U.bayrak) r.U.bayrak.castShadow = false;
      wrap.userData = r.U; wrap.userData.bas = r.bas;
      return wrap;
    }
    if (src.anims.length) {
      const mixer = new THREE.AnimationMixer(o);
      const clip = src.anims.find((c) => /walk|yuru|yürü|ride|gallop|trot|run/i.test(c.name)) || src.anims[0];
      mixer.clipAction(clip).play(); wrap.userData.mixer = mixer;
    }
    const bas = new THREE.Object3D(); bas.position.y = src.boy * 0.92; wrap.add(bas); wrap.userData.bas = bas;
    return wrap;
  }
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
        const boy = a.boy || (rig ? size.y : BOY[kok]), olcek = size.y > 0 ? boy / size.y : 1;
        A.glb[key] = { scene: gl.scene, anims: gl.animations || [], ayar: a, olcek, yOff: rig ? 0 : -box.min.y * olcek, boy, rig };
        console.log(`[model] ${f} yüklendi`);
      } catch (e) { console.warn('[model] yüklenemedi:', f, e); }
    }
    if (A.glb.mustafa) { // kendi sedye modeli
      const w = hazirla('mustafa'); w.rotation.y = 0;
      A.tabut.clear(); A.tabut.add(w); A.mustafaBas = w.userData.bas;
    }
    // bostancılar ve seyis de yeniçeri modeliyle
    if (A.glb.yeniceri) {
      A.bostanci = A.bostanci.map((b, i) => {
        const w = glbFigur('yeniceri', i, i * 7 + 3); if (!w) return b;
        w.position.copy(b.position); w.visible = b.visible; w.userData.tasi = b.userData.tasi; w.userData.hedef = b.userData.hedef;
        A.root.remove(b); A.root.add(w); return w;
      });
      const s = glbFigur('yeniceri', 0, 5); if (s) { s.position.copy(A.seyis.position); A.root.remove(A.seyis); A.root.add(s); A.seyis = s; }
    }
    for (const u of [...A.uyeler]) A.ekle(u, u.rol);
  };
  return A;
}
