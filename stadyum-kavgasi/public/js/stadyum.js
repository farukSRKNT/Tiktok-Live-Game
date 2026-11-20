// Gece maçı stadyumu: çim (biçme desenli), çizgiler, kaleler, LED reklam panoları, dört tarafta basamaklı tribün,
// tribünde zıplayan seyirci (tek çizimde, binlerce kişi), çatı ve projektör kuleleri.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TAKIMLAR } from './takimlar.js';

export const SAHA = { x: 34, z: 52.5 }; // yarı genişlik / yarı uzunluk (m)
const PANO = 3.2; // reklam panolarının sahadan uzaklığı
const TRIB = 7.5; // tribünün ilk basamağının sahadan uzaklığı
const SIRA = 20, DER = 0.9, YUK = 0.5; // tribün: sıra sayısı, basamak derinliği, yüksekliği

function cimDokusu() {
  const S = 12, w = 68 * S, h = 105 * S;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const n = 14;
  for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? '#2f7d32' : '#3a8f3b'; x.fillRect(0, (i * h) / n, w, h / n + 1); }
  // ince doku
  for (let i = 0; i < 26000; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.04)'; x.fillRect(Math.random() * w, Math.random() * h, 2, 3); }
  x.strokeStyle = 'rgba(255,255,255,.92)'; x.lineWidth = 0.12 * S;
  const m = 0.06 * S; x.strokeRect(m, m, w - 2 * m, h - 2 * m);
  x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
  x.beginPath(); x.arc(w / 2, h / 2, 9.15 * S, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(w / 2, h / 2, 0.3 * S, 0, Math.PI * 2); x.fill();
  for (const yon of [0, 1]) {
    const y0 = yon ? h - m : m, s = yon ? -1 : 1;
    x.strokeRect(w / 2 - 20.15 * S, Math.min(y0, y0 + s * 16.5 * S), 40.3 * S, 16.5 * S);
    x.strokeRect(w / 2 - 9.16 * S, Math.min(y0, y0 + s * 5.5 * S), 18.32 * S, 5.5 * S);
    x.beginPath(); x.arc(w / 2, y0 + s * 11 * S, 0.25 * S, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(w / 2, y0 + s * 11 * S, 9.15 * S, yon ? Math.PI + 0.93 : 0.93, yon ? 2 * Math.PI - 0.93 : Math.PI - 0.93); x.stroke();
  }
  for (const [cx, cy, a] of [[m, m, 0], [w - m, m, Math.PI / 2], [w - m, h - m, Math.PI], [m, h - m, -Math.PI / 2]]) { x.beginPath(); x.arc(cx, cy, 1 * S, a, a + Math.PI / 2); x.stroke(); }
  return c;
}

// LED pano dokusu: kayan yazı (her karede offset kayar)
function ledDokusu() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 64;
  const x = c.getContext('2d');
  const parca = [['⚽ STADYUM KAVGASI', '#0b0b14', '#ffd23f'], ['TAKIMINI YAZ, SAHAYA İN!', '#c8102e', '#ffffff'], ['🌹 GÜL = CAN', '#101a40', '#7ad1ff'], ['ÖLMEDEN TEKRAR GELEMEZSİN', '#0b0b14', '#ff5c5c'], ['💪 DEV OL', '#1b5e20', '#ffffff'], ['🔥 MEŞALE YAK', '#ff6a00', '#1a0a00']];
  let px = 0; const pw = 2048 / parca.length;
  for (const [t, bg, fg] of parca) {
    x.fillStyle = bg; x.fillRect(px, 0, pw, 64);
    x.fillStyle = fg; x.font = '900 34px Nunito, Arial Black, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(t, px + pw / 2, 34, pw - 16);
    px += pw;
  }
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping;
  return tx;
}

export function buildStadium(scene, LOW) {
  const S = { cosku: 0.4 };
  const g = new THREE.Group(); scene.add(g);

  // ---------- ışık ----------
  scene.add(new THREE.HemisphereLight('#a8b8ff', '#1b2a14', 0.55));
  const ana = new THREE.DirectionalLight('#fff6e8', 2.4);
  ana.position.set(30, 55, 40); ana.castShadow = !LOW;
  ana.shadow.mapSize.set(2048, 2048);
  Object.assign(ana.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 10, far: 140 });
  ana.shadow.bias = -0.0004; ana.shadow.normalBias = 0.02;
  scene.add(ana); scene.add(ana.target);
  const ikinci = new THREE.DirectionalLight('#dfe8ff', 1.1); ikinci.position.set(-40, 50, -30); scene.add(ikinci);
  S.ana = ana;

  // ---------- zemin ----------
  const cimTx = new THREE.CanvasTexture(cimDokusu()); cimTx.colorSpace = THREE.SRGBColorSpace; cimTx.anisotropy = 8;
  const cim = new THREE.Mesh(new THREE.PlaneGeometry(68, 105), new THREE.MeshStandardMaterial({ map: cimTx, roughness: 0.95 }));
  cim.rotation.x = -Math.PI / 2; cim.receiveShadow = true; g.add(cim);
  const kenar = new THREE.Mesh(new THREE.PlaneGeometry(68 + TRIB * 2 + 2, 105 + TRIB * 2 + 2), new THREE.MeshStandardMaterial({ color: '#2a6b2c', roughness: 1 }));
  kenar.rotation.x = -Math.PI / 2; kenar.position.y = -0.02; kenar.receiveShadow = true; g.add(kenar);

  // ---------- kaleler ----------
  const beyaz = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, emissive: '#333' });
  const ag = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.35 });
  for (const s of [-1, 1]) {
    const k = new THREE.Group(); k.position.z = s * SAHA.z;
    const dir = (x) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.44, 8), beyaz); m.position.set(x, 1.22, 0); m.castShadow = true; k.add(m); };
    dir(-3.66); dir(3.66);
    const ust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 7.4, 8), beyaz); ust.rotation.z = Math.PI / 2; ust.position.y = 2.44; k.add(ust);
    const a = new THREE.Mesh(new THREE.BoxGeometry(7.32, 2.44, 2, 14, 5, 4), ag); a.position.set(0, 1.22, s * 1); k.add(a);
    g.add(k);
  }
  // korner bayrakları
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), beyaz); d.position.set(x * SAHA.x, 0.75, z * SAHA.z); g.add(d);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshStandardMaterial({ color: '#ffd23f', side: THREE.DoubleSide })); b.position.set(x * SAHA.x + 0.25, 1.35, z * SAHA.z); g.add(b);
  }

  // ---------- LED reklam panoları ----------
  const led = ledDokusu();
  const ledMat = new THREE.MeshStandardMaterial({ map: led, emissiveMap: led, emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.6 });
  const panoArka = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.8 });
  const pano = (L, x, z, ry) => {
    const geo = new THREE.BoxGeometry(L, 0.9, 0.25);
    const m = new THREE.Mesh(geo, [panoArka, panoArka, panoArka, panoArka, ledMat, panoArka]);
    m.position.set(x, 0.45, z); m.rotation.y = ry; m.castShadow = true; g.add(m);
    // UV'yi uzunluğa göre tekrarla
    const uv = geo.attributes.uv; for (let i = 16; i < 20; i++) uv.setX(i, uv.getX(i) * L / 40); uv.needsUpdate = true;
  };
  pano(105 + PANO * 2, SAHA.x + PANO, 0, -Math.PI / 2);
  pano(105 + PANO * 2, -SAHA.x - PANO, 0, Math.PI / 2);
  pano(68 + PANO * 2, 0, SAHA.z + PANO, Math.PI);
  pano(68 + PANO * 2, 0, -SAHA.z - PANO, 0);

  // ---------- tribünler ----------
  const beton = new THREE.MeshStandardMaterial({ color: '#3a3f4c', roughness: 0.9 });
  const koltukRenk = ['#b3122e', '#1b3a7a'];
  const tribunler = [];
  // her taraf: yerel eksen u (pano boyunca), v (sahadan dışarı). dünya: merkez + u*eu + v*ev
  const yanlar = [
    { L: 105 + TRIB * 2, d: SAHA.x + TRIB, eu: [0, 0, 1], ev: [1, 0, 0] },
    { L: 105 + TRIB * 2, d: SAHA.x + TRIB, eu: [0, 0, -1], ev: [-1, 0, 0] },
    { L: 68 + TRIB * 2, d: SAHA.z + TRIB, eu: [-1, 0, 0], ev: [0, 0, 1] },
    { L: 68 + TRIB * 2, d: SAHA.z + TRIB, eu: [1, 0, 0], ev: [0, 0, -1] },
  ];
  const koltukMat = new THREE.MeshStandardMaterial({ color: '#2a2f3c', roughness: 0.8 });
  for (const [yi, y] of yanlar.entries()) {
    const ry = Math.atan2(y.ev[0], y.ev[2]);
    for (let r = 0; r < SIRA; r++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(y.L + r * DER * 2, YUK * (r + 1), DER), r % 2 ? beton : koltukMat);
      const v = y.d + r * DER + DER / 2;
      m.position.set(y.ev[0] * v, (YUK * (r + 1)) / 2, y.ev[2] * v); m.rotation.y = ry; m.receiveShadow = true;
      g.add(m);
    }
    // arka duvar
    const v = y.d + SIRA * DER + 0.5;
    const duvar = new THREE.Mesh(new THREE.BoxGeometry(y.L + SIRA * DER * 2 + 2, SIRA * YUK + 7, 1), beton);
    duvar.position.set(y.ev[0] * v, (SIRA * YUK + 7) / 2, y.ev[2] * v); duvar.rotation.y = ry; g.add(duvar);
    // çatı (öne doğru çıkıntı) + alt kenarında ışık şeridi
    const cati = new THREE.Mesh(new THREE.BoxGeometry(y.L + SIRA * DER * 2 + 2, 0.6, SIRA * DER * 0.85), new THREE.MeshStandardMaterial({ color: '#20242e', roughness: 0.7 }));
    const cv = y.d + SIRA * DER * 0.55;
    cati.position.set(y.ev[0] * cv, SIRA * YUK + 7, y.ev[2] * cv); cati.rotation.y = ry; g.add(cati);
    const serit = new THREE.Mesh(new THREE.BoxGeometry(y.L + SIRA * DER * 1.6, 0.25, 0.4), new THREE.MeshBasicMaterial({ color: '#fff4d6' }));
    const sv = y.d + SIRA * DER * 0.15;
    serit.position.set(y.ev[0] * sv, SIRA * YUK + 6.6, y.ev[2] * sv); serit.rotation.y = ry; g.add(serit);
    tribunler.push({ ...y, ry, yi });
  }
  // köşe dolgu
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(SIRA * DER + 1, SIRA * YUK + 7, SIRA * DER + 1), beton);
    k.position.set(x * (SAHA.x + TRIB + (SIRA * DER) / 2), (SIRA * YUK + 7) / 2, z * (SAHA.z + TRIB + (SIRA * DER) / 2)); g.add(k);
  }

  // ---------- seyirciler (tek InstancedMesh, zıplama gölgelendiricide) ----------
  const govde = new THREE.BoxGeometry(0.42, 0.62, 0.26); govde.translate(0, 0.31, 0);
  const bas = new THREE.SphereGeometry(0.13, 8, 6); bas.translate(0, 0.78, 0);
  const kolG = new THREE.BoxGeometry(0.1, 0.42, 0.1); kolG.translate(-0.28, 0.85, 0); // kalkık kol
  const kolG2 = kolG.clone(); kolG2.translate(0.56, 0, 0);
  // baş rengi ayrı olsun diye vertex rengi: gövde=1 (forma rengi), baş/kol=ten
  const boya = (geo, v) => { const n = geo.attributes.position.count, c = new Float32Array(n * 3).fill(v); geo.setAttribute('ten', new THREE.BufferAttribute(c, 3)); return geo; };
  const kisiGeo = mergeGeometries([boya(govde.toNonIndexed(), 0), boya(bas.toNonIndexed(), 1), boya(kolG.toNonIndexed(), 1), boya(kolG2.toNonIndexed(), 1)]);
  const yerler = [];
  for (const y of tribunler) {
    for (let r = 0; r < SIRA; r++) {
      const L = y.L + r * DER * 2 - 4, v = y.d + r * DER + DER * 0.45, hy = YUK * (r + 1);
      for (let u = -L / 2; u < L / 2; u += 0.62) {
        if (Math.random() < 0.12) continue;
        yerler.push({ x: y.eu[0] * u + y.ev[0] * v, z: y.eu[2] * u + y.ev[2] * v, y: hy, ry: y.ry + Math.PI, yi: y.yi, u, r });
      }
    }
  }
  const N = yerler.length;
  const kMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  const U = { uTime: { value: 0 }, uCosku: { value: 0.4 } };
  kMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uCosku = U.uCosku;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aFaz;\nattribute vec3 ten;\nuniform float uTime;\nuniform float uCosku;\nvarying float vTen;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vTen = ten.x;
        float zip = max(0.0, sin(uTime * (5.0 + aFaz * 3.0) + aFaz * 40.0));
        float coskulu = step(fract(aFaz * 7.13), uCosku);
        transformed.y += zip * zip * 0.32 * coskulu;
        // kollar sadece coşkulu olanlarda kalkık; diğerlerinde aşağıda (gövdeye gömülü)
        if (ten.x > 0.5 && position.y > 0.6 && position.y < 1.1 && abs(position.x) > 0.2) transformed.y -= (1.0 - coskulu) * 0.55;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTen;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.66, 0.5), vTen);');
  };
  const kalabalik = new THREE.InstancedMesh(kisiGeo, kMat, N);
  const faz = new Float32Array(N);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
  yerler.forEach((p, i) => {
    faz[i] = Math.random();
    E.set(0, p.ry + (Math.random() - 0.5) * 0.3, 0); Q.setFromEuler(E);
    const s = 0.9 + Math.random() * 0.2; SC.set(s, s, s);
    P.set(p.x, p.y, p.z); M.compose(P, Q, SC); kalabalik.setMatrixAt(i, M);
  });
  kisiGeo.setAttribute('aFaz', new THREE.InstancedBufferAttribute(faz, 1));
  // bölümler: her tribün ~12 m'lik bloklara ayrılır, her blok bir takımın taraftarı (renkleri takımın renkleri)
  const bolumler = [];
  const bolumAnah = (p) => `${p.yi}:${Math.floor((p.u + 200) / 12)}`;
  const bMap = new Map();
  yerler.forEach((p, i) => { const k = bolumAnah(p); let b = bMap.get(k); if (!b) { b = { i: [], takim: null }; bMap.set(k, b); bolumler.push(b); } b.i.push(i); });
  const C = new THREE.Color();
  function bolumBoya(b, T) {
    b.takim = T.id;
    for (const i of b.i) {
      const r = Math.random();
      C.set(r < 0.55 ? T.a : r < 0.85 ? T.b : '#20222a');
      C.offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
      kalabalik.setColorAt(i, C);
    }
    kalabalik.instanceColor.needsUpdate = true;
  }
  const BUYUK = ['gs', 'fb', 'bjk', 'ts'];
  bolumler.forEach((b, i) => bolumBoya(b, TAKIMLAR.find((t) => t.id === BUYUK[i % 4])));
  kalabalik.frustumCulled = false;
  g.add(kalabalik);
  S.bolumler = bolumler;

  // tribün dağılımı oyundaki takımlara uysun: her çağrıda birkaç bölüm yeniden boyanır (yavaş yavaş değişir)
  S.tribunUyum = (sayilar) => {
    const top = Object.values(sayilar).reduce((a, b) => a + b, 0);
    if (!top) return;
    const hedef = {};
    for (const [id, n] of Object.entries(sayilar)) hedef[id] = Math.round((n / top) * bolumler.length);
    const mevcut = {};
    for (const b of bolumler) mevcut[b.takim] = (mevcut[b.takim] || 0) + 1;
    const fazla = bolumler.filter((b) => (mevcut[b.takim] || 0) > (hedef[b.takim] || 0));
    let deg = 0;
    for (const [id, h] of Object.entries(hedef).sort((a, b) => b[1] - a[1])) {
      while ((mevcut[id] || 0) < h && fazla.length && deg < 3) {
        const b = fazla.splice(Math.floor(Math.random() * fazla.length), 1)[0];
        mevcut[b.takim]--; mevcut[id] = (mevcut[id] || 0) + 1;
        bolumBoya(b, TAKIMLAR.find((t) => t.id === id)); deg++;
      }
    }
  };
  // takımın tribündeki bir noktası (meşale için)
  S.tribunNoktasi = (takimId) => {
    const l = bolumler.filter((b) => b.takim === takimId);
    const b = l.length ? l[Math.floor(Math.random() * l.length)] : bolumler[Math.floor(Math.random() * bolumler.length)];
    const p = yerler[b.i[Math.floor(Math.random() * b.i.length)]];
    return new THREE.Vector3(p.x, p.y + 1.2, p.z);
  };

  // ---------- projektör kuleleri ----------
  const isik = new THREE.MeshBasicMaterial({ color: '#fffbe8' });
  const direk = new THREE.MeshStandardMaterial({ color: '#555b66', roughness: 0.6, metalness: 0.4 });
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const px = x * (SAHA.x + TRIB + SIRA * DER + 4), pz = z * (SAHA.z + TRIB + SIRA * DER + 4);
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 42, 8), direk); d.position.set(px, 21, pz); g.add(d);
    const pan = new THREE.Group(); pan.position.set(px, 43, pz); pan.lookAt(0, 0, 0); g.add(pan);
    const arka = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 0.6), direk); pan.add(arka);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.75, 12), isik); l.position.set(-3.3 + i * 2.2, -1.8 + j * 1.8, 0.35); pan.add(l);
    }
  }

  // ---------- gökyüzü ----------
  const gok = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 a = vec3(0.02,0.03,0.08), b = vec3(0.10,0.12,0.25); gl_FragColor = vec4(mix(b, a, smoothstep(0.0, 0.5, h)), 1.0); }',
  }));
  scene.add(gok);

  S.update = (t, dt) => {
    led.offset.x = (led.offset.x + dt * 0.04) % 1;
    U.uTime.value = t;
    U.uCosku.value += (S.cosku - U.uCosku.value) * Math.min(1, dt * 1.5);
  };
  return S;
}
