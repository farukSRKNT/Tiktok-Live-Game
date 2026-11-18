// Dünya: alay hep orijinde durur, yol ve doğa (parçalar hâlinde) alayın altından akar.
// Her parça (L birim) güzergâhtaki yerine göre biyomundan doğa alır: şehir, sahil, göl, ova, orman, zeytinlik…
// Durakların yapıları (cami, saray, han, kale, köprü…) tam o durağın yerinde yol kenarına konur.
import * as THREE from 'three';
import { DURAKLAR, biyomAt, TOPLAM_S } from './rota.js';

export const L = 24;          // parça boyu
const FAR = 300, BEHIND = 60; // ne kadar ileri/geri parça tutulur
const YOL_G = 5.2;            // yol genişliği

const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------- biyomlar ----------
// sol/sag: yolun solunda/sağında kara genişliği (dışı su). agac: [tür, ağırlık]. yog: ağaç yoğunluğu (parça başına)
const BIYOM = {
  sehir:     { yer: '#8c9a5a', yol: '#a69c8c', sol: 90, sag: 90, yog: 7, agac: [['selvi', 4], ['cinar', 2]], ev: 5, dag: 0.12 },
  deniz:     { yer: null, sol: 0, sag: 0, yog: 0, agac: [], kayik: 0.8 },
  sahil:     { yer: '#98a660', yol: '#b8a47a', sol: 90, sag: 8, yog: 6, agac: [['selvi', 2], ['zeytin', 2], ['cinar', 1]], ev: 0.8, kayik: 0.5, dag: 0.15 },
  kir:       { yer: '#7d9a4a', yol: '#b39a6c', sol: 90, sag: 90, yog: 9, agac: [['mese', 4], ['cinar', 1], ['kavak', 2]], ev: 0.8, kaya: 2, koyun: 0.35, dag: 0.45 },
  gol:       { yer: '#7c9c55', yol: '#b39a6c', sol: 10, sag: 90, yog: 8, agac: [['kavak', 3], ['sogut', 3], ['mese', 1]], sazlik: 6, kayik: 0.3, dag: 0.35 },
  zeytinlik: { yer: '#a29b62', yol: '#bba57a', sol: 90, sag: 90, yog: 16, agac: [['zeytin', 8], ['selvi', 1]], ev: 0.3, kaya: 1, dag: 0.35 },
  bursa:     { yer: '#7f9a52', yol: '#a69c8c', sol: 90, sag: 90, yog: 8, agac: [['cinar', 3], ['selvi', 3], ['kavak', 1]], ev: 4, dag: 1, karli: true },
  ova:       { yer: '#b7a65a', yol: '#b8a070', sol: 90, sag: 90, yog: 5, agac: [['kavak', 4], ['mese', 1]], ev: 0.5, tarla: 1, koyun: 0.3, dag: 0.3 },
  orman:     { yer: '#5d7a3c', yol: '#a08a62', sol: 90, sag: 90, yog: 22, agac: [['cam', 10], ['mese', 1]], kaya: 2, dag: 0.5 },
  manisa:    { yer: '#86985a', yol: '#a69c8c', sol: 90, sag: 90, yog: 8, agac: [['selvi', 3], ['zeytin', 2], ['cinar', 1]], ev: 4, dag: 1, spil: true },
};

// ---------- ortak malzemeler ----------
const M = {};
const mat = (k, c, o = {}) => M[k] || (M[k] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...o }));
const G = {
  kutu: new THREE.BoxGeometry(1, 1, 1),
  sil: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  koni: new THREE.ConeGeometry(0.5, 1, 7),
  koni4: new THREE.ConeGeometry(0.72, 1, 4),
  top: new THREE.IcosahedronGeometry(0.5, 0),
  top1: new THREE.IcosahedronGeometry(0.5, 1),
  kubbe: new THREE.SphereGeometry(0.5, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
  yer: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  kaya: new THREE.DodecahedronGeometry(0.5, 0),
};
function mesh(geo, m, x, y, z, sx, sy, sz, gol = true) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z); o.scale.set(sx, sy ?? sx, sz ?? sx);
  o.castShadow = gol; o.receiveShadow = true;
  return o;
}

// ---------- doku: çimen / toprak gürültüsü ----------
function noiseTex(rep, dark = 0.18) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2200; i++) { const v = 255 - Math.random() * 255 * dark; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 2 + Math.random() * 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function tasTex() { // kaldırım taşı
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); x.fillStyle = '#8a8378'; x.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 6; k++) {
    const v = 200 + Math.random() * 55; x.fillStyle = `rgb(${v},${v - 6},${v - 16})`;
    x.fillRect(k * 22 + (r % 2) * 11 + 1, r * 16 + 1, 20, 14);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 4); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- ağaçlar ve küçük şeyler ----------
const AGAC = {
  selvi: (r) => { const g = new THREE.Group(), h = 5 + r() * 3; g.add(mesh(G.sil, mat('govde', '#5b4330'), 0, 0.4, 0, 0.25, 0.8, 0.25)); g.add(mesh(G.koni, mat('selvi', '#2f4d2a'), 0, 0.6 + h / 2, 0, 1.1, h, 1.1)); return g; },
  cinar: (r) => { const g = new THREE.Group(), s = 3 + r() * 2; g.add(mesh(G.sil, mat('govde2', '#7a6a55'), 0, 1.5, 0, 0.5, 3, 0.5)); g.add(mesh(G.top, mat('cinar', '#4f7a34'), 0, 3 + s * 0.4, 0, s * 1.3, s, s * 1.3)); g.add(mesh(G.top, mat('cinar2', '#5d8a3a'), s * 0.4, 3.4 + s * 0.3, 0.3, s * 0.8)); return g; },
  mese: (r) => { const g = new THREE.Group(), s = 2.2 + r() * 1.6; g.add(mesh(G.sil, mat('govde', '#5b4330'), 0, 1, 0, 0.35, 2, 0.35)); g.add(mesh(G.top, mat('mese', '#4a6e2c'), 0, 2 + s * 0.4, 0, s * 1.2, s, s * 1.2)); return g; },
  cam: (r) => { const g = new THREE.Group(), s = 0.8 + r() * 0.6; g.add(mesh(G.sil, mat('govde', '#5b4330'), 0, 1, 0, 0.3 * s, 2 * s, 0.3 * s)); for (let i = 0; i < 3; i++) g.add(mesh(G.koni, mat('cam', '#2d5530'), 0, (2 + i * 1.5) * s, 0, (3.2 - i * 0.8) * s, 2.6 * s, (3.2 - i * 0.8) * s)); return g; },
  zeytin: (r) => { const g = new THREE.Group(), s = 1.6 + r() * 1; g.add(mesh(G.sil, mat('govde3', '#6b5a48'), 0, 0.6, 0, 0.35, 1.2, 0.35)); g.add(mesh(G.top, mat('zeytin', '#7d8a5a'), 0, 1.4 + s * 0.3, 0, s * 1.5, s * 0.8, s * 1.5)); return g; },
  kavak: (r) => { const g = new THREE.Group(), h = 7 + r() * 4; g.add(mesh(G.sil, mat('govde2', '#7a6a55'), 0, 0.5, 0, 0.25, 1, 0.25)); g.add(mesh(G.top, mat('kavak', '#5f8a3a'), 0, 0.8 + h / 2, 0, 1.6, h, 1.6)); return g; },
  sogut: (r) => { const g = new THREE.Group(), s = 2.5 + r(); g.add(mesh(G.sil, mat('govde', '#5b4330'), 0, 1, 0, 0.4, 2, 0.4)); g.add(mesh(G.top1, mat('sogut', '#7fa04a'), 0, 2.2 + s * 0.3, 0, s * 1.4, s * 1.1, s * 1.4)); return g; },
};
function agacSec(B, r) {
  let tot = 0; for (const [, w] of B.agac) tot += w;
  let x = r() * tot; for (const [k, w] of B.agac) { if ((x -= w) <= 0) return k; }
  return B.agac[0][0];
}
// modeller/ klasöründen yüklenen yapılar (ev-1.glb, ev-2.glb …, kadirga.glb). Yoksa kodla yapılanlar kullanılır.
const YAPI_GLB = { ev: [], kadirga: null };
function ev(r) {
  if (YAPI_GLB.ev.length) {
    const g = YAPI_GLB.ev[Math.floor(r() * YAPI_GLB.ev.length) % YAPI_GLB.ev.length].clone();
    const s = 0.85 + r() * 0.3; g.scale.set(s, s, s);
    return g;
  }
  const g = new THREE.Group(), w = 3 + r() * 2.5, d = 3 + r() * 2, h = 2.4 + r() * 2.2;
  const duvar = r() < 0.6 ? mat('evBeyaz', '#e8dfcc') : mat('evAhsap', '#b48c63');
  g.add(mesh(G.kutu, duvar, 0, h / 2, 0, w, h, d));
  const cat = mesh(G.koni4, mat('kiremit', '#a24a2a'), 0, h + 0.8, 0, w * 1.05, 1.6, d * 1.05); cat.rotation.y = Math.PI / 4; g.add(cat);
  g.add(mesh(G.kutu, mat('pencere', '#3a2a1a'), w / 2 + 0.01, h * 0.6, 0, 0.05, 0.7, 0.6, false));
  return g;
}
function kayik(r) {
  const g = new THREE.Group();
  g.add(mesh(G.kutu, mat('tekne', '#6a4426'), 0, 0.2, 0, 1.6, 0.5, 4.5));
  if (r() < 0.6) {
    g.add(mesh(G.sil, mat('direk', '#4a3020'), 0, 2.2, 0, 0.1, 4, 0.1));
    const y = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), mat('yelken', '#efe6d0', { side: THREE.DoubleSide }));
    y.position.set(0, 2.6, 0.2); y.rotation.y = Math.PI / 2; g.add(y);
  }
  g.userData.salla = r() * 6;
  return g;
}
function koyunSurusu(r) {
  const g = new THREE.Group(), n = 4 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const k = new THREE.Group(), x = (r() - 0.5) * 6, z = (r() - 0.5) * 6;
    k.add(mesh(G.top1, mat('yun', '#efeae0'), 0, 0.55, 0, 1.0, 0.7, 1.3));
    k.add(mesh(G.kutu, mat('koyunbas', '#2a2420'), 0, 0.7, -0.7, 0.32, 0.34, 0.4, false));
    k.position.set(x, 0, z); k.rotation.y = r() * 6; g.add(k);
  }
  return g;
}
function dag(r, karli, yesil) {
  const g = new THREE.Group(), h = 30 + r() * 40, w = 60 + r() * 60;
  g.add(mesh(G.koni, mat(yesil ? 'dagY' : 'dag', yesil ? '#6b7f52' : '#7d7a6a'), 0, h / 2 - 2, 0, w, h, w * 0.8, false));
  if (karli) g.add(mesh(G.koni, mat('kar', '#f3f5f8'), 0, h - 2 - h * 0.15, 0, w * 0.3, h * 0.3 + 0.2, w * 0.24, false));
  return g;
}

// ---------- durak yapıları ----------
const TAS = () => mat('tas', '#d9cfbd'), KURSUN = () => mat('kursun', '#7c8794', { metalness: 0.3, roughness: 0.6 });
function minare(h) {
  const g = new THREE.Group();
  g.add(mesh(G.sil, TAS(), 0, h / 2, 0, 0.9, h, 0.9));
  g.add(mesh(G.sil, TAS(), 0, h * 0.78, 0, 1.4, 0.3, 1.4));
  g.add(mesh(G.koni, KURSUN(), 0, h + 1.2, 0, 1.0, 2.6, 1.0));
  return g;
}
function cami(cok = false) {
  const g = new THREE.Group();
  if (cok) { // Bursa Ulu Cami: 20 kubbe
    g.add(mesh(G.kutu, TAS(), 0, 3.5, 0, 22, 7, 18));
    for (let i = 0; i < 5; i++) for (let k = 0; k < 4; k++) g.add(mesh(G.kubbe, KURSUN(), -8.8 + i * 4.4, 7, -6.6 + k * 4.4, 3.8, 2.6, 3.8));
    const m1 = minare(20); m1.position.set(11.5, 0, -9); g.add(m1);
    const m2 = minare(20); m2.position.set(11.5, 0, 9); g.add(m2);
  } else {
    g.add(mesh(G.kutu, TAS(), 0, 3.5, 0, 12, 7, 12));
    g.add(mesh(G.sil, TAS(), 0, 7.5, 0, 10, 1.2, 10));
    g.add(mesh(G.kubbe, KURSUN(), 0, 8, 0, 10, 7, 10));
    for (const z of [-5, 5]) { const yk = mesh(G.kubbe, KURSUN(), 6.5, 5, z, 4, 3, 4); g.add(yk); }
    const m1 = minare(18); m1.position.set(7.5, 0, -7.5); g.add(m1);
    const m2 = minare(18); m2.position.set(7.5, 0, 7.5); g.add(m2);
  }
  return g;
}
function sur(n, renk = '#c8b89a', tugla = false) {
  const g = new THREE.Group(), m = mat(tugla ? 'tugla' : 'sur', tugla ? '#b0704e' : renk);
  g.add(mesh(G.kutu, m, 0, 3, 0, 3, 6, n * 10));
  for (let i = 0; i < n * 5; i++) g.add(mesh(G.kutu, m, 0, 6.5, -n * 5 + 1 + i * 2, 3.2, 1, 1));
  for (let i = 0; i <= n; i++) { const z = -n * 5 + i * 10; g.add(mesh(G.sil, m, 0, 4.5, z, 4.6, 9, 4.6)); g.add(mesh(G.koni, mat('kule', '#7c4a32'), 0, 10.2, z, 5.2, 3, 5.2)); }
  return g;
}
function saray(manisa) {
  const g = new THREE.Group();
  const s = sur(3, manisa ? '#d6c7a8' : '#e2d9c6'); g.add(s);
  const kapi = mesh(G.kutu, mat('kapi', '#4a2e1c'), 1.6, 2.4, 0, 0.3, 4.8, 3.4, false); g.add(kapi);
  const c = cami(); c.scale.setScalar(0.7); c.position.set(-14, 0, -4); g.add(c);
  for (let i = 0; i < 5; i++) { const t = AGAC.selvi(rng(i + 3)); t.position.set(-5 - (i % 2) * 3, 0, -12 + i * 6); g.add(t); }
  // sancak
  g.add(mesh(G.sil, mat('direk', '#4a3020'), 0, 12, 10, 0.2, 12, 0.2));
  const bayrak = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), mat('sancak', '#c1121f', { side: THREE.DoubleSide, flatShading: false }));
  bayrak.position.set(0, 16.5, 12); bayrak.rotation.y = Math.PI / 2; bayrak.userData.dalga = true; g.add(bayrak);
  return g;
}
function han() {
  const g = new THREE.Group(), m = mat('han', '#b9a483');
  g.add(mesh(G.kutu, m, 0, 3, 0, 18, 6, 18));
  for (let i = 0; i < 3; i++) g.add(mesh(G.kubbe, KURSUN(), -4 + i * 4, 6, -6, 3, 2, 3));
  g.add(mesh(G.kutu, mat('kapi', '#4a2e1c'), 9.05, 2, 0, 0.2, 4, 3, false));
  for (const z of [-7, 7]) g.add(mesh(G.kutu, m, 7, 7, z, 1.2, 2, 1.2));
  return g;
}
function iskele() {
  const g = new THREE.Group(), m = mat('ahsap', '#7a5734');
  g.add(mesh(G.kutu, m, 2, 0.3, 0, 6, 0.4, 26));
  for (let i = 0; i < 6; i++) for (const x of [-0.6, 4.6]) g.add(mesh(G.sil, m, x, -0.5, -12 + i * 5, 0.4, 2, 0.4));
  for (let i = 0; i < 3; i++) { const k = kayik(rng(i + 11)); k.position.set(7, 0, -9 + i * 8); g.add(k); }
  const kul = mesh(G.kutu, m, -4, 1.6, -8, 4, 3.2, 4); g.add(kul);
  return g;
}
function kopru() { // nehir yolun altından geçer, iki yanda korkuluk ve kemerler
  const g = new THREE.Group(), m = mat('kopruTas', '#c9bea8');
  const su = mesh(G.yer, mat('nehir', '#3d6f8f', { roughness: 0.3 }), 0, -0.3, 0, 400, 1, 14, false); su.receiveShadow = false; g.add(su);
  for (const x of [-YOL_G / 2 - 0.4, YOL_G / 2 + 0.4]) {
    g.add(mesh(G.kutu, m, x, 0.6, 0, 0.6, 1.2, 18));
    for (const z of [-4, 4]) g.add(mesh(new THREE.TorusGeometry(2.6, 0.7, 6, 12, Math.PI), m, x, -0.4, z, 1, 1, 1));
  }
  g.userData.tamGenis = true; // köprü yolun üstünde, yan kaydırma yok
  return g;
}
function antik() {
  const g = new THREE.Group(), m = mat('mermer', '#e9e3d5');
  for (let i = 0; i < 6; i++) {
    const h = i === 2 ? 3 : i === 4 ? 5 : 8;
    g.add(mesh(G.sil, m, 0, h / 2, -10 + i * 4, 1.2, h, 1.2));
  }
  g.add(mesh(G.kutu, m, 0, 8.4, -6, 1.6, 0.8, 9));
  for (let i = 0; i < 4; i++) g.add(mesh(G.kaya, m, 3 + i, 0.4, -8 + i * 5, 1.5, 0.8, 1.2));
  return g;
}
function kale() { const g = sur(4, '#c8b89a', true); return g; }

const YAPILAR = { saray: () => saray(false), cami: () => cami(), ulucami: () => cami(true), han, iskele, kopru, antik, kale };

// köşe taşı (mil taşı) + tabela
function milTasi(d) {
  const g = new THREE.Group();
  g.add(mesh(G.kutu, mat('mil', '#bdb3a1'), 0, 0.9, 0, 0.8, 1.8, 0.5));
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const x = c.getContext('2d');
  x.fillStyle = '#5a3a1e'; x.fillRect(0, 0, 512, 160); x.strokeStyle = '#d8b25a'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 150);
  x.fillStyle = '#ffe9b0'; x.font = '800 70px Nunito, Segoe UI, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(d.ad, 256, 66); x.font = '700 30px Nunito, Segoe UI, sans-serif'; x.fillText(`${d.km} km`, 256, 126);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const tab = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, side: THREE.DoubleSide }));
  tab.position.set(0, 2.6, 0); tab.rotation.y = Math.PI / 2; g.add(tab);
  g.add(mesh(G.sil, mat('direk', '#4a3020'), 0, 1.5, 0, 0.12, 3, 0.12));
  return g;
}

// ---------- dünya ----------
export function buildWorld(scene) {
  const W = { s: 0, dir: 1, chunks: new Map(), su: null, biyom: 'sehir', time: 0 };

  // ışıklar
  const hemi = new THREE.HemisphereLight('#cfe3ff', '#6b5a3a', 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.6);
  sun.position.set(-18, 30, -10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target); sun.target.position.set(0, 0, 4);
  W.hemi = hemi; W.sun = sun;

  // deniz (her yerin altında; kara parçaları üstünü örter)
  const suMat = new THREE.MeshStandardMaterial({ color: '#2f6f9a', roughness: 0.25, metalness: 0.1 });
  const su = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 1, 1).rotateX(-Math.PI / 2), suMat);
  su.position.y = -0.35; su.receiveShadow = true; scene.add(su); W.su = su;

  // mavna (deniz geçişinde alayın altında)
  const mavna = new THREE.Group();
  const ah = mat('ahsap', '#7a5734');
  mavna.add(mesh(G.kutu, ah, 0, -0.25, 6, 8, 0.6, 40));
  for (const x of [-4, 4]) mavna.add(mesh(G.kutu, ah, x, 0.3, 6, 0.3, 0.8, 40));
  for (let i = 0; i < 4; i++) { const k = new THREE.Group(); k.add(mesh(G.sil, ah, 0, 0, 0, 0.12, 5, 0.12)); k.rotation.z = 1.1; k.position.set(-6, 0.5, -8 + i * 9); mavna.add(k); const k2 = k.clone(); k2.rotation.z = -1.1; k2.position.x = 6; mavna.add(k2); }
  mavna.visible = false; scene.add(mavna); W.mavna = mavna;

  const grassTex = noiseTex(6), yolTex = noiseTex(2, 0.3), tas = tasTex();
  const yerMat = {}, yolMat = {};
  const getYer = (c) => yerMat[c] || (yerMat[c] = new THREE.MeshStandardMaterial({ color: c, map: grassTex, roughness: 1 }));
  const getYol = (c, tasli) => yolMat[c + tasli] || (yolMat[c + tasli] = new THREE.MeshStandardMaterial({ color: tasli ? '#ffffff' : c, map: tasli ? tas : yolTex, roughness: 1 }));
  const tarlaMat = new THREE.MeshStandardMaterial({ color: '#d9b950', map: noiseTex(3, 0.35), roughness: 1 });

  function buildChunk(n) {
    const r = rng(n * 7919 + 13), q0 = n * L, qm = q0 + L / 2;
    const bk = biyomAt(qm), B = BIYOM[bk] || BIYOM.kir;
    const g = new THREE.Group(); g.userData.n = n;
    const sideSign = () => (r() < 0.5 ? -1 : 1);
    // kara + yol
    if (B.yer) {
      const yer = getYer(B.yer), w = B.sol + B.sag;
      const p = mesh(G.yer, yer, (B.sag - B.sol) / 2, -0.02, 0, w, 1, L + 0.05, false); g.add(p);
      const tasli = bk === 'sehir' || bk === 'bursa' || bk === 'manisa';
      g.add(mesh(G.yer, getYol(B.yol, tasli), 0, 0, 0, YOL_G, 1, L + 0.05, false));
      // kıyı şeridi (kum)
      if (B.sag < 20) g.add(mesh(G.yer, mat('kum', '#d8c79a'), B.sag + 1.5, -0.1, 0, 3, 1, L + 0.05, false));
      if (B.sol < 20) g.add(mesh(G.yer, mat('kum', '#d8c79a'), -B.sol - 1.5, -0.1, 0, 3, 1, L + 0.05, false));
    }
    const place = (o, xmin, xmax, side) => {
      const s = side || sideSign(), x = s * (xmin + r() * (xmax - xmin));
      if ((s < 0 && -x > B.sol - 1) || (s > 0 && x > B.sag - 1)) return false;
      o.position.set(x, 0, (r() - 0.5) * L); o.rotation.y = r() * 6; g.add(o); return true;
    };
    // ağaçlar: yol kenarında seyrek, uzakta daha sık
    // Yolun iki yanı kameralar için boş bırakılır (yakın çekimde ağaç kameranın içinden geçmesin):
    // solda yol boyu ince selvi/kavak sırası, gerisi 17 birimden ötede.
    const sol = -1;
    for (let i = 0; i < B.yog; i++) {
      const k = agacSec(B, r);
      if (i % 4 === 0 && B.sol > 10) { const ince = r() < 0.5 ? 'selvi' : 'kavak'; place(AGAC[(bk === 'sehir' || bk === 'manisa' || bk === 'bursa') ? 'selvi' : ince](r), 5.6, 7, sol); }
      else place(AGAC[k](r), 17, 70);
    }
    if (B.ev) for (let i = 0; i < Math.floor(B.ev) + (r() < B.ev % 1 ? 1 : 0); i++) place(ev(r), 18, 45);
    if (B.kaya) for (let i = 0; i < B.kaya; i++) { const k = mesh(G.kaya, mat('kaya', '#8d8a80'), 0, 0.3, 0, 1 + r() * 2.5, 0.7 + r(), 1 + r() * 2); if (place(k, 5, 40)) k.position.y = 0.2; }
    if (B.koyun && r() < B.koyun) place(koyunSurusu(r), 12, 30);
    if (B.tarla) for (const s of [-1, 1]) if (r() < 0.75) { const t = mesh(G.yer, tarlaMat, s * (9 + 12), 0.02, 0, 20, 1, L * 0.9, false); g.add(t); }
    if (B.sazlik) for (let i = 0; i < B.sazlik; i++) { const k = mesh(G.koni, mat('saz', '#6f8a3a'), 0, 0.8, 0, 0.6, 1.8, 0.6); place(k, B.sol - 3, B.sol + 2, -1); }
    if (B.kayik) for (const s of [-1, 1]) {
      const kara = s < 0 ? B.sol : B.sag;
      if (kara < 60 && r() < B.kayik) {
        // açık denizde arada bir uzakta kürekli kadırga geçer
        const buyuk = YAPI_GLB.kadirga && bk === 'deniz' && r() < 0.35;
        const k = buyuk ? YAPI_GLB.kadirga.clone() : kayik(r);
        if (buyuk) { k.scale.setScalar(0.5); k.userData.salla = r() * 6; }
        k.position.set(s * (kara + (buyuk ? 40 : 10) + r() * 50), 0, (r() - 0.5) * L); k.rotation.y = r() * 0.6; g.add(k);
      }
    }
    if (B.dag && r() < B.dag * 0.6) {
      const s = B.karli || B.spil ? -1 : sideSign();
      const d = dag(r, B.karli, !B.karli); d.position.set(s * (110 + r() * 90), 0, (r() - 0.5) * L); g.add(d);
    }
    // bu parçadaki duraklar: köşe taşı + yapı
    for (const d of DURAKLAR) {
      if (d.s < q0 || d.s >= q0 + L) continue;
      const z = -(d.s - qm);
      const mil = milTasi(d); mil.position.set(-YOL_G / 2 - 1.3, 0, z); mil.scale.z = W.dir; g.add(mil);
      if (d.yapi && YAPILAR[d.yapi]) {
        const y = d.yapi === 'saray' && d.biyom === 'manisa' ? saray(true) : YAPILAR[d.yapi]();
        if (y.userData.tamGenis) y.position.set(0, 0, z);
        else { y.position.set(d.yapi === 'iskele' ? 6 : -24, 0, z); y.scale.z = W.dir; }
        g.add(y);
      }
    }
    return g;
  }

  // her karede: parçaları yerleştir / yenilerini kur / gerileri at
  W.update = (s, dir, dt, t) => {
    if (dir !== W.dir) { for (const c of W.chunks.values()) scene.remove(c); W.chunks.clear(); } // yön değişti: dünyayı yeniden kur
    W.s = s; W.dir = dir; W.time = t;
    const nA = Math.floor((s - (dir > 0 ? BEHIND : FAR)) / L), nB = Math.floor((s + (dir > 0 ? FAR : BEHIND)) / L);
    const nMax = Math.ceil(TOPLAM_S / L) + 2;
    for (let n = Math.max(-3, nA); n <= Math.min(nMax, nB); n++) {
      if (!W.chunks.has(n)) { const c = buildChunk(n); scene.add(c); W.chunks.set(n, c); }
    }
    for (const [n, c] of W.chunks) {
      if (n < nA - 1 || n > nB + 1) { scene.remove(c); W.chunks.delete(n); continue; }
      c.position.z = -((n + 0.5) * L - s) * dir;
      c.scale.z = dir; // dönüşte dünya aynalanır (yol aynı, sol/sağ yerinde kalır)
      c.traverse((o) => { if (o.userData.salla != null) { o.position.y = Math.sin(t * 1.3 + o.userData.salla) * 0.12; o.rotation.z = Math.sin(t + o.userData.salla) * 0.05; } });
    }
    W.biyom = biyomAt(s);
    const denizde = W.biyom === 'deniz';
    W.mavna.visible = denizde;
    if (denizde) { W.mavna.position.y = Math.sin(t * 0.9) * 0.08; W.mavna.rotation.z = Math.sin(t * 0.7) * 0.012; }
  };

  // modeller/ klasöründeki yapı modelleri: ev-*.glb (köy/şehir evleri), kadirga.glb (deniz geçişi gemisi)
  W.loadModels = async () => {
    let list = [];
    try { list = (await (await fetch('/api/models')).json()).models || []; } catch {}
    const istenen = list.filter((f) => /^(ev(-\d+)?|kadirga)\.(glb|gltf)$/i.test(f));
    if (!istenen.length) return;
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    for (const f of istenen.sort()) {
      try {
        const gl = await loader.loadAsync('/modeller/' + encodeURIComponent(f));
        gl.scene.traverse((k) => { if (k.isMesh) { k.castShadow = true; k.receiveShadow = true; } });
        if (/^kadirga/i.test(f)) YAPI_GLB.kadirga = gl.scene; else YAPI_GLB.ev.push(gl.scene);
        console.log(`[model] ${f} yüklendi`);
      } catch (e) { console.warn('[model] yüklenemedi:', f, e); }
    }
    if (YAPI_GLB.kadirga) { // alayın altındaki mavna yerine kadırga
      for (const c of [...mavna.children]) mavna.remove(c);
      const k = YAPI_GLB.kadirga.clone(); k.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      mavna.add(k);
    }
    for (const c of W.chunks.values()) scene.remove(c); // yeni modellerle parçaları yeniden kur
    W.chunks.clear();
  };

  // gün döngüsü: 0 sabah … 0.5 öğle … 0.75 gün batımı … 0.9 gece
  const C = (h) => new THREE.Color(h);
  const SKY = [[0, C('#f2c9a0')], [0.12, C('#a9d2f0')], [0.6, C('#9fcbef')], [0.74, C('#f0a46a')], [0.82, C('#2c2f55')], [0.94, C('#141a33')], [1, C('#f2c9a0')]];
  const tmpC = new THREE.Color();
  W.setDay = (p) => {
    let i = 0; while (i < SKY.length - 2 && p > SKY[i + 1][0]) i++;
    const [a, ca] = SKY[i], [b, cb] = SKY[i + 1], k = (p - a) / (b - a);
    tmpC.copy(ca).lerp(cb, Math.min(1, Math.max(0, k)));
    scene.background.copy(tmpC); scene.fog.color.copy(tmpC);
    const gece = p > 0.8 && p < 0.97 ? Math.sin(((p - 0.8) / 0.17) * Math.PI) : 0;
    const aksam = p > 0.66 && p < 0.84 ? Math.sin(((p - 0.66) / 0.18) * Math.PI) : 0;
    sun.intensity = 2.6 * (1 - gece * 0.85);
    sun.color.setRGB(1, 0.95 - aksam * 0.25, 0.85 - aksam * 0.4);
    hemi.intensity = 1.2 - gece * 0.75;
    suMat.color.setRGB(0.18 - gece * 0.1, 0.43 - gece * 0.25, 0.6 - gece * 0.3);
    W.gece = gece;
  };
  return W;
}
