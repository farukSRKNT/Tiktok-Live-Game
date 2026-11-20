// Taraftar figürü: eklemli (kalça, gövde, baş, omuz-dirsek, kalça-diz) basit model, takım formasıyla.
// Animasyon tamamen kodla: koşu, gard, yumruk (düz/kroşe), tekme, darbe alma, blok, yere düşme (nakavt), kutlama, pano üstünden atlama.
// Her eklem hedef açıya yumuşakça döner; böylece hareketler birbirine akıcı geçer.
import * as THREE from 'three';
import { formaDokusu } from './takimlar.js';

const TEN = ['#f1c7a3', '#e0ac85', '#c98e64', '#a86f4c', '#f5d2b8', '#8a5a3c'];
const SAC = ['#1d1410', '#3b2516', '#5a3a22', '#0c0c0c', '#8a6a3a', '#2b2b2b'];
const MAT = new Map();
const mat = (renk, opt = {}) => {
  const k = renk + JSON.stringify(opt);
  let m = MAT.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: renk, roughness: 0.75, ...opt }); MAT.set(k, m); }
  return m;
};
// paylaşılan geometriler
const GEO = {
  gogus: new THREE.BoxGeometry(0.46, 0.52, 0.26),
  bel: new THREE.BoxGeometry(0.4, 0.2, 0.24),
  sort: new THREE.BoxGeometry(0.42, 0.22, 0.26),
  boyun: new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8),
  bas: new THREE.SphereGeometry(0.135, 16, 12),
  sac: new THREE.SphereGeometry(0.142, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
  goz: new THREE.SphereGeometry(0.018, 6, 4),
  kas: new THREE.BoxGeometry(0.055, 0.014, 0.02),
  burun: new THREE.BoxGeometry(0.03, 0.05, 0.04),
  sakal: new THREE.SphereGeometry(0.137, 12, 6, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.3),
  kolUst: new THREE.CylinderGeometry(0.07, 0.065, 0.3, 8).translate(0, -0.15, 0),
  kolAlt: new THREE.CylinderGeometry(0.058, 0.05, 0.27, 8).translate(0, -0.135, 0),
  yumruk: new THREE.SphereGeometry(0.068, 10, 8),
  bacakUst: new THREE.CylinderGeometry(0.1, 0.085, 0.44, 8).translate(0, -0.22, 0),
  bacakAlt: new THREE.CylinderGeometry(0.08, 0.06, 0.44, 8).translate(0, -0.22, 0),
  ayak: new THREE.BoxGeometry(0.11, 0.08, 0.26).translate(0, -0.04, 0.06),
  atki: new THREE.TorusGeometry(0.09, 0.035, 6, 12),
};

function eklem(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function parca(parent, geo, m, x = 0, y = 0, z = 0, golge = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = golge; parent.add(o); return o; }

export function savasciYap(T, numara) {
  const ten = mat(TEN[Math.floor(Math.random() * TEN.length)]);
  const sacM = mat(SAC[Math.floor(Math.random() * SAC.length)]);
  const forma = mat('#ffffff', { map: formaDokusu(THREE, T), roughness: 0.8 });
  const sirt = mat('#ffffff', { map: formaDokusu(THREE, T, numara), roughness: 0.8 });
  const sortM = mat(T.sort), corapM = mat(T.corap), ayakkabi = mat('#15151a', { roughness: 0.5 });
  const kolLM = mat(T.kolL), kolRM = mat(T.kolR), siyah = mat('#111');

  const kok = new THREE.Group();
  const govde = eklem(kok, 0, 0.94, 0); // kalça merkezi: düşme/eğilme buradan
  const J = { kok, govde };
  // şort
  parca(govde, GEO.sort, sortM, 0, -0.02, 0);
  // gövde (bel → göğüs)
  J.gogus = eklem(govde, 0, 0.08, 0);
  // göğüs: ön yüz desenli, arka yüz numaralı forma
  const gm = parca(J.gogus, GEO.gogus, [forma, forma, forma, forma, forma, sirt], 0, 0.3, 0);
  gm.receiveShadow = false;
  parca(J.gogus, GEO.bel, forma, 0, 0.04, 0, false);
  parca(J.gogus, GEO.boyun, ten, 0, 0.6, 0, false);
  J.bas = eklem(J.gogus, 0, 0.64, 0);
  parca(J.bas, GEO.bas, ten, 0, 0.12, 0);
  const sacTip = Math.random();
  if (sacTip > 0.15) { const s = parca(J.bas, GEO.sac, sacM, 0, 0.13, -0.008, false); s.rotation.x = -0.25; }
  if (Math.random() < 0.35) parca(J.bas, GEO.sakal, sacM, 0, 0.11, 0.005, false).rotation.y = Math.PI;
  parca(J.bas, GEO.goz, siyah, -0.045, 0.14, 0.123, false);
  parca(J.bas, GEO.goz, siyah, 0.045, 0.14, 0.123, false);
  const kL = parca(J.bas, GEO.kas, sacM, -0.045, 0.172, 0.125, false); kL.rotation.z = -0.35; // çatık kaşlar
  const kR = parca(J.bas, GEO.kas, sacM, 0.045, 0.172, 0.125, false); kR.rotation.z = 0.35;
  parca(J.bas, GEO.burun, ten, 0, 0.115, 0.135, false);
  if (Math.random() < 0.4) { // atkı
    const a = parca(J.gogus, GEO.atki, mat(Math.random() < 0.5 ? T.a : T.b), 0, 0.56, 0, false); a.rotation.x = Math.PI / 2;
  }
  // kollar
  for (const [k, s, km] of [['L', -1, kolLM], ['R', 1, kolRM]]) {
    const om = eklem(J.gogus, s * 0.29, 0.5, 0);
    parca(om, GEO.kolUst, km, 0, 0, 0);
    const dir = eklem(om, 0, -0.29, 0);
    parca(dir, GEO.kolAlt, ten, 0, 0, 0);
    parca(dir, GEO.yumruk, ten, 0, -0.29, 0);
    J['om' + k] = om; J['dir' + k] = dir;
  }
  // bacaklar
  for (const [k, s] of [['L', -1], ['R', 1]]) {
    const kal = eklem(govde, s * 0.11, -0.08, 0);
    const ust = parca(kal, GEO.bacakUst, ten, 0, 0, 0);
    parca(kal, new THREE.CylinderGeometry(0.105, 0.1, 0.16, 8).translate(0, -0.06, 0), sortM, 0, 0, 0, false); // şort paçası
    const diz = eklem(kal, 0, -0.43, 0);
    parca(diz, GEO.bacakAlt, corapM, 0, 0, 0);
    parca(diz, GEO.ayak, ayakkabi, 0, -0.42, 0);
    J['kal' + k] = kal; J['diz' + k] = diz;
    void ust;
  }
  // blob gölge yok: gerçek gölge (projektör) kullanılıyor
  kok.userData.J = J;
  // eklemlerin anlık açıları (yumuşak geçiş için)
  const A = {};
  for (const n of ['omL', 'omR', 'dirL', 'dirR', 'kalL', 'kalR', 'dizL', 'dizR', 'gogus', 'bas', 'govde']) A[n] = { x: 0, y: 0, z: 0 };
  kok.userData.A = A;
  kok.userData.yy = 0; // gövde yüksekliği ofseti
  return kok;
}

// ---------- poz hesapları ----------
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
// zaman çizelgesi yardımcıları: 0→1 çıkış, tepe, geri dönüş
const vurus = (t, tepe, bitis) => (t < tepe ? ease(t / tepe) : 1 - ease((t - tepe) / (bitis - tepe)));

function poz(f, t) {
  // f.anim: { ad, t (başladığından beri sn) }, f.faz: koşu fazı, f.hiz: 0..1 koşu şiddeti
  const P = {
    omL: { x: -1.25, y: 0, z: -0.25 }, omR: { x: -1.25, y: 0, z: 0.25 }, // gard: yumruklar yüzde
    dirL: { x: -1.9, y: 0, z: 0 }, dirR: { x: -1.9, y: 0, z: 0 },
    kalL: { x: -0.15, y: 0, z: -0.12 }, kalR: { x: 0.25, y: 0, z: 0.12 },
    dizL: { x: 0.3, y: 0, z: 0 }, dizR: { x: 0.25, y: 0, z: 0 },
    gogus: { x: 0.12, y: 0.15, z: 0 }, bas: { x: -0.1, y: -0.1, z: 0 }, govde: { x: 0, y: 0, z: 0 }, yy: -0.05,
  };
  const zipla = Math.sin(t * 7 + f.tohum) * 0.025; // gard sallanması
  P.yy += zipla; P.gogus.z = Math.sin(t * 3.5 + f.tohum) * 0.06;

  // koşu (hız > 0)
  const h = f.hiz || 0;
  if (h > 0.05) {
    const s = Math.sin(f.faz), c = Math.cos(f.faz);
    const k = Math.min(1, h);
    P.kalL.x = lerp(P.kalL.x, -s * 0.9, k); P.kalR.x = lerp(P.kalR.x, s * 0.9, k);
    P.kalL.z = lerp(P.kalL.z, 0, k); P.kalR.z = lerp(P.kalR.z, 0, k);
    P.dizL.x = lerp(P.dizL.x, 0.2 + Math.max(0, c) * 1.3, k); P.dizR.x = lerp(P.dizR.x, 0.2 + Math.max(0, -c) * 1.3, k);
    P.omL.x = lerp(P.omL.x, s * 0.8 - 0.3, k * 0.8); P.omR.x = lerp(P.omR.x, -s * 0.8 - 0.3, k * 0.8);
    P.dirL.x = lerp(P.dirL.x, -1.4, k); P.dirR.x = lerp(P.dirR.x, -1.4, k);
    P.gogus.x = lerp(P.gogus.x, 0.3, k); P.gogus.y = lerp(P.gogus.y, 0, k);
    P.yy = lerp(P.yy, Math.abs(Math.sin(f.faz)) * 0.08 - 0.03, k);
  }

  const a = f.anim, at = a ? a.t : 0;
  if (!a) return P;
  switch (a.ad) {
    case 'yumruk': { // düz yumruk (sağ ya da sol)
      const k = vurus(at, 0.14, 0.38), S = a.taraf === 'L' ? 'L' : 'R', s = S === 'L' ? -1 : 1;
      P['om' + S].x = lerp(P['om' + S].x, -1.62, k); P['om' + S].z = lerp(P['om' + S].z, s * 0.05, k);
      P['dir' + S].x = lerp(P['dir' + S].x, -0.05, k);
      P.gogus.y = lerp(P.gogus.y, -s * 0.55, k); P.gogus.x += k * 0.12;
      P.kalL.x -= k * 0.2; P.yy -= k * 0.04;
      break;
    }
    case 'kroşe': { // yandan geniş yumruk
      const k = vurus(at, 0.2, 0.5), S = a.taraf === 'L' ? 'L' : 'R', s = S === 'L' ? -1 : 1;
      const geri = at < 0.08 ? ease(at / 0.08) : 0;
      P['om' + S].x = lerp(P['om' + S].x, -1.5, k); P['om' + S].z = lerp(P['om' + S].z, s * 1.2, k) + s * geri * 0.3;
      P['om' + S].y = lerp(0, -s * 0.9, k);
      P['dir' + S].x = lerp(P['dir' + S].x, -1.2, k);
      P.gogus.y = lerp(P.gogus.y, -s * 0.9, k) + s * geri * 0.3;
      P.yy -= k * 0.08; P.dizL.x += k * 0.3; P.dizR.x += k * 0.3;
      break;
    }
    case 'tekme': { // ön tekme
      const k = vurus(at, 0.24, 0.6);
      P.kalR.x = lerp(P.kalR.x, -1.6, k); P.dizR.x = lerp(P.dizR.x, at < 0.12 ? 1.6 : 0.1, k);
      P.kalL.x = lerp(P.kalL.x, 0.15, k); P.dizL.x = lerp(P.dizL.x, 0.15, k);
      P.gogus.x = lerp(P.gogus.x, -0.45, k);
      P.omL.z -= k * 0.5; P.omR.z += k * 0.5;
      P.yy += k * 0.02;
      break;
    }
    case 'darbe': { // darbe aldı: geri savrulur
      const k = vurus(at, 0.06, 0.38), s = a.yon || 1;
      P.gogus.x = lerp(P.gogus.x, -0.55, k); P.gogus.z += s * k * 0.25;
      P.bas.x = lerp(P.bas.x, -0.7, k); P.bas.z = s * k * 0.4; P.bas.y = s * k * 0.5;
      P.omL.x += k * 0.6; P.omR.x += k * 0.6; P.omL.z -= k * 0.6; P.omR.z += k * 0.6;
      P.dirL.x += k * 1.0; P.dirR.x += k * 1.0;
      P.dizL.x += k * 0.4; P.dizR.x += k * 0.4; P.yy -= k * 0.06;
      break;
    }
    case 'blok': { // kollarla siper
      const k = vurus(at, 0.08, 0.4);
      P.omL.x = lerp(P.omL.x, -1.7, k); P.omR.x = lerp(P.omR.x, -1.7, k);
      P.omL.z = lerp(P.omL.z, 0.25, k); P.omR.z = lerp(P.omR.z, -0.25, k);
      P.dirL.x = lerp(P.dirL.x, -2.4, k); P.dirR.x = lerp(P.dirR.x, -2.4, k);
      P.gogus.x += k * 0.25; P.bas.x += k * 0.3; P.yy -= k * 0.08;
      break;
    }
    case 'nakavt': { // geriye devrilir, yerde yatar
      const d = ease(at / 0.55), sek = at > 0.55 && at < 0.85 ? Math.sin(((at - 0.55) / 0.3) * Math.PI) * 0.12 : 0;
      P.govde.x = lerp(0, -Math.PI / 2 + 0.08, d) + sek;
      P.govde.z = (a.yon || 1) * d * 0.15;
      P.yy = lerp(P.yy, -0.78, d) + sek * 0.3;
      P.omL.x = lerp(P.omL.x, -2.6, d); P.omR.x = lerp(P.omR.x, -2.2, d);
      P.omL.z = lerp(P.omL.z, -0.9, d); P.omR.z = lerp(P.omR.z, 1.1, d);
      P.dirL.x = lerp(P.dirL.x, -0.3, d); P.dirR.x = lerp(P.dirR.x, -0.6, d);
      P.kalL.x = lerp(P.kalL.x, -0.25, d); P.kalR.x = lerp(P.kalR.x, -0.05, d);
      P.kalL.z = lerp(P.kalL.z, -0.3, d); P.kalR.z = lerp(P.kalR.z, 0.35, d);
      P.dizL.x = lerp(P.dizL.x, 0.6, d); P.dizR.x = lerp(P.dizR.x, 0.1, d);
      P.gogus.x = lerp(P.gogus.x, 0, d); P.gogus.y = 0; P.gogus.z = 0;
      P.bas.x = lerp(P.bas.x, 0.2, d); P.bas.y = (a.yon || 1) * d * 0.7;
      break;
    }
    case 'kutlama': { // kollar havada zıplar
      const z = Math.abs(Math.sin(at * 6));
      P.omL.x = -2.9 + Math.sin(at * 12) * 0.2; P.omR.x = -2.9 - Math.sin(at * 12) * 0.2;
      P.omL.z = -0.35; P.omR.z = 0.35; P.dirL.x = -0.3; P.dirR.x = -0.3;
      P.gogus.x = -0.15; P.bas.x = -0.35; P.yy = z * 0.28 - 0.02;
      P.kalL.x = -z * 0.4; P.kalR.x = -z * 0.4; P.dizL.x = z * 0.8; P.dizR.x = z * 0.8;
      break;
    }
    case 'atla': { // panonun üstünden atlayıp sahaya iner
      const u = Math.min(1, at / a.sure);
      P.yy = Math.sin(u * Math.PI) * 1.25 - (u > 0.85 ? (1 - (1 - u) / 0.15) * 0.2 : 0);
      P.kalL.x = -1.2 * Math.sin(u * Math.PI); P.kalR.x = -0.6 * Math.sin(u * Math.PI);
      P.dizL.x = 1.6 * Math.sin(u * Math.PI); P.dizR.x = 1.2 * Math.sin(u * Math.PI);
      P.omL.x = -2.4 * Math.sin(u * Math.PI); P.omR.x = -2.4 * Math.sin(u * Math.PI);
      P.omL.z = -0.6; P.omR.z = 0.6; P.gogus.x = 0.35;
      break;
    }
    case 'tehdit': { // göğüs gerip bağırır
      const k = vurus(at, 0.25, 1.2);
      P.omL.x = lerp(P.omL.x, -0.4, k); P.omR.x = lerp(P.omR.x, -0.4, k);
      P.omL.z = lerp(P.omL.z, -1.0, k); P.omR.z = lerp(P.omR.z, 1.0, k);
      P.dirL.x = lerp(P.dirL.x, -1.6, k); P.dirR.x = lerp(P.dirR.x, -1.6, k);
      P.gogus.x = lerp(P.gogus.x, -0.3, k); P.bas.x = lerp(P.bas.x, -0.35, k);
      break;
    }
  }
  return P;
}

// her kare: hedef pozu hesapla, eklemleri ona doğru yumuşakça döndür
export function savasciGuncelle(f, dt, t) {
  const o = f.ch, J = o.userData.J, A = o.userData.A;
  const P = poz(f, t);
  const sert = f.anim && (f.anim.ad === 'yumruk' || f.anim.ad === 'kroşe' || f.anim.ad === 'darbe' || f.anim.ad === 'tekme') ? 30 : 14;
  const k = 1 - Math.exp(-sert * dt);
  for (const n in A) {
    const a = A[n], p = P[n];
    a.x += (p.x - a.x) * k; a.y += (p.y - a.y) * k; a.z += (p.z - a.z) * k;
    J[n].rotation.set(a.x, a.y, a.z);
  }
  o.userData.yy += (P.yy - o.userData.yy) * k;
  J.govde.position.y = 0.94 + o.userData.yy;
}
